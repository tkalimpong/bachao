import { APP_SLUG } from './appBrand';
import {
  buildBackupPayloadForUpload,
  parseBackup,
  serializeBackup,
  type BackupPayload,
} from './backupPayload';

/** Download family data as JSON file (Plus feature). */
export async function exportFamilyBackup(): Promise<void> {
  const payload = await buildBackupPayloadForUpload();
  const blob = new Blob([serializeBackup(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${APP_SLUG}-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Read a JSON backup file picked on this device. */
export function readBackupFile(file: File): Promise<BackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseBackup(String(reader.result ?? '')));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Could not read the backup file.'));
    reader.readAsText(file);
  });
}
