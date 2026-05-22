import { useStore } from '../store/useStore';
import { navigateBack } from './navigationBack';

export function getMainScrollEl(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-main-scroll]');
}

/** タブを離れる直前に呼ぶ（DOM がまだ旧画面のとき） */
export function captureTabScrollBeforeLeave(tab: string) {
  const el = getMainScrollEl();
  if (!el) return;
  useStore.getState().saveTabScrollTop(tab, el.scrollTop);
}

export function scrollMainToTop() {
  const el = getMainScrollEl();
  if (el) {
    el.scrollTop = 0;
    el.scrollTo(0, 0);
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function restoreMainScrollTop(top: number) {
  const el = getMainScrollEl();
  if (!el) return;
  el.scrollTop = top;
  el.scrollTo(0, top);
}

export function resetMainScroll() {
  scrollMainToTop();
}

export function resetMainScrollThoroughly() {
  scrollMainToTop();
  requestAnimationFrame(scrollMainToTop);
  requestAnimationFrame(() => requestAnimationFrame(scrollMainToTop));
}

export function applyScrollForTab(tab: string) {
  const { restoreScrollTab, tabScrollTops } = useStore.getState();
  if (restoreScrollTab === tab) {
    const top = tabScrollTops[tab] ?? 0;
    useStore.setState({ restoreScrollTab: null });
    restoreMainScrollTop(top);
    requestAnimationFrame(() => restoreMainScrollTop(top));
    return;
  }
  resetMainScrollThoroughly();
}

/** 設定サブ画面など、戻る操作で直前のスクロール位置を復元する */
export function goBackToTab(_tab: string) {
  navigateBack();
}
