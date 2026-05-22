import { useStore } from '../store/useStore';

const ROOT_TABS = new Set(['home', 'settings', 'family', 'history']);

type BackHandler = () => boolean;

const handlers: BackHandler[] = [];
let historyEntries = 0;
let ignorePopstate = false;

export function isRootTab(tab: string): boolean {
  return ROOT_TABS.has(tab);
}

export function initNavigationHistory(): void {
  if (!window.history.state?.familygullakNav) {
    window.history.replaceState({ familygullakNav: true }, '');
  }
}

export function resetNavigationHistory(): void {
  historyEntries = 0;
  window.history.replaceState({ familygullakNav: true }, '');
}

export function pushNavigationHistory(): void {
  historyEntries += 1;
  window.history.pushState({ familygullakNav: true }, '');
}

export function pushOverlayHistory(): void {
  pushNavigationHistory();
}

export function registerBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  return () => {
    const index = handlers.indexOf(handler);
    if (index >= 0) handlers.splice(index, 1);
  };
}

function tryOverlayBack(): boolean {
  for (let i = handlers.length - 1; i >= 0; i -= 1) {
    if (handlers[i]()) return true;
  }
  return false;
}

export function hasOverlayBackHandler(): boolean {
  return handlers.length > 0;
}

function syncHistoryBack(): void {
  if (historyEntries <= 0) return;
  historyEntries -= 1;
  ignorePopstate = true;
  window.history.back();
}

export function navigateBack(): boolean {
  if (tryOverlayBack()) {
    syncHistoryBack();
    return true;
  }
  if (useStore.getState().popTab()) {
    syncHistoryBack();
    return true;
  }
  return false;
}

/** Re-push history so Android system back / edge swipe does not close the WebView. */
function trapBrowserBack(): void {
  window.history.pushState({ familygullakNav: true }, '');
}

export function handlePopState(): void {
  if (ignorePopstate) {
    ignorePopstate = false;
    return;
  }
  if (historyEntries > 0) historyEntries -= 1;
  if (tryOverlayBack()) return;
  if (useStore.getState().popTab()) return;
  trapBrowserBack();
}

export function canNavigateBack(): boolean {
  if (hasOverlayBackHandler()) return true;
  const { navStack, currentTab } = useStore.getState();
  if (currentTab === 'add') return true;
  return navStack.length > 0;
}

/** Call when tab changes forward (sub-screen); pairs with store navStack. */
export function onTabForward(fromTab: string, toTab: string, navStack: string[]): void {
  if (isRootTab(toTab)) {
    resetNavigationHistory();
    return;
  }
  if (navStack.length > 0 && navStack[navStack.length - 1] === fromTab) {
    pushNavigationHistory();
  }
}
