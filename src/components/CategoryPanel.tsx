import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, type Category, type Expense } from '../store/useStore';
import { isLiveFirebase } from '../lib/appMode';
import { getVisibleCategories, resolveCategoryLabel } from '../lib/categories';
import CategoryIcon from './CategoryIcon';
import { categoryMonthProgress, monthlyAvgBeforeMonth } from '../lib/categoryAverage';
import { ChevronDown, ChevronUp, Wifi, WifiOff, Users, Pencil } from 'lucide-react';
import EditTransactionSheet from '../components/EditTransactionSheet';

function fmt(n: number) {
  return '₹' + Math.abs(n).toLocaleString('en-IN');
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Props = {
  selectedMonth: string;
  monthLabel: string;
};

export default function CategoryPanel({ selectedMonth, monthLabel }: Props) {
  const {
    expenses, members, language,
    syncStatus,
    openAddExpenseFromCategory,
    categoryExpandCategory,
    setCategoryExpandCategory,
    setCategoryScrollTarget,
    hiddenCategories,
    categoryOverrides,
  } = useStore();

  const [expanded, setExpanded] = useState<Category | null>(null);
  const [editTx, setEditTx] = useState<Expense | null>(null);
  const cardRefs = useRef<Partial<Record<Category, HTMLDivElement | null>>>({});

  useEffect(() => {
    if (!categoryExpandCategory) return;
    const cat = categoryExpandCategory;
    setExpanded(cat);
    setCategoryExpandCategory(null);

    const scrollToCard = () => {
      cardRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    // App の scroll リセットより後に実行（複数回で確実に届ける）
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToCard);
    });
    const t1 = window.setTimeout(scrollToCard, 50);
    const t2 = window.setTimeout(scrollToCard, 120);
    const t3 = window.setTimeout(() => setCategoryScrollTarget(null), 180);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [categoryExpandCategory, setCategoryExpandCategory, setCategoryScrollTarget]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );

  /** 選択月より前の月だけで算出（選択月の支出は平均に含めない） */
  const monthlyAvg = useMemo(
    () => monthlyAvgBeforeMonth(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const rows = getVisibleCategories(hiddenCategories).map((cat) => {
    const txns = monthExpenses
      .filter((e) => e.category === cat.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const { spent, avg, pct, isWarn, isOver } = categoryMonthProgress(
      expenses,
      selectedMonth,
      cat.id,
    );
    return { cat, txns, spent, avg, pct, isWarn, isOver };
  });

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const L = (en: string, hi: string) => (language === 'en' ? en : hi);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="px-5">
          <div className="flex items-center gap-2 mb-0.5">
            {syncStatus === 'live' && (
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">
                <Wifi className="w-2.5 h-2.5" />
                {L('Live', 'लाइव')}
              </div>
            )}
            {syncStatus === 'connecting' && (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-500 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                <Wifi className="w-2.5 h-2.5" />
                {L('Syncing…', 'सिंक हो रहा है…')}
              </div>
            )}
            {syncStatus === 'offline' && isLiveFirebase() && (
              <div className="flex items-center gap-1 bg-gray-100 text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">
                <WifiOff className="w-2.5 h-2.5" />
                {L('Offline', 'ऑफ़लाइन')}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {L('Shared with family · updates in real-time', 'परिवार के साथ साझा · रियल-टाइम अपडेट')}
          </p>
        </div>

        <div className="px-4">
          <div className="bg-white rounded-2xl px-4 py-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">
                  {L(`Spent in ${monthLabel}`, `${monthLabel} में खर्च`)}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-700">
                {fmt(totalSpent)} / {monthlyAvg > 0 ? fmt(monthlyAvg) : '–'}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: monthlyAvg > 0 ? `${Math.min((totalSpent / monthlyAvg) * 100, 100)}%` : '0%',
                  background: totalSpent > monthlyAvg ? '#f43f5e' : '#f59e0b',
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-gray-400">
                {monthlyAvg > 0
                  ? `${Math.round(Math.min((totalSpent / monthlyAvg) * 100, 110))}% ${L('of mo. avg', 'मासिक औसत का')}`
                  : ''}
              </span>
              <span className="text-sm font-bold text-gray-400">
                {L('Mo. avg', 'मासिक औसत')}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 flex flex-col gap-2">
          {rows.map(({ cat, txns, spent, avg, pct, isWarn, isOver }) => {
            const isExpanded = expanded === cat.id;
            const barColor = isOver ? '#f43f5e' : isWarn ? '#f59e0b' : '#22c55e';

            return (
              <div
                key={cat.id}
                ref={(el) => { cardRefs.current[cat.id] = el; }}
                className="bg-white rounded-2xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : cat.id)}
                >
                  <CategoryIcon categoryId={cat.id} overrides={categoryOverrides} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-gray-800">
                        {resolveCategoryLabel(cat.id, language, categoryOverrides)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isOver && (
                          <span className="text-xs bg-rose-100 text-rose-600 font-bold px-1.5 py-0.5 rounded-full">
                            {L('OVER', 'पार')}
                          </span>
                        )}
                        {isWarn && (
                          <span className="text-xs bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full">
                            {L('NEAR', 'पास')}
                          </span>
                        )}
                        <span
                          className="text-sm font-black"
                          style={{ color: isOver ? '#f43f5e' : isWarn ? '#f59e0b' : '#374151' }}
                        >
                          {fmt(spent)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: avg > 0 ? `${pct}%` : spent > 0 ? '8%' : '0%',
                          background: avg > 0 ? barColor : '#d1d5db',
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-400">
                        {avg > 0
                          ? `${fmt(spent)} / ${fmt(avg)} ${L('mo. avg', 'मासिक औसत')}`
                          : spent > 0
                          ? fmt(spent)
                          : L('no history', 'कोई इतिहास नहीं')}
                      </span>
                      {txns.length > 0 && (
                        <span className="text-xs text-gray-300">
                          {txns.length} {L('txns', 'लेनदेन')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-gray-300 shrink-0">
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                    }
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-50">
                    {txns.length === 0 ? (
                      <p className="text-xs text-gray-300 text-center py-4">
                        {L('No spending in this month', 'इस महीने कोई खर्च नहीं')}
                      </p>
                    ) : (
                      txns.map((tx) => {
                        const member = members.find((m) => m.id === tx.memberId);
                        return (
                          <button
                            key={tx.id}
                            onClick={() => setEditTx(tx)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50/50 active:bg-gray-100 transition-colors text-left"
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: member?.color ?? '#9ca3af' }}
                            >
                              {member?.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-700 truncate">
                                {tx.note || L('(no note)', '(नोट नहीं)')}
                              </p>
                              <p className="text-sm text-gray-400">
                                {member?.name} · {timeAgo(tx.date)}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-rose-500 shrink-0">
                              −{fmt(tx.amount)}
                            </span>
                            <Pencil className="w-6 h-6 text-gray-300 shrink-0" />
                          </button>
                        );
                      })
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddExpenseFromCategory(cat.id, selectedMonth);
                      }}
                      className="w-full py-2.5 text-xs text-brand-500 font-semibold bg-brand-50/50 active:bg-brand-50 transition-colors"
                    >
                      + {L(`Add to ${cat.id}`, `${cat.id} में जोड़ें`)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editTx && (
        <EditTransactionSheet
          target={{ kind: 'expense', data: editTx }}
          onClose={() => setEditTx(null)}
        />
      )}
    </>
  );
}
