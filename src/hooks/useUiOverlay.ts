import { useEffect } from 'react';
import { useStore } from '../store/useStore';

/** Edit / Transfer などのフルスクリーンオーバーレイ表示中に BottomNav を隠す */
export function useUiOverlay() {
  const pushUiOverlay = useStore((s) => s.pushUiOverlay);
  const popUiOverlay = useStore((s) => s.popUiOverlay);

  useEffect(() => {
    pushUiOverlay();
    return popUiOverlay;
  }, [pushUiOverlay, popUiOverlay]);
}
