import { create } from 'zustand';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  canEditMemberRole,
  canManageMembers,
  type MemberRole,
} from '../lib/permissions';

export type Category =
  | 'food' | 'transport' | 'shopping' | 'health' | 'entertainment'
  | 'utilities' | 'education' | 'home' | 'other' | 'telecom';

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

export interface Transfer {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  note: string;
  date: string;
}

export interface Envelope {
  id: Category;
  budget: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: MemberRole;
  color: string;
}

export type SyncStatus = 'offline' | 'connecting' | 'live';
export type { MemberRole } from '../lib/permissions';

interface AppState {
  // ── sync ──────────────────────────────────────────────────────
  groupId: string;
  syncStatus: SyncStatus;
  setSyncStatus: (s: SyncStatus) => void;

  // ── navigation ────────────────────────────────────────────────
  currentTab: string;
  addMode: 'expense' | 'income';
  setTab: (tab: string, addMode?: 'expense' | 'income') => void;
  historyNavigateMonth: string | null;
  setHistoryNavigateMonth: (month: string | null) => void;

  // ── settings ──────────────────────────────────────────────────
  isPremium: boolean;
  language: 'en' | 'hi';
  toggleLanguage: () => void;
  categoryOverrides: Partial<Record<Category, { icon: string; en: string; hi: string }>>;
  setCategoryOverride: (id: Category, data: { icon: string; en: string; hi: string }) => void;
  resetCategoryOverride: (id: Category) => void;

  // ── expenses ──────────────────────────────────────────────────
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (id: string) => void;

  // ── incomes ───────────────────────────────────────────────────
  incomes: Income[];
  setIncomes: (incomes: Income[]) => void;
  addIncome: (i: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, data: Partial<Omit<Income, 'id'>>) => void;
  deleteIncome: (id: string) => void;

  // ── transfers (member-to-member, not family income/expense) ───
  transfers: Transfer[];
  setTransfers: (transfers: Transfer[]) => void;
  addTransfer: (t: Omit<Transfer, 'id'>) => void;
  updateTransfer: (id: string, data: Partial<Omit<Transfer, 'id'>>) => void;
  deleteTransfer: (id: string) => void;

  // ── envelopes ─────────────────────────────────────────────────
  envelopes: Envelope[];
  setEnvelopes: (envelopes: Envelope[]) => void;
  updateEnvelopeBudget: (id: Category, budget: number) => void;

  // ── allocation rules (% per category for auto-split) ──────────
  allocationRules: Record<Category, number>;
  setAllocationRule: (id: Category, pct: number) => void;

  // ── members ───────────────────────────────────────────────────
  members: FamilyMember[];
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  activeMemberId: string;
  setActiveMember: (id: string) => void;
  updateMemberRole: (id: string, role: 'partner' | 'helper') => void;
  removeMember: (id: string) => void;
}

// ── local seed data (used when Firebase is NOT configured) ────────────────

const initialExpenses: Expense[] = [
  { id: '1',  category: 'food',          amount: 450,  note: 'Lunch at office',     date: '2026-05-20', memberId: 'm1' },
  { id: '2',  category: 'transport',     amount: 120,  note: 'Auto rickshaw',        date: '2026-05-20', memberId: 'm1' },
  { id: '3',  category: 'shopping',      amount: 1200, note: 'New shirt',            date: '2026-05-19', memberId: 'm2' },
  { id: '4',  category: 'food',          amount: 380,  note: 'Groceries',            date: '2026-05-19', memberId: 'm2' },
  { id: '5',  category: 'utilities',     amount: 850,  note: 'Electricity bill',     date: '2026-05-18', memberId: 'm1' },
  { id: '6',  category: 'entertainment', amount: 499,  note: 'Netflix subscription', date: '2026-05-17', memberId: 'm2' },
  { id: '7',  category: 'health',        amount: 600,  note: 'Medicine',             date: '2026-05-16', memberId: 'm3' },
  { id: '8',  category: 'education',     amount: 2500, note: 'Tuition fee',          date: '2026-05-15', memberId: 'm3' },
  { id: '9',  category: 'food',          amount: 250,  note: 'Chai & snacks',        date: '2026-05-15', memberId: 'm1' },
  { id: '10', category: 'transport',     amount: 200,  note: 'Petrol',               date: '2026-05-14', memberId: 'm2' },
  { id: '11', category: 'home',          amount: 800,  note: 'Vegetables & fruits',  date: '2026-05-13', memberId: 'm1' },
  { id: '12', category: 'other',         amount: 3200, note: 'Miscellaneous',         date: '2026-05-12', memberId: 'm1' },
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

const initialTransfers: Transfer[] = [
  {
    id: 't1',
    fromMemberId: 'm1',
    toMemberId: 'm3',
    amount: 1500,
    note: 'Pocket money',
    date: '2026-05-14',
  },
];

const initialEnvelopes: Envelope[] = [
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

// ── store ─────────────────────────────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  // ── sync ──────────────────────────────────────────────────────
  groupId: 'family-default',
  syncStatus: isFirebaseConfigured ? 'connecting' : 'offline',
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  // ── navigation ────────────────────────────────────────────────
  currentTab: 'home',
  addMode: 'expense',
  setTab: (tab, addMode) =>
    set(addMode !== undefined ? { currentTab: tab, addMode } : { currentTab: tab }),
  historyNavigateMonth: null,
  setHistoryNavigateMonth: (historyNavigateMonth) => set({ historyNavigateMonth }),

  // ── settings ──────────────────────────────────────────────────
  isPremium: false,
  language: 'en',
  toggleLanguage: () => set((s) => ({ language: s.language === 'en' ? 'hi' : 'en' })),
  categoryOverrides: {},
  setCategoryOverride: (id, data) =>
    set((s) => ({ categoryOverrides: { ...s.categoryOverrides, [id]: data } })),
  resetCategoryOverride: (id) =>
    set((s) => {
      const next = { ...s.categoryOverrides };
      delete next[id];
      return { categoryOverrides: next };
    }),

  // ── expenses ──────────────────────────────────────────────────
  expenses: isFirebaseConfigured ? [] : initialExpenses,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (e) => {
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      addDoc(collection(db, `groups/${groupId}/expenses`), {
        ...e,
        createdAt: serverTimestamp(),
      });
    } else {
      set((s) => ({
        expenses: [
          { ...e, id: Date.now().toString() },
          ...s.expenses,
        ],
      }));
    }
  },

  updateExpense: (id, data) => {
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      updateDoc(doc(db, `groups/${groupId}/expenses/${id}`), data);
    } else {
      set((s) => ({
        expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)),
      }));
    }
  },
  deleteExpense: (id) => {
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      deleteDoc(doc(db, `groups/${groupId}/expenses/${id}`));
    } else {
      set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
    }
  },

  // ── incomes ───────────────────────────────────────────────────
  incomes: isFirebaseConfigured ? [] : initialIncomes,
  setIncomes: (incomes) => set({ incomes }),
  addIncome: (i) => {
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      addDoc(collection(db, `groups/${groupId}/incomes`), {
        ...i,
        createdAt: serverTimestamp(),
      });
    } else {
      set((s) => ({
        incomes: [
          { ...i, id: 'inc_' + Date.now() },
          ...s.incomes,
        ],
      }));
    }
  },

  updateIncome: (id, data) => {
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      updateDoc(doc(db, `groups/${groupId}/incomes/${id}`), data);
    } else {
      set((s) => ({
        incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...data } : i)),
      }));
    }
  },
  deleteIncome: (id) => {
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      deleteDoc(doc(db, `groups/${groupId}/incomes/${id}`));
    } else {
      set((s) => ({ incomes: s.incomes.filter((i) => i.id !== id) }));
    }
  },

  // ── transfers ─────────────────────────────────────────────────
  transfers: isFirebaseConfigured ? [] : initialTransfers,
  setTransfers: (transfers) => set({ transfers }),
  addTransfer: (t) => {
    if (t.fromMemberId === t.toMemberId) return;
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      addDoc(collection(db, `groups/${groupId}/transfers`), {
        ...t,
        createdAt: serverTimestamp(),
      });
    } else {
      set((s) => ({
        transfers: [{ ...t, id: 'tr_' + Date.now() }, ...s.transfers],
      }));
    }
  },
  updateTransfer: (id, data) => {
    if (data.fromMemberId && data.toMemberId && data.fromMemberId === data.toMemberId) return;
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      updateDoc(doc(db, `groups/${groupId}/transfers/${id}`), data);
    } else {
      set((s) => ({
        transfers: s.transfers.map((t) => (t.id === id ? { ...t, ...data } : t)),
      }));
    }
  },
  deleteTransfer: (id) => {
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      deleteDoc(doc(db, `groups/${groupId}/transfers/${id}`));
    } else {
      set((s) => ({ transfers: s.transfers.filter((t) => t.id !== id) }));
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

  // ── allocation rules ──────────────────────────────────────────
  allocationRules: {
    food:          25,
    transport:     10,
    shopping:      10,
    health:         8,
    entertainment:  5,
    utilities:     12,
    education:     10,
    home:          10,
    other:          5,
    telecom:        5,
  },
  setAllocationRule: (id, pct) =>
    set((s) => ({ allocationRules: { ...s.allocationRules, [id]: pct } })),

  // ── members ───────────────────────────────────────────────────
  members: [
    { id: 'm1', name: 'Rahul', avatar: 'R', role: 'owner', color: '#2563eb' },
    { id: 'm2', name: 'Priya', avatar: 'P', role: 'partner', color: '#8b5cf6' },
    { id: 'm3', name: 'Arjun', avatar: 'A', role: 'helper', color: '#22c55e' },
  ],
  currentUserId: 'm1',
  setCurrentUserId: (id) => {
    const member = get().members.find((m) => m.id === id);
    if (!member) return;
    set({ currentUserId: id, activeMemberId: id });
  },
  activeMemberId: 'm1',
  setActiveMember: (id) => set({ activeMemberId: id }),
  updateMemberRole: (id, role) => {
    const { members, currentUserId } = get();
    const me = members.find((m) => m.id === currentUserId);
    if (!me || !canEditMemberRole(me.role)) return;
    set((s) => ({
      members: s.members.map((m) =>
        m.id === id && m.role !== 'owner' ? { ...m, role } : m,
      ),
    }));
  },
  removeMember: (id) => {
    const { members, currentUserId } = get();
    const me = members.find((m) => m.id === currentUserId);
    const target = members.find((m) => m.id === id);
    if (!me || !canManageMembers(me.role) || !target || target.role === 'owner') return;
    if (members.length <= 1) return;
    set((s) => {
      const nextMembers = s.members.filter((m) => m.id !== id);
      const fallback = nextMembers[0]?.id ?? 'm1';
      return {
        members: nextMembers,
        currentUserId: s.currentUserId === id ? fallback : s.currentUserId,
        activeMemberId: s.activeMemberId === id ? fallback : s.activeMemberId,
      };
    });
  },
}));
