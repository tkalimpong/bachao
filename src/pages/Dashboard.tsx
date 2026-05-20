import { useStore } from '../store/useStore';
import { getCat } from '../lib/categories';
import { Globe, TrendingDown, TrendingUp, Minus } from 'lucide-react';

function fmt(n: number) {
  return '₹' + Math.abs(n).toLocaleString('en-IN');
}

function relativeDate(dateStr: string, lang: 'en' | 'hi') {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return lang === 'en' ? 'Today' : 'आज';
  if (dateStr === yesterday) return lang === 'en' ? 'Yesterday' : 'कल';
  return dateStr;
}

const SOURCE_ICONS: Record<string, string> = {
  salary: '💼', freelance: '💻', business: '🏪', gift: '🎁', rent: '🏠', other_income: '💰',
};

export default function Dashboard() {
  const { expenses, incomes, envelopes, members, language, toggleLanguage, setTab } = useStore();

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth));
  const monthIncomes = incomes.filter((i) => i.date.startsWith(thisMonth));

  const totalIn  = monthIncomes.reduce((s, i) => s + i.amount, 0);
  const totalOut = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const balance  = totalIn - totalOut;

  // recent transactions merged and sorted
  type TxEntry =
    | { kind: 'expense'; data: typeof expenses[0] }
    | { kind: 'income';  data: typeof incomes[0] };

  const allTx: TxEntry[] = [
    ...expenses.map((e) => ({ kind: 'expense' as const, data: e })),
    ...incomes.map((i)  => ({ kind: 'income'  as const, data: i })),
  ].sort((a, b) => b.data.date.localeCompare(a.data.date)).slice(0, 8);

  // Envelope summary — top 4 by % used
  const envelopeSummary = envelopes
    .map((env) => {
      const spent = monthExpenses
        .filter((e) => e.category === env.id)
        .reduce((s, e) => s + e.amount, 0);
      return { ...env, spent, pct: Math.min((spent / env.budget) * 100, 100) };
    })
    .filter((e) => e.spent > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="bg-white pt-10 pb-4 px-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">
              {new Date().toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN', { month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-lg font-bold text-gray-900">
              {language === 'en' ? 'Bachao' : 'बचाओ'}
            </h1>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 active:scale-95"
          >
            <Globe className="w-3 h-3" />
            {language === 'en' ? 'EN' : 'हि'}
          </button>
        </div>
      </div>

      {/* ── Fudget-style IN / OUT / BALANCE ── */}
      <div className="px-4">
        <div className="bg-gray-900 rounded-3xl p-5 text-white">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* IN */}
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs text-white/60 font-medium">
                  {language === 'en' ? 'Money In' : 'आया'}
                </span>
              </div>
              <p className="text-xl font-black text-emerald-400">{fmt(totalIn)}</p>
            </div>
            {/* OUT */}
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-full bg-rose-400/20 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-xs text-white/60 font-medium">
                  {language === 'en' ? 'Money Out' : 'गया'}
                </span>
              </div>
              <p className="text-xl font-black text-rose-400">{fmt(totalOut)}</p>
            </div>
          </div>

          {/* BALANCE */}
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/60">
                {language === 'en' ? 'Balance' : 'बचत'}
              </span>
            </div>
            <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {balance < 0 ? '−' : '+'}{fmt(balance)}
            </p>
          </div>

          {/* Balance bar */}
          {totalIn > 0 && (
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((totalOut / totalIn) * 100, 100)}%` }}
              />
            </div>
          )}
          <p className="text-[10px] text-white/30 mt-1 text-right">
            {totalIn > 0 ? Math.round((totalOut / totalIn) * 100) : 0}%{' '}
            {language === 'en' ? 'of income spent' : 'आय का खर्च'}
          </p>
        </div>
      </div>

      {/* ── Envelope quick view ── */}
      {envelopeSummary.length > 0 && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-2 ml-1">
            <p className="text-xs text-gray-400 font-semibold uppercase">
              {language === 'en' ? 'Envelopes' : 'लिफ़ाफ़े'}
            </p>
            <button
              onClick={() => setTab('envelopes')}
              className="text-xs text-brand-500 font-semibold"
            >
              {language === 'en' ? 'All →' : 'सभी →'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {envelopeSummary.map((env) => {
              const cat = getCat(env.id as any);
              const isLow = env.pct > 80;
              const isOver = env.pct >= 100;
              return (
                <button
                  key={env.id}
                  onClick={() => setTab('envelopes')}
                  className="bg-white rounded-2xl px-4 py-3 text-left active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs font-semibold text-gray-700 flex-1 truncate">
                      {language === 'en'
                        ? env.id.charAt(0).toUpperCase() + env.id.slice(1)
                        : env.id}
                    </span>
                    {isOver && (
                      <span className="text-[9px] bg-rose-100 text-rose-600 font-bold px-1.5 py-0.5 rounded-full">
                        {language === 'en' ? 'OVER' : 'पार'}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${env.pct}%`,
                        background: isOver ? '#f43f5e' : isLow ? '#f59e0b' : '#22c55e',
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-400">
                      ₹{env.spent.toLocaleString('en-IN')}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: isOver ? '#f43f5e' : isLow ? '#f59e0b' : '#22c55e' }}
                    >
                      ₹{Math.max(env.budget - env.spent, 0).toLocaleString('en-IN')}{' '}
                      {language === 'en' ? 'left' : 'बचा'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent transactions (income + expense combined) ── */}
      <div className="px-4">
        <p className="text-xs text-gray-400 font-semibold uppercase mb-2 ml-1">
          {language === 'en' ? 'Recent' : 'हालिया'}
        </p>
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
          {allTx.map(({ kind, data }) => {
            if (kind === 'expense') {
              const cat = getCat(data.category as any);
              return (
                <div key={data.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: cat.bg }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{data.note}</p>
                    <p className="text-[11px] text-gray-400">
                      {relativeDate(data.date, language)} ·{' '}
                      {members.find((m) => m.id === data.memberId)?.name}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-rose-500 shrink-0">
                    −{fmt(data.amount)}
                  </span>
                </div>
              );
            } else {
              const icon = SOURCE_ICONS[(data as any).source] ?? '💰';
              return (
                <div key={data.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-50">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{data.note}</p>
                    <p className="text-[11px] text-gray-400">
                      {relativeDate(data.date, language)} ·{' '}
                      {members.find((m) => m.id === data.memberId)?.name}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-500 shrink-0">
                    +{fmt(data.amount)}
                  </span>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
