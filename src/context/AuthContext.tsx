import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { isLiveFirebase } from '../lib/appMode';
import { bootstrapFirebaseAuth } from '../lib/authBootstrap';
import { resolveUserGroup } from '../lib/authProfile';
import { formatAuthError, signInWithGoogle } from '../lib/googleSignIn';
import { clearDriveTokenCache, prefetchDriveAccessToken } from '../lib/googleDriveAuth';
import { useStore } from '../store/useStore';

import { migrateSessionKey } from '../lib/storageMigrate';

const PENDING_INVITE_KEY = 'hamrogullak_pending_invite';
const LEGACY_PENDING_INVITE_KEY = 'bachao_pending_invite';

migrateSessionKey(PENDING_INVITE_KEY, LEGACY_PENDING_INVITE_KEY);
const SETUP_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  ready: boolean;
  sessionReady: boolean;
  error: string | null;
  signIn: (inviteCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isRequired: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isLiveFirebase());
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!isLiveFirebase());
  const [sessionReady, setSessionReady] = useState(false);
  const { setGroupId, setCurrentUserId, setActiveMember } = useStore();
  const sessionRunRef = useRef<Promise<void> | null>(null);
  const bootstrappedRef = useRef(false);

  const applySession = useCallback(
    async (firebaseUser: User, inviteCode?: string | null) => {
      if (sessionRunRef.current) return sessionRunRef.current;

      const state = useStore.getState();
      if (state.currentUserId === firebaseUser.uid && state.groupId) {
        setUser(firebaseUser);
        setSessionReady(true);
        setReady(true);
        setLoading(false);
        setError(null);
        return;
      }

      const run = async () => {
        setLoading(true);
        setError(null);
        setSessionReady(false);
        setUser(firebaseUser);
        try {
          const code = inviteCode ?? sessionStorage.getItem(PENDING_INVITE_KEY);
          const nextGroupId = await withTimeout(
            resolveUserGroup(firebaseUser, code),
            SETUP_TIMEOUT_MS,
            'Family setup timed out. Check your network and Firestore rules.',
          );
          sessionStorage.removeItem(PENDING_INVITE_KEY);
          setGroupId(nextGroupId);
          setCurrentUserId(firebaseUser.uid);
          setActiveMember(firebaseUser.uid);
          setSessionReady(true);
          void prefetchDriveAccessToken();
        } catch (e) {
          sessionStorage.removeItem(PENDING_INVITE_KEY);
          setSessionReady(false);
          setUser(null);
          setError(formatAuthError(e));
        } finally {
          setReady(true);
          setLoading(false);
          sessionRunRef.current = null;
        }
      };

      sessionRunRef.current = run();
      return sessionRunRef.current;
    },
    [setGroupId, setCurrentUserId, setActiveMember],
  );

  useEffect(() => {
    if (!isLiveFirebase() || !auth) {
      setLoading(false);
      setReady(true);
      return;
    }

    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const firebaseUser = await bootstrapFirebaseAuth();
        if (!mounted) return;
        bootstrappedRef.current = true;
        if (firebaseUser) {
          await applySession(firebaseUser);
        } else {
          setReady(true);
          setLoading(false);
        }
      } catch (e) {
        if (!mounted) return;
        bootstrappedRef.current = true;
        setError(formatAuthError(e));
        setReady(true);
        setLoading(false);
      }
    })();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted || !bootstrappedRef.current) return;
      if (firebaseUser) {
        await applySession(firebaseUser);
      } else if (!sessionRunRef.current) {
        setUser(null);
        setSessionReady(false);
        setReady(true);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [applySession]);

  const signIn = useCallback(async (inviteCode?: string) => {
    if (!auth) return;
    setError(null);
    setLoading(true);
    setSessionReady(false);
    if (inviteCode?.trim()) {
      sessionStorage.setItem(PENDING_INVITE_KEY, inviteCode.trim().toUpperCase());
    } else {
      sessionStorage.removeItem(PENDING_INVITE_KEY);
    }
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        await applySession(signedInUser, inviteCode);
      }
    } catch (e) {
      sessionStorage.removeItem(PENDING_INVITE_KEY);
      if (auth.currentUser) {
        await applySession(auth.currentUser, inviteCode);
        return;
      }
      setError(formatAuthError(e));
      setLoading(false);
      setReady(true);
    }
  }, [applySession]);

  const signOut = useCallback(async () => {
    if (!auth) return;
    setError(null);
    setSessionReady(false);
    clearDriveTokenCache();
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        ready,
        sessionReady,
        error,
        signIn,
        signOut,
        isRequired: isLiveFirebase(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
