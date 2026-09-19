import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  getDocFromServer,
  where,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot as mandated by Firebase integration guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore client is offline, check connection/network:", error.message);
    }
  }
}
testConnection();

// Authentication Helpers
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      // Sync basic user info to Firestore user profile document
      const userDocRef = doc(db, "users", result.user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        await setDoc(userDocRef, {
          id: result.user.uid,
          name: result.user.displayName || "Creative Artist",
          email: result.user.email || "",
          photoURL: result.user.photoURL || "",
          accountType: "artist",
          roleHeadline: "Verified Audio & Creative Professional",
          bio: "Producer, Sound Designer & Creative Engineer active on SideQuests.",
          skills: ["Mixing & Mastering", "Live Production", "Sound Design"],
          hourlyRate: "$85 - $150 / hr",
          verified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// User Profile Persistence Helpers
export async function syncUserProfile(uid: string, profileData: Record<string, any>) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    ...profileData,
    id: uid,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export async function fetchUserProfile(uid: string) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn("Could not fetch user profile from Firestore:", err);
  }
  return null;
}

// Quests Persistence Helpers
export function subscribeQuests(onUpdate: (quests: any[]) => void) {
  try {
    const q = query(collection(db, "quests"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      onUpdate(items);
    }, (error) => {
      console.warn("Firestore quest subscription note:", error.message);
    });
  } catch (err) {
    console.warn("Error setting up quests subscription:", err);
    return () => {};
  }
}

export async function createFirestoreQuest(questData: Record<string, any>) {
  const questCol = collection(db, "quests");
  const docRef = await addDoc(questCol, {
    ...questData,
    createdAt: new Date().toISOString(),
    status: questData.status || "open"
  });
  return docRef.id;
}

// Applications Persistence Helpers
export async function submitQuestApplication(applicationData: {
  questId: string;
  questTitle: string;
  applicantUid: string;
  applicantName: string;
  applicantAvatar?: string;
  proposalText: string;
  bidAmount: string;
}) {
  const appsCol = collection(db, "applications");
  const docRef = await addDoc(appsCol, {
    ...applicationData,
    status: "pending",
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export function subscribeUserApplications(uid: string, onUpdate: (apps: any[]) => void) {
  try {
    const q = query(collection(db, "applications"), where("applicantUid", "==", uid));
    return onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      onUpdate(list);
    }, (err) => {
      console.warn("Firestore applications query note:", err.message);
    });
  } catch (err) {
    console.warn("Error subscribing to applications:", err);
    return () => {};
  }
}

// Bookmarks Persistence Helpers
export async function toggleFirestoreBookmark(userId: string, questId: string, isCurrentlyBookmarked: boolean) {
  const bookmarksCol = collection(db, "bookmarks");
  if (isCurrentlyBookmarked) {
    // Remove
    const q = query(bookmarksCol, where("userId", "==", userId), where("questId", "==", questId));
    const snaps = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    snaps.forEach((d) => deletePromises.push(deleteDoc(d.ref)));
    await Promise.all(deletePromises);
  } else {
    // Add
    await addDoc(bookmarksCol, {
      userId,
      questId,
      createdAt: new Date().toISOString()
    });
  }
}

export function subscribeUserBookmarks(userId: string, onUpdate: (questIds: string[]) => void) {
  try {
    const q = query(collection(db, "bookmarks"), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.questId) ids.push(data.questId);
      });
      onUpdate(ids);
    }, (err) => {
      console.warn("Firestore bookmarks query note:", err.message);
    });
  } catch (err) {
    console.warn("Error subscribing to bookmarks:", err);
    return () => {};
  }
}
