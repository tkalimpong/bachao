import { useEffect, useRef } from 'react';
import { pushOverlayHistory, registerBackHandler } from '../lib/navigationBack';

/** Close overlay / modal on system back or edge swipe. */
export function useBackHandler(handler: () => boolean, enabled = true): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    pushOverlayHistory();
    return registerBackHandler(() => handlerRef.current());
  }, [enabled]);
}
