/**
 * Social links: the creative picks a platform and types a username;
 * we build the URL ourselves so every button goes where it says it goes.
 */
import type { SocialLink, SocialPlatform, UserProfile } from '../types';

export interface PlatformDef {
  id: SocialPlatform;
  name: string;
  /** Shown before the input, e.g. "instagram.com/" */
  prefix: string;
  placeholder: string;
  build: (handle: string) => string;
}

const at = (h: string) => h.replace(/^@+/, '');

export const PLATFORMS: PlatformDef[] = [
  { id: 'instagram', name: 'Instagram', prefix: 'instagram.com/', placeholder: 'yourname', build: (h) => `https://www.instagram.com/${at(h)}` },
  { id: 'x', name: 'X', prefix: 'x.com/', placeholder: 'yourname', build: (h) => `https://x.com/${at(h)}` },
  { id: 'tiktok', name: 'TikTok', prefix: 'tiktok.com/@', placeholder: 'yourname', build: (h) => `https://www.tiktok.com/@${at(h)}` },
  { id: 'youtube', name: 'YouTube', prefix: 'youtube.com/@', placeholder: 'yourchannel', build: (h) => `https://www.youtube.com/@${at(h)}` },
  { id: 'linkedin', name: 'LinkedIn', prefix: 'linkedin.com/in/', placeholder: 'your-name', build: (h) => `https://www.linkedin.com/in/${at(h)}` },
  { id: 'behance', name: 'Behance', prefix: 'behance.net/', placeholder: 'yourname', build: (h) => `https://www.behance.net/${at(h)}` },
  { id: 'soundcloud', name: 'SoundCloud', prefix: 'soundcloud.com/', placeholder: 'yourname', build: (h) => `https://soundcloud.com/${at(h)}` },
  { id: 'website', name: 'Website', prefix: '', placeholder: 'https://yoursite.com', build: (h) => h }
];

export const MAX_SOCIAL_LINKS = 8;

export const platformDef = (id: SocialPlatform) => PLATFORMS.find((p) => p.id === id);

const HOSTS: Partial<Record<SocialPlatform, RegExp>> = {
  instagram: /(?:^|\.)instagram\.com$/,
  x: /(?:^|\.)(?:x|twitter)\.com$/,
  tiktok: /(?:^|\.)tiktok\.com$/,
  youtube: /(?:^|\.)youtube\.com$/,
  linkedin: /(?:^|\.)linkedin\.com$/,
  behance: /(?:^|\.)behance\.net$/,
  soundcloud: /(?:^|\.)soundcloud\.com$/
};

/**
 * Turns whatever the person typed (a username, "@name" or a pasted profile URL)
 * into a clean handle. Returns null when it isn't usable.
 */
export function normalizeHandle(platform: SocialPlatform, raw: string): string | null {
  let v = raw.trim();
  if (!v) return null;

  if (platform === 'website') {
    if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
    try {
      const u = new URL(v);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
      if (!u.hostname.includes('.')) return null;
      return u.toString().slice(0, 200);
    } catch {
      return null;
    }
  }

  // Pasted a full profile URL? Take the first path segment from the right host.
  if (/^(https?:\/\/)?([a-z0-9-]+\.)*[a-z0-9-]+\.[a-z]{2,}\//i.test(v)) {
    try {
      const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      const hostOk = HOSTS[platform]?.test(u.hostname.toLowerCase());
      if (!hostOk) return null;
      const parts = u.pathname.split('/').filter(Boolean);
      const skip = platform === 'linkedin' ? ['in'] : [];
      v = parts.find((p) => !skip.includes(p)) || '';
    } catch {
      return null;
    }
  }

  v = at(v);
  if (!/^[A-Za-z0-9._-]{1,60}$/.test(v)) return null;
  return v;
}

/** The URL a social button opens. Only ever https links we built. */
export function socialUrl(link: SocialLink): string | null {
  const def = platformDef(link.platform);
  if (!def) return null;
  const handle = normalizeHandle(link.platform, link.handle);
  if (!handle) return null;
  const url = def.build(handle);
  return /^https?:\/\//i.test(url) ? url : null;
}

/** Short label for a button: "@name" for socials, the domain for websites. */
export function socialLabel(link: SocialLink): string {
  if (link.platform === 'website') {
    try {
      return new URL(link.handle).hostname.replace(/^www\./, '');
    } catch {
      return 'Website';
    }
  }
  return `@${at(link.handle)}`;
}

/** Social links for a profile, falling back to the older portfolio link fields. */
export function profileSocialLinks(p: Pick<UserProfile, 'socialLinks' | 'portfolioLinks'>): SocialLink[] {
  if (p.socialLinks && p.socialLinks.length) {
    return p.socialLinks.filter((l) => platformDef(l.platform) && socialUrl(l));
  }
  const legacy = p.portfolioLinks || {};
  const out: SocialLink[] = [];
  const add = (platform: SocialPlatform, raw?: string): boolean => {
    if (!raw) return false;
    const h = normalizeHandle(platform, raw);
    if (h) out.push({ platform, handle: h });
    return !!h;
  };
  add('instagram', legacy.instagram);
  // This field used to take any reel link (YouTube, Vimeo…), so fall back to a website link.
  if (!add('soundcloud', legacy.soundcloud)) add('website', legacy.soundcloud);
  // Older free-text "portfolio" fields were whole URLs: keep them as websites.
  add('website', legacy.website);
  add('website', legacy.spotify);
  return out.slice(0, MAX_SOCIAL_LINKS);
}
