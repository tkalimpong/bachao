import type { IncomeSourceOverrides } from './incomeSources';
import { normalizeIncomeSourceOverrides } from './incomeSources';
import { migrateStorageKey } from './storageMigrate';

const STORAGE_KEY = 'familygullak_income_source_overrides';

migrateStorageKey(STORAGE_KEY, 'hamrogullak_income_source_overrides');
migrateStorageKey(STORAGE_KEY, 'bachao_income_source_overrides');

export function loadStoredIncomeSourceOverrides(): IncomeSourceOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return normalizeIncomeSourceOverrides(JSON.parse(raw) as IncomeSourceOverrides);
  } catch {
    return {};
  }
}

export function saveStoredIncomeSourceOverrides(overrides: IncomeSourceOverrides): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* private browsing / quota */
  }
}
