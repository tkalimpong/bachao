import { useState } from 'react';
import { useStore, type Category, type IncomeSource } from '../store/useStore';
import { CATEGORIES } from '../lib/categories';
import { Check, TrendingDown, TrendingUp, CalendarDays } from 'lucide-react';

type Mode = 'expense' | 'income';

const INCOME_SOURCES: { id: IncomeSource; icon: string; en: string; hi: string }[] = [
  { id: 'salary',       icon: '💼', en: 'Salary',    hi: 'तनख्वाह' },
  { id: 'freelance',    icon: '💻', en: 'Freelance',  hi: 'फ्रीलांस' },
  { id: 'business',     icon: '🏪', en: 'Business',   hi: 'व्यापार' },
  { id: 'gift',         icon: '🎁', en: 'Gift',       hi: 'उपहार' },
  { id: 'rent',         icon: '🏠', en: 'Rent',       hi: 'किराया' },
  { id: 'other_income', icon: '💰', en: 'Other',      hi: 'अन्य' },
];

function fmt(n: number) {
  return '₹' + Math.abs(n).toLocaleString('en-IN');
}

export default function AddExpense() {
  const {
    addExpense, addIncome, setTab, language,
    members, activeMemberId, setActiveMember,
    envelopes, expenses,
  } = useStore();

  const [mode, setMode]         = useState<Mode>('expense');
  const [category, setCategory] = useState<Category>('food');
  const [source, setSource]     = useState<IncomeSource>('salary');
  const [amount, setAmount]     = useState('');
  const [note, setNote]         = useState('');
  const [date, setDate]         = useState(() => new Date().toISOString().slice(0, 10));
  const [saved, setSaved]       = useState(false);

  const thisMonth = new Date().toISOString().slice(0, 7);

  // selected category spending & limit for hint bar
  const catSpent  = expenses
    .filter((e) => e.date.startsWith(thisMonth) && e.category === category)
    .reduce((s, e) => s + e.amount, 0);
  const catBudget = envelopes.find((e) => e.id === category)?.budget ?? 0;
  const catFill   = catBudget > 0 ? Math.min((catSpent / catBudget) * 100, 110) : 0;
  const catOver   = catBudget > 0 && catSpent > catBudget;
  const catWarn   = catBudget > 0 && catFill >= 75 && !catOver;

  function handleSave() {
    const n = Number(amount);
    if (!n || n <= 0) return;
    if (mode === 'expense') {
      addExpense({ category, amount: n, note, date, memberId: activeMemberId });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setAmount('');
        setNote('');
        setDate(new Date().toISOString().slice(0, 10));
        setTab('home');
      }, 900);
    } else {
      addIncome({ source, amount: n, note, date, memberId: activeMemberId });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setAmount('');
        setNote('');
        setDate(new Date().toISOString().slice(0, 10));
        setTab('home');
      }, 900);
    }
  }

  return (
    <div className="flex flex-col pb-24 pt-10">
      <div className="px-5 mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Add Transaction' : 'लेन-देन जोड़ें'}
        </h2>
      </div>

      {/* Mode toggle */}
      <div className="px-4 mb-5">
        <div className="bg-white rounded-2xl p-1 flex gap-1">
          <button
            onClick={() => setMode('expense')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'expense' ? 'bg-rose-500 text-white' : 'text-gray-400'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            {language === 'en' ? 'Expense' : 'खर्च'}
          </button>
          <button
            onClick={() => setMode('income')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mode === 'income' ? 'bg-emerald-500 text-white' : 'text-gray-400'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {language === 'en' ? 'Income' : 'आय'}
          </button>
        </div>
      </div>

      {/* Category / Source grid */}
      <div className="px-4 mb-4">
        <p className="text-[10px] text-gray-400 font-semibold uppercase ml-1 mb-2">
          {mode === 'expense'
            ? (language === 'en' ? 'Category' : 'कैटेगरी')
            : (language === 'en' ? 'Income source' : 'आय का स्रोत')}
        </p>
        {mode === 'expense' ? (
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map((cat) => {
              const env     = envelopes.find((e) => e.id === cat.id);
              const spent   = expenses
                .filter((e) => e.date.startsWith(thisMonth) && e.category === cat.id)
                .reduce((s, e) => s + e.amount, 0);
              const fill    = env?.budget ? Math.min((spent / env.budget) * 100, 110) : 0;
              const over    = env?.budget ? spent > env.budget : false;
              const warn    = env?.budget ? fill >= 75 && !over : false;
              const dotColor = over ? '#f43f5e' : warn ? '#f97316' : '#22c55e';
              const isSelected = category === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 transition-all active:scale-95 ${
                    isSelected ? 'ring-2 ring-brand-500 scale-105' : 'bg-white'
                  }`}
                  style={isSelected ? { background: cat.bg } : {}}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[8px] font-medium text-gray-500 leading-tight text-center px-0.5">
                    {language === 'en' ? cat.id.slice(0, 5) : cat.id.slice(0, 4)}
                  </span>
                  {/* spending dot indicator */}
                  {spent > 0 && (
                    <span
                      className="text-[8px] font-bold leading-tight"
                      style={{ color: dotColor }}
                    >
                      {spent >= 1000 ? (spent / 1000).toFixed(1) + 'k' : spent}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {INCOME_SOURCES.map((src) => (
              <button
                key={src.id}
                onClick={() => setSource(src.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-all active:scale-95 ${
                  source === src.id ? 'ring-2 ring-emerald-500 scale-105 bg-emerald-50' : 'bg-white'
                }`}
              >
                <span className="text-2xl">{src.icon}</span>
                <span className="text-[10px] font-medium text-gray-600">
                  {language === 'en' ? src.en : src.hi}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spending progress hint (expense mode, if budget set) */}
      {mode === 'expense' && catBudget > 0 && (
        <div className="px-4 mb-2">
          <div className="bg-white rounded-xl px-4 py-2.5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-400 font-medium">
                {language === 'en' ? 'Spent this month' : 'इस महीने खर्च'}
              </span>
              <span className={`font-bold ${catOver ? 'text-rose-500' : catWarn ? 'text-orange-500' : 'text-gray-600'}`}>
                {fmt(catSpent)} / {fmt(catBudget)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(catFill, 100)}%`,
                  background: catOver ? '#f43f5e' : catWarn ? '#f97316' : '#22c55e',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl px-4 flex items-center gap-2 h-16 bg-white">
          <span className={`text-2xl font-black ${mode === 'expense' ? 'text-rose-300' : 'text-emerald-300'}`}>
            ₹
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 text-3xl font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-200"
          />
        </div>
      </div>

      {/* Note */}
      <div className="px-4 mb-3">
        <input
          type="text"
          placeholder={language === 'en' ? 'Note (optional)' : 'नोट (वैकल्पिक)'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-white rounded-2xl px-4 h-12 text-sm text-gray-800 outline-none placeholder:text-gray-300"
        />
      </div>

      {/* Date */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl px-4 h-12 flex items-center gap-3">
          <CalendarDays className="w-4 h-4 text-gray-300 shrink-0" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 text-sm text-gray-800 bg-transparent outline-none"
          />
        </div>
      </div>

      {/* Member selector */}
      <div className="px-4 mb-6">
        <p className="text-[10px] text-gray-400 font-semibold uppercase ml-1 mb-2">
          {language === 'en' ? 'Who?' : 'कौन?'}
        </p>
        <div className="flex gap-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMember(m.id)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all active:scale-95 ${
                activeMemberId === m.id ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: m.color }}
              >
                {m.avatar}
              </div>
              <span className={`text-xs font-semibold ${activeMemberId === m.id ? 'text-white' : 'text-gray-600'}`}>
                {m.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="px-4">
        <button
          onClick={handleSave}
          disabled={!amount || saved}
          className={`w-full h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-500 text-white'
              : !amount
              ? 'bg-gray-100 text-gray-300'
              : mode === 'expense'
              ? 'bg-rose-500 text-white'
              : 'bg-emerald-500 text-white'
          }`}
        >
          {saved ? (
            <><Check className="w-5 h-5" />{language === 'en' ? 'Saved!' : 'सहेजा!'}</>
          ) : mode === 'expense' ? (
            <><TrendingDown className="w-5 h-5" />{language === 'en' ? 'Add Expense' : 'खर्च जोड़ें'}</>
          ) : (
            <><TrendingUp className="w-5 h-5" />{language === 'en' ? 'Add Income' : 'आय जोड़ें'}</>
          )}
        </button>
        <button onClick={() => setTab('home')} className="w-full h-10 text-sm text-gray-400 mt-1">
          {language === 'en' ? 'Cancel' : 'रद्द'}
        </button>
      </div>
    </div>
  );
}
