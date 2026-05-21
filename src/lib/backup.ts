import { useStore } from '../store/useStore';

/** Download family data as JSON (Plus feature). */
export function exportFamilyBackup(): void {
  const {
    expenses,
    incomes,
    transfers,
    members,
    categoryBudgets,
    categoryOverrides,
    hiddenCategories,
    plan,
    groupId,
  } = useStore.getState();

  const payload = {
    exportedAt: new Date().toISOString(),
    groupId: groupId || null,
    plan,
    members,
    expenses,
    incomes,
    transfers,
    categoryBudgets,
    categoryOverrides,
    hiddenCategories,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bachao-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
