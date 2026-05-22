import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import type { CategoryOverrides } from './categories';
import { db } from './firebase';
import { isLiveFirebase } from './appMode';
import type { Plan } from './plan';
import {
  useStore,
  type Category,
  type CategoryBudget,
  type Expense,
  type FamilyMember,
  type Income,
  type Transfer,
} from '../store/useStore';
import {
  saveStoredCategoryOverrides,
} from './categoryOverridesStorage';
import {
  saveStoredHiddenCategories,
  saveStoredPlan,
} from './planStorage';

import { APP_SLUG } from './appBrand';

export const BACKUP_VERSION = 1;
export const BACKUP_FILENAME = `${APP_SLUG}-family-backup.json`;
/** Legacy filenames from previous app names — still read on restore. */
export const LEGACY_BACKUP_FILENAMES = [
  'hamro-gullak-family-backup.json',
  'bachao-family-backup.json',
] as const;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  groupId: string | null;
  plan: Plan;
  members: FamilyMember[];
  expenses: Expense[];
  incomes: Income[];
  transfers: Transfer[];
  categoryBudgets: CategoryBudget[];
  categoryOverrides: CategoryOverrides;
  hiddenCategories: Category[];
}

export function buildBackupPayload(): BackupPayload {
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

  return {
    version: BACKUP_VERSION,
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
}

function mapExpenseDoc(id: string, data: Record<string, unknown>): Expense {
  return {
    id,
    category: data.category as Expense['category'],
    amount: data.amount as number,
    note: data.note as string,
    date: data.date as string,
    memberId: data.memberId as string,
  };
}

function mapIncomeDoc(id: string, data: Record<string, unknown>): Income {
  return {
    id,
    source: data.source as Income['source'],
    amount: data.amount as number,
    note: data.note as string,
    date: data.date as string,
    memberId: data.memberId as string,
  };
}

function mapTransferDoc(id: string, data: Record<string, unknown>): Transfer {
  return {
    id,
    fromMemberId: data.fromMemberId as string,
    toMemberId: data.toMemberId as string,
    amount: data.amount as number,
    note: data.note as string,
    date: data.date as string,
  };
}

async function fetchCollection<T>(
  path: string,
  map: (id: string, data: Record<string, unknown>) => T,
): Promise<T[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, path));
  return snap.docs.map((d) => map(d.id, d.data() as Record<string, unknown>));
}

/** Full family snapshot for cloud backup (all months, not just the synced month). */
export async function buildBackupPayloadForUpload(): Promise<BackupPayload> {
  const base = buildBackupPayload();
  const { groupId } = useStore.getState();
  if (!isLiveFirebase() || !db || !groupId) return base;

  const prefix = `groups/${groupId}`;
  const [expenses, incomes, transfers] = await Promise.all([
    fetchCollection(`${prefix}/expenses`, mapExpenseDoc),
    fetchCollection(`${prefix}/incomes`, mapIncomeDoc),
    fetchCollection(`${prefix}/transfers`, mapTransferDoc),
  ]);

  return { ...base, expenses, incomes, transfers };
}

export function formatRestoreError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code: string }).code)
    : '';
  const message = error instanceof Error ? error.message : 'Restore failed';

  if (code === 'permission-denied' || code === 'firestore/permission-denied') {
    return 'Could not sync restore to the cloud (Firestore permission denied). Deploy firestore.rules: firebase deploy --only firestore:rules — see docs/ANDROID.md.';
  }
  if (message.includes('Missing or insufficient permissions') || message.includes('PERMISSION_DENIED')) {
    return 'Could not sync restore to the cloud (Firestore permission denied). Deploy firestore.rules: firebase deploy --only firestore:rules — see docs/ANDROID.md.';
  }
  if (message.includes('different family group')) return message;
  if (message.includes('Invalid backup') || message.includes('Unsupported backup')) return message;
  if (message.includes('No backup found')) return message;
  return message;
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function parseBackup(raw: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid backup file (not JSON).');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid backup file.');
  }
  const p = parsed as Partial<BackupPayload>;
  if (p.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version (${p.version ?? 'unknown'}).`);
  }
  if (!Array.isArray(p.expenses) || !Array.isArray(p.incomes) || !Array.isArray(p.transfers)) {
    throw new Error('Backup file is missing transaction data.');
  }
  return p as BackupPayload;
}

function applyToLocalStore(payload: BackupPayload): void {
  saveStoredPlan(payload.plan ?? 'free');
  saveStoredCategoryOverrides(payload.categoryOverrides ?? {});
  saveStoredHiddenCategories(payload.hiddenCategories ?? []);

  useStore.setState({
    plan: payload.plan ?? 'free',
    expenses: payload.expenses,
    incomes: payload.incomes,
    transfers: payload.transfers,
    categoryBudgets: payload.categoryBudgets ?? useStore.getState().categoryBudgets,
    categoryOverrides: payload.categoryOverrides ?? {},
    hiddenCategories: payload.hiddenCategories ?? [],
    ...(isLiveFirebase() ? {} : { members: payload.members }),
  });
}

async function deleteCollectionDocs(path: string, keepIds: Set<string>): Promise<void> {
  if (!db) return;
  const snap = await getDocs(collection(db, path));
  const toDelete = snap.docs.filter((d) => !keepIds.has(d.id));
  for (let i = 0; i < toDelete.length; i += 400) {
    const batch = writeBatch(db);
    toDelete.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

async function upsertTransactions(groupId: string, payload: BackupPayload): Promise<void> {
  if (!db) return;

  for (let i = 0; i < payload.expenses.length; i += 400) {
    const batch = writeBatch(db);
    payload.expenses.slice(i, i + 400).forEach((e) => {
      const { id, ...data } = e;
      batch.set(doc(db!, `groups/${groupId}/expenses/${id}`), data);
    });
    await batch.commit();
  }

  for (let i = 0; i < payload.incomes.length; i += 400) {
    const batch = writeBatch(db);
    payload.incomes.slice(i, i + 400).forEach((item) => {
      const { id, ...data } = item;
      batch.set(doc(db!, `groups/${groupId}/incomes/${id}`), data);
    });
    await batch.commit();
  }

  for (let i = 0; i < payload.transfers.length; i += 400) {
    const batch = writeBatch(db);
    payload.transfers.slice(i, i + 400).forEach((t) => {
      const { id, ...data } = t;
      batch.set(doc(db!, `groups/${groupId}/transfers/${id}`), data);
    });
    await batch.commit();
  }

  for (const budget of payload.categoryBudgets ?? []) {
    await setDoc(
      doc(db, `groups/${groupId}/categoryBudgets/${budget.id}`),
      { budget: budget.budget },
      { merge: true },
    );
  }

  await setDoc(
    doc(db, `groups/${groupId}/settings/main`),
    {
      plan: payload.plan ?? 'free',
      categoryOverrides: payload.categoryOverrides ?? {},
      hiddenCategories: payload.hiddenCategories ?? [],
    },
    { merge: true },
  );
}

async function restoreToFirestore(groupId: string, payload: BackupPayload): Promise<void> {
  if (!db) throw new Error('Firestore not configured');
  if (payload.groupId && payload.groupId !== groupId) {
    throw new Error('This backup belongs to a different family group.');
  }

  const expenseIds = new Set(payload.expenses.map((e) => e.id));
  const incomeIds = new Set(payload.incomes.map((i) => i.id));
  const transferIds = new Set(payload.transfers.map((t) => t.id));

  // Write backup data first; orphan cleanup is best-effort.
  await upsertTransactions(groupId, payload);
  applyToLocalStore({ ...payload, groupId });

  try {
    await deleteCollectionDocs(`groups/${groupId}/expenses`, expenseIds);
    await deleteCollectionDocs(`groups/${groupId}/incomes`, incomeIds);
    await deleteCollectionDocs(`groups/${groupId}/transfers`, transferIds);
  } catch (e) {
    console.warn('[restore] could not remove old transactions', e);
  }
}

/** Restore backup into the current family (local store + Firestore when live). */
export async function restoreBackupPayload(payload: BackupPayload): Promise<void> {
  const { groupId } = useStore.getState();
  if (isLiveFirebase() && db && groupId) {
    await restoreToFirestore(groupId, payload);
    return;
  }
  applyToLocalStore(payload);
}
