import { getRedirectResult } from 'firebase/auth';
import { auth } from './firebase';
import { cacheDriveAccessTokenFromAuthResult } from './googleDriveAuth';

const AUTH_READY_MS = 12_000;

let bootstrapPromise: Promise<import('firebase/auth').User | null> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('Auth init timed out')), ms);
    }),
  ]);
}

export function resetAuthBootstrapForTests(): void {
  bootstrapPromise = null;
}

export function bootstrapFirebaseAuth(): Promise<import('firebase/auth').User | null> {
  if (!auth) return Promise.resolve(null);
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        cacheDriveAccessTokenFromAuthResult(result);
        if (result.user) return result.user;
      }
    } catch (e) {
      console.error('[auth] getRedirectResult failed', e);
    }

    await withTimeout(auth.authStateReady(), AUTH_READY_MS);
    return auth.currentUser;
  })().catch((e) => {
    console.error('[auth] bootstrap failed', e);
    return auth?.currentUser ?? null;
  });

  return bootstrapPromise;
}
