/**
 * Invitations: a gig provider shows interest in a creative by inviting them
 * to apply to one of their open quests.
 *
 *   invites/{questId}_{creativeUid}   – one per quest per creative
 *
 * Only gig providers can send invites, only for their own open quests, and
 * only to creative accounts (enforced in firestore.rules). The creative can
 * decline, or apply — which marks the invite as applied.
 */
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Invite, Quest, UserProfile } from '../types';

export const MAX_INVITE_NOTE = 500;

const nowIso = () => new Date().toISOString();
export const inviteId = (questId: string, creativeUid: string) => `${questId}_${creativeUid}`;

export async function sendInvite(
  provider: UserProfile & { id: string },
  quest: Quest,
  creative: { id: string; name: string },
  note: string
) {
  const avatar = provider.avatarUrl && provider.avatarUrl.length <= 150000 ? provider.avatarUrl : '';
  await setDoc(doc(db, 'invites', inviteId(quest.id, creative.id)), {
    questId: quest.id,
    questTitle: quest.title.slice(0, 140),
    questBudget: Number(quest.budget) || 0,
    questCategory: String(quest.category || ''),
    clientUid: provider.id,
    clientName: (provider.organizationName || provider.displayName || 'Gig provider').slice(0, 80),
    ...(avatar ? { clientAvatar: avatar } : {}),
    creativeUid: creative.id,
    creativeName: creative.name.slice(0, 80),
    note: note.trim().slice(0, MAX_INVITE_NOTE),
    status: 'pending',
    createdAt: nowIso()
  });
}

/** The gig provider takes an invite back (only while the creative hasn't applied). */
export const withdrawInvite = (id: string) => deleteDoc(doc(db, 'invites', id));

export const declineInvite = (id: string) =>
  updateDoc(doc(db, 'invites', id), { status: 'declined', respondedAt: nowIso() });

/** Called after the creative applies; quietly does nothing if there was no invite. */
export async function markInviteApplied(questId: string, creativeUid: string) {
  try {
    await updateDoc(doc(db, 'invites', inviteId(questId, creativeUid)), { status: 'applied', respondedAt: nowIso() });
  } catch {
    /* no invite for this quest */
  }
}

function subscribeInvitesWhere(field: 'clientUid' | 'creativeUid', uid: string, onUpdate: (invites: Invite[]) => void) {
  const q = query(collection(db, 'invites'), where(field, '==', uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Invite, 'id'>) }));
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    onUpdate(list);
  }, (err) => console.warn('Invites subscription:', err.message));
}

/** Invites the signed-in gig provider has sent. */
export const subscribeSentInvites = (uid: string, cb: (invites: Invite[]) => void) => subscribeInvitesWhere('clientUid', uid, cb);
/** Invites the signed-in creative has received. */
export const subscribeReceivedInvites = (uid: string, cb: (invites: Invite[]) => void) => subscribeInvitesWhere('creativeUid', uid, cb);
