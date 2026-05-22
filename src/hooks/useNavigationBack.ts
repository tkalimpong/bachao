import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  canNavigateBack,
  handlePopState,
  initNavigationHistory,
  navigateBack,
  onTabForward,
  resetNavigationHistory,
} from '../lib/navigationBack';
import { useStore } from '../store/useStore';

const EDGE_PX = 28;
const SWIPE_MIN_PX = 72;

export function useNavigationBack(): void {
  const currentTab = useStore((s) => s.currentTab);
  const navStack = useStore((s) => s.navStack);
  const prevTabRef = useRef(currentTab);

  useEffect(() => {
    initNavigationHistory();

    const onPopState = () => handlePopState();
    window.addEventListener('popstate', onPopState);

    let touchStartX = 0;
    let touchStartY = 0;
    let edgeSwipe = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      edgeSwipe = t.clientX <= EDGE_PX;
      if (!edgeSwipe) return;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!edgeSwipe) return;
      edgeSwipe = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (dx >= SWIPE_MIN_PX && Math.abs(dy) <= dx * 0.75 && canNavigateBack()) {
        navigateBack();
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    let removeBackButton: (() => void) | undefined;

    if (Capacitor.isNativePlatform()) {
      void App.addListener('backButton', () => {
        if (canNavigateBack()) {
          navigateBack();
        } else {
          void App.exitApp();
        }
      }).then((handle) => {
        removeBackButton = () => void handle.remove();
      });
    }

    return () => {
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      removeBackButton?.();
    };
  }, []);

  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev !== currentTab) {
      if (navStack.length === 0) {
        resetNavigationHistory();
      } else {
        onTabForward(prev, currentTab, navStack);
      }
    }
    prevTabRef.current = currentTab;
  }, [currentTab, navStack]);
}
