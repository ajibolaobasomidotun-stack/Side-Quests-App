// Security-rules tests. Run with: npm run test:rules  (needs Java; downloads the Firestore emulator on first run)
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
await t('studio creates own profile as provider', () => assertSucceeds(setDoc(doc(studio, 'users/studio1'), { accountType: 'provider', displayName: 'Studio One' })));
await t('artist creates own profile', () => assertSucceeds(setDoc(doc(artist, 'users/artist1'), { accountType: 'artist', displayName: 'Artist One' })));
await t('artist2 creates own profile', () => assertSucceeds(setDoc(doc(artist2, 'users/artist2'), { accountType: 'artist', displayName: 'Artist Two' })));
await t('cannot create profile with verified flag', () => assertFails(setDoc(doc(artist, 'users/artist1'), { accountType: 'artist', verified: true })));
await t('cannot self-verify on update', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { verified: true })));
await t('cannot store email in public profile', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { email: 'a@b.c' })));
await t('cannot edit someone else\'s profile', () => assertFails(updateDoc(doc(artist, 'users/studio1'), { displayName: 'hacked' })));
await t('invalid accountType rejected', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { accountType: 'admin' })));
await t('small profile photo accepted', () => assertSucceeds(updateDoc(doc(artist, 'users/artist1'), { avatarUrl: 'data:image/jpeg;base64,' + 'A'.repeat(30000) })));
await t('oversized profile photo rejected', () => assertFails(updateDoc(doc(artist, 'users/artist1'), { avatarUrl: 'data:image/jpeg;base64,' + 'A'.repeat(200000) })));
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

// --- bookmarks
await t('save a bookmark', () => assertSucceeds(setDoc(doc(artist, 'bookmarks/artist1_q1'), { userId: 'artist1', questId: 'q1', createdAt: 'x' })));
await t('cannot read others bookmarks', () => assertFails(getDoc(doc(artist2, 'bookmarks/artist1_q1'))));
await t('list own bookmarks', () => assertSucceeds(getDocs(query(collection(artist, 'bookmarks'), where('userId', '==', 'artist1')))));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
