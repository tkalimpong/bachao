import { isLiveFirebase } from './appMode';
import {
  isAutoBackupDue,
  loadAutoBackupSettings,
  saveLastAutoBackupAt,
  saveLastCloudBackupAt,
} from './backupScheduleStorage';
import { uploadBackupToDrive } from './googleDrive';
import { canBackup } from './plan';
import { canUsePremium, getMemberRole } from './permissions';
import { useStore } from '../store/useStore';

export type AutoBackupResult =
  | 'skipped'
  | 'success'
  | 'no_token'
  | 'error';

export const AUTO_BACKUP_EVENT = 'hamrogullak:auto-backup';

let running = false;

export async function runScheduledBackup(): Promise<AutoBackupResult> {
  if (running) return 'skipped';
  if (!isLiveFirebase()) return 'skipped';

  const settings = loadAutoBackupSettings();
  if (!settings.enabled || !isAutoBackupDue(settings)) return 'skipped';

  const state = useStore.getState();
  if (!canBackup(state.plan)) return 'skipped';

  const role = getMemberRole(state.members, state.currentUserId);
  if (role && !canUsePremium(role)) return 'skipped';

  running = true;
  try {
    await uploadBackupToDrive({ interactive: false });
    const now = new Date().toISOString();
    saveLastAutoBackupAt(now);
    saveLastCloudBackupAt(now);
    window.dispatchEvent(new CustomEvent(AUTO_BACKUP_EVENT, { detail: { at: now } }));
    return 'success';
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'DRIVE_TOKEN_UNAVAILABLE') return 'no_token';
      if (e.message === 'DRIVE_REDIRECT_PENDING') return 'no_token';
    }
    console.warn('[auto-backup] failed', e);
    return 'error';
  } finally {
    running = false;
  }
}
