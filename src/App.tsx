import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { canAccessTab, canUsePremium, getMemberRole, shouldShowBottomNav } from './lib/permissions';
import { applyScrollForTab, scrollMainToTop, restoreMainScrollTop } from './lib/mainScroll';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { useAutoBackup } from './hooks/useAutoBackup';
import { useNavigationBack } from './hooks/useNavigationBack';
import { useAuth } from './context/AuthContext';
import { isLiveFirebase } from './lib/appMode';
import { canBackup } from './lib/plan';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import Members from './pages/Members';
import Family from './pages/Family';
import Premium from './pages/Premium';
import History from './pages/History';
import Backup from './pages/Backup';
import Gullak from './pages/Gullak';
import Login from './pages/Login';

const SCREENS: Record<string, React.FC> = {
  home:       Dashboard,
  add:        AddExpense,
  settings:   Settings,
  categories: Categories,
  members:    Members,
  premium:    Premium,
  family:     Family,
  history:    History,
  backup:     Backup,
  gullak:     Gullak,
};

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-sm min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-8">
        <div className="w-10 h-10 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin" />
        <p className="text-sm font-medium text-gray-600 text-center">{message}</p>
      </div>
    </div>
  );
}

function AppShell() {
  const {
    currentTab,
    addNavigationKey,
    uiOverlayDepth,
    setTab,
    members,
    currentUserId,
    groupId,
    plan,
  } = useStore();
  const showBottomNav = shouldShowBottomNav(currentTab, uiOverlayDepth);
  const syncEnabled = isLiveFirebase() && Boolean(groupId && currentUserId);
  useFirestoreSync(syncEnabled);

  const role = getMemberRole(members, currentUserId);
  const autoBackupEnabled =
    syncEnabled &&
    canBackup(plan) &&
    (role ? canUsePremium(role) : true);
  useAutoBackup(autoBackupEnabled);
  useNavigationBack();

  useEffect(() => {
    const role = getMemberRole(members, currentUserId);
    if (!role || canAccessTab(role, currentTab)) return;
    setTab('home');
  }, [currentTab, currentUserId, members, setTab]);

  const screenKey = currentTab === 'add' ? `add-${addNavigationKey}` : currentTab;
  const didRestoreScrollRef = useRef(false);

  useLayoutEffect(() => {
    didRestoreScrollRef.current =
      useStore.getState().restoreScrollTab === currentTab;
    applyScrollForTab(currentTab);
  }, [currentTab, addNavigationKey]);

  useEffect(() => {
    if (didRestoreScrollRef.current) {
      const top = useStore.getState().tabScrollTops[currentTab] ?? 0;
      requestAnimationFrame(() => restoreMainScrollTop(top));
      didRestoreScrollRef.current = false;
      return;
    }
    if (currentTab === 'history' && useStore.getState().categoryScrollTarget) {
      scrollMainToTop();
      return;
    }
    scrollMainToTop();
    const t = window.setTimeout(scrollMainToTop, 0);
    return () => window.clearTimeout(t);
  }, [currentTab, addNavigationKey]);

  const Screen = SCREENS[currentTab] ?? Dashboard;

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center">
      <div className="relative w-full max-w-sm min-h-screen bg-surface overflow-hidden flex flex-col">
        <div className="h-6 bg-transparent shrink-0" />
        <div
          key={screenKey}
          data-main-scroll
          className="flex-1 overflow-y-auto min-h-0"
        >
          <Screen />
        </div>
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}

export default function App() {
  const auth = useAuth();

  if (auth.isRequired) {
    if (!auth.ready || auth.loading) {
      const message = auth.user
        ? 'Setting up your family…'
        : 'Signing you in…';
      return <LoadingScreen message={message} />;
    }
    if (!auth.user || !auth.sessionReady) {
      return (
        <Login loading={auth.loading} error={auth.error} onSignIn={auth.signIn} />
      );
    }
  }

  return <AppShell />;
}
