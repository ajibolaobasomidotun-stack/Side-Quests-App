/**
 * The creative verticals SideQuests covers. Used for quest categories, the
 * homepage verticals, directory filters, and to group profile skills.
 * Add a vertical here and it appears everywhere.
 */
export const GIG_CATEGORIES = [
  {
    key: 'Music & Audio',
    tag: 'MUSIC',
    blurb: 'Producers, session musicians, vocalists, mix engineers, DJs and sound designers.'
  },
  {
    key: 'Photo & Video',
    tag: 'VISUAL',
    blurb: 'Photographers, videographers, editors, animators and motion designers.'
  },
  {
    key: 'Design & Illustration',
    tag: 'DESIGN',
    blurb: 'Brand and graphic designers, illustrators, UI/UX, 3D artists and muralists.'
  },
  {
    key: 'Writing & Content',
    tag: 'WORDS',
    blurb: 'Copywriters, scriptwriters, editors, social media managers and UGC creators.'
  },
  {
    key: 'Performance & Events',
    tag: 'LIVE',
    blurb: 'Actors, dancers, hosts and MCs, voice actors, models and live performers.'
  },
  {
    key: 'Fashion & Beauty',
    tag: 'STYLE',
    blurb: 'Makeup artists, hair and wardrobe stylists, fashion designers and tailors.'
  }
] as const;

export type GigCategory = (typeof GIG_CATEGORIES)[number]['key'] | 'Other';

export const GIG_CATEGORY_KEYS: GigCategory[] = [...GIG_CATEGORIES.map((c) => c.key), 'Other'];

/** Maps categories from the music-only prototype onto the new verticals. */
export function normalizeCategory(value: unknown): GigCategory {
  const v = String(value || '');
  if ((GIG_CATEGORY_KEYS as string[]).includes(v)) return v as GigCategory;
  if (['Live Performance', 'Studio Sessions', 'Production'].includes(v)) return 'Music & Audio';
  return 'Other';
}
