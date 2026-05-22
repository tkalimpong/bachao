import { useState, useMemo, useEffect } from 'react';
import { useBackHandler } from '../hooks/useBackHandler';
import { useStore, type Expense, type Income } from '../store/useStore';
import { getCat } from '../lib/categories';
import { SOURCE_ICONS } from '../lib/incomeSources';
import { Search, X, ChevronLeft, ChevronRight, Pencil, ChevronDown, Check } from 'lucide-react';
import EditTransactionSheet from '../components/EditTransactionSheet';
import CategoryPanel from '../components/CategoryPanel';
import { TRUST_BLUE } from '../lib/theme';
import {
  canViewAllHistory,
  canViewGroupFinances,
  getMemberRole,
} from '../lib/permissions';

function fmt(n: number) {
  return '₹' + Math.abs(n).toLocaleString('en-IN');
}

type EditTarget =
  | { kind: 'expense'; data: Expense }
  | { kind: 'income';  data: Income };

type TypeFilter = 'all' | 'expense' | 'income';

function formatMonthKey(key: string, lang: 'en' | 'hi') {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN', { month: 'long', year: 'numeric' });
}

function formatDayHeader(dateStr: string, lang: 'en' | 'hi') {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today)     return lang === 'en' ? 'Today' : 'आज';
  if (dateStr === yesterday) return lang === 'en' ? 'Yesterday' : 'कल';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(lang === 'en' ? 'en-IN' : 'hi-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

// ── Shared sub-components ─────────────────────────────────────────────────

type TxEntry =
  | { kind: 'expense'; data: Expense }
  | { kind: 'income';  data: Income };

function EmptyState({ L }: { L: (en: string, hi: string) => string }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-10 flex flex-col items-center gap-2">
      <span className="text-4xl">🔍</span>
      <p className="text-sm text-gray-400 font-medium">
        {L('No transactions found', 'कोई लेनदेन नहीं मिला')}
      </p>
    </div>
  );
}

function TxList({
  txs, members, showMember, onEdit, L,
}: {
  txs: TxEntry[];
  members: { id: string; name: string; avatar: string; color: string }[];
  showMember: boolean;
  onEdit: (t: EditTarget) => void;
  L: (en: string, hi: string) => string;
}) {
  return (
    <div className="bg-white rounded-b-2xl overflow-hidden divide-y divide-gray-50">
      {txs.map(({ kind, data }) => {
        const member = members.find((m) => m.id === data.memberId);
        if (kind === 'expense') {
          const cat = getCat((data as Expense).category);
          return (
            <button
              key={data.id}
              onClick={() => onEdit({ kind: 'expense', data: data as Expense })}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
            >
              {showMember && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                  style={{ background: member?.color ?? '#9ca3af' }}
                >
                  {member?.avatar ?? '?'}
                </div>
              )}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: cat.bg }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {data.note || L('(no note)', '(नोट नहीं)')}
                </p>
                <p className="text-[10px] text-gray-300 capitalize">{(data as Expense).category}</p>
              </div>
              <span className="text-sm font-black text-rose-500 shrink-0">−{fmt(data.amount)}</span>
              <Pencil className="w-3.5 h-3.5 text-gray-200 shrink-0" />
            </button>
          );
        } else {
          const icon = SOURCE_ICONS[(data as Income).source] ?? '💰';
          return (
            <button
              key={data.id}
              onClick={() => onEdit({ kind: 'income', data: data as Income })}
              className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
            >
              {showMember && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                  style={{ background: member?.color ?? '#9ca3af' }}
                >
                  {member?.avatar ?? '?'}
                </div>
              )}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-50">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {data.note || L('(no note)', '(नोट नहीं)')}
                </p>
                <p className="text-[10px] text-gray-300 capitalize">
                  {(data as Income).source.replace('_', ' ')}
                </p>
              </div>
              <span className="text-sm font-black text-emerald-500 shrink-0">+{fmt(data.amount)}</span>
              <Pencil className="w-3.5 h-3.5 text-gray-200 shrink-0" />
            </button>
          );
        }
      })}
    </div>
  );
}

type HistoryTopView = 'history' | 'category';

export default function History() {
  const {
    expenses, incomes, transfers, members, language,
    currentTab, historyNavigateMonth, setHistoryNavigateMonth,
    historyView, setHistoryView,
    categoryExpandCategory,
    currentUserId,
  } = useStore();

  const myRole = getMemberRole(members, currentUserId);
  const showGroup = myRole ? canViewGroupFinances(myRole) : true;
  const ownOnly = myRole ? !canViewAllHistory(myRole) : false;
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Build sorted list of unique months (desc)
  const allMonths = useMemo(() => {
    const seen = new Set<string>();
    [...expenses, ...incomes, ...transfers].forEach((t) => {
      seen.add(t.date.slice(0, 7));
    });
    seen.add(new Date().toISOString().slice(0, 7));
    return Array.from(seen).sort((a, b) => b.localeCompare(a));
  }, [expenses, incomes, transfers]);

  const [monthIdx, setMonthIdx] = useState(0);
  const selectedMonth = allMonths[monthIdx] ?? new Date().toISOString().slice(0, 7);

  // Group months by year for the picker
  const monthsByYear = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of allMonths) {
      const y = m.slice(0, 4);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allMonths]);

  // Merge and filter all transactions
  const effectiveMemberFilter = ownOnly ? currentUserId : memberFilter;

  const filtered = useMemo<TxEntry[]>(() => {
    const merged: TxEntry[] = [
      ...expenses.map((e) => ({ kind: 'expense' as const, data: e })),
      ...incomes.map((i)  => ({ kind: 'income'  as const, data: i })),
    ];

    return merged
      .filter((t) => t.data.date.startsWith(selectedMonth))
      .filter((t) => typeFilter === 'all' || t.kind === typeFilter)
      .filter((t) => effectiveMemberFilter === 'all' || t.data.memberId === effectiveMemberFilter)
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        if (t.kind === 'expense') {
          return (
            t.data.note.toLowerCase().includes(q) ||
            t.data.category.toLowerCase().includes(q)
          );
        }
        return (
          t.data.note.toLowerCase().includes(q) ||
          t.data.source.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.data.date.localeCompare(a.data.date));
  }, [expenses, incomes, selectedMonth, typeFilter, effectiveMemberFilter, search]);

  // Group by date (timeline mode)
  const grouped = useMemo(() => {
    const map = new Map<string, TxEntry[]>();
    for (const tx of filtered) {
      const d = tx.data.date;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(tx);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  useEffect(() => {
    if (currentTab !== 'history' || !historyNavigateMonth) return;
    const idx = allMonths.indexOf(historyNavigateMonth);
    if (idx >= 0) setMonthIdx(idx);
    setHistoryNavigateMonth(null);
  }, [currentTab, historyNavigateMonth, allMonths, setHistoryNavigateMonth]);

  useEffect(() => {
    if (currentTab !== 'history' || !categoryExpandCategory || !showGroup) return;
    setHistoryView('category');
  }, [currentTab, categoryExpandCategory, showGroup, setHistoryView]);

  useEffect(() => {
    if (ownOnly) setMemberFilter(currentUserId);
  }, [ownOnly, currentUserId]);

  useEffect(() => {
    if (!showGroup && historyView === 'category') setHistoryView('history');
  }, [showGroup, historyView, setHistoryView]);

  const topView: HistoryTopView = showGroup ? historyView : 'history';
  const monthLabel = formatMonthKey(selectedMonth, language);

  // Monthly totals (filtered by type/member/search)
  const totalOut = filtered
    .filter((t) => t.kind === 'expense')
    .reduce((s, t) => s + t.data.amount, 0);
  const totalIn = filtered
    .filter((t) => t.kind === 'income')
    .reduce((s, t) => s + t.data.amount, 0);
  const balance = totalIn - totalOut;

  const L = (en: string, hi: string) => language === 'en' ? en : hi;

  useBackHandler(() => {
    setShowMonthPicker(false);
    return true;
  }, showMonthPicker);

  useBackHandler(() => {
    setHistoryView('history');
    return true;
  }, showGroup && topView === 'category');

  return (
    <div className="flex flex-col pb-24">

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <div className="bg-white pt-10 pb-3 px-5 sticky top-0 z-20 shadow-sm">
        {showGroup && (
          <div className="flex gap-2 mb-3">
            {(['history', 'category'] as HistoryTopView[]).map((v) => (
              <button
                key={v}
                onClick={() => setHistoryView(v)}
                className={`flex-1 h-9 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  topView === v ? 'bg-ink text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {v === 'history'
                  ? L('History', 'इतिहास')
                  : L('Category', 'कैटेगरी')}
              </button>
            ))}
          </div>
        )}

        {/* Month navigator */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-3 py-2 mb-3">
          <button
            onClick={() => setMonthIdx((i) => Math.min(i + 1, allMonths.length - 1))}
            disabled={monthIdx >= allMonths.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-gray-200 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setShowMonthPicker(true)}
            className="flex items-center gap-1 active:opacity-70"
          >
            <span className="text-sm font-bold text-gray-800">
              {formatMonthKey(selectedMonth, language)}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button
            onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
            disabled={monthIdx <= 0}
            className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-gray-200 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {topView === 'history' && (
        <>
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 h-10 mb-3">
          <Search className="w-4 h-4 text-gray-300 shrink-0" />
          <input
            type="text"
            placeholder={L('Search notes, categories…', 'खोजें…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder:text-gray-300"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="w-4 h-4 text-gray-300" />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-3">
          {(['all', 'expense', 'income'] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex-1 h-8 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                typeFilter === t
                  ? t === 'expense'
                    ? 'bg-rose-500 text-white'
                    : t === 'income'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-ink text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {t === 'all'
                ? L('All', 'सभी')
                : t === 'expense'
                ? L('Expense', 'खर्च')
                : L('Income', 'आय')}
            </button>
          ))}
        </div>

        {/* Member filter — group viewers only */}
        <div
          className={`flex gap-2 overflow-x-auto pb-0.5 no-scrollbar ${
            !showGroup ? 'hidden' : ''
          }`}
        >
          <button
            onClick={() => setMemberFilter('all')}
            className={`shrink-0 h-7 px-3 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              memberFilter === 'all' ? 'bg-ink text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {L('All', 'सभी')}
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setMemberFilter(m.id)}
              className={`shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                memberFilter === m.id ? 'text-white' : 'bg-gray-100 text-gray-500'
              }`}
              style={memberFilter === m.id ? { background: m.color } : {}}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ background: m.color }}
              >
                {m.avatar}
              </span>
              {m.name}
            </button>
          ))}
        </div>
        </>
        )}
      </div>

      {topView === 'category' ? (
        <div className="pt-4">
          <CategoryPanel selectedMonth={selectedMonth} monthLabel={monthLabel} />
        </div>
      ) : (
      <>
      {/* ── Monthly summary ─────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-50 rounded-2xl px-3 py-3">
            <p className="text-[10px] text-emerald-500 font-semibold uppercase mb-1">
              {L('In', 'आया')}
            </p>
            <p className="text-base font-black text-emerald-600 tabular-nums">
              {totalIn > 0 ? `+${fmt(totalIn)}` : '—'}
            </p>
          </div>
          <div className="bg-rose-50 rounded-2xl px-3 py-3">
            <p className="text-[10px] text-rose-400 font-semibold uppercase mb-1">
              {L('Out', 'गया')}
            </p>
            <p className="text-base font-black text-rose-500 tabular-nums">
              {totalOut > 0 ? `−${fmt(totalOut)}` : '—'}
            </p>
          </div>
          <div
            className="rounded-2xl px-3 py-3"
            style={{ background: balance > 0 ? TRUST_BLUE[50] : '#f9fafb' }}
          >
            <p
              className="text-[10px] font-semibold uppercase mb-1"
              style={{ color: balance > 0 ? TRUST_BLUE[500] : '#6b7280' }}
            >
              {L('Balance', 'बचत')}
            </p>
            <p
              className="text-base font-black tabular-nums"
              style={{
                color:
                  balance > 0
                    ? TRUST_BLUE[600]
                    : balance < 0
                    ? '#f43f5e'
                    : '#d1d5db',
              }}
            >
              {balance === 0 && totalIn === 0 && totalOut === 0
                ? '—'
                : `${balance >= 0 ? '+' : '−'}${fmt(Math.abs(balance))}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Transaction list ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 flex flex-col gap-4">

        {grouped.length === 0 ? (
          <EmptyState L={L} />
        ) : (
          grouped.map(([date, txs]) => (
            <div key={date}>
              <div className="mb-2 px-1">
                <span className="text-xs font-bold text-gray-400">{formatDayHeader(date, language)}</span>
              </div>
              <TxList txs={txs} members={members} showMember onEdit={setEditTarget} L={L} />
            </div>
          ))
        )}
      </div>
      </>
      )}

      {/* Edit sheet */}
      {editTarget && (
        <EditTransactionSheet
          target={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Month picker sheet */}
      {showMonthPicker && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowMonthPicker(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[70vh] flex flex-col">
            {/* Handle + title */}
            <div className="shrink-0 pt-3 pb-3 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">
                  {L('Select Month', 'महीना चुनें')}
                </h3>
                <button
                  onClick={() => setShowMonthPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Month list grouped by year */}
            <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-4">
              {monthsByYear.map(([year, months]) => (
                <div key={year}>
                  <p className="text-xs font-bold text-gray-300 uppercase mb-2 px-1">{year}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((m) => {
                      const isSelected = m === selectedMonth;
                      const label = new Date(m + '-01').toLocaleString(
                        language === 'en' ? 'en-IN' : 'hi-IN',
                        { month: 'short' },
                      );
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setMonthIdx(allMonths.indexOf(m));
                            setShowMonthPicker(false);
                          }}
                          className={`h-10 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                            isSelected
                              ? 'bg-ink text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 shrink-0" />}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
