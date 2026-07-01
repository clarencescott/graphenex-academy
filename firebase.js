import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
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

window.grapheneAuth = {
  auth,
  login,
  register,
  logout,
  observeAuthState,
  getCurrentUser: () => auth.currentUser
};

