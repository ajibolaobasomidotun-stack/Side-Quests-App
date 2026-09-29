/**
 * Contracts: created when a gig provider hires a creative.
 *
 * Firestore layout
 *   contracts/{questId}_{creativeUid}                 – the contract (id matches the application id)
 *   contracts/{id}/milestones/{milestoneId}           – one doc per milestone
 *   contracts/{id}/messages/{messageId}               – chat + file + system messages
 * Storage layout
 *   contracts/{id}/{uploaderUid}/{timestamp}_{name}   – delivered files
 *
 * Who can do what is enforced in firestore.rules and storage.rules.
 */
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  updateDoc,
  addDoc,
  type Timestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app, db } from './firebase';
import type {
  Application,
  Contract,
  ContractFile,
  ContractMessage,
  ContractStatus,
  Milestone,
  MilestoneStatus,
  Quest,
  UserProfile
} from '../types';

export const storage = getStorage(app);
export const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024; // 1 GB, mirrored in storage.rules

const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Hiring → contract
// ---------------------------------------------------------------------------

/**
 * Accepts an application and opens a contract in one atomic write:
 * application → accepted, quest → active, contract + milestones created.
 * Milestones start from the quest's milestones, scaled to the creative's rate.
 */
export async function hireAndCreateContract(app: Application, quest: Quest, client: UserProfile): Promise<string> {
  const contractId = app.id; // "{questId}_{creativeUid}"
  const batch = writeBatch(db);
  const total = Math.round(Number(app.bidAmount)) || quest.budget;

  const questTotal = quest.milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0) || 1;
  const baseMilestones = quest.milestones.length > 0
    ? quest.milestones
    : [{ id: 'm1', title: 'Final delivery', amount: total, status: 'escrowed' as const }];
  let allocated = 0;
  const milestones = baseMilestones.map((m, i) => {
    const isLast = i === baseMilestones.length - 1;
    const amount = isLast ? total - allocated : Math.round((Number(m.amount) / questTotal) * total);
    allocated += amount;
    return { title: m.title, amount };
  });

  batch.update(doc(db, 'applications', app.id), { status: 'accepted', updatedAt: nowIso() });
  batch.update(doc(db, 'quests', quest.id), { status: 'active', hiredUid: app.applicantUid, updatedAt: nowIso() });
  batch.set(doc(db, 'contracts', contractId), {
    questId: quest.id,
    questTitle: quest.title,
    category: quest.category,
    clientUid: client.id,
    clientName: client.organizationName || client.displayName,
    clientAvatar: client.avatarUrl || '',
    creativeUid: app.applicantUid,
    creativeName: app.applicantName,
    creativeAvatar: app.applicantAvatar || '',
    participants: [client.id, app.applicantUid],
    totalAmount: total,
    status: 'setup',
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
  milestones.forEach((m, i) => {
    batch.set(doc(collection(db, 'contracts', contractId, 'milestones')), {
      title: m.title,
      amount: m.amount,
      order: i,
      status: 'pending'
    });
  });
  await batch.commit();
  return contractId;
}

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export function subscribeMyContracts(uid: string, onUpdate: (contracts: Contract[]) => void) {
  const q = query(collection(db, 'contracts'), where('participants', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Contract, 'id'>) }));
    list.sort((a, b) => (b.lastMessageAt || b.updatedAt || b.createdAt || '').localeCompare(a.lastMessageAt || a.updatedAt || a.createdAt || ''));
    onUpdate(list);
  }, (err) => console.warn('Contracts subscription:', err.message));
}

export function subscribeMilestones(contractId: string, onUpdate: (m: Milestone[]) => void) {
  const q = query(collection(db, 'contracts', contractId, 'milestones'), orderBy('order'));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Milestone, 'id'>) })));
  }, (err) => console.warn('Milestones subscription:', err.message));
}

export function subscribeMessages(contractId: string, onUpdate: (m: ContractMessage[]) => void) {
  const q = query(collection(db, 'contracts', contractId, 'messages'), orderBy('createdAt'));
  return onSnapshot(q, { includeMetadataChanges: false }, (snap) => {
    onUpdate(snap.docs.map((d) => {
      const data = d.data();
      const ts = data.createdAt as Timestamp | null;
      return {
        id: d.id,
        senderUid: data.senderUid,
        senderName: data.senderName,
        type: data.type,
        text: data.text || '',
        file: data.file,
        createdAt: ts ? ts.toDate() : null
      } as ContractMessage;
    }));
  }, (err) => console.warn('Messages subscription:', err.message));
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function sendMessage(
  contractId: string,
  sender: { uid: string; name: string },
  body: { type: 'text' | 'file' | 'system'; text: string; file?: ContractFile }
) {
  const text = body.text.slice(0, 4000);
  await addDoc(collection(db, 'contracts', contractId, 'messages'), {
    senderUid: sender.uid,
    senderName: sender.name,
    type: body.type,
    text,
    ...(body.file ? { file: body.file } : {}),
    createdAt: serverTimestamp()
  });
  // Preview for the contracts list. Best-effort: a failure here shouldn't lose the message.
  updateDoc(doc(db, 'contracts', contractId), {
    lastMessageAt: nowIso(),
    lastMessagePreview: body.type === 'file' ? `📎 ${body.file?.name || 'File'}` : text.slice(0, 140),
    lastMessageBy: sender.uid
  }).catch((e) => console.warn('Could not update message preview:', e));
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export function uploadContractFile(
  contractId: string,
  uid: string,
  file: File,
  onProgress: (fraction: number) => void
): Promise<ContractFile> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(new Error('Files can be up to 1 GB. For bigger files, share a link in the chat.'));
  }
  const safeName = file.name.replace(/[^\w.\- ()]+/g, '_').slice(-120) || 'file';
  const path = `contracts/${contractId}/${uid}/${Date.now()}_${safeName}`;
  const task = uploadBytesResumable(ref(storage, path), file, {
    contentType: file.type || 'application/octet-stream',
    contentDisposition: `attachment; filename="${safeName}"`
  });
  return new Promise((resolve, reject) => {
    task.on('state_changed',
      (s) => onProgress(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0),
      reject,
      () => resolve({ name: file.name, size: file.size, contentType: file.type || 'application/octet-stream', path })
    );
  });
}

export async function getFileUrl(path: string): Promise<string> {
  return getDownloadURL(ref(storage, path));
}

// ---------------------------------------------------------------------------
// Contract setup (gig provider edits milestones, then proposes)
// ---------------------------------------------------------------------------

/** Replaces the milestone list during setup and updates the contract total. */
export async function saveMilestonePlan(
  contractId: string,
  existing: Milestone[],
  plan: { id?: string; title: string; amount: number }[]
) {
  const batch = writeBatch(db);
  const keep = new Set(plan.map((m) => m.id).filter(Boolean) as string[]);
  existing.filter((m) => !keep.has(m.id)).forEach((m) => batch.delete(doc(db, 'contracts', contractId, 'milestones', m.id)));
  plan.forEach((m, i) => {
    const data = { title: m.title.trim(), amount: Math.round(m.amount), order: i };
    if (m.id) {
      batch.update(doc(db, 'contracts', contractId, 'milestones', m.id), data);
    } else {
      batch.set(doc(collection(db, 'contracts', contractId, 'milestones')), { ...data, status: 'pending' });
    }
  });
  const total = plan.reduce((s, m) => s + Math.round(m.amount), 0);
  batch.update(doc(db, 'contracts', contractId), { totalAmount: total, updatedAt: nowIso() });
  await batch.commit();
}

export async function setContractStatus(contractId: string, status: ContractStatus, extra: Record<string, unknown> = {}) {
  await updateDoc(doc(db, 'contracts', contractId), { status, updatedAt: nowIso(), ...extra });
}

/** Gig provider marks the contract complete and closes the quest. */
export async function completeContract(contract: Contract) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'contracts', contract.id), { status: 'completed', updatedAt: nowIso() });
  batch.update(doc(db, 'quests', contract.questId), { status: 'completed', updatedAt: nowIso() });
  await batch.commit();
}

/** Cancels before work starts. When the gig provider cancels, the quest reopens for applications. */
export async function cancelContract(contract: Contract, byClient: boolean) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'contracts', contract.id), { status: 'cancelled', updatedAt: nowIso() });
  if (byClient) {
    batch.update(doc(db, 'quests', contract.questId), { status: 'open', updatedAt: nowIso() });
  }
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Milestone workflow (during active contracts)
// ---------------------------------------------------------------------------

export async function submitMilestone(contractId: string, milestoneId: string, note: string) {
  await updateDoc(doc(db, 'contracts', contractId, 'milestones', milestoneId), {
    status: 'submitted' as MilestoneStatus,
    submissionNote: note.slice(0, 2000),
    submittedAt: nowIso()
  });
}

export async function reviewMilestone(contractId: string, milestoneId: string, approve: boolean, feedback: string) {
  await updateDoc(doc(db, 'contracts', contractId, 'milestones', milestoneId), {
    status: (approve ? 'approved' : 'changes_requested') as MilestoneStatus,
    feedback: feedback.slice(0, 2000),
    reviewedAt: nowIso()
  });
}
