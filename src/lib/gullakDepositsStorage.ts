import type { GullakDeposit } from '../store/useStore';
import { migrateStorageKey } from './storageMigrate';

const STORAGE_KEY = 'familygullak_gullak_deposits';
const LEGACY_HAMRO_KEY = 'hamrogullak_gullak_deposits';
const LEGACY_KEY = 'bachao_gullak_deposits';

migrateStorageKey(STORAGE_KEY, LEGACY_HAMRO_KEY);
migrateStorageKey(STORAGE_KEY, LEGACY_KEY);

export function loadStoredGullakDeposits(): GullakDeposit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GullakDeposit[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredGullakDeposits(deposits: GullakDeposit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deposits));
  } catch {
    /* private browsing / quota */
  }
}
