import { useState } from 'react';
import { useStore, type Expense, type Income } from '../store/useStore';
import { getCat, CATEGORIES } from '../lib/categories';
import { Globe, TrendingDown, TrendingUp, Minus, PiggyBank, Pencil } from 'lucide-react';
import EditTransactionSheet from '../components/EditTransactionSheet';
import { canViewGroupFinances, getMemberRole } from '../lib/permissions';

function fmt(n: number) {
  return '₹' + Math.abs(n).toLocaleString('en-IN');
}

function fmtShort(n: number) {
  if (Math.abs(n) >= 1000) return '₹' + (Math.abs(n) / 1000).toFixed(1) + 'k';
  return '₹' + Math.abs(n);
}

function relativeDate(dateStr: string, lang: 'en' | 'hi') {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today)     return lang === 'en' ? 'Today'     : 'आज';
  if (dateStr === yesterday) return lang === 'en' ? 'Yesterday' : 'कल';
  return dateStr;
}

const SOURCE_ICONS: Record<string, string> = {
  salary: '💼', freelance: '💻', business: '🏪', gift: '🎁', rent: '🏠', other_income: '💰',
};

// ── SVG circular gauge（加算式）──────────────────────────────────────────────
// 支出が増えると 12時から時計回りにリングが伸びていく。
//   0%          → リングなし（グレーの背景のみ）
//   1〜74%      → 緑リングが時計回りに伸びる
//   75〜99%     → オレンジ（上限に近い警告色）
//   100%〜      → 赤（上限超過）、最大 110% 分まで伸びて止まる
//   budget = 0  → グレーの細いリングで「記録あり」を示すだけ
const RING_R    = 21;
const RING_CIRC = 2 * Math.PI * RING_R;

function GaugeRing({ budget, spent }: { budget: number; spent: number }) {
  const hasBudget = budget > 0;
  const fillPct   = hasBudget ? Math.min((spent / budget) * 100, 110) : 0;
  const fillLen   = (fillPct / 100) * RING_CIRC;
  const color     = fillPct >= 100 ? '#f43f5e' : fillPct >= 75 ? '#f97316' : '#22c55e';

  return (
    <>
      {/* トラック */}
      <circle cx="29" cy="29" r={RING_R} fill="none" stroke="#f3f4f6" strokeWidth="3.5" />

      {/* 支出リング：12時（-90°）から時計回りに伸びる */}
      {hasBudget && fillLen > 0 ? (
        <circle
          cx="29" cy="29" r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${fillLen} ${RING_CIRC}`}
          strokeDashoffset={0}
          transform="rotate(-90 29 29)"
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s ease' }}
        />
      ) : !hasBudget && spent > 0 ? (
        /* 上限未設定でも支出があれば細いグレーリングで示す */
        <circle
          cx="29" cy="29" r={RING_R}
          fill="none"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeDasharray={`${RING_CIRC * 0.25} ${RING_CIRC}`}
          transform="rotate(-90 29 29)"
        />
      ) : null}
    </>
  );
}

type EditTarget =
  | { kind: 'expense'; data: Expense }
  | { kind: 'income';  data: Income };

export default function Dashboard() {
  const { expenses, incomes, envelopes, members, language, toggleLanguage, setTab, currentUserId } =
    useStore();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const thisMonth    = new Date().toISOString().slice(0, 7);
  const myRole = getMemberRole(members, currentUserId);
  const showGroup = myRole ? canViewGroupFinances(myRole) : true;

  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth));
  const monthIncomes  = incomes.filter((i)  => i.date.startsWith(thisMonth));

  const scopedExpenses = showGroup
    ? monthExpenses
    : monthExpenses.filter((e) => e.memberId === currentUserId);
  const scopedIncomes = showGroup
    ? monthIncomes
    : monthIncomes.filter((i) => i.memberId === currentUserId);

  const totalIn  = scopedIncomes.reduce((s, i)  => s + i.amount, 0);
  const totalOut = scopedExpenses.reduce((s, e) => s + e.amount, 0);
  const balance  = totalIn - totalOut;

  // merged recent transactions (latest 8)
  type TxEntry =
    | { kind: 'expense'; data: typeof expenses[0] }
    | { kind: 'income';  data: typeof incomes[0] };

  const allTx: TxEntry[] = [
    ...scopedExpenses.map((e) => ({ kind: 'expense' as const, data: e })),
    ...scopedIncomes.map((i)  => ({ kind: 'income'  as const, data: i })),
  ].sort((a, b) => b.data.date.localeCompare(a.data.date)).slice(0, 8);

  const gaugeData = CATEGORIES.map((cat) => {
    const env   = envelopes.find((e) => e.id === cat.id)!;
    const spent = scopedExpenses
      .filter((e) => e.category === cat.id)
      .reduce((s, e) => s + e.amount, 0);
    const fillPct = env.budget > 0 ? (spent / env.budget) * 100 : 0;
    const isOver  = env.budget > 0 && spent > env.budget;
    const isWarn  = env.budget > 0 && fillPct >= 75 && !isOver;
    return { cat, env, spent, fillPct, isWarn, isOver };
  });

  return (
    <div className="flex flex-col gap-4 pb-24">

      {/* ── Header ── */}
      <div className="bg-white pt-10 pb-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/bachao-logo.png"
              alt="Bachao"
              className="w-10 h-10 rounded-xl object-cover shadow-sm"
            />
            <div>
              <p className="text-xs text-gray-400 font-medium">
                {new Date().toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN', { month: 'long', year: 'numeric' })}
              </p>
              <h1 className="text-lg font-bold text-gray-900">
                {language === 'en' ? 'Bachao' : 'बचाओ'}
              </h1>
            </div>
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

      {/* ── IN / OUT / BALANCE ── */}
      <div className="px-4">
        <div className="bg-gray-900 rounded-3xl p-5 text-white">
          <div className="grid grid-cols-2 gap-4 mb-4">
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

      {/* ── 貯蓄カード（自動計算）─────────────────────────────────────────── */}
      <div className="px-4">
        {balance >= 0 ? (
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 font-medium">
                {language === 'en' ? 'Savings this month' : 'इस महीने की बचत'}
              </p>
              <p className="text-xl font-black text-white">
                +{fmt(balance)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-white/70">
                {language === 'en' ? 'of income' : 'आय का'}
              </p>
              <p className="text-sm font-bold text-white">
                {totalIn > 0 ? Math.round((balance / totalIn) * 100) : 0}%
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <PiggyBank className="w-5 h-5 text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-rose-400 font-medium">
                {language === 'en' ? 'Overspending this month' : 'इस महीने ज़्यादा खर्च'}
              </p>
              <p className="text-xl font-black text-rose-500">
                −{fmt(Math.abs(balance))}
              </p>
            </div>
          </div>
        )}
      </div>

      {showGroup && (
      <div className="px-4">
        <div className="flex items-center justify-between mb-2 ml-1">
          <p className="text-xs text-gray-400 font-semibold uppercase">
            {language === 'en' ? 'Envelopes' : 'लिफ़ाफ़े'}
          </p>
          <button
            onClick={() => setTab('envelopes')}
            className="text-xs text-brand-500 font-semibold"
          >
            {language === 'en' ? 'Details →' : 'विवरण →'}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-3">
          <div className="grid grid-cols-5 gap-1">
            {gaugeData.map(({ cat, env, spent, isWarn, isOver }) => {
              const amtColor = isOver ? 'text-rose-500' : isWarn ? 'text-orange-500' : 'text-gray-600';

              return (
                <button
                  key={cat.id}
                  onClick={() => setTab('envelopes')}
                  className="flex flex-col items-center gap-0.5 py-1 active:scale-95 transition-transform"
                >
                  {/* SVG ring + icon */}
                  <svg width="58" height="58" viewBox="0 0 58 58">
                    <GaugeRing budget={env.budget} spent={spent} />
                    <circle cx="29" cy="29" r="17" fill={cat.bg} />
                    <text
                      x="29" y="35"
                      textAnchor="middle"
                      fontSize="18"
                      style={{ fontFamily: 'system-ui' }}
                    >
                      {cat.icon}
                    </text>
                  </svg>

                  {/* spent amount */}
                  <span className={`text-[9px] font-black leading-tight ${amtColor}`}>
                    {spent > 0 ? fmtShort(spent) : '–'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* legend */}
          <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-gray-50">
            {[
              { color: '#22c55e', en: 'OK',     hi: 'ठीक' },
              { color: '#f97316', en: '≥75%',   hi: '≥75%' },
              { color: '#f43f5e', en: 'Over',   hi: 'पार'  },
            ].map((l) => (
              <div key={l.en} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[9px] text-gray-400">
                  {language === 'en' ? l.en : l.hi}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* ── アイデア2: Visual-first recent transactions ─────────────────────── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2 ml-1">
          <p className="text-xs text-gray-400 font-semibold uppercase">
            {language === 'en' ? 'Recent' : 'हालिया'}
          </p>
          <button
            onClick={() => setTab('history')}
            className="text-xs text-brand-500 font-semibold"
          >
            {language === 'en' ? 'See all →' : 'सभी देखें →'}
          </button>
        </div>
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
          {allTx.map(({ kind, data }) => {
            const member = members.find((m) => m.id === data.memberId);

            if (kind === 'expense') {
              const cat = getCat(data.category as any);
              return (
                <button
                  key={data.id}
                  onClick={() => setEditTarget({ kind: 'expense', data: data as Expense })}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
                    style={{ background: member?.color ?? '#9ca3af' }}
                  >
                    {member?.avatar ?? '?'}
                  </div>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: cat.bg }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {data.note || (language === 'en' ? '(no note)' : '(メモなし)')}
                    </p>
                    <p className="text-[10px] text-gray-300">{relativeDate(data.date, language)}</p>
                  </div>
                  <span className="text-sm font-black text-rose-500 shrink-0">−{fmt(data.amount)}</span>
                  <Pencil className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                </button>
              );
            } else {
              const icon = SOURCE_ICONS[(data as any).source] ?? '💰';
              return (
                <button
                  key={data.id}
                  onClick={() => setEditTarget({ kind: 'income', data: data as Income })}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
                    style={{ background: member?.color ?? '#9ca3af' }}
                  >
                    {member?.avatar ?? '?'}
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-50">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {data.note || (language === 'en' ? '(no note)' : '(メモなし)')}
                    </p>
                    <p className="text-[10px] text-gray-300">{relativeDate(data.date, language)}</p>
                  </div>
                  <span className="text-sm font-black text-emerald-500 shrink-0">+{fmt(data.amount)}</span>
                  <Pencil className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                </button>
              );
            }
          })}
        </div>
      </div>

      {/* Edit transaction sheet */}
      {editTarget && (
        <EditTransactionSheet
          target={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
