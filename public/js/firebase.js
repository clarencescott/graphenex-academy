import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
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

async function recordCourseCompletion(courseId) {
  const user = auth.currentUser;
  const normalizedCourseId = String(courseId || "").trim();
  if (!user?.uid) {
    throw new Error("You must be signed in to save course progress.");
  }
  if (!normalizedCourseId) {
    throw new Error("Missing course ID for progress update.");
  }

  const payload = {
    completedCourseIds: arrayUnion(normalizedCourseId),
    updatedAt: new Date().toISOString()
  };
  const writes = await Promise.allSettled(
    ["users", "profiles"].map((collectionName) =>
      setDoc(doc(db, collectionName, user.uid), payload, { merge: true })
    )
  );

  if (!writes.some((result) => result.status === "fulfilled")) {
    const firstError = writes.find((result) => result.status === "rejected");
    throw firstError?.reason || new Error("Failed to save course progress.");
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

async function getAssignedCompanyId(user = auth.currentUser) {
  if (!user?.uid) {
    return "";
  }

  const userDocument = await getDoc(doc(db, "users", user.uid));
  if (userDocument.exists()) {
    return String(userDocument.data().companyId || "").trim();
  }

  const profileDocument = await getDoc(doc(db, "profiles", user.uid));
  return profileDocument.exists()
    ? String(profileDocument.data().companyId || "").trim()
    : "";
}

async function isCompanyAdmin(companyId, user = auth.currentUser) {
  const normalizedCompanyId = String(companyId || "").trim();
  if (!user || !normalizedCompanyId) {
    return false;
  }

  const userDocument = await getDoc(doc(db, "users", user.uid));
  if (!userDocument.exists()) {
    return false;
  }
  const userData = userDocument.data();
  return userData.admin === true && userData.companyId === normalizedCompanyId;
}

async function getAllUserProgress(companyId) {
  const user = auth.currentUser;
  const normalizedCompanyId = String(companyId || "").trim();
  if (!(await isCompanyAdmin(normalizedCompanyId, user))) {
    throw new Error("Admin access for this company is required to view learner progress.");
  }

  const [usersSnapshot, profilesSnapshot] = await Promise.all([
    getDocs(query(collection(db, "users"), where("companyId", "==", normalizedCompanyId))),
    getDocs(query(collection(db, "profiles"), where("companyId", "==", normalizedCompanyId)))
  ]);
  const records = new Map();

  const mergeSnapshot = (snapshot) => {
    snapshot.forEach((userDoc) => {
      const data = userDoc.data();
      const uid = String(data.uid || userDoc.id).trim();
      if (!uid) {
        return;
      }

      records.set(uid, {
        ...(records.get(uid) || {}),
        ...data,
        uid
      });
    });
  };

  mergeSnapshot(profilesSnapshot);
  mergeSnapshot(usersSnapshot);

  return Array.from(records.values());
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
  getAssignedCompanyId,
  isCompanyAdmin,
  getAllUserProgress,
  recordCourseCompletion,
  getCurrentUser: () => auth.currentUser
};
