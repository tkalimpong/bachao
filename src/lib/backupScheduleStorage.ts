import { migrateStorageKey } from './storageMigrate';

export type AutoBackupInterval = 'daily' | 'weekly';

export interface AutoBackupSettings {
  enabled: boolean;
  interval: AutoBackupInterval;
}

const SETTINGS_KEY = 'hamrogullak_auto_backup';
const LAST_AUTO_KEY = 'hamrogullak_auto_backup_last';
const LAST_CLOUD_KEY = 'hamrogullak_last_cloud_backup';
const LEGACY_SETTINGS_KEY = 'bachao_auto_backup';
const LEGACY_LAST_RUN_KEY = 'bachao_auto_backup_last';

const INTERVAL_MS: Record<AutoBackupInterval, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

migrateStorageKey(SETTINGS_KEY, LEGACY_SETTINGS_KEY);
migrateStorageKey(LAST_AUTO_KEY, LEGACY_LAST_RUN_KEY);

const DEFAULT_SETTINGS: AutoBackupSettings = {
  enabled: false,
  interval: 'daily',
};

export function loadAutoBackupSettings(): AutoBackupSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AutoBackupSettings>;
    return {
      enabled: parsed.enabled === true,
      interval: parsed.interval === 'weekly' ? 'weekly' : 'daily',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveAutoBackupSettings(settings: AutoBackupSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* private browsing / quota */
  }
}

export function loadLastAutoBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_AUTO_KEY);
  } catch {
    return null;
  }
}

export function saveLastAutoBackupAt(iso: string): void {
  try {
    localStorage.setItem(LAST_AUTO_KEY, iso);
  } catch {
    /* private browsing / quota */
  }
}

function loadLastCloudBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_CLOUD_KEY);
  } catch {
    return null;
  }
}

export function saveLastCloudBackupAt(iso: string): void {
  try {
    localStorage.setItem(LAST_CLOUD_KEY, iso);
  } catch {
    /* private browsing / quota */
  }
}

export function intervalMs(interval: AutoBackupInterval): number {
  return INTERVAL_MS[interval];
}

export function isAutoBackupDue(
  settings: AutoBackupSettings,
  now = Date.now(),
): boolean {
  if (!settings.enabled) return false;
  const last = loadLastCloudBackupAt();
  if (!last) return true;
  const lastMs = Date.parse(last);
  if (Number.isNaN(lastMs)) return true;
  return now - lastMs >= intervalMs(settings.interval);
}

export function nextAutoBackupAt(
  settings: AutoBackupSettings,
  now = Date.now(),
): Date | null {
  if (!settings.enabled) return null;
  const last = loadLastCloudBackupAt();
  const base = last && !Number.isNaN(Date.parse(last)) ? Date.parse(last) : now;
  return new Date(base + intervalMs(settings.interval));
}
