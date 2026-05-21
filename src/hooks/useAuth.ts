import { useCallback, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { resolveUserGroup } from '../lib/authProfile';
import { completeGoogleRedirectSignIn, signInWithGoogle } from '../lib/googleSignIn';
import { useStore } from '../store/useStore';

const PENDING_INVITE_KEY = 'bachao_pending_invite';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);
  const { setGroupId, setCurrentUserId, setActiveMember } = useStore();

  const applySession = useCallback(
    async (firebaseUser: User, inviteCode?: string | null) => {
      setLoading(true);
      setError(null);
      try {
        const code = inviteCode ?? sessionStorage.getItem(PENDING_INVITE_KEY);
        const groupId = await resolveUserGroup(firebaseUser, code);
        sessionStorage.removeItem(PENDING_INVITE_KEY);
        setGroupId(groupId);
        setCurrentUserId(firebaseUser.uid);
        setActiveMember(firebaseUser.uid);
        setUser(firebaseUser);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-in failed');
        setUser(null);
      } finally {
        setReady(true);
        setLoading(false);
      }
    },
    [setGroupId, setCurrentUserId, setActiveMember],
  );

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      setReady(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const redirectUser = await completeGoogleRedirectSignIn();
      if (cancelled || !redirectUser) return;
      await applySession(redirectUser);
    })();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return;
      if (firebaseUser) {
        await applySession(firebaseUser);
      } else {
        setUser(null);
        setReady(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [applySession]);

  const signIn = useCallback(
    async (inviteCode?: string) => {
      if (!auth) return;
      setError(null);
      setLoading(true);
      if (inviteCode?.trim()) {
        sessionStorage.setItem(PENDING_INVITE_KEY, inviteCode.trim().toUpperCase());
      }
      try {
        const signedInUser = await signInWithGoogle();
        if (signedInUser) {
          await applySession(signedInUser, inviteCode);
        }
      } catch (e) {
        sessionStorage.removeItem(PENDING_INVITE_KEY);
        setError(e instanceof Error ? e.message : 'Google sign-in failed');
        setLoading(false);
      }
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    if (!auth) return;
    setError(null);
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  return {
    user,
    loading,
    ready,
    error,
    signIn,
    signOut,
    isRequired: isFirebaseConfigured,
  };
}
