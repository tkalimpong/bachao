import { useState } from 'react';
import { useStore, type Category, type Expense, type Income } from '../store/useStore';
import { getVisibleCategories, resolveCategoryAppearance } from '../lib/categories';
import CategoryIcon from '../components/CategoryIcon';
import IncomeSourceIcon from '../components/IncomeSourceIcon';
import AppLogo from '../components/AppLogo';
import GullakPotIcon from '../components/GullakPotIcon';
import { appName } from '../lib/appBrand';
import { TRUST_BLUE } from '../lib/theme';
import { Globe, TrendingDown, TrendingUp, Minus, Pencil, ChevronDown } from 'lucide-react';
import EditTransactionSheet from '../components/EditTransactionSheet';
import { categoryMonthProgress } from '../lib/categoryAverage';
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

// ── SVG circular gauge（加算式）──────────────────────────────────────────────
// 支出が増えると 12時から時計回りにリングが伸びていく。
//   0%          → リングなし（グレーの背景のみ）
//   1〜74%      → 緑リングが時計回りに伸びる
//   75〜99%     → オレンジ（上限に近い警告色）
//   100%〜      → 赤（月平均超過）、最大 110% 分まで伸びて止まる
//   前月までの月平均 = 0 → グレーの細いリングで「記録あり」を示すだけ
const RING_R    = 21;
const RING_CIRC = 2 * Math.PI * RING_R;

function GaugeRing({ baseline, spent }: { baseline: number; spent: number }) {
  const hasBaseline = baseline > 0;
  const fillPct   = hasBaseline ? Math.min((spent / baseline) * 100, 110) : 0;
  const fillLen   = (fillPct / 100) * RING_CIRC;
  const color     = fillPct >= 100 ? '#f43f5e' : fillPct >= 75 ? '#f59e0b' : '#22c55e';

  return (
    <>
      {/* トラック */}
      <circle cx="29" cy="29" r={RING_R} fill="none" stroke="#f3f4f6" strokeWidth="3.5" />

      {/* 支出リング：12時（-90°）から時計回りに伸びる */}
      {hasBaseline && fillLen > 0 ? (
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
      ) : !hasBaseline && spent > 0 ? (
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
  const {
    expenses, incomes, members, language, toggleLanguage, setTab,
    setHistoryView, setCategoryExpandCategory, setCategoryScrollTarget, currentUserId,
    hiddenCategories,
    categoryOverrides,
    incomeSourceOverrides,
  } =
    useStore();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [savingsExpanded, setSavingsExpanded] = useState(false);

  const thisMonth    = new Date().toISOString().slice(0, 7);
  const myRole = getMemberRole(members, currentUserId);
  const showGroup = myRole ? canViewGroupFinances(myRole) : true;
  const L = (en: string, hi: string) => (language === 'en' ? en : hi);

  function goToHistoryTab() {
    setHistoryView('history');
    setCategoryExpandCategory(null);
    setCategoryScrollTarget(null);
    setTab('history');
  }

  function goToHistoryCategoryTab() {
    setHistoryView('category');
    setCategoryExpandCategory(null);
    setCategoryScrollTarget(null);
    setTab('history');
  }

  const memberExpenses = showGroup
    ? expenses
    : expenses.filter((e) => e.memberId === currentUserId);
  const memberIncomes = showGroup
    ? incomes
    : incomes.filter((i) => i.memberId === currentUserId);

  const monthExpenses = memberExpenses.filter((e) => e.date.startsWith(thisMonth));
  const monthIncomes  = memberIncomes.filter((i) => i.date.startsWith(thisMonth));

  const monthIn  = monthIncomes.reduce((s, i)  => s + i.amount, 0);
  const monthOut = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const monthBalance = monthIn - monthOut;

  const allTimeIn  = memberIncomes.reduce((s, i) => s + i.amount, 0);
  const allTimeOut = memberExpenses.reduce((s, e) => s + e.amount, 0);
  const allTimeBalance = allTimeIn - allTimeOut;

  // merged recent transactions (latest 8)
  type TxEntry =
    | { kind: 'expense'; data: typeof expenses[0] }
    | { kind: 'income';  data: typeof incomes[0] };

  const allTx: TxEntry[] = [
    ...monthExpenses.map((e) => ({ kind: 'expense' as const, data: e })),
    ...monthIncomes.map((i)  => ({ kind: 'income'  as const, data: i })),
  ].sort((a, b) => b.data.date.localeCompare(a.data.date)).slice(0, 8);

  const gaugeData = getVisibleCategories(hiddenCategories).map((cat) => {
    const { spent, avg, pct, isWarn, isOver } = categoryMonthProgress(
      expenses,
      thisMonth,
      cat.id,
    );
    return { cat, spent, avg, pct, isWarn, isOver };
  });

  return (
    <div className="flex flex-col gap-4 pb-24">

      {/* ── Header ── */}
      <div className="bg-white pt-10 pb-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AppLogo size={44} />
            <div>
              <p className="text-sm text-gray-400 font-medium">
                {new Date().toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN', { month: 'long', year: 'numeric' })}
              </p>
              <h1 className="text-xl font-bold text-gray-900">
                {appName(language)}
              </h1>
            </div>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3.5 py-2 text-sm font-semibold text-gray-600 active:scale-95"
          >
            <Globe className="w-5 h-5" />
            {language === 'en' ? 'EN' : 'हि'}
          </button>
        </div>
      </div>

      {/* ── IN / OUT / BALANCE（全期間）── */}
      <div className="px-4">
        <div className="bg-ink rounded-3xl p-5 text-white">
          {!showGroup && (
            <p className="text-xs text-white/50 font-semibold uppercase mb-3">
              {L('Your summary', 'आपका सारांश')}
            </p>
          )}
          <p className="text-xs text-white/40 font-semibold uppercase mb-3">
            {L('All time', 'कुल')}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-white/60 font-medium">
                  {language === 'en' ? 'Money In' : 'आया'}
                </span>
              </div>
              <p className="text-xl font-black text-emerald-400">{fmt(allTimeIn)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-8 h-8 rounded-full bg-rose-400/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-sm text-white/60 font-medium">
                  {language === 'en' ? 'Money Out' : 'गया'}
                </span>
              </div>
              <p className="text-xl font-black text-rose-400">{fmt(allTimeOut)}</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minus className="w-6 h-6 text-white/40" />
              <span className="text-sm text-white/60">
                {language === 'en' ? 'Balance' : 'बचत'}
              </span>
            </div>
            <p
              className="text-2xl font-black"
              style={{
                color:
                  allTimeBalance > 0
                    ? TRUST_BLUE[400]
                    : allTimeBalance < 0
                    ? undefined
                    : 'rgba(255,255,255,0.5)',
              }}
            >
              {allTimeBalance < 0 ? (
                <span className="text-rose-400">−{fmt(Math.abs(allTimeBalance))}</span>
              ) : (
                <>+{fmt(allTimeBalance)}</>
              )}
            </p>
          </div>
          {allTimeIn > 0 && (
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((allTimeOut / allTimeIn) * 100, 100)}%` }}
              />
            </div>
          )}
          <p className="text-xs text-white/30 mt-1 text-right">
            {allTimeIn > 0 ? Math.round((allTimeOut / allTimeIn) * 100) : 0}%{' '}
            {language === 'en' ? 'of income spent' : 'आय का खर्च'}
          </p>
        </div>
      </div>

      {/* ── 貯蓄カード（今月・タップで下に展開）──────────────────────────── */}
      <div className="px-4">
        <div
          className={`rounded-2xl overflow-hidden ${
            monthBalance >= 0
              ? ''
              : 'bg-rose-50 border border-rose-100'
          }`}
          style={
            monthBalance >= 0
              ? { background: `linear-gradient(to right, ${TRUST_BLUE[500]}, ${TRUST_BLUE[600]})` }
              : undefined
          }
        >
          <button
            type="button"
            onClick={() => setSavingsExpanded((v) => !v)}
            className="w-full px-4 py-3 flex items-center gap-3 text-left active:opacity-90 transition-opacity"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                monthBalance >= 0 ? 'bg-white/20' : 'bg-rose-100'
              }`}
            >
              <GullakPotIcon
                state={monthBalance >= 0 ? 'savings' : 'overspend'}
                className={`w-11 h-11 ${monthBalance >= 0 ? 'text-white' : 'text-rose-800'}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-medium ${
                  monthBalance >= 0 ? 'text-white/70' : 'text-rose-400'
                }`}
              >
                {monthBalance >= 0
                  ? L('Savings this month', 'इस महीने की बचत')
                  : L('Overspending this month', 'इस महीने ज़्यादा खर्च')}
              </p>
              <p
                className={`text-xs ${
                  monthBalance >= 0 ? 'text-white/50' : 'text-rose-300'
                }`}
              >
                {L('This month', 'इस महीने')}
              </p>
              <p
                className={`text-xl font-black mt-0.5 ${
                  monthBalance >= 0 ? 'text-white' : 'text-rose-500'
                }`}
              >
                {monthBalance >= 0
                  ? `+${fmt(monthBalance)}`
                  : `−${fmt(Math.abs(monthBalance))}`}
              </p>
            </div>
            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <div>
                <p
                  className={`text-xs ${
                    monthBalance >= 0 ? 'text-white/70' : 'text-rose-400'
                  }`}
                >
                  {L('of income', 'आय का')}
                </p>
                <p
                  className={`text-sm font-bold ${
                    monthBalance >= 0 ? 'text-white' : 'text-rose-500'
                  }`}
                >
                  {monthIn > 0 ? Math.round((monthBalance / monthIn) * 100) : 0}%
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-300 ${
                  monthBalance >= 0 ? 'text-white/60' : 'text-rose-300'
                } ${savingsExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              savingsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div
                className={`px-4 pb-4 pt-1 border-t ${
                  monthBalance >= 0 ? 'border-white/20' : 'border-rose-100'
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase mb-2 ${
                    monthBalance >= 0 ? 'text-white/50' : 'text-rose-300'
                  }`}
                >
                  {L('This month', 'इस महीने')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={`rounded-xl px-3 py-2.5 ${
                      monthBalance >= 0 ? 'bg-white/15' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                      <span
                        className={`text-xs font-semibold ${
                          monthBalance >= 0 ? 'text-white/80' : 'text-emerald-600'
                        }`}
                      >
                        {L('Money In', 'आया')}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-black ${
                        monthBalance >= 0 ? 'text-emerald-300' : 'text-emerald-600'
                      }`}
                    >
                      {monthIn > 0 ? `+${fmt(monthIn)}` : '—'}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2.5 ${
                      monthBalance >= 0 ? 'bg-white/15' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <TrendingDown className="w-6 h-6 text-rose-400" />
                      <span
                        className={`text-xs font-semibold ${
                          monthBalance >= 0 ? 'text-white/80' : 'text-rose-500'
                        }`}
                      >
                        {L('Money Out', 'गया')}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-black ${
                        monthBalance >= 0 ? 'text-rose-300' : 'text-rose-500'
                      }`}
                    >
                      {monthOut > 0 ? `−${fmt(monthOut)}` : '—'}
                    </p>
                  </div>
                </div>
                {monthIn > 0 && (
                  <p
                    className={`text-xs text-right mt-2 ${
                      monthBalance >= 0 ? 'text-white/40' : 'text-rose-300'
                    }`}
                  >
                    {Math.round((monthOut / monthIn) * 100)}%{' '}
                    {L('of income spent', 'आय का खर्च')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showGroup && (
      <div className="px-4">
        <div className="flex items-center justify-between mb-2 ml-1">
          <p className="text-sm text-gray-400 font-semibold uppercase">
            {language === 'en' ? 'Category' : 'कैटेगरी'}
          </p>
          <button
            type="button"
            onClick={goToHistoryCategoryTab}
            className="text-xs text-brand-500 font-semibold"
          >
            {language === 'en' ? 'Details →' : 'विवरण →'}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-3">
          <div className="grid grid-cols-5 gap-1">
            {gaugeData.map(({ cat, spent, avg, isWarn, isOver }) => {
              const amtColor = isOver ? 'text-rose-500' : isWarn ? 'text-orange-500' : 'text-gray-600';
              const appearance = resolveCategoryAppearance(cat.id as Category, categoryOverrides);

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setHistoryView('category');
                    setCategoryExpandCategory(cat.id as Category);
                    setCategoryScrollTarget(cat.id as Category);
                    setTab('history');
                  }}
                  className="flex flex-col items-center gap-0.5 py-1 active:scale-95 transition-transform"
                >
                  {/* SVG ring + icon */}
                  <svg width="58" height="58" viewBox="0 0 58 58">
                    <GaugeRing baseline={avg} spent={spent} />
                    <circle cx="29" cy="29" r="16" fill={appearance.bg} />
                    <foreignObject x="16" y="16" width="26" height="26">
                      <div className="w-full h-full flex items-center justify-center">
                        <CategoryIcon
                          categoryId={cat.id as Category}
                          overrides={categoryOverrides}
                          variant="plain"
                          size="md"
                        />
                      </div>
                    </foreignObject>
                  </svg>

                  {/* spent amount */}
                  <span className={`text-xs font-black leading-tight ${amtColor}`}>
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
              { color: '#f59e0b', en: '≥75%',   hi: '≥75%' },
              { color: '#f43f5e', en: 'Over',   hi: 'पार'  },
            ].map((l) => (
              <div key={l.en} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-xs text-gray-400">
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
          <p className="text-sm text-gray-400 font-semibold uppercase">
            {showGroup
              ? (language === 'en' ? 'Recent' : 'हालिया')
              : (language === 'en' ? 'Your recent' : 'आपका हालिया')}
          </p>
          <button
            type="button"
            onClick={goToHistoryTab}
            className="text-xs text-brand-500 font-semibold"
          >
            {language === 'en' ? 'See all →' : 'सभी देखें →'}
          </button>
        </div>
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
          {allTx.map(({ kind, data }) => {
            const member = members.find((m) => m.id === data.memberId);

            if (kind === 'expense') {
              const catId = data.category as Category;
              return (
                <button
                  key={data.id}
                  onClick={() => setEditTarget({ kind: 'expense', data: data as Expense })}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
                >
                  {showGroup && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
                    style={{ background: member?.color ?? '#9ca3af' }}
                  >
                    {member?.avatar ?? '?'}
                  </div>
                  )}
                  <CategoryIcon categoryId={catId} overrides={categoryOverrides} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {data.note || (language === 'en' ? '(no note)' : '(नोट नहीं)')}
                    </p>
                    <p className="text-xs text-gray-300">{relativeDate(data.date, language)}</p>
                  </div>
                  <span className="text-sm font-black text-rose-500 shrink-0">−{fmt(data.amount)}</span>
                  <Pencil className="w-6 h-6 text-gray-200 shrink-0" />
                </button>
              );
            } else {
              const incomeId = (data as Income).source;
              return (
                <button
                  key={data.id}
                  onClick={() => setEditTarget({ kind: 'income', data: data as Income })}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
                >
                  {showGroup && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
                    style={{ background: member?.color ?? '#9ca3af' }}
                  >
                    {member?.avatar ?? '?'}
                  </div>
                  )}
                  <IncomeSourceIcon sourceId={incomeId} overrides={incomeSourceOverrides} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {data.note || (language === 'en' ? '(no note)' : '(नोट नहीं)')}
                    </p>
                    <p className="text-xs text-gray-300">{relativeDate(data.date, language)}</p>
                  </div>
                  <span className="text-sm font-black text-emerald-500 shrink-0">+{fmt(data.amount)}</span>
                  <Pencil className="w-6 h-6 text-gray-200 shrink-0" />
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
