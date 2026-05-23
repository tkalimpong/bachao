import type { GullakDeposit } from '../store/useStore';

/** Filter deposits to a member scope (null = all members). */
export function scopeGullakDeposits(
  deposits: GullakDeposit[],
  memberIds: string[] | null,
): GullakDeposit[] {
  if (!memberIds) return deposits;
  return deposits.filter((d) => memberIds.includes(d.memberId));
}

export function sumGullakDeposits(deposits: GullakDeposit[]): number {
  return deposits.reduce((s, d) => s + d.amount, 0);
}

export function sumGullakDepositsInMonth(
  deposits: GullakDeposit[],
  monthKey: string,
): number {
  return sumGullakDeposits(deposits.filter((d) => d.date.startsWith(monthKey)));
}

export function availableBalance(rawBalance: number, gullakTotal: number): number {
  return rawBalance - gullakTotal;
}
