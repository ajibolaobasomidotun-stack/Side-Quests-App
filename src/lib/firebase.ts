import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import type { AccountType, Application, ApplicationStatus, Quest, UserProfile } from "../types";
import { normalizeCategory } from "../categories";

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/** Firestore rejects `undefined`; drop those keys (shallow + one level of nested objects). */
function clean<T extends Record<string, any>>(obj: T): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = clean(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const nowIso = () => new Date().toISOString();

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<FirebaseUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Turns Firebase auth error codes into plain-English messages. */
export function authErrorMessage(err: any): string {
  const code: string = err?.code || "";
  switch (code) {
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/missing-password": return "Please enter a password.";
    case "auth/weak-password": return "Password needs at least 6 characters.";
    case "auth/email-already-in-use": return "An account with this email already exists. Try signing in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Email or password is incorrect.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a minute and try again.";
    case "auth/popup-blocked": return "Your browser blocked the sign-in popup. Allow popups for this site and try again.";
    case "auth/operation-not-allowed": return "This sign-in method isn't enabled yet.";
    case "auth/unauthorized-domain": return "This web address isn't authorized for sign-in yet.";
    default: return "Something went wrong. Please try again.";
  }
}

// ---------------------------------------------------------------------------
// User profiles  (collection: users/{uid}; publicly readable, so no email here)
// ---------------------------------------------------------------------------

/** Maps a Firestore user document (including older AI Studio-era docs) to a UserProfile. */
export function docToProfile(uid: string, d: Record<string, any>): UserProfile {
  return {
    id: uid,
    accountType: (d.accountType === "provider" ? "provider" : "artist") as AccountType,
    displayName: d.displayName || d.name || "SideQuests Member",
    handle: d.handle || "",
    roleHeadline: d.roleHeadline || "",
    bio: d.bio || "",
    location: d.location || "",
    avatarUrl: d.avatarUrl || d.photoURL || "",
    selectedCategories: d.selectedCategories || d.skills || [],
    hourlyRate: typeof d.hourlyRate === "number" ? d.hourlyRate : undefined,
    credits: d.credits || [],
    gear: d.gear || [],
    experienceLevel: d.experienceLevel,
    availability: d.availability,
    portfolioLinks: d.portfolioLinks,
    socialLinks: Array.isArray(d.socialLinks) ? d.socialLinks.slice(0, 8) : undefined,
    proofItems: Array.isArray(d.proofItems) ? d.proofItems.slice(0, 8) : undefined,
    organizationName: d.organizationName,
    orgType: d.orgType,
    budgetTier: d.budgetTier,
    hiringGoals: d.hiringGoals || [],
    ageConfirmed: d.ageConfirmed === true,
    ageConfirmedAt: typeof d.ageConfirmedAt === 'string' ? d.ageConfirmedAt : undefined,
    verified: d.verified === true,
    payoutsReady: d.payoutsReady === true,
    createdAt: d.createdAt || nowIso()
  };
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? docToProfile(uid, snap.data()) : null;
}

/**
 * Creates or updates the signed-in user's profile.
 * `verified` is never written from the app — only an admin can set it (enforced in firestore.rules).
 */
export async function saveUserProfile(uid: string, profile: UserProfile, isNew: boolean) {
  const { id: _id, verified: _verified, payoutsReady: _payouts, ...rest } = profile;
  const payload = clean({
    ...rest,
    updatedAt: nowIso(),
    ...(isNew ? { createdAt: nowIso() } : {})
  });
  // Remove legacy fields written by the AI Studio prototype (email must not be public).
  const legacyCleanup = isNew ? {} : {
    email: deleteField(), name: deleteField(), photoURL: deleteField(), skills: deleteField(),
    // Replaced by socialLinks (ProfileCreator migrates the old values).
    portfolioLinks: deleteField()
  };
  await setDoc(doc(db, "users", uid), { ...payload, ...legacyCleanup }, { merge: true });
}

export async function updateAccountType(uid: string, accountType: AccountType) {
  await updateDoc(doc(db, "users", uid), { accountType, updatedAt: nowIso() });
}

/** Live list of artist profiles for the Creatives directory. */
export function subscribeArtists(onUpdate: (profiles: UserProfile[]) => void) {
  const q = query(collection(db, "users"), where("accountType", "==", "artist"));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => docToProfile(d.id, d.data())));
  }, (err) => console.warn("Artists subscription:", err.message));
}

// ---------------------------------------------------------------------------
// Quests  (collection: quests/{questId})
// ---------------------------------------------------------------------------

function docToQuest(id: string, d: Record<string, any>): Quest {
  const budget = typeof d.budget === "number"
    ? d.budget
    : parseInt(String(d.budget || "").replace(/[^0-9]/g, ""), 10) || 0;
  const milestones = Array.isArray(d.milestones) && d.milestones.length > 0
    ? d.milestones.map((m: any, i: number) => ({
        id: m.id || `m${i + 1}`,
        title: m.title || `Milestone ${i + 1}`,
        amount: Number(m.amount) || 0,
        status: "escrowed" as const
      }))
    : [{ id: "m1", title: "Final delivery", amount: budget, status: "escrowed" as const }];
  return {
    id,
    title: d.title || "Untitled quest",
    clientUid: d.clientUid,
    clientName: d.clientName || "Gig Provider",
    clientAvatar: d.clientAvatar || "",
    category: normalizeCategory(d.category),
    budget,
    deadline: d.deadline || "Flexible",
    description: d.description || "",
    requirements: d.requirements || d.tags || [],
    milestones,
    status: d.status || "open",
    hiredUid: d.hiredUid,
    createdAt: d.createdAt || ""
  };
}

export function subscribeQuests(onUpdate: (quests: Quest[]) => void) {
  return onSnapshot(collection(db, "quests"), (snap) => {
    const list = snap.docs.map((d) => docToQuest(d.id, d.data()));
    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    onUpdate(list);
  }, (err) => console.warn("Quests subscription:", err.message));
}

export async function createQuest(uid: string, owner: UserProfile, quest: Quest): Promise<string> {
  const ref = doc(collection(db, "quests"));
  await setDoc(ref, clean({
    title: quest.title,
    description: quest.description,
    category: quest.category,
    budget: quest.budget,
    deadline: quest.deadline,
    requirements: quest.requirements,
    milestones: quest.milestones.map((m, i) => ({ id: `m${i + 1}`, title: m.title, amount: m.amount })),
    clientUid: uid,
    clientName: owner.organizationName || owner.displayName,
    clientAvatar: owner.avatarUrl || "",
    status: "open",
    createdAt: nowIso()
  }));
  return ref.id;
}

export async function setQuestStatus(questId: string, status: Quest["status"], hiredUid?: string) {
  await updateDoc(doc(db, "quests", questId), clean({ status, hiredUid, updatedAt: nowIso() }));
}

export async function deleteQuest(questId: string) {
  await deleteDoc(doc(db, "quests", questId));
}

// ---------------------------------------------------------------------------
// Applications  (collection: applications/{questId}_{applicantUid})
// ---------------------------------------------------------------------------

export async function submitApplication(app: Omit<Application, "id" | "status" | "createdAt">) {
  const id = `${app.questId}_${app.applicantUid}`;
  await setDoc(doc(db, "applications", id), clean({
    ...app,
    status: "pending",
    createdAt: nowIso()
  }));
  return id;
}

export async function setApplicationStatus(applicationId: string, status: ApplicationStatus) {
  await updateDoc(doc(db, "applications", applicationId), { status, updatedAt: nowIso() });
}

export async function withdrawApplication(applicationId: string) {
  await deleteDoc(doc(db, "applications", applicationId));
}

function subscribeApplicationsWhere(field: "applicantUid" | "clientUid", uid: string, onUpdate: (apps: Application[]) => void) {
  const q = query(collection(db, "applications"), where(field, "==", uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Application, "id">) }));
    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    onUpdate(list);
  }, (err) => console.warn("Applications subscription:", err.message));
}

/** Applications the signed-in creative has sent. */
export const subscribeMyApplications = (uid: string, cb: (apps: Application[]) => void) =>
  subscribeApplicationsWhere("applicantUid", uid, cb);

/** Applications received on quests the signed-in studio owns. */
export const subscribeReceivedApplications = (uid: string, cb: (apps: Application[]) => void) =>
  subscribeApplicationsWhere("clientUid", uid, cb);

// ---------------------------------------------------------------------------
// Bookmarks  (collection: bookmarks/{uid}_{questId})
// ---------------------------------------------------------------------------

export async function toggleBookmark(userId: string, questId: string, isCurrentlyBookmarked: boolean) {
  const ref = doc(db, "bookmarks", `${userId}_${questId}`);
  if (isCurrentlyBookmarked) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { userId, questId, createdAt: nowIso() });
  }
}

export function subscribeUserBookmarks(userId: string, onUpdate: (questIds: string[]) => void) {
  const q = query(collection(db, "bookmarks"), where("userId", "==", userId));
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => d.data().questId).filter(Boolean));
  }, (err) => console.warn("Bookmarks subscription:", err.message));
}
