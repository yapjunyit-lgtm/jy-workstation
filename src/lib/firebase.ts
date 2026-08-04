import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

const STORAGE_KEY = 'jy_firebase_config';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getFirebaseDB(): Firestore | null {
  if (db) return db;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    const config: FirebaseConfig = JSON.parse(saved);
    if (!config.apiKey || !config.projectId) return null;

    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    return db;
  } catch {
    return null;
  }
}

export function configureFirebase(config: FirebaseConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  app = null;
  db = null;
  return getFirebaseDB();
}

export function isFirebaseConfigured(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const config: FirebaseConfig = JSON.parse(saved);
    return !!(config.apiKey && config.projectId);
  } catch {
    return false;
  }
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  app = null;
  db = null;
}

export function getFirebaseConfig(): FirebaseConfig | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
