import type { Plan } from './plan';
import type { Category } from '../store/useStore';

const PLAN_KEY = 'bachao_plan';
const HIDDEN_KEY = 'bachao_hidden_categories';

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
