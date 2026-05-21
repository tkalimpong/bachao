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
import { isFirebaseConfigured, db } from '../lib/firebase';
import {
  canEditMemberRole,
  canManageMembers,
  type MemberRole,
} from '../lib/permissions';
import { seedExpenses, seedIncomes, seedTransfers } from '../lib/seedData';

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

export interface CategoryBudget {
  id: Category;
  budget: number;
}

export type HistoryView = 'history' | 'category';

/** Where to return when cancelling Add from Category tab */
export type AddReturnContext = {
  tab: string;
  historyView?: HistoryView;
  categoryExpandCategory?: Category;
  historyNavigateMonth?: string;
};

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
  /** 次のタブ表示で save した scrollTop を復元（戻る・キャンセル用） */
  restoreScrollTab: string | null;
  tabScrollTops: Partial<Record<string, number>>;
  saveTabScrollTop: (tab: string, top: number) => void;
  requestRestoreScroll: (tab: string) => void;
  historyNavigateMonth: string | null;
  setHistoryNavigateMonth: (month: string | null) => void;
  historyView: HistoryView;
  setHistoryView: (view: HistoryView) => void;
  categoryExpandCategory: Category | null;
  setCategoryExpandCategory: (category: Category | null) => void;
  /** History でカテゴリへ scrollIntoView するまで App の scroll リセットを抑止 */
  categoryScrollTarget: Category | null;
  setCategoryScrollTarget: (category: Category | null) => void;
  addPrefillCategory: Category | null;
  addReturnContext: AddReturnContext | null;
  /** Bumps when opening Add so the screen remounts and scroll resets */
  addNavigationKey: number;
  openAddExpenseFromCategory: (category: Category, selectedMonth: string) => void;
  clearAddPrefill: () => void;
  clearAddNavigation: () => void;

  /** EditTransactionSheet / TransferSheet など */
  uiOverlayDepth: number;
  pushUiOverlay: () => void;
  popUiOverlay: () => void;

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

  // ── category budgets (monthly limits per expense category) ────
  categoryBudgets: CategoryBudget[];
  setCategoryBudgets: (budgets: CategoryBudget[]) => void;
  updateCategoryBudget: (id: Category, budget: number) => void;

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

const initialExpenses: Expense[] = seedExpenses;

const initialIncomes: Income[] = seedIncomes;

const initialTransfers: Transfer[] = seedTransfers;

const initialCategoryBudgets: CategoryBudget[] = [
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

function captureCurrentTabScroll() {
  const { currentTab, saveTabScrollTop } = useStore.getState();
  const el = document.querySelector<HTMLElement>('[data-main-scroll]');
  if (el) saveTabScrollTop(currentTab, el.scrollTop);
}

export const useStore = create<AppState>((set, get) => ({
  // ── sync ──────────────────────────────────────────────────────
  groupId: 'family-default',
  syncStatus: isFirebaseConfigured ? 'connecting' : 'offline',
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  // ── navigation ────────────────────────────────────────────────
  currentTab: 'home',
  addMode: 'expense',
  setTab: (tab, addMode) => {
    const { currentTab } = get();
    if (tab !== currentTab) captureCurrentTabScroll();
    set(addMode !== undefined ? { currentTab: tab, addMode } : { currentTab: tab });
  },
  restoreScrollTab: null,
  tabScrollTops: {},
  saveTabScrollTop: (tab, top) =>
    set((s) => ({ tabScrollTops: { ...s.tabScrollTops, [tab]: top } })),
  requestRestoreScroll: (tab) => set({ restoreScrollTab: tab }),
  historyNavigateMonth: null,
  setHistoryNavigateMonth: (historyNavigateMonth) => set({ historyNavigateMonth }),
  historyView: 'history',
  setHistoryView: (historyView) => set({ historyView }),
  categoryExpandCategory: null,
  setCategoryExpandCategory: (categoryExpandCategory) => set({ categoryExpandCategory }),
  categoryScrollTarget: null,
  setCategoryScrollTarget: (categoryScrollTarget) => set({ categoryScrollTarget }),
  addPrefillCategory: null,
  addReturnContext: null,
  addNavigationKey: 0,
  openAddExpenseFromCategory: (category, selectedMonth) => {
    captureCurrentTabScroll();
    set((s) => ({
      addPrefillCategory: category,
      addReturnContext: {
        tab: 'history',
        historyView: 'category',
        categoryExpandCategory: category,
        historyNavigateMonth: selectedMonth,
      },
      // 戻るときだけ展開（ここで set すると Category の scrollIntoView が先に走る）
      categoryExpandCategory: null,
      currentTab: 'add',
      addMode: 'expense',
      addNavigationKey: s.addNavigationKey + 1,
    }));
  },
  clearAddPrefill: () => set({ addPrefillCategory: null }),
  clearAddNavigation: () => set({ addPrefillCategory: null, addReturnContext: null }),
  uiOverlayDepth: 0,
  pushUiOverlay: () => set((s) => ({ uiOverlayDepth: s.uiOverlayDepth + 1 })),
  popUiOverlay: () => set((s) => ({ uiOverlayDepth: Math.max(0, s.uiOverlayDepth - 1) })),

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

  // ── category budgets ──────────────────────────────────────────
  categoryBudgets: initialCategoryBudgets,
  setCategoryBudgets: (categoryBudgets) => set({ categoryBudgets }),

  updateCategoryBudget: (id, budget) => {
    if (isFirebaseConfigured && db) {
      const { groupId } = get();
      setDoc(
        doc(db, `groups/${groupId}/categoryBudgets/${id}`),
        { budget },
        { merge: true },
      );
    } else {
      set((s) => ({
        categoryBudgets: s.categoryBudgets.map((e) => (e.id === id ? { ...e, budget } : e)),
      }));
    }
  },

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
