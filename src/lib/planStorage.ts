import type { Plan } from './plan';
import type { Category, IncomeSource } from '../store/useStore';
import { migrateStorageKey } from './storageMigrate';

const PLAN_KEY = 'familygullak_plan';
const HIDDEN_KEY = 'familygullak_hidden_categories';
const HIDDEN_INCOME_KEY = 'familygullak_hidden_income_sources';
const LEGACY_HAMRO_PLAN_KEY = 'hamrogullak_plan';
const LEGACY_HAMRO_HIDDEN_KEY = 'hamrogullak_hidden_categories';
const LEGACY_HAMRO_HIDDEN_INCOME_KEY = 'hamrogullak_hidden_income_sources';
const LEGACY_PLAN_KEY = 'bachao_plan';
const LEGACY_HIDDEN_KEY = 'bachao_hidden_categories';
const LEGACY_HIDDEN_INCOME_KEY = 'bachao_hidden_income_sources';

migrateStorageKey(PLAN_KEY, LEGACY_HAMRO_PLAN_KEY);
migrateStorageKey(HIDDEN_KEY, LEGACY_HAMRO_HIDDEN_KEY);
migrateStorageKey(HIDDEN_INCOME_KEY, LEGACY_HAMRO_HIDDEN_INCOME_KEY);
migrateStorageKey(PLAN_KEY, LEGACY_PLAN_KEY);
migrateStorageKey(HIDDEN_KEY, LEGACY_HIDDEN_KEY);
migrateStorageKey(HIDDEN_INCOME_KEY, LEGACY_HIDDEN_INCOME_KEY);

export function loadStoredPlan(): Plan {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw === 'plus' ? 'plus' : 'free';
  } catch {
    return 'free';
  }
}

export function saveStoredPlan(plan: Plan): void {
  try {
    localStorage.setItem(PLAN_KEY, plan);
  } catch {
    /* private browsing / quota */
  }
}

export function loadStoredHiddenCategories(): Category[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Category[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredHiddenCategories(categories: Category[]): void {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(categories));
  } catch {
    /* private browsing / quota */
  }
}

export function loadStoredHiddenIncomeSources(): IncomeSource[] {
  try {
    const raw = localStorage.getItem(HIDDEN_INCOME_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IncomeSource[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredHiddenIncomeSources(sources: IncomeSource[]): void {
  try {
    localStorage.setItem(HIDDEN_INCOME_KEY, JSON.stringify(sources));
  } catch {
    /* private browsing / quota */
  }
}
