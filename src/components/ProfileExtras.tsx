/**
 * Profile extras: social links, proof of work, and track record + reviews.
 * Editors are used in ProfileCreator; displays on the profile page and the
 * creative detail modal.
 */
import React, { useEffect, useRef, useState } from 'react';
import type { ProofItem, PublicStats, Review, RoleStats, SocialLink, SocialPlatform } from '../types';
import { MAX_SOCIAL_LINKS, PLATFORMS, normalizeHandle, platformDef, socialLabel, socialUrl } from '../lib/social';
import { MAX_PROOF_ITEMS, ProofError, formatDuration, uploadProof, visibleProof } from '../lib/proof';
import { CREATIVE_CATEGORIES, PROVIDER_CATEGORIES, fetchReviewsAbout, subscribePublicStats } from '../lib/reviews';
import { Avatar } from './Avatar';
import { Close, Globe, Plus, Star, Trash2, Verified, VerifiedUser } from './Icons';

const label = 'block text-xs font-mono uppercase tracking-wider text-brand-text-muted mb-2 font-semibold';
const input = 'w-full bg-brand-container-high border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none focus:border-brand-volt';

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: '#E1306C',
  x: '#F5F5F2',
  tiktok: '#25F4EE',
  youtube: '#FF3D3D',
  linkedin: '#3A8DDE',
  behance: '#2F6BFF',
  soundcloud: '#FF7A1A',
  website: '#C3F400'
};

/** Small coloured monogram for a platform (no brand logos). */
const PlatformMark: React.FC<{ platform: SocialPlatform; className?: string }> = ({ platform, className = 'w-7 h-7' }) => {
  if (platform === 'website') {
    return (
      <span className={`${className} rounded-lg bg-brand-volt/15 grid place-items-center flex-shrink-0`}>
        <Globe className="w-4 h-4 text-brand-volt" />
      </span>
    );
  }
  const name = platformDef(platform)?.name || '?';
  return (
    <span
      className={`${className} rounded-lg grid place-items-center flex-shrink-0 font-mono text-[11px] font-bold`}
      style={{ background: `${PLATFORM_COLORS[platform]}22`, color: PLATFORM_COLORS[platform] }}
      aria-hidden="true"
    >
      {name.slice(0, platform === 'x' ? 1 : 2)}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export const SocialLinksEditor: React.FC<{ links: SocialLink[]; onChange: (links: SocialLink[]) => void }> = ({ links, onChange }) => {
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const def = platformDef(platform)!;

  const add = () => {
    const handle = normalizeHandle(platform, value);
    if (!handle) {
      setError(platform === 'website' ? 'Enter a full web address, like https://yoursite.com' : `That doesn’t look like a ${def.name} username.`);
      return;
    }
    if (links.some((l) => l.platform === platform && l.handle.toLowerCase() === handle.toLowerCase())) {
      setError('You’ve already added that one.');
      return;
    }
    onChange([...links, { platform, handle }].slice(0, MAX_SOCIAL_LINKS));
    setValue('');
    setError(null);
  };

  return (
    <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
      <div>
        <h3 className="text-base font-bold text-white font-display">Social links</h3>
        <p className="text-xs text-brand-text-muted mt-1">Pick a platform and type your username. We build the link, so people land right on your account.</p>
      </div>

      {links.length > 0 && (
        <ul className="space-y-2">
          {links.map((l, i) => (
            <li key={`${l.platform}-${l.handle}`} className="flex items-center gap-3 bg-brand-container-high/50 border border-white/5 rounded-xl px-3 py-2">
              <PlatformMark platform={l.platform} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white font-semibold">{platformDef(l.platform)?.name}</div>
                <a href={socialUrl(l) || undefined} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-text-muted hover:text-brand-volt truncate block">
                  {socialLabel(l)}
                </a>
              </div>
              <button
                type="button"
                onClick={() => onChange(links.filter((_, j) => j !== i))}
                className="p-2 text-brand-text-muted hover:text-red-400"
                aria-label={`Remove ${platformDef(l.platform)?.name} link`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {links.length < MAX_SOCIAL_LINKS ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Platform">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={platform === p.id}
                onClick={() => { setPlatform(p.id); setError(null); }}
                className={`h-9 px-3 rounded-full text-xs font-medium border transition-colors ${
                  platform === p.id ? 'bg-brand-volt text-brand-bg border-brand-volt' : 'border-white/15 text-white hover:border-white/30'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <label className="flex-1 flex items-center bg-brand-container-high border border-white/10 rounded-xl focus-within:border-brand-volt overflow-hidden">
              {def.prefix && <span className="pl-3 text-xs text-brand-text-muted font-mono whitespace-nowrap">{def.prefix}</span>}
              <span className="sr-only">{def.name} {platform === 'website' ? 'address' : 'username'}</span>
              <input
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
                placeholder={def.placeholder}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent px-2 py-2.5 text-sm text-white placeholder:text-brand-text-muted/60 focus:outline-none"
              />
            </label>
            <button type="button" onClick={add} className="bg-white/10 hover:bg-brand-volt hover:text-brand-bg text-white px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
        </div>
      ) : (
        <p className="text-xs text-brand-text-muted">You’ve added the maximum of {MAX_SOCIAL_LINKS} links.</p>
      )}
    </div>
  );
};

export const SocialButtons: React.FC<{ links: SocialLink[]; className?: string }> = ({ links, className = '' }) => {
  const items = links.map((l) => ({ l, url: socialUrl(l) })).filter((x) => x.url);
  if (!items.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map(({ l, url }) => (
        <a
          key={`${l.platform}-${l.handle}`}
          href={url!}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-xl border border-white/10 bg-white/5 hover:border-brand-volt/50 hover:bg-white/10 transition-colors"
          aria-label={`${platformDef(l.platform)?.name}: ${socialLabel(l)} (opens in a new tab)`}
        >
          <PlatformMark platform={l.platform} />
          <span className="text-xs text-white font-medium">{socialLabel(l)}</span>
        </a>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Proof of work
// ---------------------------------------------------------------------------

interface Uploading { key: string; name: string; progress: number }

export const ProofEditor: React.FC<{
  uid: string;
  items: ProofItem[];
  onChange: (items: ProofItem[]) => void;
  /** Called with the storage path of an item removed from the list. */
  onRemove: (path: string) => void;
  skillOptions: string[];
}> = ({ uid, items, onChange, onRemove, skillOptions }) => {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id || null);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const selected = items.find((i) => i.id === selectedId) || null;
  const slotsLeft = MAX_PROOF_ITEMS - items.length - uploading.length;

  const update = (id: string, patch: Partial<ProofItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setError(null);
    const list = Array.from(files).slice(0, Math.max(0, slotsLeft));
    if (files.length > list.length) setError(`You can show up to ${MAX_PROOF_ITEMS} items.`);
    for (const file of list) {
      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploading((u) => [...u, { key, name: file.name, progress: 0 }]);
      try {
        const item = await uploadProof(uid, file, (p) =>
          setUploading((u) => u.map((x) => (x.key === key ? { ...x, progress: p } : x)))
        );
        const current = itemsRef.current;
        const next = [...current, { ...item, isCover: current.length === 0, skill: skillOptions[0] || '' }];
        itemsRef.current = next;
        onChange(next);
        setSelectedId(item.id);
      } catch (err) {
        setError(err instanceof ProofError ? err.message : `Couldn’t upload ${file.name}. Please try again.`);
      } finally {
        setUploading((u) => u.filter((x) => x.key !== key));
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = (item: ProofItem) => {
    const rest = items.filter((i) => i.id !== item.id);
    if (item.isCover && rest.length) rest[0] = { ...rest[0], isCover: true };
    onChange(rest);
    onRemove(item.path);
    setSelectedId(rest[0]?.id || null);
  };

  return (
    <div className="bg-brand-container-low border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
      <div>
        <h3 className="text-base font-bold text-white font-display">Proof of work</h3>
        <p className="text-xs text-brand-text-muted mt-1">
          Upload photos or short videos (up to 60 seconds) of your work. Tag each one with the skill it shows.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setSelectedId(it.id)}
            aria-pressed={it.id === selectedId}
            aria-label={`${it.type === 'video' ? 'Video' : 'Photo'}${it.caption ? `: ${it.caption}` : ''}`}
            className={`relative aspect-[3/4] rounded-xl overflow-hidden bg-brand-container-high border-2 ${it.id === selectedId ? 'border-brand-volt' : 'border-transparent'}`}
          >
            {it.type === 'image' ? (
              <img src={it.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <video src={`${it.url}#t=0.1`} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {it.isCover && <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded-full bg-brand-volt text-brand-bg text-[9px] font-bold">COVER</span>}
            {it.type === 'video' && (
              <span className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-mono">▶ {formatDuration(it.durationSec)}</span>
            )}
          </button>
        ))}
        {uploading.map((u) => (
          <div key={u.key} className="relative aspect-[3/4] rounded-xl bg-brand-container-high border border-white/10 grid place-items-center p-2 text-center">
            <div className="w-full">
              <div className="text-[10px] text-brand-text-muted truncate">{u.name}</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-brand-volt transition-all" style={{ width: `${Math.round(u.progress * 100)}%` }} />
              </div>
              <div className="text-[10px] text-brand-volt font-mono mt-1">{Math.round(u.progress * 100)}%</div>
            </div>
          </div>
        ))}
        {slotsLeft > 0 && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            className="aspect-[3/4] rounded-xl border-[1.5px] border-dashed border-brand-volt/50 bg-brand-volt/5 text-brand-volt flex flex-col items-center justify-center gap-1.5 text-xs font-semibold hover:bg-brand-volt/10"
          >
            <Plus className="w-6 h-6" />
            Add
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-[11px] text-brand-text-muted">
        {items.length} of {MAX_PROOF_ITEMS} added · photos, or videos up to 60 seconds and 100 MB each
      </p>
      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}

      {selected && (
        <div className="p-4 rounded-2xl bg-brand-container-high/50 border border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white">{selected.type === 'video' ? 'Video' : 'Photo'} selected</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!!selected.isCover}
                onClick={() => onChange(items.map((i) => ({ ...i, isCover: i.id === selected.id })))}
                className="h-9 px-3 rounded-lg border border-white/15 text-xs text-white whitespace-nowrap disabled:text-brand-volt disabled:border-brand-volt/40"
              >
                {selected.isCover ? 'Cover' : 'Make cover'}
              </button>
              <button type="button" onClick={() => remove(selected)} className="h-9 px-3 rounded-lg border border-white/15 text-xs text-red-300 hover:border-red-400/50">
                Remove
              </button>
            </div>
          </div>
          <label className="block">
            <span className={label}>Caption</span>
            <input
              value={selected.caption}
              maxLength={140}
              onChange={(e) => update(selected.id, { caption: e.target.value })}
              placeholder="What was the brief?"
              className={input}
            />
          </label>
          {skillOptions.length > 0 && (
            <div>
              <span className={label}>Skill it shows</span>
              <div className="flex flex-wrap gap-1.5">
                {skillOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={selected.skill === s}
                    onClick={() => update(selected.id, { skill: s })}
                    className={`h-8 px-3 rounded-full text-xs border ${
                      selected.skill === s ? 'bg-brand-volt text-brand-bg border-brand-volt' : 'border-white/15 text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ProofGallery: React.FC<{ uid: string; items?: ProofItem[] }> = ({ uid, items }) => {
  const list = visibleProof(uid, items);
  const [open, setOpen] = useState<ProofItem | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!list.length) return null;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {list.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setOpen(it)}
            className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-brand-container-high text-left"
            aria-label={`Open ${it.type === 'video' ? 'video' : 'photo'}${it.caption ? `: ${it.caption}` : ''}`}
          >
            {it.type === 'image' ? (
              <img src={it.url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
            ) : (
              <video src={`${it.url}#t=0.1`} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <span className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 to-transparent">
              {it.skill && <span className="block text-[10px] font-mono text-brand-volt uppercase truncate">{it.skill}</span>}
              {it.caption && <span className="block text-xs text-white truncate">{it.caption}</span>}
            </span>
            {it.type === 'video' && (
              <span className="absolute right-1.5 top-1.5 px-1.5 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-mono">▶ {formatDuration(it.durationSec)}</span>
            )}
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={open.caption || 'Proof of work'} onClick={() => setOpen(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2" aria-label="Close" onClick={() => setOpen(null)}>
            <Close className="w-7 h-7" />
          </button>
          <figure className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            {open.type === 'image' ? (
              <img src={open.url} alt={open.caption || ''} className="w-full max-h-[78vh] object-contain rounded-xl" />
            ) : (
              <video src={open.url} controls autoPlay playsInline className="w-full max-h-[78vh] rounded-xl bg-black" />
            )}
            {(open.caption || open.skill) && (
              <figcaption className="mt-3 text-center">
                {open.skill && <span className="block text-[11px] font-mono text-brand-volt uppercase">{open.skill}</span>}
                {open.caption && <span className="text-sm text-white">{open.caption}</span>}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Track record and reviews
// ---------------------------------------------------------------------------

const TIERS = ['New', 'Rising', 'Trusted', 'Top rated'] as const;

export const Stars: React.FC<{ value: number; className?: string }> = ({ value, className = 'w-3.5 h-3.5' }) => (
  <span className="inline-flex" aria-label={`${value.toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <React.Fragment key={n}>
        <Star className={`${className} ${n <= Math.round(value) ? 'text-[#FFB547]' : 'text-white/20'}`} />
      </React.Fragment>
    ))}
  </span>
);

const fmtHours = (h: number | null) => (h === null ? '—' : h < 24 ? `${Math.max(1, Math.round(h))}h` : `${(h / 24).toFixed(1)}d`);

function statTiles(s: RoleStats, role: 'creative' | 'provider') {
  const pct = s.distinctPartners ? Math.round((s.repeatPartners / s.distinctPartners) * 100) : null;
  return role === 'creative'
    ? [
        { value: String(s.completedContracts), label: 'Paid contracts', how: 'Completed on SideQuests' },
        { value: pct === null ? '—' : `${pct}%`, label: 'Rehire rate', how: s.distinctPartners ? `${s.repeatPartners} of ${s.distinctPartners} hired them again` : 'No gig providers yet' },
        { value: s.avgRevisionRounds === null ? '—' : String(s.avgRevisionRounds), label: 'Revision rounds', how: 'Average per milestone' },
        { value: s.wouldWorkAgainPct === null ? '—' : `${s.wouldWorkAgainPct}%`, label: 'Would hire again', how: 'From gig provider reviews' }
      ]
    : [
        { value: String(s.completedContracts), label: 'Paid contracts', how: 'Every one funded up front' },
        { value: fmtHours(s.avgApprovalHours), label: 'Approval speed', how: 'Average time to approve work' },
        { value: s.avgRevisionRounds === null ? '—' : String(s.avgRevisionRounds), label: 'Revision rounds', how: 'Average asked per milestone' },
        { value: String(s.repeatPartners), label: 'Creatives rehired', how: 'Came back to work again' }
      ];
}

export const TrackRecord: React.FC<{ uid: string; role: 'creative' | 'provider'; verified?: boolean }> = ({ uid, role, verified }) => {
  const [stats, setStats] = useState<PublicStats | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => subscribePublicStats(uid, setStats), [uid]);
  useEffect(() => {
    let live = true;
    fetchReviewsAbout(uid).then((r) => live && setReviews(r)).catch(() => live && setReviews([]));
    return () => { live = false; };
  }, [uid, stats?.updatedAt]);

  const s: RoleStats | undefined = role === 'creative' ? stats?.asCreative : stats?.asProvider;
  const level = s?.level || 'New';
  const levelIdx = TIERS.indexOf(level);
  const cats = role === 'creative' ? CREATIVE_CATEGORIES : PROVIDER_CATEGORIES;
  // Reviews about this person in this role are written by the other side.
  const roleReviews = (reviews || []).filter((r) => r.reviewerRole !== role);
  const topTags = Object.entries(s?.tagCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const badges = [...(s?.badges || [])];
  if (role === 'creative' && verified && !badges.some((b) => b.id === 'verified')) {
    badges.unshift({ id: 'verified', name: 'Verified creative', rule: 'Identity and portfolio checked by SideQuests' });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-brand-volt text-brand-bg flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.15em]">TRACK RECORD LEVEL</span>
            <span className="text-xs font-semibold">{s?.completedContracts || 0} paid contract{s?.completedContracts === 1 ? '' : 's'}</span>
          </div>
          <span className="font-display text-3xl font-semibold leading-none">{level}</span>
          <div className="grid grid-cols-4 gap-1">
            {TIERS.map((t, i) => (
              <div key={t} className="flex flex-col gap-1">
                <span className={`h-1.5 rounded-full ${i <= levelIdx ? 'bg-brand-bg' : 'bg-brand-bg/20'}`} />
                <span className={`text-[11px] font-semibold ${i === levelIdx ? '' : 'opacity-55'}`}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-brand-container-low border border-white/10">
          {s && s.ratingCount > 0 && s.ratingAvg !== null ? (
            <>
              <div className="flex items-end gap-3">
                <span className="font-mono text-4xl text-white">{s.ratingAvg.toFixed(1)}</span>
                <div className="pb-1">
                  <Stars value={s.ratingAvg} className="w-4 h-4" />
                  <div className="text-xs text-brand-text-muted">{s.ratingCount} review{s.ratingCount === 1 ? '' : 's'}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {cats.map((c) => {
                  const v = s.categoryAvgs[c.key];
                  return (
                    <div key={c.key} className="flex items-center gap-3 text-xs">
                      <span className="w-32 text-brand-text-muted">{c.name}</span>
                      <span className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <span className="block h-full bg-[#FFB547]" style={{ width: `${((v || 0) / 5) * 100}%` }} />
                      </span>
                      <span className="w-8 text-right font-mono text-white">{v ? v.toFixed(1) : '—'}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col justify-center">
              <div className="text-sm font-semibold text-white">No reviews yet</div>
              <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                Reviews come only from people who completed a paid contract together, so every one is real.
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-brand-text-muted mb-2">Measured from paid contracts, not opinions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(s ? statTiles(s, role) : statTiles({ completedContracts: 0, ratingAvg: null, ratingCount: 0, categoryAvgs: {}, tagCounts: {}, wouldWorkAgainPct: null, repeatPartners: 0, distinctPartners: 0, avgRevisionRounds: null, avgApprovalHours: null, level: 'New', badges: [] }, role)).map((t) => (
            <div key={t.label} className="p-3.5 rounded-xl bg-brand-container-low border border-white/5">
              <div className="font-mono text-2xl text-brand-volt">{t.value}</div>
              <div className="text-xs font-semibold text-white mt-0.5">{t.label}</div>
              <div className="text-[11px] text-brand-text-muted leading-snug">{t.how}</div>
            </div>
          ))}
        </div>
      </div>

      {badges.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-brand-text-muted mb-2">Badges earned</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {badges.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10">
                <span className="w-9 h-9 rounded-lg bg-brand-volt/10 grid place-items-center flex-shrink-0">
                  {b.id === 'verified' ? <Verified className="w-5 h-5 text-brand-volt" /> : <VerifiedUser className="w-5 h-5 text-brand-volt" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{b.name}</span>
                  <span className="block text-[11px] text-brand-text-muted">{b.rule}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {topTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topTags.map(([t, n]) => (
            <span key={t} className="px-3 py-1.5 rounded-full border border-white/10 text-xs text-white">
              {t} <span className="text-brand-text-muted font-mono">×{n}</span>
            </span>
          ))}
        </div>
      )}

      {roleReviews.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-brand-text-muted mb-2">Reviews</h4>
          <ul className="space-y-2">
            {(showAll ? roleReviews : roleReviews.slice(0, 3)).map((r) => (
              <li key={r.id} className="p-4 rounded-xl bg-brand-container-low border border-white/5">
                <div className="flex items-center gap-3">
                  <Avatar src={r.reviewerAvatar || ''} name={r.reviewerName} className="w-9 h-9 rounded-lg text-xs" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white font-semibold truncate">{r.reviewerName}</div>
                    <div className="text-[11px] text-brand-text-muted truncate">
                      {r.questTitle} · {new Date(r.releasedAt || r.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <Stars value={r.overall} />
                </div>
                {r.note && <p className="mt-3 text-sm text-white/90 leading-relaxed">{r.note}</p>}
                {r.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-white/5 text-[11px] text-brand-text-muted">{t}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {roleReviews.length > 3 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs text-brand-volt hover:underline">
              {showAll ? 'Show fewer' : `Show all ${roleReviews.length} reviews`}
            </button>
          )}
        </div>
      )}
      {stats === undefined && <p className="text-xs text-brand-text-muted">Loading track record…</p>}
    </div>
  );
};
