import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD73BbOs1RK_7Op2Q9a7ihY0V_moPuimb8",
  authDomain: "graphenex-academy.firebaseapp.com",
  projectId: "graphenex-academy",
  storageBucket: "graphenex-academy.firebasestorage.app",
  messagingSenderId: "379080255076",
  appId: "1:379080255076:web:0f2d970917f8d4f11b2171",
  measurementId: "G-PSQCJPMPTB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const auth = getAuth(app);

async function login(email, password, rememberUser) {
  await setPersistence(auth, rememberUser ? browserLocalPersistence : browserSessionPersistence);
  return signInWithEmailAndPassword(auth, email, password);
}

async function register(email, password, rememberUser) {
  await setPersistence(auth, rememberUser ? browserLocalPersistence : browserSessionPersistence);
  return createUserWithEmailAndPassword(auth, email, password);
}

function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

async function logout() {
  await signOut(auth);
}

async function upsertUserProfile(uid, profileData) {
  if (!uid) {
    throw new Error("Missing UID for profile update.");
  }

  const payload = {
    uid,
    ...profileData,
    updatedAt: new Date().toISOString()
  };

  const targetRefs = new Map();
  const addTarget = (collectionName, docId) => {
    if (!docId) return;
    targetRefs.set(`${collectionName}/${docId}`, doc(db, collectionName, docId));
  };

  addTarget("profiles", uid);
  addTarget("users", uid);

  const collectionsToSync = ["profiles", "users"];
  for (const collectionName of collectionsToSync) {
    const uidMatches = await getDocs(query(collection(db, collectionName), where("uid", "==", uid), limit(5)));
    uidMatches.forEach((matchDoc) => addTarget(collectionName, matchDoc.id));
  }

  const writes = await Promise.allSettled(
    Array.from(targetRefs.values()).map((docRef) => setDoc(docRef, payload, { merge: true }))
  );

  if (!writes.some((result) => result.status === "fulfilled")) {
    const firstError = writes.find((result) => result.status === "rejected");
    throw firstError?.reason || new Error("Failed to update profile documents.");
  }
}

async function reauthenticateCurrentUser(currentPassword) {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error("No authenticated user available for reauthentication.");
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
}

async function updateCurrentUserEmail(newEmail, currentPassword) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user available for email update.");
  }

  await reauthenticateCurrentUser(currentPassword);
  await updateEmail(user, newEmail);
}

async function updateCurrentUserPassword(newPassword, currentPassword) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user available for password update.");
  }

  await reauthenticateCurrentUser(currentPassword);
  await updatePassword(user, newPassword);
}

async function getUserProfileByUid(uid) {
  if (!uid) {
    return null;
  }

  const profilesDoc = await getDoc(doc(db, "profiles", uid));
  if (profilesDoc.exists()) {
    return profilesDoc.data();
  }

  const usersDoc = await getDoc(doc(db, "users", uid));
  if (usersDoc.exists()) {
    return usersDoc.data();
  }

  const profileByUidField = await getDocs(query(collection(db, "profiles"), where("uid", "==", uid), limit(1)));
  if (!profileByUidField.empty) {
    return profileByUidField.docs[0].data();
  }

  const userByUidField = await getDocs(query(collection(db, "users"), where("uid", "==", uid), limit(1)));
  if (!userByUidField.empty) {
    return userByUidField.docs[0].data();
  }

  return null;
}

async function getUserProfileForAuthUser(user) {
  if (!user?.uid) {
    return null;
  }

  const authEmailRaw = user.email || "";
  const authEmail = authEmailRaw.toLowerCase();
  const profileByUid = await getUserProfileByUid(user.uid);

  if (profileByUid) {
    const profileEmail = (profileByUid.email || profileByUid.userEmail || "").toLowerCase();
    if (!profileEmail || !authEmail || profileEmail === authEmail) {
      return profileByUid;
    }
  }

  return null;
}

window.grapheneAuth = {
  auth,
  login,
  register,
  logout,
  upsertUserProfile,
  updateCurrentUserEmail,
  updateCurrentUserPassword,
  observeAuthState,
  getUserProfileByUid,
  getUserProfileForAuthUser,
  getCurrentUser: () => auth.currentUser
};

