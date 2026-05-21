import type { Expense, Income, Transfer } from '../store/useStore';

/** Local demo data: Feb–May 2026 */
const SEED_MONTHS = ['2026-02', '2026-03', '2026-04', '2026-05'] as const;

type ExpenseDraft = Omit<Expense, 'id' | 'date'> & { day: number };

function d(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, '0')}`;
}

function expensesForMonth(month: string, drafts: ExpenseDraft[]): Expense[] {
  return drafts.map((row, i) => {
    const { day, ...rest } = row;
    return { id: `e-${month}-${i + 1}`, date: d(month, day), ...rest };
  });
}

const FEB: ExpenseDraft[] = [
  { day: 3,  category: 'food',          amount: 420,  note: 'Weekly groceries',      memberId: 'm2' },
  { day: 5,  category: 'transport',     amount: 180,  note: 'Metro pass top-up',     memberId: 'm1' },
  { day: 7,  category: 'utilities',     amount: 920,  note: 'Electricity bill',      memberId: 'm1' },
  { day: 8,  category: 'telecom',       amount: 599,  note: 'Mobile recharge',       memberId: 'm1' },
  { day: 10, category: 'food',          amount: 310,  note: 'Vegetable market',      memberId: 'm1' },
  { day: 12, category: 'shopping',      amount: 1850, note: 'Winter sale',           memberId: 'm2' },
  { day: 14, category: 'health',        amount: 750,  note: 'Pharmacy',              memberId: 'm2' },
  { day: 15, category: 'education',     amount: 2500, note: 'Tuition fee',           memberId: 'm2' },
  { day: 17, category: 'food',          amount: 480,  note: 'Restaurant dinner',     memberId: 'm2' },
  { day: 18, category: 'transport',     amount: 120,  note: 'Auto to station',       memberId: 'm1' },
  { day: 20, category: 'entertainment', amount: 350,  note: 'Movie tickets',         memberId: 'm2' },
  { day: 22, category: 'home',          amount: 640,  note: 'Cleaning supplies',     memberId: 'm1' },
  { day: 24, category: 'food',          amount: 290,  note: 'Snacks & chai',         memberId: 'm1' },
  { day: 26, category: 'other',         amount: 1100, note: 'Repair service',        memberId: 'm1' },
  { day: 28, category: 'transport',     amount: 220,  note: 'Petrol',                memberId: 'm2' },
];

const MAR: ExpenseDraft[] = [
  { day: 2,  category: 'food',          amount: 390,  note: 'Groceries',             memberId: 'm2' },
  { day: 4,  category: 'transport',     amount: 150,  note: 'Cab to client',         memberId: 'm1' },
  { day: 6,  category: 'utilities',     amount: 880,  note: 'Gas cylinder',          memberId: 'm1' },
  { day: 8,  category: 'telecom',       amount: 799,  note: 'Broadband bill',        memberId: 'm1' },
  { day: 9,  category: 'shopping',      amount: 2400, note: 'Shoes & bags',          memberId: 'm2' },
  { day: 11, category: 'food',          amount: 520,  note: 'Bulk rice & dal',       memberId: 'm1' },
  { day: 13, category: 'health',        amount: 450,  note: 'Doctor visit',          memberId: 'm2' },
  { day: 15, category: 'education',     amount: 2500, note: 'Tuition fee',           memberId: 'm2' },
  { day: 16, category: 'entertainment', amount: 499,  note: 'Streaming subscription', memberId: 'm2' },
  { day: 18, category: 'food',          amount: 340,  note: 'Office lunch',          memberId: 'm1' },
  { day: 19, category: 'transport',     amount: 200,  note: 'Bus pass',              memberId: 'm2' },
  { day: 21, category: 'home',          amount: 720,  note: 'Kitchen utensils',      memberId: 'm2' },
  { day: 23, category: 'food',          amount: 410,  note: 'Festival sweets',       memberId: 'm2' },
  { day: 25, category: 'shopping',      amount: 1600, note: 'Clothes for Holi',      memberId: 'm1' },
  { day: 27, category: 'other',         amount: 850,  note: 'Donation',              memberId: 'm1' },
  { day: 29, category: 'transport',     amount: 180,  note: 'Auto rickshaw',         memberId: 'm1' },
];

const APR: ExpenseDraft[] = [
  { day: 1,  category: 'utilities',     amount: 1050, note: 'Electricity bill',      memberId: 'm1' },
  { day: 3,  category: 'food',          amount: 440,  note: 'Groceries',             memberId: 'm2' },
  { day: 5,  category: 'transport',     amount: 250,  note: 'Petrol',                memberId: 'm2' },
  { day: 7,  category: 'telecom',       amount: 599,  note: 'Mobile plan',           memberId: 'm2' },
  { day: 9,  category: 'food',          amount: 360,  note: 'Vegetables & fruits',   memberId: 'm1' },
  { day: 11, category: 'shopping',      amount: 980,  note: 'Online order',          memberId: 'm2' },
  { day: 13, category: 'health',        amount: 520,  note: 'Medicine',              memberId: 'm2' },
  { day: 15, category: 'education',     amount: 2500, note: 'Tuition fee',           memberId: 'm2' },
  { day: 16, category: 'entertainment', amount: 280,  note: 'Weekend outing',        memberId: 'm2' },
  { day: 18, category: 'food',          amount: 470,  note: 'Dinner out',            memberId: 'm1' },
  { day: 20, category: 'transport',     amount: 130,  note: 'Metro',                 memberId: 'm1' },
  { day: 22, category: 'home',          amount: 890,  note: 'Fan repair',            memberId: 'm1' },
  { day: 24, category: 'food',          amount: 300,  note: 'Chai & snacks',         memberId: 'm1' },
  { day: 26, category: 'shopping',      amount: 1750, note: 'Birthday gift',         memberId: 'm1' },
  { day: 28, category: 'other',         amount: 620,  note: 'Stationery',          memberId: 'm2' },
  { day: 30, category: 'transport',     amount: 190,  note: 'Auto to market',        memberId: 'm2' },
];

const MAY: ExpenseDraft[] = [
  { day: 9,  category: 'health',        amount: 400,  note: 'Doctor visit',          memberId: 'm2' },
  { day: 10, category: 'shopping',      amount: 2200, note: 'Kurta for festival',    memberId: 'm1' },
  { day: 11, category: 'food',          amount: 320,  note: 'Dinner out',            memberId: 'm2' },
  { day: 12, category: 'other',         amount: 3200, note: 'Miscellaneous',         memberId: 'm1' },
  { day: 13, category: 'home',          amount: 800,  note: 'Vegetables & fruits',   memberId: 'm1' },
  { day: 14, category: 'transport',     amount: 200,  note: 'Petrol',                memberId: 'm2' },
  { day: 15, category: 'food',          amount: 250,  note: 'Chai & snacks',         memberId: 'm1' },
  { day: 15, category: 'education',     amount: 2500, note: 'Tuition fee',           memberId: 'm2' },
  { day: 16, category: 'health',        amount: 600,  note: 'Medicine',              memberId: 'm2' },
  { day: 17, category: 'entertainment', amount: 499,  note: 'Netflix subscription',  memberId: 'm2' },
  { day: 18, category: 'utilities',     amount: 850,  note: 'Electricity bill',      memberId: 'm1' },
  { day: 19, category: 'food',          amount: 380,  note: 'Groceries',             memberId: 'm2' },
  { day: 19, category: 'shopping',      amount: 1200, note: 'New shirt',             memberId: 'm2' },
  { day: 20, category: 'food',          amount: 450,  note: 'Lunch at office',       memberId: 'm1' },
  { day: 20, category: 'transport',     amount: 120,  note: 'Auto rickshaw',         memberId: 'm1' },
];

const MONTH_EXPENSES: Record<(typeof SEED_MONTHS)[number], ExpenseDraft[]> = {
  '2026-02': FEB,
  '2026-03': MAR,
  '2026-04': APR,
  '2026-05': MAY,
};

function buildIncomes(): Income[] {
  const rows: Income[] = [];
  const monthLabels = ['February', 'March', 'April', 'May'];

  SEED_MONTHS.forEach((month, idx) => {
    const label = monthLabels[idx];
    rows.push(
      { id: `i-${month}-1`, source: 'salary', amount: 45000, note: `${label} salary`, date: d(month, 1), memberId: 'm1' },
      { id: `i-${month}-2`, source: 'salary', amount: 32000, note: `${label} salary`, date: d(month, 1), memberId: 'm2' },
    );
  });

  rows.push(
    { id: 'i-2026-02-f1', source: 'freelance', amount: 12000, note: 'Logo design project', date: '2026-02-18', memberId: 'm2' },
    { id: 'i-2026-03-f1', source: 'freelance', amount: 6500,  note: 'Consulting day rate', date: '2026-03-22', memberId: 'm2' },
    { id: 'i-2026-04-f1', source: 'business',  amount: 9000,  note: 'Side hustle sales',   date: '2026-04-12', memberId: 'm1' },
    { id: 'i-2026-05-f1', source: 'freelance', amount: 8500,  note: 'Design project',      date: '2026-05-08', memberId: 'm2' },
    { id: 'i-2026-03-g1', source: 'gift',      amount: 3000,  note: 'Holi gift from aunt', date: '2026-03-14', memberId: 'm2' },
    { id: 'i-2026-05-g1', source: 'gift',      amount: 2000,  note: 'Birthday gift',       date: '2026-05-12', memberId: 'm2' },
  );

  return rows;
}

function buildTransfers(): Transfer[] {
  return [
    { id: 't-2026-02', fromMemberId: 'm1', toMemberId: 'm2', amount: 1200, note: 'Pocket money',     date: '2026-02-20' },
    { id: 't-2026-03', fromMemberId: 'm2', toMemberId: 'm2', amount: 800,  note: 'School supplies',  date: '2026-03-08' },
    { id: 't-2026-04', fromMemberId: 'm1', toMemberId: 'm2', amount: 2000, note: 'Shared groceries', date: '2026-04-15' },
    { id: 't-2026-05', fromMemberId: 'm1', toMemberId: 'm2', amount: 1500, note: 'Pocket money',     date: '2026-05-14' },
  ];
}

export const seedExpenses: Expense[] = SEED_MONTHS.flatMap((month) =>
  expensesForMonth(month, MONTH_EXPENSES[month]),
);

export const seedIncomes: Income[] = buildIncomes();

export const seedTransfers: Transfer[] = buildTransfers();
