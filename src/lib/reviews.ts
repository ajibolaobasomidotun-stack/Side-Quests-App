/**
 * Reviews: two-way and blind. After a contract is completed, each side has
 * 14 days to review the other. Reviews stay hidden until both are in, or
 * until the window closes. All writes go through the `submitReview` server
 * function; the browser can only read.
 *
 *   reviews/{contractId}_{reviewerUid}   – one per person per contract
 *   publicStats/{uid}                    – track record computed by the server
 *
 * Keep the category and tag lists in sync with functions/src/reviews.ts.
 */
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from './firebase';
import type { Contract, PublicStats, Review, ReviewerRole } from '../types';

export const REVIEW_WINDOW_DAYS = 14;

export interface ReviewCategory { key: string; name: string; hint: string }

/** What a gig provider rates a creative on. */
export const CREATIVE_CATEGORIES: ReviewCategory[] = [
  { key: 'quality', name: 'Quality of work', hint: 'Did it look or sound great?' },
  { key: 'brief', name: 'Matched the brief', hint: 'What you asked for' },
  { key: 'communication', name: 'Communication', hint: 'Replies and updates' },
  { key: 'onTime', name: 'On time', hint: 'Delivered when agreed' }
];

/** What a creative rates a gig provider on. */
export const PROVIDER_CATEGORIES: ReviewCategory[] = [
  { key: 'clearBrief', name: 'Clear brief', hint: 'Knew what they wanted' },
  { key: 'fairFeedback', name: 'Fair feedback', hint: 'Reasonable revisions' },
  { key: 'communication', name: 'Communication', hint: 'Replies and updates' },
  { key: 'promptApprovals', name: 'Prompt approvals', hint: 'Released payments quickly' }
];

export const CREATIVE_TAGS = {
  good: ['Great communication', 'Matched the brief', 'On time', 'Creative ideas', 'Easy revisions', 'Would hire again'],
  bad: ['Late delivery', 'Hard to reach', 'Missed the brief', 'Too many revisions', 'Quality issues']
};

export const PROVIDER_TAGS = {
  good: ['Clear brief', 'Fair feedback', 'Fast approvals', 'Great communication', 'Respectful', 'Would work again'],
  bad: ['Unclear brief', 'Scope creep', 'Slow approvals', 'Hard to reach', 'Unfair feedback']
};

/** Categories and tags for the person being reviewed. */
export const reviewSpecFor = (revieweeRole: ReviewerRole) =>
  revieweeRole === 'creative'
    ? { categories: CREATIVE_CATEGORIES, tags: CREATIVE_TAGS }
    : { categories: PROVIDER_CATEGORIES, tags: PROVIDER_TAGS };

export const STAR_WORDS = ['', 'Poor', 'Below expectations', 'Okay', 'Good', 'Excellent'];

/** When the review window for a completed contract closes, or null if unknown. */
export function reviewDeadline(c: Contract): Date | null {
  const done = c.completedAt || (c.status === 'completed' ? c.updatedAt : undefined);
  if (!done) return null;
  return new Date(new Date(done).getTime() + REVIEW_WINDOW_DAYS * 86400000);
}

/** True when this person can still review this contract. */
export function canReview(c: Contract, uid: string): boolean {
  if (c.status !== 'completed' || !c.participants.includes(uid)) return false;
  if (c.reviewedBy?.includes(uid)) return false;
  const d = reviewDeadline(c);
  return !d || d.getTime() > Date.now();
}

export interface ReviewInput {
  contractId: string;
  overall: number;
  categories: Record<string, number>;
  tags: string[];
  note: string;
  wouldWorkAgain: boolean;
}

const functions = getFunctions(app, 'us-central1');

export async function submitReview(input: ReviewInput): Promise<{ released: boolean }> {
  const res = await httpsCallable<ReviewInput, { released: boolean }>(functions, 'submitReview')(input);
  return res.data;
}

const toReview = (id: string, d: Record<string, any>): Review => ({ id, ...(d as Omit<Review, 'id'>) });

/** Released reviews about a person, newest first. */
export async function fetchReviewsAbout(uid: string, max = 20): Promise<Review[]> {
  const q = query(
    collection(db, 'reviews'),
    where('revieweeUid', '==', uid),
    where('released', '==', true),
    orderBy('releasedAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toReview(d.id, d.data()));
}

/** The review this person left on a contract (visible to them before release). */
export async function fetchMyReview(contractId: string, uid: string): Promise<Review | null> {
  const snap = await getDoc(doc(db, 'reviews', `${contractId}_${uid}`));
  return snap.exists() ? toReview(snap.id, snap.data()) : null;
}

/** The other person's review of me on a contract, once released. */
export async function fetchReviewOfMe(contract: Contract, uid: string): Promise<Review | null> {
  const other = contract.participants.find((p) => p !== uid);
  if (!other) return null;
  try {
    const snap = await getDoc(doc(db, 'reviews', `${contract.id}_${other}`));
    return snap.exists() ? toReview(snap.id, snap.data()) : null;
  } catch {
    return null; // not released yet
  }
}

export function subscribePublicStats(uid: string, onUpdate: (s: PublicStats | null) => void) {
  return onSnapshot(
    doc(db, 'publicStats', uid),
    (snap) => onUpdate(snap.exists() ? (snap.data() as PublicStats) : null),
    () => onUpdate(null)
  );
}

export function reviewErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string };
  if (e?.code && e.code !== 'functions/internal' && e.message) return e.message;
  return 'Could not send your review. Please try again.';
}
