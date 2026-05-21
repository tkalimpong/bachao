import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  ChevronLeft, ChevronRight, ChevronDown, X, Check, History,
} from 'lucide-react';
import {
  ROLE_ICONS,
  canViewGroupFinances,
  getMemberRole,
  roleLabel,
} from '../lib/permissions';

function fmt(n: number) {
  return '₹' + Math.abs(n).toLocaleString('en-IN');
}

function formatMonthKey(key: string, lang: 'en' | 'hi') {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN', { month: 'long', year: 'numeric' });
}

export default function Family() {
  const {
    members, expenses, incomes, language, setTab,
    setHistoryNavigateMonth, currentUserId, setCurrentUserId,
  } = useStore();
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const L = (en: string, hi: string) => (language === 'en' ? en : hi);
  const myRole = getMemberRole(members, currentUserId);
  const showGroup = myRole ? canViewGroupFinances(myRole) : false;

  const allMonths = useMemo(() => {
    const seen = new Set<string>();
    [...expenses, ...incomes].forEach((t) => seen.add(t.date.slice(0, 7)));
    seen.add(new Date().toISOString().slice(0, 7));
    return Array.from(seen).sort((a, b) => b.localeCompare(a));
  }, [expenses, incomes]);

  const [monthIdx, setMonthIdx] = useState(0);
  const selectedMonth = allMonths[monthIdx] ?? new Date().toISOString().slice(0, 7);
  const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);

  const monthsByYear = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of allMonths) {
      const y = m.slice(0, 4);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allMonths]);

  const memberStats = useMemo(() => {
    const monthExp = expenses.filter((e) => e.date.startsWith(selectedMonth));
    const monthInc = incomes.filter((i) => i.date.startsWith(selectedMonth));
    const list = showGroup
      ? members
      : members.filter((m) => m.id === currentUserId);
    return list.map((m) => {
      const earned = monthInc.filter((i) => i.memberId === m.id).reduce((s, i) => s + i.amount, 0);
      const spent = monthExp.filter((e) => e.memberId === m.id).reduce((s, e) => s + e.amount, 0);
      const count =
        monthExp.filter((e) => e.memberId === m.id).length +
        monthInc.filter((i) => i.memberId === m.id).length;
      return { member: m, earned, spent, balance: earned - spent, count };
    });
  }, [members, expenses, incomes, selectedMonth, showGroup, currentUserId]);

  const familyTotal = useMemo(() => {
    const earned = memberStats.reduce((s, r) => s + r.earned, 0);
    const spent = memberStats.reduce((s, r) => s + r.spent, 0);
    return { earned, spent, balance: earned - spent };
  }, [memberStats]);

  function goToHistory() {
    setHistoryNavigateMonth(selectedMonth);
    setTab('history');
  }

  return (
    <div className="flex flex-col gap-4 pb-24 pt-10">
      <div className="px-5">
        <h2 className="text-xl font-bold text-gray-900">{L('Family', 'परिवार')}</h2>
      </div>

      {/* Current user (demo / multi-role testing) */}
      <div className="px-4">
        <p className="text-[10px] text-gray-400 font-semibold uppercase ml-1 mb-2">
          {L('Signed in as', 'लॉगिन')}
        </p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setCurrentUserId(m.id)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95 ${
                currentUserId === m.id ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 shadow-sm'
              }`}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: m.color }}
              >
                {m.avatar}
              </div>
              <span className="text-xs font-bold">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Month navigator */}
      <div className="px-4">
        <div className="flex items-center justify-between bg-white rounded-2xl px-3 py-2 shadow-sm">
          <button
            onClick={() => setMonthIdx((i) => Math.min(i + 1, allMonths.length - 1))}
            disabled={monthIdx >= allMonths.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setShowMonthPicker(true)}
            className="flex flex-col items-center active:opacity-70"
          >
            <span className="text-sm font-bold text-gray-800 flex items-center gap-1">
              {formatMonthKey(selectedMonth, language)}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </span>
            {!isCurrentMonth && (
              <span className="text-[10px] text-brand-500 font-semibold">
                {L('Past month', 'पिछला महीना')}
              </span>
            )}
          </button>
          <button
            onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
            disabled={monthIdx <= 0}
            className="w-8 h-8 flex items-center justify-center rounded-xl active:bg-gray-100 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Family total — owner & partner only */}
      {showGroup && (
        <div className="px-4">
          <div className="bg-gray-900 rounded-2xl p-4 text-white">
            <p className="text-[10px] text-white/50 font-semibold uppercase mb-2">
              {L('Family total', 'परिवार कुल')}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] text-emerald-400 font-bold uppercase mb-0.5">{L('Income', 'आय')}</p>
                <p className="text-sm font-black text-emerald-400">
                  {familyTotal.earned > 0 ? `+${fmt(familyTotal.earned)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-rose-300 font-bold uppercase mb-0.5">{L('Expense', 'खर्च')}</p>
                <p className="text-sm font-black text-rose-400">
                  {familyTotal.spent > 0 ? `−${fmt(familyTotal.spent)}` : '—'}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-white/50 font-bold uppercase mb-0.5">{L('Balance', 'बचत')}</p>
                <p className={`text-sm font-black ${familyTotal.balance >= 0 ? 'text-white' : 'text-rose-300'}`}>
                  {familyTotal.balance === 0 && familyTotal.earned === 0 && familyTotal.spent === 0
                    ? '—'
                    : `${familyTotal.balance >= 0 ? '+' : '−'}${fmt(familyTotal.balance)}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members overview */}
      <div className="px-4">
        <p className="text-xs text-gray-400 font-semibold uppercase mb-2 ml-1">
          {showGroup ? L('All members', 'सभी सदस्य') : L('Your summary', 'आपका सारांश')}
        </p>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-4 py-2 border-b border-gray-100 bg-gray-50/80">
            <span className="text-[9px] font-bold text-gray-400 uppercase">{L('Member', 'सदस्य')}</span>
            <span className="text-[9px] font-bold text-emerald-500 uppercase text-right w-14">{L('In', 'आय')}</span>
            <span className="text-[9px] font-bold text-rose-400 uppercase text-right w-14">{L('Out', 'खर्च')}</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase text-right w-14">{L('Bal.', 'बचत')}</span>
          </div>

          <div className="divide-y divide-gray-50">
            {memberStats.map(({ member: m, earned, spent, balance, count }) => (
              <div key={m.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 items-center px-4 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                      style={{ background: m.color }}
                    >
                      {m.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                      {(() => {
                        const RoleIcon = ROLE_ICONS[m.role];
                        return (
                          <div
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold mt-0.5"
                            style={
                              m.role === 'owner'
                                ? { background: m.color + '22', color: m.color }
                                : { background: '#f3f4f6', color: '#6b7280' }
                            }
                          >
                            <RoleIcon className="w-2.5 h-2.5" />
                            {roleLabel(m.role, language)}
                          </div>
                        );
                      })()}
                      {count > 0 && (
                        <p className="text-[10px] text-gray-300 mt-0.5">
                          {count} {L('txns', 'लेनदेन')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 text-right w-14 tabular-nums">
                    {earned > 0 ? `+${fmt(earned)}` : '—'}
                  </span>
                  <span className="text-xs font-bold text-rose-500 text-right w-14 tabular-nums">
                    {spent > 0 ? `−${fmt(spent)}` : '—'}
                  </span>
                  <span
                    className={`text-xs font-black text-right w-14 tabular-nums ${
                      balance > 0 ? 'text-gray-900' : balance < 0 ? 'text-rose-500' : 'text-gray-300'
                    }`}
                  >
                    {earned === 0 && spent === 0 ? '—' : `${balance >= 0 ? '+' : '−'}${fmt(balance)}`}
                  </span>
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* Link to History */}
      <div className="px-4">
        <button
          onClick={goToHistory}
          className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-brand-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900">
              {showGroup
                ? L('View transaction history', 'लेनदेन इतिहास देखें')
                : L('View my history', 'मेरा इतिहास देखें')}
            </p>
            <p className="text-xs text-gray-400">
              {showGroup
                ? L('Browse & edit by date', 'तारीख से देखें और संपादित करें')
                : L('Browse & edit your records', 'अपने रिकॉर्ड देखें और संपादित करें')}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-brand-400 shrink-0" />
        </button>
      </div>

      {showMonthPicker && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowMonthPicker(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[70vh] flex flex-col">
            <div className="shrink-0 pt-3 pb-3 px-5 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">{L('Select Month', 'महीना चुनें')}</h3>
                <button
                  onClick={() => setShowMonthPicker(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
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
                          className={`h-10 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5 active:scale-95 ${
                            isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
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
