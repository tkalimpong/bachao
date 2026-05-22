import type { CategoryOverrides } from './categories';
import { normalizeCategoryOverrides } from './categories';
import { migrateStorageKey } from './storageMigrate';

const STORAGE_KEY = 'familygullak_category_overrides';
const LEGACY_HAMRO_KEY = 'hamrogullak_category_overrides';
const LEGACY_KEY = 'bachao_category_overrides';

migrateStorageKey(STORAGE_KEY, LEGACY_HAMRO_KEY);
migrateStorageKey(STORAGE_KEY, LEGACY_KEY);

export function loadStoredCategoryOverrides(): CategoryOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return normalizeCategoryOverrides(JSON.parse(raw) as CategoryOverrides);
  } catch {
    return {};
  }
}

export function saveStoredCategoryOverrides(overrides: CategoryOverrides): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* private browsing / quota */
  }
}
