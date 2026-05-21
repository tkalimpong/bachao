import type { Category, Expense } from '../store/useStore';

/** Expenses strictly before the selected month (YYYY-MM). */
export function expensesBeforeMonth(expenses: Expense[], selectedMonth: string): Expense[] {
  return expenses.filter((e) => e.date.slice(0, 7) < selectedMonth);
}

export function earliestMonthKey(expenses: Expense[]): string | null {
  if (expenses.length === 0) return null;
  return expenses.map((e) => e.date.slice(0, 7)).sort()[0] ?? null;
}

/**
 * Calendar months from firstMonth (inclusive) up to, but not including, selectedMonth.
 * e.g. first=2026-01, selected=2026-05 → 4 (Jan–Apr).
 */
export function monthSpanBeforeSelected(firstMonth: string, selectedMonth: string): number {
  if (firstMonth >= selectedMonth) return 0;
  const [y1, m1] = firstMonth.split('-').map(Number);
  const [y2, m2] = selectedMonth.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

/**
 * Monthly average from totals through the month before selectedMonth.
 * Adding spend in selectedMonth (or later) does not change this value.
 */
export function monthlyAvgBeforeMonth(
  expenses: Expense[],
  selectedMonth: string,
  categoryId?: Category,
): number {
  const pool = categoryId
    ? expenses.filter((e) => e.category === categoryId)
    : expenses;
  const prior = expensesBeforeMonth(pool, selectedMonth);
  const first = earliestMonthKey(prior);
  if (!first) return 0;
  const months = monthSpanBeforeSelected(first, selectedMonth);
  if (months <= 0) return 0;
  const total = prior.reduce((s, e) => s + e.amount, 0);
  return Math.round(total / months);
}

export type CategoryMonthProgress = {
  spent: number;
  avg: number;
  pct: number;
  isOver: boolean;
  isWarn: boolean;
};

/** Category タブとホームゲージで共通の月次プログレス */
export function categoryMonthProgress(
  expenses: Expense[],
  selectedMonth: string,
  categoryId: Category,
): CategoryMonthProgress {
  const spent = expenses
    .filter((e) => e.date.startsWith(selectedMonth) && e.category === categoryId)
    .reduce((s, e) => s + e.amount, 0);
  const avg = monthlyAvgBeforeMonth(expenses, selectedMonth, categoryId);
  const pct = avg > 0 ? Math.min((spent / avg) * 100, 110) : 0;
  const isOver = avg > 0 && spent > avg;
  const isWarn = avg > 0 && pct >= 75 && !isOver;
  return { spent, avg, pct, isOver, isWarn };
}
