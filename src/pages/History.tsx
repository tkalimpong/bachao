import { useState, useMemo } from 'react';
import { useStore, type Expense, type Income } from '../store/useStore';
import { getCat } from '../lib/categories';
import { Search, X, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import EditTransactionSheet from '../components/EditTransactionSheet';

const SOURCE_ICONS: Record<string, string> = {
  salary: '💼', freelance: '💻', business: '🏪', gift: '🎁', rent: '🏠', other_income: '💰',
};

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

export default function History() {
  const { expenses, incomes, members, language } = useStore();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Build sorted list of unique months (desc)
  const allMonths = useMemo(() => {
    const seen = new Set<string>();
    [...expenses, ...incomes].forEach((t) => {
      seen.add(t.date.slice(0, 7));
    });
    return Array.from(seen).sort((a, b) => b.localeCompare(a));
  }, [expenses, incomes]);

  const [monthIdx, setMonthIdx] = useState(0);
  const selectedMonth = allMonths[monthIdx] ?? new Date().toISOString().slice(0, 7);

  // Merge and filter all transactions
  type TxEntry =
    | { kind: 'expense'; data: Expense }
    | { kind: 'income';  data: Income };

  const filtered = useMemo<TxEntry[]>(() => {
    const merged: TxEntry[] = [
      ...expenses.map((e) => ({ kind: 'expense' as const, data: e })),
      ...incomes.map((i)  => ({ kind: 'income'  as const, data: i })),
    ];

    return merged
      .filter((t) => t.data.date.startsWith(selectedMonth))
      .filter((t) => typeFilter === 'all' || t.kind === typeFilter)
      .filter((t) => memberFilter === 'all' || t.data.memberId === memberFilter)
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        if (t.kind === 'expense') {
          return (
            t.data.note.toLowerCase().includes(q) ||
            t.data.category.toLowerCase().includes(q)
          );
        } else {
          return (
            t.data.note.toLowerCase().includes(q) ||
            (t.data as Income).source.toLowerCase().includes(q)
          );
        }
      })
      .sort((a, b) => b.data.date.localeCompare(a.data.date));
  }, [expenses, incomes, selectedMonth, typeFilter, memberFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, TxEntry[]>();
    for (const tx of filtered) {
      const d = tx.data.date;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(tx);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  // Monthly totals (filtered by type/member/search)
  const totalOut = filtered
    .filter((t) => t.kind === 'expense')
    .reduce((s, t) => s + t.data.amount, 0);
  const totalIn = filtered
    .filter((t) => t.kind === 'income')
    .reduce((s, t) => s + t.data.amount, 0);

  const L = (en: string, hi: string) => language === 'en' ? en : hi;

  return (
    <div className="flex flex-col pb-24">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white pt-10 pb-3 px-5 sticky top-0 z-20 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900 mb-3">
          {L('History', 'इतिहास')}
        </h1>

        {/* Month navigator */}
        <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-3 py-2 mb-3">
          <button
            onClick={() => setMonthIdx((i) => Math.min(i + 1, allMonths.length - 1))}
            disabled={monthIdx >= allMonths.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-gray-200 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm font-bold text-gray-800">
            {formatMonthKey(selectedMonth, language)}
          </span>
          <button
            onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
            disabled={monthIdx <= 0}
            className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-gray-200 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

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
                    : 'bg-gray-900 text-white'
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

        {/* Member filter */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setMemberFilter('all')}
            className={`shrink-0 h-7 px-3 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              memberFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
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
      </div>

      {/* ── Monthly summary ─────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-2xl px-4 py-3">
            <p className="text-[10px] text-emerald-500 font-semibold uppercase mb-1">
              {L('In', 'आया')}
            </p>
            <p className="text-lg font-black text-emerald-600">+{fmt(totalIn)}</p>
          </div>
          <div className="bg-rose-50 rounded-2xl px-4 py-3">
            <p className="text-[10px] text-rose-400 font-semibold uppercase mb-1">
              {L('Out', 'गया')}
            </p>
            <p className="text-lg font-black text-rose-500">−{fmt(totalOut)}</p>
          </div>
        </div>
      </div>

      {/* ── Transaction list ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 flex flex-col gap-4">
        {grouped.length === 0 ? (
          <div className="bg-white rounded-2xl px-4 py-10 flex flex-col items-center gap-2">
            <span className="text-4xl">🔍</span>
            <p className="text-sm text-gray-400 font-medium">
              {L('No transactions found', 'कोई लेनदेन नहीं मिला')}
            </p>
          </div>
        ) : (
          grouped.map(([date, txs]) => {
            const dayOut = txs.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.data.amount, 0);
            const dayIn  = txs.filter((t) => t.kind === 'income').reduce((s, t) => s + t.data.amount, 0);

            return (
              <div key={date}>
                {/* Day header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-gray-400">
                    {formatDayHeader(date, language)}
                  </span>
                  <div className="flex items-center gap-2">
                    {dayIn > 0 && (
                      <span className="text-xs font-bold text-emerald-500">+{fmt(dayIn)}</span>
                    )}
                    {dayOut > 0 && (
                      <span className="text-xs font-bold text-rose-400">−{fmt(dayOut)}</span>
                    )}
                  </div>
                </div>

                {/* Transactions */}
                <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
                  {txs.map(({ kind, data }) => {
                    const member = members.find((m) => m.id === data.memberId);
                    if (kind === 'expense') {
                      const cat = getCat((data as Expense).category);
                      return (
                        <button
                          key={data.id}
                          onClick={() => setEditTarget({ kind: 'expense', data: data as Expense })}
                          className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
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
                          onClick={() => setEditTarget({ kind: 'income', data: data as Income })}
                          className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                            style={{ background: member?.color ?? '#9ca3af' }}
                          >
                            {member?.avatar ?? '?'}
                          </div>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-50">
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {data.note || L('(no note)', '(नोट नहीं)')}
                            </p>
                            <p className="text-[10px] text-gray-300 capitalize">{(data as Income).source.replace('_', ' ')}</p>
                          </div>
                          <span className="text-sm font-black text-emerald-500 shrink-0">+{fmt(data.amount)}</span>
                          <Pencil className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                        </button>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit sheet */}
      {editTarget && (
        <EditTransactionSheet
          target={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
