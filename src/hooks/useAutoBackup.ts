import { useEffect } from 'react';
import { runScheduledBackup } from '../lib/autoBackup';

const CHECK_MS = 15 * 60 * 1000;

/** Run scheduled Drive backup when due (app open / foreground). */
export function useAutoBackup(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const check = () => {
      void runScheduledBackup();
    };

    check();

    const intervalId = window.setInterval(check, CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled]);
}
