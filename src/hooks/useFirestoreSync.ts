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
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  useStore,
  type CategoryBudget,
  type Expense,
  type FamilyMember,
  type Income,
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
    setSyncStatus,
  } = useStore();

  // Re-subscribe automatically when the calendar month rolls over.
  const monthStart = useMemo(() => currentMonthStart(), [
    // Recompute key once per calendar month (YYYY-MM string).
    new Date().toISOString().slice(0, 7),
  ]);

  useEffect(() => {
    if (!enabled || !isFirebaseConfigured || !db || !groupId) {
      if (!isFirebaseConfigured) setSyncStatus('offline');
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
          const expenses: Expense[] = snap.docs.map((d) => {
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
          setExpenses(expenses);
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
        const incomes: Income[] = snap.docs.map((d) => {
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
        setIncomes(incomes);
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
        const transfers: Transfer[] = snap.docs.map((d) => {
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
        setTransfers(transfers);
      }),
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

    return () => unsubscribers.forEach((u) => u());
  }, [groupId, monthStart, enabled]);
}
