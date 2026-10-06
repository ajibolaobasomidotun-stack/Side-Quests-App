// Security-rules tests. Run with: npm run test:rules  (needs Java; downloads the Firestore emulator on first run)
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

const env = await initializeTestEnvironment({
  projectId: 'demo-sidequests',
  firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 }
});

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log('  ok  ', name); }
  catch (e) { fail++; console.log('  FAIL', name, '-', e.message.split('\n')[0]); }
}

const studio = env.authenticatedContext('studio1').firestore();
const artist = env.authenticatedContext('artist1').firestore();
const artist2 = env.authenticatedContext('artist2').firestore();
const anon = env.unauthenticatedContext().firestore();

const quest = {
  title: 'Mix a 5-track EP', description: 'Need a stereo mix for five neo-soul tracks, stems ready.',
  category: 'Studio Sessions', budget: 3000, deadline: 'In 14 days', requirements: [],
  milestones: [{ id: 'm1', title: 'A', amount: 1500 }, { id: 'm2', title: 'B', amount: 1500 }],
  clientUid: 'studio1', clientName: 'Studio One', clientAvatar: '', status: 'open', createdAt: 'x'
};
const app = (over = {}) => ({
  questId: 'q1', questTitle: 'Mix a 5-track EP', clientUid: 'studio1', applicantUid: 'artist1',
  applicantName: 'Artist One', proposalText: 'I have mixed 40 neo-soul records, available now.',
  bidAmount: 2800, status: 'pending', createdAt: 'x', ...over
});

// --- users
await t('cannot create a profile without confirming 18+', () => assertFails(setDoc(doc(studio, 'users/studio1'), { accountType: 'provider', displayName: 'Studio One' })));
await t('studio creates own profile as provider', () => assertSucceeds(setDoc(doc(studio, 'users/studio1'), { accountType: 'provider', displayName: 'Studio One', ageConfirmed: true })));
await t('artist creates own profile', () => assertSucceeds(setDoc(doc(artist, 'users/artist1'), { accountType: 'artist', displayName: 'Artist One', ageConfirmed: true })));
await t('artist2 creates own profile', () => assertSucceeds(setDoc(doc(artist2, 'users/artist2'), { accountType: 'artist', displayName: 'Artist Two', ageConfirmed: true })));
await t('cannot create profile with verified flag', () => assertFails(setDoc(doc(artist, 'users/artist1'), { accountType: 'artist', verified: true })));
await t('cannot remove the age confirmation', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { accountType: 'artist', ageConfirmed: false })));
await t('cannot self-verify on update', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { verified: true })));
await t('cannot store email in public profile', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { email: 'a@b.c' })));
await t('cannot edit someone else\'s profile', () => assertFails(updateDoc(doc(artist, 'users/studio1'), { displayName: 'hacked' })));
await t('invalid accountType rejected', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { accountType: 'admin' })));
await t('small profile photo accepted', () => assertSucceeds(updateDoc(doc(artist, 'users/artist1'), { avatarUrl: 'data:image/jpeg;base64,' + 'A'.repeat(30000) })));
await t('oversized profile photo rejected', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { avatarUrl: 'data:image/jpeg;base64,' + 'A'.repeat(200000) })));
await t('cannot mark own payouts ready', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { payoutsReady: true })));
await t('anyone can read profiles', () => assertSucceeds(getDoc(doc(anon, 'users/artist1'))));
await env.withSecurityRulesDisabled(async (c) => { await updateDoc(doc(c.firestore(), 'users/artist2'), { verified: true }); });
await t('verified user can still edit other fields', () => assertSucceeds(updateDoc(doc(artist2, 'users/artist2'), { bio: 'hi' })));
await t('verified user cannot un-verify/alter flag', () => assertFails(updateDoc(doc(artist2, 'users/artist2'), { verified: false })));

// --- quests
await t('studio posts a quest', () => assertSucceeds(setDoc(doc(studio, 'quests/q1'), quest)));
await t('artist account cannot post a quest', () => assertFails(setDoc(doc(artist, 'quests/q2'), { ...quest, clientUid: 'artist1' })));
await t('cannot post quest as someone else', () => assertFails(setDoc(doc(studio, 'quests/q3'), { ...quest, clientUid: 'other' })));
await t('cannot post with non-numeric budget', () => assertFails(setDoc(doc(studio, 'quests/q4'), { ...quest, budget: '$3000' })));
await t('anonymous can browse quests', () => assertSucceeds(getDoc(doc(anon, 'quests/q1'))));
await t('non-owner cannot edit quest', () => assertFails(updateDoc(doc(artist, 'quests/q1'), { budget: 1 })));

// --- applications
await t('artist applies', () => assertSucceeds(setDoc(doc(artist, 'applications/q1_artist1'), app())));
await t('cannot apply on behalf of another', () => assertFails(setDoc(doc(artist, 'applications/q1_artist2'), app({ applicantUid: 'artist2' }))));
await t('application id must match quest+uid', () => assertFails(setDoc(doc(artist2, 'applications/random'), app({ applicantUid: 'artist2' }))));
await t('clientUid must match quest owner', () => assertFails(setDoc(doc(artist2, 'applications/q1_artist2'), app({ applicantUid: 'artist2', clientUid: 'artist2' }))));
await t('cannot apply pre-accepted', () => assertFails(setDoc(doc(artist2, 'applications/q1_artist2'), app({ applicantUid: 'artist2', status: 'accepted' }))));
await t('studio cannot apply to own quest', () => assertFails(setDoc(doc(studio, 'applications/q1_studio1'), app({ applicantUid: 'studio1' }))));
await t('studio sees applications for its quests', () => assertSucceeds(getDocs(query(collection(studio, 'applications'), where('clientUid', '==', 'studio1')))));
await t('artist sees own applications', () => assertSucceeds(getDocs(query(collection(artist, 'applications'), where('applicantUid', '==', 'artist1')))));
await t('other artist cannot read application', () => assertFails(getDoc(doc(artist2, 'applications/q1_artist1'))));
await t('applicant cannot accept own application', () => assertFails(updateDoc(doc(artist, 'applications/q1_artist1'), { status: 'accepted' })));
await t('studio cannot change bid amount', () => assertFails(updateDoc(doc(studio, 'applications/q1_artist1'), { bidAmount: 1 })));
await t('studio accepts application', () => assertSucceeds(updateDoc(doc(studio, 'applications/q1_artist1'), { status: 'accepted', updatedAt: 'y' })));
await t('applicant cannot withdraw after acceptance', () => assertFails(deleteDoc(doc(artist, 'applications/q1_artist1'))));
await t('studio marks quest active', () => assertSucceeds(updateDoc(doc(studio, 'quests/q1'), { status: 'active', hiredUid: 'artist1' })));
await t('cannot apply to a quest that is no longer open', () => assertFails(setDoc(doc(artist2, 'applications/q1_artist2'), app({ applicantUid: 'artist2' }))));

// --- contracts (fresh quest q5 so it's independent of the flow above)
await env.withSecurityRulesDisabled(async (c) => {
  const f = c.firestore();
  await setDoc(doc(f, 'quests/q5'), { ...quest, title: 'Brand shoot' });
  await setDoc(doc(f, 'applications/q5_artist1'), app({ questId: 'q5' }));
});
const contract = {
  questId: 'q5', questTitle: 'Brand shoot', category: 'Photo & Video',
  clientUid: 'studio1', clientName: 'Studio One', creativeUid: 'artist1', creativeName: 'Artist One',
  participants: ['studio1', 'artist1'], totalAmount: 2800, status: 'setup', createdAt: 'x'
};
const hireBatch = (f, over = {}) => {
  const b = writeBatch(f);
  b.update(doc(f, 'applications/q5_artist1'), { status: 'accepted', updatedAt: 'y' });
  b.update(doc(f, 'quests/q5'), { status: 'active', hiredUid: 'artist1' });
  b.set(doc(f, 'contracts/q5_artist1'), { ...contract, ...over });
  b.set(doc(f, 'contracts/q5_artist1/milestones/m1'), { title: 'Shoot', amount: 1400, order: 0, status: 'pending' });
  b.set(doc(f, 'contracts/q5_artist1/milestones/m2'), { title: 'Edits', amount: 1400, order: 1, status: 'pending' });
  return b.commit();
};
await t('contract cannot be created without accepting the application', () => assertFails(setDoc(doc(studio, 'contracts/q5_artist1'), contract)));
await t('creative cannot create a contract', () => assertFails(hireBatch(artist)));
await t('cannot create contract already active', () => assertFails(hireBatch(studio, { status: 'active' })));
await t('studio hires: application + quest + contract + milestones in one batch', () => assertSucceeds(hireBatch(studio)));
await t('outsider cannot read contract', () => assertFails(getDoc(doc(artist2, 'contracts/q5_artist1'))));
await t('creative reads contract', () => assertSucceeds(getDoc(doc(artist, 'contracts/q5_artist1'))));
await t('list my contracts', () => assertSucceeds(getDocs(query(collection(artist, 'contracts'), where('participants', 'array-contains', 'artist1')))));
await t('creative cannot edit plan in setup', () => assertFails(updateDoc(doc(artist, 'contracts/q5_artist1/milestones/m1'), { amount: 99999 })));
await t('studio edits plan in setup', () => assertSucceeds(updateDoc(doc(studio, 'contracts/q5_artist1/milestones/m1'), { title: 'Shoot day', amount: 1500 })));
await t('studio adds milestone in setup', () => assertSucceeds(setDoc(doc(studio, 'contracts/q5_artist1/milestones/m3'), { title: 'Extras', amount: 100, order: 2, status: 'pending' })));
await t('studio cannot add pre-approved milestone', () => assertFails(setDoc(doc(studio, 'contracts/q5_artist1/milestones/m4'), { title: 'X', amount: 1, order: 3, status: 'approved' })));
await t('studio deletes milestone in setup', () => assertSucceeds(deleteDoc(doc(studio, 'contracts/q5_artist1/milestones/m3'))));
await t('creative cannot submit work before contract is active', () => assertFails(updateDoc(doc(artist, 'contracts/q5_artist1/milestones/m1'), { status: 'submitted', submissionNote: '', submittedAt: 'z' })));
await t('creative cannot accept terms still in setup', () => assertFails(updateDoc(doc(artist, 'contracts/q5_artist1'), { status: 'active', updatedAt: 'z' })));
await t('studio proposes terms', () => assertSucceeds(updateDoc(doc(studio, 'contracts/q5_artist1'), { status: 'proposed', updatedAt: 'z' })));
await t('studio cannot edit plan once proposed', () => assertFails(updateDoc(doc(studio, 'contracts/q5_artist1/milestones/m1'), { amount: 1 })));
await t('studio cannot self-accept', () => assertFails(updateDoc(doc(studio, 'contracts/q5_artist1'), { status: 'active', updatedAt: 'z' })));
await t('creative asks for changes', () => assertSucceeds(updateDoc(doc(artist, 'contracts/q5_artist1'), { status: 'setup', changeRequest: 'Can we split edits into two?', updatedAt: 'z' })));
await t('studio re-proposes', () => assertSucceeds(updateDoc(doc(studio, 'contracts/q5_artist1'), { status: 'proposed', changeRequest: '', updatedAt: 'z' })));
await t('creative cannot skip payment and go active', () => assertFails(updateDoc(doc(artist, 'contracts/q5_artist1'), { status: 'active', updatedAt: 'z' })));
await t('creative accepts (awaiting payment)', () => assertSucceeds(updateDoc(doc(artist, 'contracts/q5_artist1'), { status: 'awaiting_payment', updatedAt: 'z' })));
await t('gig provider cannot mark own contract paid', () => assertFails(updateDoc(doc(studio, 'contracts/q5_artist1'), { status: 'active', paymentStatus: 'paid', updatedAt: 'z' })));
await env.withSecurityRulesDisabled(async (c) => {
  // What the Stripe webhook does after payment clears
  await updateDoc(doc(c.firestore(), 'contracts/q5_artist1'), { status: 'active', paymentStatus: 'paid', fundedAmountCents: 290000, releasedAmountCents: 0 });
});
await t('nobody can change the total once active', () => assertFails(updateDoc(doc(studio, 'contracts/q5_artist1'), { totalAmount: 1, updatedAt: 'z' })));
await t('studio cannot approve unsubmitted milestone', () => assertFails(updateDoc(doc(studio, 'contracts/q5_artist1/milestones/m1'), { status: 'approved', feedback: '', reviewedAt: 'z' })));
await t('creative cannot approve own milestone', () => assertFails(updateDoc(doc(artist, 'contracts/q5_artist1/milestones/m1'), { status: 'approved', feedback: '', reviewedAt: 'z' })));
await t('creative submits milestone', () => assertSucceeds(updateDoc(doc(artist, 'contracts/q5_artist1/milestones/m1'), { status: 'submitted', submissionNote: 'Selects attached', submittedAt: 'z' })));
await t('changes request must count the revision', () => assertFails(updateDoc(doc(studio, 'contracts/q5_artist1/milestones/m1'), { status: 'changes_requested', feedback: 'Brighter please', reviewedAt: 'z' })));
await t('studio requests changes', () => assertSucceeds(updateDoc(doc(studio, 'contracts/q5_artist1/milestones/m1'), { status: 'changes_requested', feedback: 'Brighter please', reviewedAt: 'z', revisionCount: 1 })));
await t('creative resubmits', () => assertSucceeds(updateDoc(doc(artist, 'contracts/q5_artist1/milestones/m1'), { status: 'submitted', submissionNote: 'Brighter now', submittedAt: 'z2' })));
await t('studio cannot approve directly (money moves server-side)', () => assertFails(updateDoc(doc(studio, 'contracts/q5_artist1/milestones/m1'), { status: 'approved', feedback: 'Great', reviewedAt: 'z2' })));
await t('studio cannot fake a payout record', () => assertFails(updateDoc(doc(studio, 'contracts/q5_artist1'), { releasedAmountCents: 0, updatedAt: 'z' })));
await t('creative cannot cancel an active contract', () => assertFails(updateDoc(doc(artist, 'contracts/q5_artist1'), { status: 'cancelled', updatedAt: 'z' })));
await t('creative cannot complete contract', () => assertFails(updateDoc(doc(artist, 'contracts/q5_artist1'), { status: 'completed', updatedAt: 'z' })));
// messages
await t('participant sends a message', () => assertSucceeds(addDoc(collection(artist, 'contracts/q5_artist1/messages'), { senderUid: 'artist1', senderName: 'A', type: 'text', text: 'hi', createdAt: serverTimestamp() })));
await t('cannot send as someone else', () => assertFails(addDoc(collection(artist, 'contracts/q5_artist1/messages'), { senderUid: 'studio1', senderName: 'S', type: 'text', text: 'hi', createdAt: serverTimestamp() })));
await t('outsider cannot send', () => assertFails(addDoc(collection(artist2, 'contracts/q5_artist1/messages'), { senderUid: 'artist2', senderName: 'X', type: 'text', text: 'hi', createdAt: serverTimestamp() })));
await t('file message must point into own folder', () => assertFails(addDoc(collection(artist, 'contracts/q5_artist1/messages'), { senderUid: 'artist1', senderName: 'A', type: 'file', text: 'x', file: { name: 'x', size: 1, contentType: 'a', path: 'contracts/q5_artist1/studio1/x' }, createdAt: serverTimestamp() })));
await t('file message in own folder ok', () => assertSucceeds(addDoc(collection(artist, 'contracts/q5_artist1/messages'), { senderUid: 'artist1', senderName: 'A', type: 'file', text: 'x', file: { name: 'x', size: 1, contentType: 'a', path: 'contracts/q5_artist1/artist1/1_x' }, createdAt: serverTimestamp() })));
await t('outsider cannot read messages', () => assertFails(getDocs(collection(artist2, 'contracts/q5_artist1/messages'))));
await t('chat preview update allowed', () => assertSucceeds(updateDoc(doc(artist, 'contracts/q5_artist1'), { lastMessageAt: 'z', lastMessagePreview: 'hi', lastMessageBy: 'artist1' })));
await t('studio completes contract', () => assertSucceeds(updateDoc(doc(studio, 'contracts/q5_artist1'), { status: 'completed', updatedAt: 'z' })));

// --- profile lists
await t('social links saved on profile', () => assertSucceeds(updateDoc(doc(artist, 'users/artist1'), { accountType: 'artist', socialLinks: [{ platform: 'instagram', handle: 'a' }] })));
await t('max 8 proof items', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { accountType: 'artist', proofItems: Array.from({ length: 9 }, (_, i) => ({ id: String(i) })) })));

// --- reviews and track record (server-written)
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'reviews/q5_artist1_studio1'), { reviewerUid: 'studio1', revieweeUid: 'artist1', released: false, overall: 5 });
  await setDoc(doc(db, 'reviews/q4_artist1_studio1'), { reviewerUid: 'studio1', revieweeUid: 'artist1', released: true, overall: 4 });
  await setDoc(doc(db, 'publicStats/artist1'), { updatedAt: 'x' });
});
await t('reviewee cannot read a hidden review', () => assertFails(getDoc(doc(artist, 'reviews/q5_artist1_studio1'))));
await t('author can read own hidden review', () => assertSucceeds(getDoc(doc(studio, 'reviews/q5_artist1_studio1'))));
await t('anyone reads released reviews', () => assertSucceeds(getDoc(doc(anon, 'reviews/q4_artist1_studio1'))));
await t('query released reviews', () => assertSucceeds(getDocs(query(collection(anon, 'reviews'), where('revieweeUid', '==', 'artist1'), where('released', '==', true)))));
await t('cannot write reviews from the app', () => assertFails(setDoc(doc(studio, 'reviews/q9_artist1_studio1'), { reviewerUid: 'studio1', released: true })));
await t('anyone reads track record', () => assertSucceeds(getDoc(doc(anon, 'publicStats/artist1'))));
await t('cannot write track record', () => assertFails(setDoc(doc(artist, 'publicStats/artist1'), { updatedAt: 'y' })));

// --- bookmarks
await t('save a bookmark', () => assertSucceeds(setDoc(doc(artist, 'bookmarks/artist1_q1'), { userId: 'artist1', questId: 'q1', createdAt: 'x' })));
await t('cannot read others bookmarks', () => assertFails(getDoc(doc(artist2, 'bookmarks/artist1_q1'))));
await t('list own bookmarks', () => assertSucceeds(getDocs(query(collection(artist, 'bookmarks'), where('userId', '==', 'artist1')))));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
