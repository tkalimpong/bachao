import { create } from 'zustand';

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
  budget: number; // monthly budget for this envelope
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'adult' | 'child';
  color: string;
}

interface AppState {
  currentTab: string;
  setTab: (tab: string) => void;
  isPremium: boolean;
  language: 'en' | 'hi';
  toggleLanguage: () => void;
  expenses: Expense[];
  addExpense: (e: Omit<Expense, 'id' | 'date'>) => void;
  incomes: Income[];
  addIncome: (i: Omit<Income, 'id' | 'date'>) => void;
  envelopes: Envelope[];
  updateEnvelopeBudget: (id: Category, budget: number) => void;
  members: FamilyMember[];
  activeMemberId: string;
  setActiveMember: (id: string) => void;
}

const initialExpenses: Expense[] = [
  { id: '1',  category: 'food',          amount: 450,  note: 'Lunch at office',    date: '2026-05-20', memberId: 'm1' },
  { id: '2',  category: 'transport',     amount: 120,  note: 'Auto rickshaw',       date: '2026-05-20', memberId: 'm1' },
  { id: '3',  category: 'shopping',      amount: 1200, note: 'New shirt',           date: '2026-05-19', memberId: 'm2' },
  { id: '4',  category: 'food',          amount: 380,  note: 'Groceries',           date: '2026-05-19', memberId: 'm2' },
  { id: '5',  category: 'bills',         amount: 850,  note: 'Electricity bill',    date: '2026-05-18', memberId: 'm1' },
  { id: '6',  category: 'entertainment', amount: 499,  note: 'Netflix subscription',date: '2026-05-17', memberId: 'm2' },
  { id: '7',  category: 'health',        amount: 600,  note: 'Medicine',            date: '2026-05-16', memberId: 'm3' },
  { id: '8',  category: 'education',     amount: 2500, note: 'Tuition fee',         date: '2026-05-15', memberId: 'm3' },
  { id: '9',  category: 'food',          amount: 250,  note: 'Chai & snacks',       date: '2026-05-15', memberId: 'm1' },
  { id: '10', category: 'transport',     amount: 200,  note: 'Petrol',              date: '2026-05-14', memberId: 'm2' },
  { id: '11', category: 'home',          amount: 800,  note: 'Vegetables & fruits', date: '2026-05-13', memberId: 'm1' },
  { id: '12', category: 'travel',        amount: 3200, note: 'Train ticket',        date: '2026-05-12', memberId: 'm1' },
  { id: '13', category: 'food',          amount: 320,  note: 'Dinner out',          date: '2026-05-11', memberId: 'm2' },
  { id: '14', category: 'shopping',      amount: 2200, note: 'Kurta for festival',  date: '2026-05-10', memberId: 'm1' },
  { id: '15', category: 'health',        amount: 400,  note: 'Doctor visit',        date: '2026-05-09', memberId: 'm3' },
];

const initialIncomes: Income[] = [
  { id: 'i1', source: 'salary',    amount: 45000, note: 'May salary',       date: '2026-05-01', memberId: 'm1' },
  { id: 'i2', source: 'salary',    amount: 32000, note: 'May salary',       date: '2026-05-01', memberId: 'm2' },
  { id: 'i3', source: 'freelance', amount: 8500,  note: 'Design project',   date: '2026-05-08', memberId: 'm2' },
  { id: 'i4', source: 'gift',      amount: 2000,  note: 'Birthday gift',    date: '2026-05-12', memberId: 'm3' },
];

const initialEnvelopes: Envelope[] = [
  { id: 'food',          budget: 8000  },
  { id: 'transport',     budget: 3000  },
  { id: 'shopping',      budget: 5000  },
  { id: 'health',        budget: 3000  },
  { id: 'entertainment', budget: 2000  },
  { id: 'bills',         budget: 4000  },
  { id: 'education',     budget: 5000  },
  { id: 'home',          budget: 3000  },
  { id: 'travel',        budget: 5000  },
  { id: 'other',         budget: 2000  },
];

export const useStore = create<AppState>((set) => ({
  currentTab: 'home',
  setTab: (tab) => set({ currentTab: tab }),
  isPremium: false,
  language: 'en',
  toggleLanguage: () => set((s) => ({ language: s.language === 'en' ? 'hi' : 'en' })),
  expenses: initialExpenses,
  addExpense: (e) =>
    set((s) => ({
      expenses: [
        { ...e, id: Date.now().toString(), date: new Date().toISOString().slice(0, 10) },
        ...s.expenses,
      ],
    })),
  incomes: initialIncomes,
  addIncome: (i) =>
    set((s) => ({
      incomes: [
        { ...i, id: 'inc_' + Date.now(), date: new Date().toISOString().slice(0, 10) },
        ...s.incomes,
      ],
    })),
  envelopes: initialEnvelopes,
  updateEnvelopeBudget: (id, budget) =>
    set((s) => ({
      envelopes: s.envelopes.map((e) => (e.id === id ? { ...e, budget } : e)),
    })),
  members: [
    { id: 'm1', name: 'Rahul', avatar: 'R', role: 'owner', color: '#f97316' },
    { id: 'm2', name: 'Priya', avatar: 'P', role: 'adult', color: '#8b5cf6' },
    { id: 'm3', name: 'Arjun', avatar: 'A', role: 'child', color: '#22c55e' },
  ],
  activeMemberId: 'm1',
  setActiveMember: (id) => set({ activeMemberId: id }),
}));
