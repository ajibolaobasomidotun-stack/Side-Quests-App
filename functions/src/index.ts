/**
 * SideQuests server functions: Protected Payments with Stripe Connect.
 *
 * Money flow ("separate charges and transfers"):
 *   1. A creative sets up payouts once (Stripe-hosted onboarding, connected account).
 *   2. After the creative accepts a contract's terms, the gig provider pays
 *      the contract total through Stripe Checkout (no fee on top;
 *      US bank account first, card also accepted).
 *   3. Stripe confirms the payment by webhook → contract becomes active.
 *   4. Each time the gig provider approves a milestone, that milestone's amount
 *      minus the 3% platform fee is transferred to the creative's connected
 *      account. SideQuests keeps the fee.
 *
 * Contracts paid before the fee moved to the creative (checkout metadata
 * feeCents > 0) keep the old model: the creative receives the full amount.
 *
 * Every money-related state change happens here, never in the browser;
 * firestore.rules blocks clients from writing the fields set below.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, onRequest, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import Stripe from 'stripe';

initializeApp();
const db = getFirestore();

setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const APP_URL = defineString('APP_URL', { default: 'https://sidequests-f6394.web.app' });

/** Platform fee, deducted from the creative's payout for each milestone. */
const PLATFORM_FEE_RATE = 0.03;

let stripeClient: Stripe | null = null;
function stripe(): Stripe {
  if (!stripeClient) stripeClient = new Stripe(STRIPE_SECRET_KEY.value());
  return stripeClient;
}

const cents = (dollars: number) => Math.round(dollars * 100);
/** The platform's cut of a milestone payout, in cents. */
const payoutFeeCents = (amountCents: number) => Math.round(amountCents * PLATFORM_FEE_RATE);

function requireAuth(req: CallableRequest<unknown>): string {
  if (!req.auth?.uid) throw new HttpsError('unauthenticated', 'Please sign in.');
  return req.auth.uid;
}

function asString(v: unknown, name: string): string {
  if (typeof v !== 'string' || !v || v.length > 300) throw new HttpsError('invalid-argument', `Missing ${name}.`);
  return v;
}

async function postSystemMessage(contractId: string, senderUid: string, senderName: string, text: string) {
  await db.collection('contracts').doc(contractId).collection('messages').add({
    senderUid,
    senderName,
    type: 'system',
    text,
    createdAt: FieldValue.serverTimestamp()
  });
  await db.collection('contracts').doc(contractId).update({
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: text.slice(0, 140),
    lastMessageBy: senderUid
  });
}

// ---------------------------------------------------------------------------
// Payouts (creatives)
// ---------------------------------------------------------------------------

async function getOrCreateAccount(uid: string, email: string | undefined): Promise<string> {
  const ref = db.collection('stripeAccounts').doc(uid);
  const snap = await ref.get();
  const existing = snap.data()?.accountId as string | undefined;
  if (existing) return existing;

  const account = await stripe().accounts.create(
    {
      country: 'US',
      email,
      controller: {
        fees: { payer: 'application' },
        losses: { payments: 'application' },
        requirement_collection: 'stripe',
        stripe_dashboard: { type: 'express' }
      },
      capabilities: { transfers: { requested: true } },
      metadata: { uid }
    },
    { idempotencyKey: `account_${uid}` }
  );
  await ref.set({ accountId: account.id, createdAt: new Date().toISOString() }, { merge: true });
  return account.id;
}

/** Returns a Stripe-hosted link where the creative adds identity and bank details. */
export const createPayoutOnboardingLink = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const uid = requireAuth(req);
  const accountId = await getOrCreateAccount(uid, req.auth?.token.email);
  const base = APP_URL.value();
  const link = await stripe().accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${base}/?payouts=refresh`,
    return_url: `${base}/?payouts=return`
  });
  return { url: link.url };
});

/** Checks the creative's Stripe account and records whether payouts can be received. */
export const refreshPayoutStatus = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const uid = requireAuth(req);
  const snap = await db.collection('stripeAccounts').doc(uid).get();
  const accountId = snap.data()?.accountId as string | undefined;
  if (!accountId) return { payoutsReady: false, detailsSubmitted: false };

  const account = await stripe().accounts.retrieve(accountId);
  const payoutsReady = account.capabilities?.transfers === 'active' && !!account.payouts_enabled;
  const detailsSubmitted = !!account.details_submitted;
  await snap.ref.set({ payoutsReady, detailsSubmitted, checkedAt: new Date().toISOString() }, { merge: true });
  // Public flag so the app can show "payouts ready" (clients cannot set it themselves).
  await db.collection('users').doc(uid).set({ payoutsReady }, { merge: true });
  return { payoutsReady, detailsSubmitted };
});

/** Link to the creative's Stripe Express dashboard (payout history, bank details). */
export const createPayoutDashboardLink = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const uid = requireAuth(req);
  const snap = await db.collection('stripeAccounts').doc(uid).get();
  const accountId = snap.data()?.accountId as string | undefined;
  if (!accountId) throw new HttpsError('failed-precondition', 'Set up payouts first.');
  const link = await stripe().accounts.createLoginLink(accountId);
  return { url: link.url };
});

// ---------------------------------------------------------------------------
// Funding a contract (gig provider)
// ---------------------------------------------------------------------------

export const createContractCheckout = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const uid = requireAuth(req);
  const contractId = asString((req.data as { contractId?: unknown })?.contractId, 'contract');
  const ref = db.collection('contracts').doc(contractId);
  const snap = await ref.get();
  const c = snap.data();
  if (!c) throw new HttpsError('not-found', 'Contract not found.');
  if (c.clientUid !== uid) throw new HttpsError('permission-denied', 'Only the gig provider can pay for this contract.');
  if (c.status !== 'awaiting_payment') throw new HttpsError('failed-precondition', 'This contract isn’t waiting for payment.');
  if (c.paymentStatus === 'processing') throw new HttpsError('failed-precondition', 'A payment is already being processed.');

  // Recompute the total from the milestones rather than trusting the contract doc.
  const ms = await ref.collection('milestones').get();
  const totalDollars = ms.docs.reduce((s, d) => s + (Number(d.data().amount) || 0), 0);
  if (totalDollars <= 0 || totalDollars !== Number(c.totalAmount)) {
    throw new HttpsError('failed-precondition', 'The milestone total doesn’t match the contract. Please refresh.');
  }
  const amount = cents(totalDollars);
  const base = APP_URL.value();

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    // Bank transfer first: it's far cheaper for the platform than cards.
    payment_method_types: ['us_bank_account', 'card'],
    payment_method_options: {
      us_bank_account: { verification_method: 'automatic' }
    },
    customer_email: req.auth?.token.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          product_data: { name: `Contract: ${String(c.questTitle).slice(0, 200)}`, description: `With ${String(c.creativeName).slice(0, 100)}` }
        }
      }
    ],
    payment_intent_data: {
      transfer_group: contractId,
      metadata: { contractId, clientUid: uid, creativeUid: c.creativeUid }
    },
    // feeCents is 0: the gig provider pays only the contract total.
    metadata: { contractId, amountCents: String(amount), feeCents: '0', feeModel: 'creative' },
    success_url: `${base}/?contract=${encodeURIComponent(contractId)}&checkout=success`,
    cancel_url: `${base}/?contract=${encodeURIComponent(contractId)}&checkout=cancelled`
  });

  await ref.update({ checkoutSessionId: session.id, updatedAt: new Date().toISOString() });
  return { url: session.url };
});

async function activateFromSession(session: Stripe.Checkout.Session) {
  const contractId = session.metadata?.contractId;
  if (!contractId) return;
  const ref = db.collection('contracts').doc(contractId);
  const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!piId) throw new Error(`Session ${session.id} has no payment intent`);
  const pi = await stripe().paymentIntents.retrieve(piId);
  const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id;

  const expected = Number(session.metadata?.amountCents) + Number(session.metadata?.feeCents);
  if (pi.amount_received !== expected) {
    logger.error('Amount mismatch', { contractId, expected, received: pi.amount_received });
    await ref.update({ paymentStatus: 'needs_review' });
    return;
  }

  let activated = false;
  let names = { client: 'Gig provider', uid: '' };
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const c = snap.data();
    if (!c || c.status !== 'awaiting_payment') return; // already handled or cancelled
    tx.update(ref, {
      status: 'active',
      paymentStatus: 'paid',
      paymentIntentId: pi.id,
      chargeId: chargeId || null,
      fundedAmountCents: Number(session.metadata?.amountCents),
      feeAmountCents: Number(session.metadata?.feeCents),
      // Who pays the 3%: 'creative' (deducted from payouts) or the older 'provider' model.
      feeModel: Number(session.metadata?.feeCents) > 0 ? 'provider' : 'creative',
      releasedAmountCents: 0,
      fundedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    activated = true;
    names = { client: c.clientName, uid: c.clientUid };
  });
  if (activated) {
    await postSystemMessage(contractId, names.uid, names.client, 'Paid for the contract. The money is held by SideQuests Protected Payments and work can begin.');
  }
}

/** Stripe webhook: confirms payments (cards instantly, bank transfers after a few days). */
export const stripeWebhook = onRequest({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'] as string, STRIPE_WEBHOOK_SECRET.value());
  } catch (err) {
    logger.warn('Webhook signature check failed', err);
    res.status(400).send('Bad signature');
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          await activateFromSession(session);
        } else if (session.metadata?.contractId) {
          // Bank transfers take a few business days to clear.
          await db.collection('contracts').doc(session.metadata.contractId).update({
            paymentStatus: 'processing',
            updatedAt: new Date().toISOString()
          });
        }
        break;
      }
      case 'checkout.session.async_payment_succeeded':
        await activateFromSession(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.contractId) {
          await db.collection('contracts').doc(session.metadata.contractId).update({
            paymentStatus: 'failed',
            updatedAt: new Date().toISOString()
          });
        }
        break;
      }
      default:
        break;
    }
    res.status(200).send({ received: true });
  } catch (err) {
    logger.error('Webhook handling failed', { type: event.type, err });
    res.status(500).send('Webhook handler error'); // Stripe retries
  }
});

// ---------------------------------------------------------------------------
// Releasing a milestone (gig provider approves)
// ---------------------------------------------------------------------------

export const approveMilestone = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const uid = requireAuth(req);
  const data = (req.data || {}) as { contractId?: unknown; milestoneId?: unknown; feedback?: unknown };
  const contractId = asString(data.contractId, 'contract');
  const milestoneId = asString(data.milestoneId, 'milestone');
  const feedback = typeof data.feedback === 'string' ? data.feedback.slice(0, 2000) : '';

  const cRef = db.collection('contracts').doc(contractId);
  const mRef = cRef.collection('milestones').doc(milestoneId);
  const [cSnap, mSnap] = await Promise.all([cRef.get(), mRef.get()]);
  const c = cSnap.data();
  const m = mSnap.data();
  if (!c || !m) throw new HttpsError('not-found', 'Milestone not found.');
  if (c.clientUid !== uid) throw new HttpsError('permission-denied', 'Only the gig provider can approve milestones.');
  if (c.status !== 'active' || c.paymentStatus !== 'paid') throw new HttpsError('failed-precondition', 'This contract isn’t funded and active.');
  if (m.status !== 'submitted') throw new HttpsError('failed-precondition', 'This milestone hasn’t been submitted for review.');

  const acctSnap = await db.collection('stripeAccounts').doc(c.creativeUid).get();
  const destination = acctSnap.data()?.accountId as string | undefined;
  if (!destination) throw new HttpsError('failed-precondition', 'The creative hasn’t set up payouts yet.');

  const amount = cents(Number(m.amount));
  const alreadyReleased = Number(c.releasedAmountCents || 0);
  if (alreadyReleased + amount > Number(c.fundedAmountCents || 0)) {
    throw new HttpsError('failed-precondition', 'This would release more than was paid in. Please contact support.');
  }
  // The creative's payout is the milestone amount minus the platform fee.
  const fee = c.feeModel === 'creative' ? payoutFeeCents(amount) : 0;
  const payout = amount - fee;

  // Idempotent: retrying the same approval never pays twice.
  const transfer = await stripe().transfers.create(
    {
      amount: payout,
      currency: 'usd',
      destination,
      transfer_group: contractId,
      ...(c.chargeId ? { source_transaction: c.chargeId } : {}),
      description: `${String(c.questTitle).slice(0, 100)}: ${String(m.title).slice(0, 100)}`,
      metadata: { contractId, milestoneId, milestoneCents: String(amount), feeCents: String(fee) }
    },
    { idempotencyKey: `release_${contractId}_${milestoneId}` }
  );

  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(mRef);
    if (fresh.data()?.status === 'approved') return;
    tx.update(mRef, {
      status: 'approved',
      feedback,
      reviewedAt: new Date().toISOString(),
      transferId: transfer.id,
      payoutCents: payout,
      feeCents: fee,
      paidAt: new Date().toISOString()
    });
    tx.update(cRef, {
      releasedAmountCents: FieldValue.increment(amount),
      platformFeesCents: FieldValue.increment(fee),
      updatedAt: new Date().toISOString()
    });
  });

  await postSystemMessage(
    contractId,
    uid,
    c.clientName,
    `Approved “${m.title}” and released $${(payout / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${c.creativeName}${fee ? ` ($${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} less the 3% SideQuests fee)` : ''}.${feedback ? ` ${feedback}` : ''}`
  );
  return { transferId: transfer.id };
});

// Reviews and track record
export { submitReview, releaseExpiredReviews, onContractCompleted } from './reviews.js';
