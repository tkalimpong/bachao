import { Capacitor } from '@capacitor/core';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export function formatAuthError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code: string }).code)
    : '';
  const message = error instanceof Error ? error.message : 'Sign-in failed';

  switch (code) {
    case 'auth/invalid-action':
      return Capacitor.isNativePlatform()
        ? 'Sign-in redirect failed. Rebuild the APK after updating .env.local.'
        : 'Invalid sign-in request. Check Firebase Auth (Google enabled) and .env.local.';
    case 'auth/unauthorized-domain':
      return 'Domain not authorized. Add localhost to Firebase Auth → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Enable Google sign-in in Firebase Console → Authentication → Sign-in method.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled.';
    case 'auth/popup-blocked':
      return 'Popup blocked — allow popups for this site, or open in Chrome.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Firestore rules not deployed. Run: firebase deploy --only firestore:rules (see docs/ANDROID.md).';
    default:
      if (message.includes('permission') || message.includes('PERMISSION_DENIED')) {
        return 'Firestore rules not deployed. Run: firebase deploy --only firestore:rules (see docs/ANDROID.md).';
      }
      if (message.includes('Invite code')) return message;
      return message;
  }
}

/**
 * Web: popup (stays on localhost, no redirect loop).
 * Android APK: full-page redirect.
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) throw new Error('Firebase Auth is not configured');

  if (Capacitor.isNativePlatform()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  const result = await signInWithPopup(auth, provider);
  return result.user;
}
