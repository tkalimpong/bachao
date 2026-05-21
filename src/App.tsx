import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { canAccessTab, getMemberRole, shouldShowBottomNav } from './lib/permissions';
import { applyScrollForTab, scrollMainToTop, restoreMainScrollTop } from './lib/mainScroll';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Settings from './pages/Settings';
import Categories from './pages/Categories';
import Members from './pages/Members';
import Family from './pages/Family';
import Premium from './pages/Premium';
import History from './pages/History';

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

export default function App() {
  const {
    currentTab,
    addNavigationKey,
    uiOverlayDepth,
    setTab,
    members,
    currentUserId,
  } = useStore();
  const showBottomNav = shouldShowBottomNav(currentTab, uiOverlayDepth);
  useFirestoreSync();

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

  // 通常遷移: 子の mount 後も先頭を維持 / 復元遷移: scrollIntoView 後に位置を再適用
  useEffect(() => {
    if (didRestoreScrollRef.current) {
      const top = useStore.getState().tabScrollTops[currentTab] ?? 0;
      requestAnimationFrame(() => restoreMainScrollTop(top));
      didRestoreScrollRef.current = false;
      return;
    }
    // カテゴリジャンプ中は scrollIntoView のあとにリセットしない
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
