import type { Expense, Income, Transfer } from '../store/useStore';

export function transferReceived(transfers: Transfer[], memberId: string, month?: string): number {
  return transfers
    .filter(
      (t) =>
        t.toMemberId === memberId &&
        (!month || t.date.startsWith(month)),
    )
    .reduce((s, t) => s + t.amount, 0);
}

export function transferSent(transfers: Transfer[], memberId: string, month?: string): number {
  return transfers
    .filter(
      (t) =>
        t.fromMemberId === memberId &&
        (!month || t.date.startsWith(month)),
    )
    .reduce((s, t) => s + t.amount, 0);
}

export function memberEarned(incomes: Income[], memberId: string, month: string): number {
  return incomes
    .filter((i) => i.memberId === memberId && i.date.startsWith(month))
    .reduce((s, i) => s + i.amount, 0);
}

export function memberSpent(expenses: Expense[], memberId: string, month: string): number {
  return expenses
    .filter((e) => e.memberId === memberId && e.date.startsWith(month))
    .reduce((s, e) => s + e.amount, 0);
}

export function memberBalance(
  expenses: Expense[],
  incomes: Income[],
  transfers: Transfer[],
  memberId: string,
  month: string,
): number {
  const earned = memberEarned(incomes, memberId, month);
  const spent = memberSpent(expenses, memberId, month);
  const in_ = transferReceived(transfers, memberId, month);
  const out = transferSent(transfers, memberId, month);
  return earned - spent + in_ - out;
}
