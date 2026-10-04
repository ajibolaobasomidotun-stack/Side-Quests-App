/**
 * Reviews and track record.
 *
 * Two-way blind reviews: once a contract is completed, the gig provider and
 * the creative each have REVIEW_WINDOW_DAYS to review the other. A review
 * stays hidden until both are in, or until the window closes, so neither
 * side can retaliate. Only people on a completed (paid) contract can review.
 *
 * Track record (publicStats/{uid}) is recomputed from contract data and
 * released reviews whenever a contract completes or reviews are released.
 *
 * Keep the category and tag lists in sync with src/lib/reviews.ts.
 */
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';

const db = () => getFirestore();

export const REVIEW_WINDOW_DAYS = 14;
const DAY_MS = 86400000;

const CATEGORY_KEYS = {
  creative: ['quality', 'brief', 'communication', 'onTime'],
  provider: ['clearBrief', 'fairFeedback', 'communication', 'promptApprovals']
} as const;

const TAGS = {
  creative: [
    'Great communication', 'Matched the brief', 'On time', 'Creative ideas', 'Easy revisions', 'Would hire again',
    'Late delivery', 'Hard to reach', 'Missed the brief', 'Too many revisions', 'Quality issues'
  ],
  provider: [
    'Clear brief', 'Fair feedback', 'Fast approvals', 'Great communication', 'Respectful', 'Would work again',
    'Unclear brief', 'Scope creep', 'Slow approvals', 'Hard to reach', 'Unfair feedback'
  ]
};

type Role = 'creative' | 'provider';

const isStar = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5;

function completedAtOf(c: FirebaseFirestore.DocumentData): string | undefined {
  return c.completedAt || (c.status === 'completed' ? c.updatedAt : undefined);
}

async function postSystemMessage(contractId: string, senderUid: string, senderName: string, text: string) {
  await db().collection('contracts').doc(contractId).collection('messages').add({
    senderUid,
    senderName,
    type: 'system',
    text,
    createdAt: FieldValue.serverTimestamp()
  });
}

// ---------------------------------------------------------------------------
// Submitting a review
// ---------------------------------------------------------------------------

export const submitReview = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Please sign in.');
  const data = (req.data || {}) as Record<string, unknown>;

  const contractId = typeof data.contractId === 'string' && data.contractId.length <= 300 ? data.contractId : '';
  if (!contractId) throw new HttpsError('invalid-argument', 'Missing contract.');
  if (!isStar(data.overall)) throw new HttpsError('invalid-argument', 'Pick a star rating from 1 to 5.');
  if (typeof data.wouldWorkAgain !== 'boolean') throw new HttpsError('invalid-argument', 'Say whether you’d work together again.');
  const note = typeof data.note === 'string' ? data.note.trim().slice(0, 1000) : '';

  const cRef = db().collection('contracts').doc(contractId);
  const myRef = db().collection('reviews').doc(`${contractId}_${uid}`);

  const result = await db().runTransaction(async (tx) => {
    const cSnap = await tx.get(cRef);
    const c = cSnap.data();
    if (!c) throw new HttpsError('not-found', 'Contract not found.');
    if (!Array.isArray(c.participants) || !c.participants.includes(uid)) {
      throw new HttpsError('permission-denied', 'Only the two people on this contract can review it.');
    }
    if (c.status !== 'completed' || c.paymentStatus !== 'paid') {
      throw new HttpsError('failed-precondition', 'You can review once the contract is paid and completed.');
    }
    const doneAt = completedAtOf(c);
    const deadline = new Date(new Date(doneAt || Date.now()).getTime() + REVIEW_WINDOW_DAYS * DAY_MS);
    if (Date.now() > deadline.getTime()) {
      throw new HttpsError('failed-precondition', `The ${REVIEW_WINDOW_DAYS}-day review window for this contract has closed.`);
    }

    const reviewerRole: Role = c.clientUid === uid ? 'provider' : 'creative';
    const revieweeRole: Role = reviewerRole === 'provider' ? 'creative' : 'provider';
    const revieweeUid: string = reviewerRole === 'provider' ? c.creativeUid : c.clientUid;

    // Validate categories and tags for the person being reviewed.
    const raw = (data.categories || {}) as Record<string, unknown>;
    const categories: Record<string, number> = {};
    for (const key of CATEGORY_KEYS[revieweeRole]) {
      if (!isStar(raw[key])) throw new HttpsError('invalid-argument', 'Rate every category from 1 to 5.');
      categories[key] = raw[key] as number;
    }
    const allowedTags = TAGS[revieweeRole];
    const tags = Array.isArray(data.tags)
      ? Array.from(new Set(data.tags.filter((t): t is string => typeof t === 'string' && allowedTags.includes(t)))).slice(0, 6)
      : [];

    const [mine, theirs] = await Promise.all([tx.get(myRef), tx.get(db().collection('reviews').doc(`${contractId}_${revieweeUid}`))]);
    if (mine.exists) throw new HttpsError('already-exists', 'You’ve already reviewed this contract.');

    const now = new Date().toISOString();
    const releaseNow = theirs.exists;
    const reviewerName = reviewerRole === 'provider' ? c.clientName : c.creativeName;
    const reviewerAvatar = reviewerRole === 'provider' ? c.clientAvatar : c.creativeAvatar;

    tx.set(myRef, {
      contractId,
      questTitle: String(c.questTitle || '').slice(0, 140),
      reviewerUid: uid,
      reviewerName: String(reviewerName || 'SideQuests member').slice(0, 80),
      // Only short https links (e.g. Google photos); data URLs would bloat every review.
      ...(typeof reviewerAvatar === 'string' && reviewerAvatar.startsWith('https://') && reviewerAvatar.length < 500
        ? { reviewerAvatar } : {}),
      reviewerRole,
      revieweeUid,
      overall: data.overall,
      categories,
      tags,
      note,
      wouldWorkAgain: data.wouldWorkAgain,
      createdAt: now,
      releaseAt: deadline.toISOString(),
      released: releaseNow,
      ...(releaseNow ? { releasedAt: now } : {})
    });
    if (releaseNow) tx.update(theirs.ref, { released: true, releasedAt: now });
    tx.update(cRef, { reviewedBy: FieldValue.arrayUnion(uid) });

    return { released: releaseNow, revieweeUid, reviewerName: String(reviewerName || 'Someone') };
  });

  try {
    if (result.released) {
      await Promise.all([recomputeStats(uid), recomputeStats(result.revieweeUid)]);
      await postSystemMessage(contractId, uid, result.reviewerName, 'Both reviews are in and are now on each other’s profiles.');
    } else {
      await postSystemMessage(
        contractId,
        uid,
        result.reviewerName,
        `${result.reviewerName} left a review. It stays hidden until you leave yours, or for ${REVIEW_WINDOW_DAYS} days after the contract was completed.`
      );
    }
  } catch (err) {
    logger.error('After-review work failed', { contractId, err });
  }
  return { released: result.released };
});

// ---------------------------------------------------------------------------
// Release reviews whose window has closed (the other side never reviewed)
// ---------------------------------------------------------------------------

export const releaseExpiredReviews = onSchedule('every 6 hours', async () => {
  const now = new Date().toISOString();
  const snap = await db().collection('reviews').where('released', '==', false).where('releaseAt', '<=', now).limit(400).get();
  if (snap.empty) return;
  const batch = db().batch();
  const touched = new Set<string>();
  snap.docs.forEach((d) => {
    batch.update(d.ref, { released: true, releasedAt: now });
    touched.add(d.get('revieweeUid'));
  });
  await batch.commit();
  for (const u of touched) await recomputeStats(u).catch((err) => logger.error('Stats recompute failed', { u, err }));
  logger.info(`Released ${snap.size} reviews after the review window closed.`);
});

// ---------------------------------------------------------------------------
// Contract completed: stamp the time, invite reviews, refresh both track records
// ---------------------------------------------------------------------------

export const onContractCompleted = onDocumentUpdated('contracts/{contractId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  if (before.status === 'completed' || after.status !== 'completed') return;

  const contractId = event.params.contractId;
  await event.data!.after.ref.update({ completedAt: new Date().toISOString() });
  await postSystemMessage(
    contractId,
    after.clientUid,
    after.clientName || 'SideQuests',
    `Contract complete. You each have ${REVIEW_WINDOW_DAYS} days to leave a review. Reviews stay hidden until you’ve both submitted.`
  );
  await Promise.all([recomputeStats(after.clientUid), recomputeStats(after.creativeUid)]);
});

// ---------------------------------------------------------------------------
// Track record
// ---------------------------------------------------------------------------

type Level = 'New' | 'Rising' | 'Trusted' | 'Top rated';
interface Badge { id: string; name: string; rule: string }

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (n: number | null, dp = 2) => (n === null ? null : Math.round(n * 10 ** dp) / 10 ** dp);

function levelFor(completed: number, ratingAvg: number | null, ratingCount: number, wwa: number | null): Level {
  const r = ratingAvg ?? 0;
  if (completed >= 15 && ratingCount >= 10 && r >= 4.8 && (wwa ?? 0) >= 90) return 'Top rated';
  if (completed >= 5 && ratingCount >= 3 && r >= 4.5) return 'Trusted';
  if (completed >= 1) return 'Rising';
  return 'New';
}

export async function recomputeStats(uid: string) {
  if (!uid) return;
  const [contractsSnap, reviewsSnap, userSnap] = await Promise.all([
    db().collection('contracts').where('participants', 'array-contains', uid).get(),
    db().collection('reviews').where('revieweeUid', '==', uid).where('released', '==', true).get(),
    db().collection('users').doc(uid).get()
  ]);
  const completed = contractsSnap.docs.filter((d) => d.get('status') === 'completed');
  const reviews = reviewsSnap.docs.map((d) => d.data());

  const milestonesByContract = new Map<string, FirebaseFirestore.DocumentData[]>();
  await Promise.all(
    completed.map(async (d) => {
      const ms = await d.ref.collection('milestones').get();
      milestonesByContract.set(d.id, ms.docs.map((m) => m.data()));
    })
  );

  const build = (role: Role) => {
    const mine = completed.filter((d) => (role === 'creative' ? d.get('creativeUid') : d.get('clientUid')) === uid);
    const partnerCounts = new Map<string, number>();
    mine.forEach((d) => {
      const p = role === 'creative' ? d.get('clientUid') : d.get('creativeUid');
      partnerCounts.set(p, (partnerCounts.get(p) || 0) + 1);
    });
    const repeatPartners = [...partnerCounts.values()].filter((n) => n >= 2).length;

    const milestones = mine.flatMap((d) => milestonesByContract.get(d.id) || []);
    const approved = milestones.filter((m) => m.status === 'approved');
    const revisionRounds = approved.map((m) => Number(m.revisionCount || 0));
    const approvalHours = approved
      .filter((m) => m.submittedAt && m.paidAt)
      .map((m) => (new Date(m.paidAt).getTime() - new Date(m.submittedAt).getTime()) / 3600000)
      .filter((h) => Number.isFinite(h) && h >= 0);

    // Reviews about me in this role are written by the other role.
    const about = reviews.filter((r) => r.reviewerRole === (role === 'creative' ? 'provider' : 'creative'));
    const ratingAvg = round(avg(about.map((r) => Number(r.overall))));
    const categoryAvgs: Record<string, number> = {};
    for (const key of CATEGORY_KEYS[role]) {
      const a = avg(about.map((r) => r.categories?.[key]).filter(isStar));
      if (a !== null) categoryAvgs[key] = round(a)!;
    }
    const tagCounts: Record<string, number> = {};
    about.forEach((r) => (r.tags || []).forEach((t: string) => (tagCounts[t] = (tagCounts[t] || 0) + 1)));
    const wwa = about.length ? Math.round((about.filter((r) => r.wouldWorkAgain).length / about.length) * 100) : null;
    const avgRevisionRounds = round(avg(revisionRounds), 1);
    const avgApprovalHours = role === 'provider' ? round(avg(approvalHours), 1) : null;

    const badges: Badge[] = [];
    if (role === 'creative') {
      if (userSnap.get('verified') === true) badges.push({ id: 'verified', name: 'Verified creative', rule: 'Identity and portfolio checked by SideQuests' });
      if (repeatPartners >= 3) badges.push({ id: 'rehired', name: 'Rehired', rule: '3+ gig providers came back for more' });
      if ((categoryAvgs.onTime ?? 0) >= 4.7 && about.length >= 3) badges.push({ id: 'onTime', name: 'Always on time', rule: 'Rated 4.7+ for delivering on time' });
      if (approved.length >= 5 && (avgRevisionRounds ?? 9) <= 0.5) badges.push({ id: 'firstTime', name: 'Right first time', rule: '5+ milestones, usually approved without changes' });
    } else {
      if (approvalHours.length >= 3 && (avgApprovalHours ?? 999) <= 48) badges.push({ id: 'fastApprover', name: 'Fast approver', rule: 'Approves work within 2 days on average' });
      if ((categoryAvgs.clearBrief ?? 0) >= 4.5 && about.length >= 3) badges.push({ id: 'clearBriefs', name: 'Clear briefs', rule: 'Rated 4.5+ on brief clarity by creatives' });
      if (repeatPartners >= 3) badges.push({ id: 'repeatHirer', name: 'Repeat hirer', rule: 'Rehired 3+ creatives' });
    }

    return {
      completedContracts: mine.length,
      ratingAvg,
      ratingCount: about.length,
      categoryAvgs,
      tagCounts,
      wouldWorkAgainPct: wwa,
      repeatPartners,
      distinctPartners: partnerCounts.size,
      avgRevisionRounds,
      avgApprovalHours,
      level: levelFor(mine.length, ratingAvg, about.length, wwa),
      badges
    };
  };

  await db().collection('publicStats').doc(uid).set({
    asCreative: build('creative'),
    asProvider: build('provider'),
    updatedAt: new Date().toISOString()
  });
}
