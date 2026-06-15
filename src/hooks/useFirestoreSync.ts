import { useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isLiveFirebase } from '../lib/appMode';
import { saveStoredCategoryOverrides } from '../lib/categoryOverridesStorage';
import { saveStoredIncomeSourceOverrides } from '../lib/incomeSourceOverridesStorage';
import { saveStoredHiddenCategories, saveStoredHiddenIncomeSources, saveStoredPlan } from '../lib/planStorage';
import { loadStoredGullakDeposits } from '../lib/gullakDepositsStorage';
import type { Plan } from '../lib/plan';
import { normalizeCategoryOverrides, type CategoryOverrides } from '../lib/categories';
import {
  normalizeIncomeSourceOverrides,
  type IncomeSourceOverrides,
} from '../lib/incomeSources';
import {
  useStore,
  type Category,
  type CategoryBudget,
  type Expense,
  type FamilyMember,
  type GullakDeposit,
  type Income,
  type IncomeSource,
  type Transfer,
} from '../store/useStore';

const DEFAULT_CATEGORY_BUDGETS: CategoryBudget[] = [
  { id: 'food',          budget: 8000 },
  { id: 'transport',     budget: 3000 },
  { id: 'shopping',      budget: 5000 },
  { id: 'health',        budget: 3000 },
  { id: 'entertainment', budget: 2000 },
  { id: 'utilities',     budget: 4000 },
  { id: 'education',     budget: 5000 },
  { id: 'home',          budget: 3000 },
  { id: 'other',         budget: 2000 },
  { id: 'telecom',       budget: 2000 },
];

/** "2026-05-01" 形式の当月1日 */
function currentMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * Sets up Firestore real-time listeners for the current groupId.
 * Queries are scoped to the current calendar month so the number of
 * Firestore reads stays constant regardless of how much historical data
 * has accumulated.
 *
 * Falls back silently to local-only mode when Firebase is not configured.
 */
export function useFirestoreSync(enabled = true) {
  const {
    groupId,
    setExpenses,
    setIncomes,
    setTransfers,
    setCategoryBudgets,
    setMembers,
    setCategoryOverrides,
    setIncomeSourceOverrides,
    setGullakDeposits,
    setSyncStatus,
  } = useStore();

  // Re-subscribe automatically when the calendar month rolls over.
  const monthStart = useMemo(() => currentMonthStart(), [
    // Recompute key once per calendar month (YYYY-MM string).
    new Date().toISOString().slice(0, 7),
  ]);

  useEffect(() => {
    if (!enabled || !isLiveFirebase() || !db || !groupId) {
      if (!isLiveFirebase()) setSyncStatus('offline');
      return;
    }

    setSyncStatus('connecting');

    const unsubscribers: Array<() => void> = [];
    const groupBase = `groups/${groupId}`;

    const categoryBudgetsCol = collection(db, `${groupBase}/categoryBudgets`);
    const legacyEnvelopesCol = collection(db, `${groupBase}/envelopes`);

    // Seed category budgets; migrate legacy envelopes collection if present.
    getDocs(categoryBudgetsCol).then(async (snap) => {
      if (!snap.empty) return;
      const legacy = await getDocs(legacyEnvelopesCol);
      if (!legacy.empty) {
        legacy.docs.forEach((d) => {
          setDoc(doc(db!, `${groupBase}/categoryBudgets/${d.id}`), d.data());
        });
        return;
      }
      DEFAULT_CATEGORY_BUDGETS.forEach((b) => {
        setDoc(doc(db!, `${groupBase}/categoryBudgets/${b.id}`), { budget: b.budget });
      });
    });

    // Prime local store with full history once; live listeners below keep the
    // current month fresh without wiping older months on month rollover.
    void Promise.all([
      getDocs(query(collection(db, `${groupBase}/expenses`), orderBy('date', 'desc'))),
      getDocs(query(collection(db, `${groupBase}/incomes`), orderBy('date', 'desc'))),
      getDocs(query(collection(db, `${groupBase}/transfers`), orderBy('date', 'desc'))),
    ])
      .then(([expenseSnap, incomeSnap, transferSnap]) => {
        const expenses: Expense[] = expenseSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            category: data.category,
            amount: data.amount,
            note: data.note,
            date: data.date,
            memberId: data.memberId,
          };
        });

        const incomes: Income[] = incomeSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            source: data.source,
            amount: data.amount,
            note: data.note,
            date: data.date,
            memberId: data.memberId,
          };
        });

        const transfers: Transfer[] = transferSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            fromMemberId: data.fromMemberId,
            toMemberId: data.toMemberId,
            amount: data.amount,
            note: data.note,
            date: data.date,
          };
        });

        setExpenses(expenses);
        setIncomes(incomes);
        setTransfers(transfers);
      })
      .catch((err) => console.warn('[sync] initial history load failed', err));

    // --- expenses（当月分のみ） ---
    const expQuery = query(
      collection(db, `${groupBase}/expenses`),
      where('date', '>=', monthStart),
      orderBy('date', 'desc'),
    );
    unsubscribers.push(
      onSnapshot(
        expQuery,
        (snap) => {
          const monthExpenses: Expense[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id:       d.id,
              category: data.category,
              amount:   data.amount,
              note:     data.note,
              date:     data.date,
              memberId: data.memberId,
            };
          });
          const monthIds = new Set(monthExpenses.map((expense) => expense.id));
          const olderExpenses = useStore
            .getState()
            .expenses.filter((expense) => !monthIds.has(expense.id) && expense.date < monthStart);
          setExpenses([...monthExpenses, ...olderExpenses].sort((a, b) => b.date.localeCompare(a.date)));
          setSyncStatus('live');
        },
        () => setSyncStatus('offline'),
      ),
    );

    // --- incomes（当月分のみ） ---
    const incQuery = query(
      collection(db, `${groupBase}/incomes`),
      where('date', '>=', monthStart),
      orderBy('date', 'desc'),
    );
    unsubscribers.push(
      onSnapshot(incQuery, (snap) => {
        const monthIncomes: Income[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id:       d.id,
            source:   data.source,
            amount:   data.amount,
            note:     data.note,
            date:     data.date,
            memberId: data.memberId,
          };
        });
        const monthIds = new Set(monthIncomes.map((income) => income.id));
        const olderIncomes = useStore
          .getState()
          .incomes.filter((income) => !monthIds.has(income.id) && income.date < monthStart);
        setIncomes([...monthIncomes, ...olderIncomes].sort((a, b) => b.date.localeCompare(a.date)));
      }),
    );

    // --- transfers（当月分のみ） ---
    const trQuery = query(
      collection(db, `${groupBase}/transfers`),
      where('date', '>=', monthStart),
      orderBy('date', 'desc'),
    );
    unsubscribers.push(
      onSnapshot(trQuery, (snap) => {
        const monthTransfers: Transfer[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            fromMemberId: data.fromMemberId,
            toMemberId: data.toMemberId,
            amount: data.amount,
            note: data.note,
            date: data.date,
          };
        });
        const monthIds = new Set(monthTransfers.map((transfer) => transfer.id));
        const olderTransfers = useStore
          .getState()
          .transfers.filter((transfer) => !monthIds.has(transfer.id) && transfer.date < monthStart);
        setTransfers([...monthTransfers, ...olderTransfers].sort((a, b) => b.date.localeCompare(a.date)));
      }),
    );

    // --- gullak deposits（全件 — 累計残高用） ---
    unsubscribers.push(
      onSnapshot(
        collection(db, `${groupBase}/gullakDeposits`),
        (snap) => {
          // Offline cache can briefly report empty — don't wipe local deposits.
          if (snap.empty && snap.metadata.fromCache) return;

          const remote: GullakDeposit[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              amount: data.amount as number,
              date: data.date as string,
              memberId: data.memberId as string,
            };
          });

          const remoteIds = new Set(remote.map((d) => d.id));
          const localOnly = loadStoredGullakDeposits().filter(
            (d) => !remoteIds.has(d.id),
          );
          const gullakDeposits = [...remote, ...localOnly].sort((a, b) =>
            b.date.localeCompare(a.date),
          );

          setGullakDeposits(gullakDeposits);
        },
        (err) => console.warn('[sync] gullakDeposits listener error', err),
      ),
    );

    // --- category budgets（全件・10件固定なので常に軽量） ---
    unsubscribers.push(
      onSnapshot(categoryBudgetsCol, (snap) => {
        if (!snap.empty) {
          const categoryBudgets: CategoryBudget[] = snap.docs.map((d) => ({
            id:     d.id as CategoryBudget['id'],
            budget: d.data().budget as number,
          }));
          setCategoryBudgets(categoryBudgets);
        }
      }),
    );

    // --- members ---
    unsubscribers.push(
      onSnapshot(collection(db, `${groupBase}/members`), (snap) => {
        const members: FamilyMember[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            avatar: data.avatar,
            role: data.role,
            color: data.color,
          };
        });
        setMembers(members);
      }),
    );

    // --- group settings (plan, categories, hidden) ---
    unsubscribers.push(
      onSnapshot(doc(db, `${groupBase}/settings/main`), (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        if (data.plan === 'plus' || data.plan === 'free') {
          const plan = data.plan as Plan;
          useStore.setState({ plan });
          saveStoredPlan(plan);
        }

        const raw = data.categoryOverrides;
        if (raw && typeof raw === 'object') {
          const categoryOverrides = normalizeCategoryOverrides(raw as CategoryOverrides);
          setCategoryOverrides(categoryOverrides);
          saveStoredCategoryOverrides(categoryOverrides);
        }

        if (Array.isArray(data.hiddenCategories)) {
          const hiddenCategories = data.hiddenCategories as Category[];
          useStore.setState({ hiddenCategories });
          saveStoredHiddenCategories(hiddenCategories);
        }

        if (Array.isArray(data.hiddenIncomeSources)) {
          const hiddenIncomeSources = data.hiddenIncomeSources as IncomeSource[];
          useStore.setState({ hiddenIncomeSources });
          saveStoredHiddenIncomeSources(hiddenIncomeSources);
        }

        const rawIncome = data.incomeSourceOverrides;
        if (rawIncome && typeof rawIncome === 'object') {
          const incomeSourceOverrides = normalizeIncomeSourceOverrides(
            rawIncome as IncomeSourceOverrides,
          );
          setIncomeSourceOverrides(incomeSourceOverrides);
          saveStoredIncomeSourceOverrides(incomeSourceOverrides);
        }
      }),
    );

    return () => unsubscribers.forEach((u) => u());
  }, [groupId, monthStart, enabled]);
}
