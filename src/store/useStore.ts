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
import { isLiveFirebase } from '../lib/appMode';
import {
  loadStoredCategoryOverrides,
  saveStoredCategoryOverrides,
} from '../lib/categoryOverridesStorage';
import { db } from '../lib/firebase';
import {
  canEditMemberRole,
  canManageMembers,
  canViewGroupFinances,
  getMemberRole,
  type MemberRole,
} from '../lib/permissions';
import type { Plan } from '../lib/plan';
import {
  loadStoredHiddenCategories,
  loadStoredHiddenIncomeSources,
  loadStoredPlan,
  saveStoredHiddenCategories,
  saveStoredHiddenIncomeSources,
  saveStoredPlan,
} from '../lib/planStorage';
import type { CategoryOverride } from '../lib/categories';
import type { IncomeSourceOverride } from '../lib/incomeSources';
import {
  loadStoredIncomeSourceOverrides,
  saveStoredIncomeSourceOverrides,
} from '../lib/incomeSourceOverridesStorage';
import {
  loadStoredGullakDeposits,
  saveStoredGullakDeposits,
} from '../lib/gullakDepositsStorage';
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

export interface GullakDeposit {
  id: string;
  amount: number;
  date: string;
  memberId: string;
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
  setGroupId: (groupId: string) => void;

  // ── navigation ────────────────────────────────────────────────
  currentTab: string;
  /** Previous tabs for back navigation (sub-screens). */
  navStack: string[];
  addMode: 'expense' | 'income';
  setTab: (tab: string, addMode?: 'expense' | 'income') => void;
  popTab: () => boolean;
  cancelAddNavigation: () => void;
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
  plan: Plan;
  setPlan: (plan: Plan) => void;
  language: 'en' | 'hi';
  toggleLanguage: () => void;
  categoryOverrides: Partial<Record<Category, CategoryOverride>>;
  setCategoryOverrides: (overrides: Partial<Record<Category, CategoryOverride>>) => void;
  setCategoryOverride: (id: Category, data: CategoryOverride) => void;
  resetCategoryOverride: (id: Category) => void;
  hiddenCategories: Category[];
  setCategoryHidden: (id: Category, hidden: boolean) => void;
  hiddenIncomeSources: IncomeSource[];
  setIncomeSourceHidden: (id: IncomeSource, hidden: boolean) => void;
  incomeSourceOverrides: Partial<Record<IncomeSource, IncomeSourceOverride>>;
  setIncomeSourceOverrides: (overrides: Partial<Record<IncomeSource, IncomeSourceOverride>>) => void;
  setIncomeSourceOverride: (id: IncomeSource, data: IncomeSourceOverride) => void;
  resetIncomeSourceOverride: (id: IncomeSource) => void;

  // ── gullak (physical savings tracking) ────────────────────────
  gullakDeposits: GullakDeposit[];
  setGullakDeposits: (deposits: GullakDeposit[]) => void;
  addGullakDeposit: (d: Omit<GullakDeposit, 'id'>) => void;
  /** Remove deposits for memberIds (null = entire family). */
  clearGullakDeposits: (memberIds: string[] | null) => void;
  gullakPrefillAmount: number | null;
  setGullakPrefillAmount: (amount: number | null) => void;
  clearGullakPrefill: () => void;

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
  setMembers: (members: FamilyMember[]) => void;
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

const ROOT_TABS = new Set(['home', 'settings', 'family', 'history']);

type GroupSettingsPatch = {
  plan?: Plan;
  categoryOverrides?: Partial<Record<Category, CategoryOverride>>;
  hiddenCategories?: Category[];
  incomeSourceOverrides?: Partial<Record<IncomeSource, IncomeSourceOverride>>;
  hiddenIncomeSources?: IncomeSource[];
};

function persistGroupSettings(patch: GroupSettingsPatch) {
  const state = useStore.getState();
  const plan = patch.plan ?? state.plan;
  const categoryOverrides = patch.categoryOverrides ?? state.categoryOverrides;
  const hiddenCategories = patch.hiddenCategories ?? state.hiddenCategories;
  const incomeSourceOverrides = patch.incomeSourceOverrides ?? state.incomeSourceOverrides;
  const hiddenIncomeSources = patch.hiddenIncomeSources ?? state.hiddenIncomeSources;

  saveStoredPlan(plan);
  saveStoredCategoryOverrides(categoryOverrides);
  saveStoredHiddenCategories(hiddenCategories);
  saveStoredIncomeSourceOverrides(incomeSourceOverrides);
  saveStoredHiddenIncomeSources(hiddenIncomeSources);

  if (isLiveFirebase() && db) {
    const { groupId } = state;
    if (groupId) {
      setDoc(
        doc(db, `groups/${groupId}/settings/main`),
        { plan, categoryOverrides, hiddenCategories, incomeSourceOverrides, hiddenIncomeSources },
        { merge: true },
      );
    }
  }
}

export const useStore = create<AppState>((set, get) => ({
  // ── sync ──────────────────────────────────────────────────────
  groupId: isLiveFirebase() ? '' : 'family-default',
  syncStatus: isLiveFirebase() ? 'connecting' : 'offline',
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setGroupId: (groupId) => set({ groupId }),

  // ── navigation ────────────────────────────────────────────────
  currentTab: 'home',
  navStack: [],
  addMode: 'expense',
  setTab: (tab, addMode) => {
    const { currentTab, navStack } = get();
    if (tab === currentTab && addMode === undefined) return;
    if (tab !== currentTab) captureCurrentTabScroll();

    let nextStack = navStack;
    if (ROOT_TABS.has(tab)) {
      nextStack = [];
    } else if (tab !== currentTab) {
      nextStack = [...navStack, currentTab];
    }

    const patch: Partial<AppState> = { currentTab: tab, navStack: nextStack };
    if (addMode !== undefined) patch.addMode = addMode;
    set(patch);
  },
  popTab: () => {
    const { currentTab, navStack } = get();
    if (currentTab === 'add') {
      get().cancelAddNavigation();
      return true;
    }
    if (navStack.length === 0) return false;
    const prev = navStack[navStack.length - 1];
    get().requestRestoreScroll(prev);
    set({ currentTab: prev, navStack: navStack.slice(0, -1) });
    return true;
  },
  cancelAddNavigation: () => {
    const ctx = get().addReturnContext;
    get().clearAddNavigation();

    if (ctx) {
      if (ctx.historyView) get().setHistoryView(ctx.historyView);
      if (ctx.categoryExpandCategory) {
        get().setCategoryExpandCategory(ctx.categoryExpandCategory);
        get().setCategoryScrollTarget(ctx.categoryExpandCategory);
      }
      if (ctx.historyNavigateMonth) get().setHistoryNavigateMonth(ctx.historyNavigateMonth);
      get().requestRestoreScroll(ctx.tab);
      set((s) => ({
        currentTab: ctx.tab,
        navStack: s.navStack.slice(0, -1),
      }));
      return;
    }

    const { navStack, members, currentUserId } = get();
    const myRole = getMemberRole(members, currentUserId);
    const showGroup = myRole ? canViewGroupFinances(myRole) : true;

    if (navStack.length > 0) {
      const prev = navStack[navStack.length - 1];
      get().requestRestoreScroll(prev);
      set({ currentTab: prev, navStack: navStack.slice(0, -1) });
      return;
    }

    set({ currentTab: showGroup ? 'home' : 'history' });
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
      categoryExpandCategory: null,
      navStack: [...s.navStack, s.currentTab],
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
  plan: loadStoredPlan(),
  setPlan: (plan) => {
    persistGroupSettings({ plan });
    set({ plan });
  },
  language: 'en',
  toggleLanguage: () => set((s) => ({ language: s.language === 'en' ? 'hi' : 'en' })),
  categoryOverrides: loadStoredCategoryOverrides(),
  setCategoryOverrides: (categoryOverrides) => {
    saveStoredCategoryOverrides(categoryOverrides);
    set({ categoryOverrides });
  },
  setCategoryOverride: (id, data) =>
    set((s) => {
      const categoryOverrides = { ...s.categoryOverrides, [id]: data };
      persistGroupSettings({ categoryOverrides });
      return { categoryOverrides };
    }),
  resetCategoryOverride: (id) =>
    set((s) => {
      const next = { ...s.categoryOverrides };
      delete next[id];
      persistGroupSettings({ categoryOverrides: next });
      return { categoryOverrides: next };
    }),
  hiddenCategories: loadStoredHiddenCategories(),
  setCategoryHidden: (id, hidden) =>
    set((s) => {
      const hiddenCategories = hidden
        ? s.hiddenCategories.includes(id)
          ? s.hiddenCategories
          : [...s.hiddenCategories, id]
        : s.hiddenCategories.filter((c) => c !== id);
      persistGroupSettings({ hiddenCategories });
      return { hiddenCategories };
    }),
  hiddenIncomeSources: loadStoredHiddenIncomeSources(),
  setIncomeSourceHidden: (id, hidden) =>
    set((s) => {
      const hiddenIncomeSources = hidden
        ? s.hiddenIncomeSources.includes(id)
          ? s.hiddenIncomeSources
          : [...s.hiddenIncomeSources, id]
        : s.hiddenIncomeSources.filter((c) => c !== id);
      persistGroupSettings({ hiddenIncomeSources });
      return { hiddenIncomeSources };
    }),
  incomeSourceOverrides: loadStoredIncomeSourceOverrides(),
  setIncomeSourceOverrides: (incomeSourceOverrides) => {
    saveStoredIncomeSourceOverrides(incomeSourceOverrides);
    set({ incomeSourceOverrides });
  },
  setIncomeSourceOverride: (id, data) =>
    set((s) => {
      const incomeSourceOverrides = { ...s.incomeSourceOverrides, [id]: data };
      persistGroupSettings({ incomeSourceOverrides });
      return { incomeSourceOverrides };
    }),
  resetIncomeSourceOverride: (id) =>
    set((s) => {
      const next = { ...s.incomeSourceOverrides };
      delete next[id];
      persistGroupSettings({ incomeSourceOverrides: next });
      return { incomeSourceOverrides: next };
    }),

  // ── gullak ────────────────────────────────────────────────────
  gullakDeposits: loadStoredGullakDeposits(),
  setGullakDeposits: (gullakDeposits) => {
    saveStoredGullakDeposits(gullakDeposits);
    set({ gullakDeposits });
  },
  addGullakDeposit: (d) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `gk_${crypto.randomUUID()}`
        : `gk_${Date.now()}`;
    const deposit: GullakDeposit = { ...d, id };

    set((s) => {
      const gullakDeposits = [deposit, ...s.gullakDeposits];
      saveStoredGullakDeposits(gullakDeposits);
      return { gullakDeposits };
    });

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      if (!groupId) return;
      void setDoc(doc(db, `groups/${groupId}/gullakDeposits/${id}`), {
        amount: d.amount,
        date: d.date,
        memberId: d.memberId,
        createdAt: serverTimestamp(),
      }).catch((err) => {
        console.error('[gullak] Firestore save failed', err);
      });
    }
  },
  clearGullakDeposits: (memberIds) => {
    set((s) => {
      const toRemove = memberIds
        ? s.gullakDeposits.filter((d) => memberIds.includes(d.memberId))
        : [...s.gullakDeposits];
      const remaining = memberIds
        ? s.gullakDeposits.filter((d) => !memberIds.includes(d.memberId))
        : [];

      saveStoredGullakDeposits(remaining);

      if (isLiveFirebase() && db) {
        const { groupId } = get();
        if (groupId) {
          toRemove.forEach((d) => {
            void deleteDoc(doc(db!, `groups/${groupId}/gullakDeposits/${d.id}`)).catch(
              (err) => console.error('[gullak] Firestore delete failed', err),
            );
          });
        }
      }

      return { gullakDeposits: remaining };
    });
  },
  gullakPrefillAmount: null,
  setGullakPrefillAmount: (gullakPrefillAmount) => set({ gullakPrefillAmount }),
  clearGullakPrefill: () => set({ gullakPrefillAmount: null }),

  // ── expenses ──────────────────────────────────────────────────
  expenses: isLiveFirebase() ? [] : initialExpenses,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (e) => {
    const id = Date.now().toString();
    set((s) => ({
      expenses: [{ ...e, id }, ...s.expenses],
    }));

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      addDoc(collection(db, `groups/${groupId}/expenses`), {
        ...e,
        createdAt: serverTimestamp(),
      }).then((ref) => {
        set((s) => ({
          expenses: s.expenses.map((expense) => (expense.id === id ? { ...expense, id: ref.id } : expense)),
        }));
      }).catch(() => {
        set((s) => ({ expenses: s.expenses.filter((expense) => expense.id !== id) }));
      });
    }
  },

  updateExpense: (id, data) => {
    const previous = get().expenses.find((expense) => expense.id === id);
    if (!previous) return;

    set((s) => ({
      expenses: s.expenses.map((expense) => (expense.id === id ? { ...expense, ...data } : expense)),
    }));

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      updateDoc(doc(db, `groups/${groupId}/expenses/${id}`), data).catch(() => {
        set((s) => ({
          expenses: s.expenses.map((expense) => (expense.id === id ? previous : expense)),
        }));
      });
    }
  },
  deleteExpense: (id) => {
    const previous = get().expenses;
    set((s) => ({ expenses: s.expenses.filter((expense) => expense.id !== id) }));

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      deleteDoc(doc(db, `groups/${groupId}/expenses/${id}`)).catch(() => {
        set({ expenses: previous });
      });
    }
  },

  // ── incomes ───────────────────────────────────────────────────
  incomes: isLiveFirebase() ? [] : initialIncomes,
  setIncomes: (incomes) => set({ incomes }),
  addIncome: (i) => {
    const id = 'inc_' + Date.now();
    set((s) => ({
      incomes: [{ ...i, id }, ...s.incomes],
    }));

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      addDoc(collection(db, `groups/${groupId}/incomes`), {
        ...i,
        createdAt: serverTimestamp(),
      }).then((ref) => {
        set((s) => ({
          incomes: s.incomes.map((income) => (income.id === id ? { ...income, id: ref.id } : income)),
        }));
      }).catch(() => {
        set((s) => ({ incomes: s.incomes.filter((income) => income.id !== id) }));
      });
    }
  },

  updateIncome: (id, data) => {
    const previous = get().incomes.find((income) => income.id === id);
    if (!previous) return;

    set((s) => ({
      incomes: s.incomes.map((income) => (income.id === id ? { ...income, ...data } : income)),
    }));

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      updateDoc(doc(db, `groups/${groupId}/incomes/${id}`), data).catch(() => {
        set((s) => ({
          incomes: s.incomes.map((income) => (income.id === id ? previous : income)),
        }));
      });
    }
  },
  deleteIncome: (id) => {
    const previous = get().incomes;
    set((s) => ({ incomes: s.incomes.filter((income) => income.id !== id) }));

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      deleteDoc(doc(db, `groups/${groupId}/incomes/${id}`)).catch(() => {
        set({ incomes: previous });
      });
    }
  },

  // ── transfers ─────────────────────────────────────────────────
  transfers: isLiveFirebase() ? [] : initialTransfers,
  setTransfers: (transfers) => set({ transfers }),
  addTransfer: (t) => {
    if (t.fromMemberId === t.toMemberId) return;
    const id = 'tr_' + Date.now();
    set((s) => ({
      transfers: [{ ...t, id }, ...s.transfers],
    }));

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      addDoc(collection(db, `groups/${groupId}/transfers`), {
        ...t,
        createdAt: serverTimestamp(),
      }).then((ref) => {
        set((s) => ({
          transfers: s.transfers.map((transfer) => (transfer.id === id ? { ...transfer, id: ref.id } : transfer)),
        }));
      }).catch(() => {
        set((s) => ({ transfers: s.transfers.filter((transfer) => transfer.id !== id) }));
      });
    }
  },
  updateTransfer: (id, data) => {
    if (data.fromMemberId && data.toMemberId && data.fromMemberId === data.toMemberId) return;
    const previous = get().transfers.find((transfer) => transfer.id === id);
    if (!previous) return;

    set((s) => ({
      transfers: s.transfers.map((transfer) => (transfer.id === id ? { ...transfer, ...data } : transfer)),
    }));

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      updateDoc(doc(db, `groups/${groupId}/transfers/${id}`), data).catch(() => {
        set((s) => ({
          transfers: s.transfers.map((transfer) => (transfer.id === id ? previous : transfer)),
        }));
      });
    }
  },
  deleteTransfer: (id) => {
    const previous = get().transfers;
    set((s) => ({ transfers: s.transfers.filter((transfer) => transfer.id !== id) }));

    if (isLiveFirebase() && db) {
      const { groupId } = get();
      deleteDoc(doc(db, `groups/${groupId}/transfers/${id}`)).catch(() => {
        set({ transfers: previous });
      });
    }
  },

  // ── category budgets ──────────────────────────────────────────
  categoryBudgets: initialCategoryBudgets,
  setCategoryBudgets: (categoryBudgets) => set({ categoryBudgets }),

  updateCategoryBudget: (id, budget) => {
    if (isLiveFirebase() && db) {
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
  members: isLiveFirebase()
    ? []
    : [
        { id: 'm1', name: 'Rahul', avatar: 'R', role: 'owner', color: '#2563eb' },
        { id: 'm2', name: 'Priya', avatar: 'P', role: 'partner', color: '#8b5cf6' },
      ],
  setMembers: (members) => set({ members }),
  currentUserId: isLiveFirebase() ? '' : 'm1',
  setCurrentUserId: (id) => {
    if (isLiveFirebase()) {
      set({ currentUserId: id, activeMemberId: id });
      return;
    }
    const member = get().members.find((m) => m.id === id);
    if (!member) return;
    set({ currentUserId: id, activeMemberId: id });
  },
  activeMemberId: isLiveFirebase() ? '' : 'm1',
  setActiveMember: (id) => set({ activeMemberId: id }),
  updateMemberRole: (id, role) => {
    const { members, currentUserId, groupId, plan } = get();
    const me = members.find((m) => m.id === currentUserId);
    if (!me || !canEditMemberRole(me.role, plan)) return;
    if (isLiveFirebase() && db) {
      setDoc(doc(db, `groups/${groupId}/members/${id}`), { role }, { merge: true });
    } else {
      set((s) => ({
        members: s.members.map((m) =>
          m.id === id && m.role !== 'owner' ? { ...m, role } : m,
        ),
      }));
    }
  },
  removeMember: (id) => {
    const { members, currentUserId, groupId } = get();
    const me = members.find((m) => m.id === currentUserId);
    const target = members.find((m) => m.id === id);
    if (!me || !canManageMembers(me.role) || !target || target.role === 'owner') return;
    if (members.length <= 1) return;
    if (isLiveFirebase() && db) {
      deleteDoc(doc(db, `groups/${groupId}/members/${id}`));
    } else {
      set((s) => {
        const nextMembers = s.members.filter((m) => m.id !== id);
        const fallback = nextMembers[0]?.id ?? 'm1';
        return {
          members: nextMembers,
          currentUserId: s.currentUserId === id ? fallback : s.currentUserId,
          activeMemberId: s.activeMemberId === id ? fallback : s.activeMemberId,
        };
      });
    }
  },
}));
