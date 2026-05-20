import { create } from 'zustand';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';

export type Category =
  | 'food' | 'transport' | 'shopping' | 'health' | 'entertainment'
  | 'bills' | 'education' | 'home' | 'travel' | 'other';

export type IncomeSource =
  | 'salary' | 'freelance' | 'business' | 'gift' | 'rent' | 'other_income';

export interface Expense {
  id: string;
  category: Category;
  amount: number;
  note: string;
  date: string;
  memberId: string;
}

export interface Income {
  id: string;
  source: IncomeSource;
  amount: number;
  note: string;
  date: string;
  memberId: string;
}

export interface Envelope {
  id: Category;
  budget: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'adult' | 'child';
  color: string;
}

export type SyncStatus = 'offline' | 'connecting' | 'live';

interface AppState {
  // ── sync ──────────────────────────────────────────────────────
  groupId: string;
  syncStatus: SyncStatus;
  setSyncStatus: (s: SyncStatus) => void;

  // ── navigation ────────────────────────────────────────────────
  currentTab: string;
  setTab: (tab: string) => void;

  // ── settings ──────────────────────────────────────────────────
  isPremium: boolean;
  language: 'en' | 'hi';
  toggleLanguage: () => void;

  // ── expenses ──────────────────────────────────────────────────
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (e: Omit<Expense, 'id' | 'date'>) => void;

  // ── incomes ───────────────────────────────────────────────────
  incomes: Income[];
  setIncomes: (incomes: Income[]) => void;
  addIncome: (i: Omit<Income, 'id' | 'date'>) => void;

  // ── envelopes ─────────────────────────────────────────────────
  envelopes: Envelope[];
  setEnvelopes: (envelopes: Envelope[]) => void;
  updateEnvelopeBudget: (id: Category, budget: number) => void;

  // ── members ───────────────────────────────────────────────────
  members: FamilyMember[];
  activeMemberId: string;
  setActiveMember: (id: string) => void;
}

// ── local seed data (used when Firebase is NOT configured) ────────────────

const initialExpenses: Expense[] = [
  { id: '1',  category: 'food',          amount: 450,  note: 'Lunch at office',     date: '2026-05-20', memberId: 'm1' },
  { id: '2',  category: 'transport',     amount: 120,  note: 'Auto rickshaw',        date: '2026-05-20', memberId: 'm1' },
  { id: '3',  category: 'shopping',      amount: 1200, note: 'New shirt',            date: '2026-05-19', memberId: 'm2' },
  { id: '4',  category: 'food',          amount: 380,  note: 'Groceries',            date: '2026-05-19', memberId: 'm2' },
  { id: '5',  category: 'bills',         amount: 850,  note: 'Electricity bill',     date: '2026-05-18', memberId: 'm1' },
  { id: '6',  category: 'entertainment', amount: 499,  note: 'Netflix subscription', date: '2026-05-17', memberId: 'm2' },
  { id: '7',  category: 'health',        amount: 600,  note: 'Medicine',             date: '2026-05-16', memberId: 'm3' },
  { id: '8',  category: 'education',     amount: 2500, note: 'Tuition fee',          date: '2026-05-15', memberId: 'm3' },
  { id: '9',  category: 'food',          amount: 250,  note: 'Chai & snacks',        date: '2026-05-15', memberId: 'm1' },
  { id: '10', category: 'transport',     amount: 200,  note: 'Petrol',               date: '2026-05-14', memberId: 'm2' },
  { id: '11', category: 'home',          amount: 800,  note: 'Vegetables & fruits',  date: '2026-05-13', memberId: 'm1' },
  { id: '12', category: 'travel',        amount: 3200, note: 'Train ticket',         date: '2026-05-12', memberId: 'm1' },
  { id: '13', category: 'food',          amount: 320,  note: 'Dinner out',           date: '2026-05-11', memberId: 'm2' },
  { id: '14', category: 'shopping',      amount: 2200, note: 'Kurta for festival',   date: '2026-05-10', memberId: 'm1' },
  { id: '15', category: 'health',        amount: 400,  note: 'Doctor visit',         date: '2026-05-09', memberId: 'm3' },
];

const initialIncomes: Income[] = [
  { id: 'i1', source: 'salary',    amount: 45000, note: 'May salary',     date: '2026-05-01', memberId: 'm1' },
  { id: 'i2', source: 'salary',    amount: 32000, note: 'May salary',     date: '2026-05-01', memberId: 'm2' },
  { id: 'i3', source: 'freelance', amount: 8500,  note: 'Design project', date: '2026-05-08', memberId: 'm2' },
  { id: 'i4', source: 'gift',      amount: 2000,  note: 'Birthday gift',  date: '2026-05-12', memberId: 'm3' },
];

const initialEnvelopes: Envelope[] = [
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

// ── store ─────────────────────────────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  // ── sync ──────────────────────────────────────────────────────
  groupId: 'family-default',
  syncStatus: isFirebaseConfigured ? 'connecting' : 'offline',
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  // ── navigation ────────────────────────────────────────────────
  currentTab: 'home',
  setTab: (tab) => set({ currentTab: tab }),

  // ── settings ──────────────────────────────────────────────────
  isPremium: false,
  language: 'en',
  toggleLanguage: () => set((s) => ({ language: s.language === 'en' ? 'hi' : 'en' })),

  // ── expenses ──────────────────────────────────────────────────
  expenses: isFirebaseConfigured ? [] : initialExpenses,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (e) => {
    const today = new Date().toISOString().slice(0, 10);
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      addDoc(collection(db, `groups/${groupId}/expenses`), {
        ...e,
        date:      today,
        createdAt: serverTimestamp(),
      });
    } else {
      set((s) => ({
        expenses: [
          { ...e, id: Date.now().toString(), date: today },
          ...s.expenses,
        ],
      }));
    }
  },

  // ── incomes ───────────────────────────────────────────────────
  incomes: isFirebaseConfigured ? [] : initialIncomes,
  setIncomes: (incomes) => set({ incomes }),
  addIncome: (i) => {
    const today = new Date().toISOString().slice(0, 10);
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      addDoc(collection(db, `groups/${groupId}/incomes`), {
        ...i,
        date:      today,
        createdAt: serverTimestamp(),
      });
    } else {
      set((s) => ({
        incomes: [
          { ...i, id: 'inc_' + Date.now(), date: today },
          ...s.incomes,
        ],
      }));
    }
  },

  // ── envelopes ─────────────────────────────────────────────────
  envelopes: initialEnvelopes,
  setEnvelopes: (envelopes) => set({ envelopes }),
  updateEnvelopeBudget: (id, budget) => {
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      setDoc(
        doc(db, `groups/${groupId}/envelopes/${id}`),
        { budget },
        { merge: true },
      );
    } else {
      set((s) => ({
        envelopes: s.envelopes.map((e) => (e.id === id ? { ...e, budget } : e)),
      }));
    }
  },

  // ── members ───────────────────────────────────────────────────
  members: [
    { id: 'm1', name: 'Rahul', avatar: 'R', role: 'owner', color: '#f97316' },
    { id: 'm2', name: 'Priya', avatar: 'P', role: 'adult', color: '#8b5cf6' },
    { id: 'm3', name: 'Arjun', avatar: 'A', role: 'child', color: '#22c55e' },
  ],
  activeMemberId: 'm1',
  setActiveMember: (id) => set({ activeMemberId: id }),
}));
