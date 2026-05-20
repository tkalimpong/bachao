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
import { useStore, type Envelope, type Expense, type Income } from '../store/useStore';

const DEFAULT_ENVELOPES: Envelope[] = [
  { id: 'food',          budget: 8000 },
  { id: 'transport',     budget: 3000 },
  { id: 'shopping',      budget: 5000 },
  { id: 'health',        budget: 3000 },
  { id: 'entertainment', budget: 2000 },
  { id: 'bills',         budget: 4000 },
  { id: 'education',     budget: 5000 },
  { id: 'home',          budget: 3000 },
  { id: 'travel',        budget: 5000 },
  { id: 'other',         budget: 2000 },
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
export function useFirestoreSync() {
  const { groupId, setExpenses, setIncomes, setEnvelopes, setSyncStatus } = useStore();

  // Re-subscribe automatically when the calendar month rolls over.
  const monthStart = useMemo(() => currentMonthStart(), [
    // Recompute key once per calendar month (YYYY-MM string).
    new Date().toISOString().slice(0, 7),
  ]);

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('connecting');

    const unsubscribers: Array<() => void> = [];
    const groupBase = `groups/${groupId}`;

    // Seed default envelopes the very first time a group is used.
    const envelopesCol = collection(db, `${groupBase}/envelopes`);
    getDocs(envelopesCol).then((snap) => {
      if (snap.empty) {
        DEFAULT_ENVELOPES.forEach((env) => {
          setDoc(doc(db!, `${groupBase}/envelopes/${env.id}`), { budget: env.budget });
        });
      }
    });

    // --- expenses（当月分のみ） ---
    // where + orderBy が同一フィールド（date）なので複合インデックス不要。
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

    // --- envelopes（全件・10件固定なので常に軽量） ---
    unsubscribers.push(
      onSnapshot(envelopesCol, (snap) => {
        if (!snap.empty) {
          const envelopes: Envelope[] = snap.docs.map((d) => ({
            id:     d.id as Envelope['id'],
            budget: d.data().budget as number,
          }));
          setEnvelopes(envelopes);
        }
      }),
    );

    return () => unsubscribers.forEach((u) => u());
  }, [groupId, monthStart]);
}
