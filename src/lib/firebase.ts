/**
 * Firebase client — Cloud Sync for JY Workstation
 *
 * Config can come from either:
 *   1. VITE_FIREBASE_* env vars (build-time), or
 *   2. Settings → Cloud Sync (stored in localStorage, runtime)
 * The app falls back to local-only mode if neither is present.
 */
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, signInAnonymously, onAuthStateChanged, type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = 'jy_firebase_config';
const EMPTY_CONFIG: FirebaseConfig = {
  apiKey: '', authDomain: '', projectId: '', storageBucket: '',
  messagingSenderId: '', appId: '',
};

// ── Config storage ────────────────────────────────────────────────────
export function getStoredFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.apiKey && parsed?.projectId ? parsed as FirebaseConfig : null;
  } catch {
    return null;
  }
}

export function readFirebaseConfig(): FirebaseConfig | null {
  // Env config wins; fall back to stored config
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  if (apiKey && projectId) {
    return {
      apiKey,
      projectId,
      authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || `${projectId}.firebaseapp.com`,
      storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || `${projectId}.appspot.com`,
      messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '',
      appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '',
    };
  }
  return getStoredFirebaseConfig();
}

export function getFirebaseConfig(): FirebaseConfig | null {
  return readFirebaseConfig();
}

export function configureFirebase(config: FirebaseConfig): void {
  // Delete existing app first so the new config takes effect
  if (app) {
    try { deleteApp(app); } catch { /* ignore */ }
    app = null;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...EMPTY_CONFIG, ...config }));
}

export function clearFirebaseConfig(): void {
  if (app) {
    try { deleteApp(app); } catch { /* ignore */ }
    app = null;
  }
  localStorage.removeItem(STORAGE_KEY);
}

export function isFirebaseConfigured(): boolean {
  return readFirebaseConfig() !== null;
}

// ── App / Auth / Firestore singletons ─────────────────────────────────
let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  const cfg = readFirebaseConfig();
  if (!cfg) return null;
  if (!app) app = initializeApp(cfg);
  return app;
}

export function getFirebaseAuth() {
  const fbApp = getFirebaseApp();
  if (!fbApp) throw new Error('Firebase is not configured');
  return getAuth(fbApp);
}

export function getFirestoreDB() {
  const fbApp = getFirebaseApp();
  if (!fbApp) throw new Error('Firebase is not configured');
  return getFirestore(fbApp);
}

/**
 * Ensures there is a signed-in user. Uses anonymous auth as a fallback so
 * single-device sync works instantly; email/password is needed for
 * multi-device access to the same data.
 */
export async function ensureSignedIn(): Promise<User> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

// ── Auth actions ──────────────────────────────────────────────────────
export async function firebaseSignIn(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function firebaseSignUp(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function firebaseSignOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export function onFirebaseAuthChange(cb: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured()) {
    cb(null);
    return () => {};
  }
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, cb);
}
