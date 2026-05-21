import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { canAccessTab, getMemberRole, shouldShowBottomNav } from './lib/permissions';
import { applyScrollForTab, scrollMainToTop, restoreMainScrollTop } from './lib/mainScroll';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { useAuth } from './hooks/useAuth';
import { isFirebaseConfigured } from './lib/firebase';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import Members from './pages/Members';
import Family from './pages/Family';
import Premium from './pages/Premium';
import History from './pages/History';
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
};

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-sm min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin" />
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
  } = useStore();
  const showBottomNav = shouldShowBottomNav(currentTab, uiOverlayDepth);
  const syncEnabled = !isFirebaseConfigured || Boolean(groupId && currentUserId);
  useFirestoreSync(syncEnabled);

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
    if (!auth.ready || (auth.loading && !auth.user)) {
      return <LoadingScreen />;
    }
    if (!auth.user) {
      return (
        <Login loading={auth.loading} error={auth.error} onSignIn={auth.signIn} />
      );
    }
  }

  return <AppShell />;
}
