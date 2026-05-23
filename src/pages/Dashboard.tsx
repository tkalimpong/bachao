import { useState } from 'react';
import { useStore, type Category, type Expense, type Income } from '../store/useStore';
import { getVisibleCategories, resolveCategoryAppearance } from '../lib/categories';
import CategoryIcon from '../components/CategoryIcon';
import IncomeSourceIcon from '../components/IncomeSourceIcon';
import AppLogo from '../components/AppLogo';
import GullakPotIcon from '../components/GullakPotIcon';
import { appName } from '../lib/appBrand';
import { TRUST_BLUE } from '../lib/theme';
import { Globe, TrendingDown, TrendingUp, Minus, Pencil } from 'lucide-react';
import EditTransactionSheet from '../components/EditTransactionSheet';
import { categoryMonthProgress } from '../lib/categoryAverage';
import { canViewGroupFinances, getMemberRole } from '../lib/permissions';
import {
  availableBalance,
  scopeGullakDeposits,
  sumGullakDeposits,
  sumGullakDepositsInMonth,
} from '../lib/gullakBalance';

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

type BalancePeriod = 'all' | 'month';

export default function Dashboard() {
  const {
    expenses, incomes, members, language, toggleLanguage, setTab,
    setHistoryView, setCategoryExpandCategory, setCategoryScrollTarget, currentUserId,
    hiddenCategories,
    categoryOverrides,
    incomeSourceOverrides,
    gullakDeposits,
    setGullakPrefillAmount,
  } =
    useStore();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [balancePeriod, setBalancePeriod] = useState<BalancePeriod>('all');

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

  const allTimeIn  = memberIncomes.reduce((s, i) => s + i.amount, 0);
  const allTimeOut = memberExpenses.reduce((s, e) => s + e.amount, 0);
  const rawAllTimeBalance = allTimeIn - allTimeOut;

  const memberScope = showGroup ? null : [currentUserId];
  const scopedGullak = scopeGullakDeposits(gullakDeposits, memberScope);
  const gullakTotal = sumGullakDeposits(scopedGullak);
  const allTimeBalance = availableBalance(rawAllTimeBalance, gullakTotal);

  const periodIn = balancePeriod === 'all' ? allTimeIn : monthIn;
  const periodOut = balancePeriod === 'all' ? allTimeOut : monthOut;
  const rawPeriodBalance = periodIn - periodOut;
  const periodGullak =
    balancePeriod === 'all'
      ? gullakTotal
      : sumGullakDepositsInMonth(scopedGullak, thisMonth);
  const periodBalance = availableBalance(rawPeriodBalance, periodGullak);

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

      {/* ── IN / OUT / BALANCE（全期間 ⇄ 今月）── */}
      <div className="px-4">
        <div className="bg-ink rounded-3xl p-5 text-white">
          {!showGroup && (
            <p className="text-xs text-white/50 font-semibold uppercase mb-3">
              {L('Your summary', 'आपका सारांश')}
            </p>
          )}

          <div className="flex rounded-xl bg-white/10 p-1 mb-4">
            {([
              ['all', L('All time', 'कुल')],
              ['month', L('This month', 'इस महीने')],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setBalancePeriod(id)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                  balancePeriod === id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-white/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

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
              <p className="text-xl font-black text-emerald-400">{fmt(periodIn)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-8 h-8 rounded-full bg-rose-400/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                <span className="text-sm text-white/60 font-medium">
                  {L('Spent', 'खर्च')}
                </span>
              </div>
              <p className="text-xl font-black text-rose-400">{fmt(periodOut)}</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
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
                    periodBalance > 0
                      ? TRUST_BLUE[400]
                      : periodBalance < 0
                      ? undefined
                      : 'rgba(255,255,255,0.5)',
                }}
              >
                {periodBalance < 0 ? (
                  <span className="text-rose-400">−{fmt(Math.abs(periodBalance))}</span>
                ) : (
                  <>+{fmt(periodBalance)}</>
                )}
              </p>
            </div>
            {periodGullak > 0 && (
              <div className="flex items-center justify-end gap-1 mt-1.5">
                <GullakPotIcon state="savings" className="w-3.5 h-3.5 text-brand-300" />
                <span className="text-xs font-bold text-brand-300">
                  −{fmt(periodGullak)}
                </span>
                <span className="text-[10px] text-white/40">{L('Gullak', 'गुल्लक')}</span>
              </div>
            )}
          </div>
          {periodIn > 0 && (
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((periodOut / periodIn) * 100, 100)}%` }}
              />
            </div>
          )}
          <p className="text-xs text-white/30 mt-1 text-right">
            {periodIn > 0 ? Math.round((periodOut / periodIn) * 100) : 0}%{' '}
            {L('of income spent', 'आय का खर्च')}
          </p>
        </div>
      </div>

      {/* ── Gullak 残高 ── */}
      <div className="px-4">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(to right, ${TRUST_BLUE[500]}, ${TRUST_BLUE[600]})`,
          }}
        >
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <GullakPotIcon state="savings" className="w-11 h-11 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80">
                {L('Your Gullak', 'आपका गुल्लक')}
              </p>
              <p className="text-2xl font-black text-white mt-0.5">
                {gullakTotal > 0 ? fmt(gullakTotal) : '—'}
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                {L('Physical savings at home', 'घर पर नकद बचत')}
              </p>
            </div>
          </div>
          {allTimeBalance > 0 && (
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => {
                  setGullakPrefillAmount(allTimeBalance);
                  setTab('gullak');
                }}
                className="w-full py-3 rounded-2xl bg-white/20 border border-white/30 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <GullakPotIcon state="savings" className="w-5 h-5 text-white" />
                {L('Save to Gullak?', 'गुल्लक में रखें?')}
              </button>
            </div>
          )}
        </div>
      </div>

      {showGroup && (
      <div className="px-4">
        <div className="flex items-center justify-between mb-2 ml-1">
          <p className="text-sm text-gray-400 font-semibold uppercase">
            {language === 'en' ? 'Expense' : 'खर्च'}
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
