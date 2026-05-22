import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import {
  DRIVE_APPDATA_SCOPE,
  cacheDriveAccessTokenFromAuthResult,
} from './googleDriveAuth';

const provider = new GoogleAuthProvider();
provider.addScope(DRIVE_APPDATA_SCOPE);
provider.setCustomParameters({ prompt: 'select_account' });

export function formatAuthError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code: string }).code)
    : '';
  const message = error instanceof Error ? error.message : 'Sign-in failed';

  switch (code) {
    case 'auth/invalid-action':
      return 'Invalid sign-in request. Check Firebase Auth (Google enabled) and .env.local.';
    case 'auth/invalid-credential':
    case 'auth/internal-error':
      return Capacitor.isNativePlatform()
        ? 'Google sign-in failed on this device. In Firebase Console, register Android app com.familygullak.app, add your APK SHA-1 fingerprint, and place google-services.json in android/app/ (see docs/ANDROID.md).'
        : 'Sign-in failed. Check Firebase Auth settings and .env.local.';
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
      if (
        message.includes('DEVELOPER_ERROR')
        || message.includes('Error 10')
        || message.includes('12500')
      ) {
        return 'Google sign-in is misconfigured. Register Android app com.familygullak.app in Firebase, add SHA-1, and install google-services.json (see docs/ANDROID.md).';
      }
      if (message.includes('12501') || message.includes('cancelled')) {
        return 'Sign-in cancelled.';
      }
      if (message.includes('permission') || message.includes('PERMISSION_DENIED')) {
        return 'Firestore rules not deployed. Run: firebase deploy --only firestore:rules (see docs/ANDROID.md).';
      }
      if (message.includes('Invite code')) return message;
      return message;
  }
}

/** Web: popup. Android APK: native Google Sign-In (WebView redirect is blocked by Google). */
export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) throw new Error('Firebase Auth is not configured');

  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle({
      scopes: [DRIVE_APPDATA_SCOPE],
    });
    const idToken = result.credential?.idToken;
    if (!idToken) throw new Error('Google sign-in returned no credential');

    const credential = GoogleAuthProvider.credential(
      idToken,
      result.credential?.accessToken ?? undefined,
    );
    const userCredential = await signInWithCredential(auth, credential);
    cacheDriveAccessTokenFromAuthResult(userCredential);
    return userCredential.user;
  }

  const result = await signInWithPopup(auth, provider);
  cacheDriveAccessTokenFromAuthResult(result);
  return result.user;
}
