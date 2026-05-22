import {
  BACKUP_FILENAME,
  LEGACY_BACKUP_FILENAME,
  serializeBackup,
  parseBackup,
  buildBackupPayload,
  buildBackupPayloadForUpload,
  type BackupPayload,
} from './backupPayload';
import {
  getDriveAccessToken,
  getDriveAccessTokenSilent,
  formatDriveAuthError,
  formatDriveApiError,
} from './googleDriveAuth';

export type DriveBackupMeta = {
  id: string;
  modifiedTime: string;
};

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

async function driveFetch(url: string, token: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(formatDriveApiError(body || `Drive API error (${res.status})`));
  }
  return res;
}

async function findBackupFile(token: string): Promise<DriveBackupMeta | null> {
  for (const name of [BACKUP_FILENAME, LEGACY_BACKUP_FILENAME]) {
    const q = encodeURIComponent(`name='${name}' and 'appDataFolder' in parents`);
    const res = await driveFetch(
      `${DRIVE_FILES}?spaces=appDataFolder&q=${q}&fields=files(id,name,modifiedTime)&pageSize=1`,
      token,
    );
    const data = (await res.json()) as { files?: DriveBackupMeta[] };
    if (data.files?.[0]) return data.files[0];
  }
  return null;
}

type DriveUploadOptions = {
  /** When false, uses cached token only (no redirect/popup). Default true. */
  interactive?: boolean;
};

async function resolveDriveToken(interactive: boolean): Promise<string> {
  if (interactive) return getDriveAccessToken();
  const token = await getDriveAccessTokenSilent();
  if (!token) throw new Error('DRIVE_TOKEN_UNAVAILABLE');
  return token;
}

export async function fetchDriveBackupMeta(): Promise<DriveBackupMeta | null> {
  const token = await getDriveAccessToken();
  return findBackupFile(token);
}

export async function uploadBackupToDrive(
  options?: DriveUploadOptions,
): Promise<DriveBackupMeta> {
  const token = await resolveDriveToken(options?.interactive !== false);
  const json = serializeBackup(await buildBackupPayloadForUpload());
  const existing = await findBackupFile(token);

  if (existing) {
    const res = await driveFetch(
      `${DRIVE_UPLOAD}/${existing.id}?uploadType=media`,
      token,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: json,
      },
    );
    const updated = (await res.json()) as DriveBackupMeta;
    return { id: updated.id, modifiedTime: updated.modifiedTime ?? new Date().toISOString() };
  }

  const metadata = { name: BACKUP_FILENAME, parents: ['appDataFolder'] };
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
  );
  form.append('file', new Blob([json], { type: 'application/json' }));

  const res = await driveFetch(`${DRIVE_UPLOAD}?uploadType=multipart`, token, {
    method: 'POST',
    body: form,
  });
  const created = (await res.json()) as DriveBackupMeta;
  return created;
}

export async function downloadBackupFromDrive(): Promise<BackupPayload> {
  const token = await getDriveAccessToken();
  const existing = await findBackupFile(token);
  if (!existing) throw new Error('No backup found on Google Drive.');

  const res = await driveFetch(
    `${DRIVE_FILES}/${existing.id}?alt=media`,
    token,
  );
  const raw = await res.text();
  return parseBackup(raw);
}

export { formatDriveAuthError, parseBackup, buildBackupPayload, buildBackupPayloadForUpload };
