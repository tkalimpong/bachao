import { initializeApp, type FirebaseApp } from 'firebase/app';
import { Capacitor } from '@capacitor/core';
import {
  browserLocalPersistence,
  getAuth,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { isEmbeddedPreviewBrowser } from './embeddedBrowser';
import { isPreviewUiMode } from './appMode';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

function envLooksConfigured(): boolean {
  const { apiKey, projectId, authDomain } = firebaseConfig;
  if (!apiKey || !projectId || !authDomain) return false;
  if (apiKey.includes('your-') || projectId.includes('your-')) return false;
  return true;
}

export const isFirebaseConfigured = envLooksConfigured();
export const firebaseInitInPreview = isFirebaseConfigured && isPreviewUiMode();

export let app: FirebaseApp | null = null;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let firebaseInitError: string | null = null;

function initFirestore(appInstance: FirebaseApp): Firestore {
  if (isEmbeddedPreviewBrowser()) {
    // IndexedDB persistence hangs or crashes in IDE Simple Browser iframes.
    return getFirestore(appInstance);
  }
  return initializeFirestore(appInstance, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
}

if (isFirebaseConfigured && !isPreviewUiMode()) {
  try {
    app = initializeApp(firebaseConfig);
    if (Capacitor.isNativePlatform()) {
      try {
        auth = initializeAuth(app, {
          persistence: indexedDBLocalPersistence,
        });
      } catch {
        auth = getAuth(app);
      }
    } else {
      auth = getAuth(app);
      const persistence = isEmbeddedPreviewBrowser()
        ? inMemoryPersistence
        : browserLocalPersistence;
      void setPersistence(auth, persistence);
    }
    db = initFirestore(app);
  } catch (e) {
    firebaseInitError = e instanceof Error ? e.message : 'Firebase init failed';
    console.error('[firebase]', e);
  }
}
