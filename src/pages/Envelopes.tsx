import { useState } from 'react';
import { useStore, type Category } from '../store/useStore';
import { getCat, CATEGORIES } from '../lib/categories';
import { ChevronDown, ChevronUp, Wifi, Users } from 'lucide-react';

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

export default function Envelopes() {
  const { expenses, envelopes, members, language, updateEnvelopeBudget, isPremium, setTab } = useStore();
  const [expanded, setExpanded] = useState<Category | null>(null);
  const [editing, setEditing]   = useState<Category | null>(null);
  const [editVal, setEditVal]   = useState('');

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth));

  const rows = CATEGORIES.map((cat) => {
    const env = envelopes.find((e) => e.id === cat.id)!;
    const txns = monthExpenses
      .filter((e) => e.category === cat.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const spent = txns.reduce((s, e) => s + e.amount, 0);
    const remaining = env.budget - spent;
    const pct = env.budget > 0 ? Math.min((spent / env.budget) * 100, 100) : 0;
    const isLow  = pct > 75 && pct < 100;
    const isOver = remaining < 0;
    return { cat, env, txns, spent, remaining, pct, isLow, isOver };
  });

  const totalBudget    = rows.reduce((s, r) => s + r.env.budget, 0);
  const totalSpent     = rows.reduce((s, r) => s + r.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  function startEdit(id: Category, current: number) {
    setEditing(id);
    setEditVal(String(current));
  }
  function commitEdit(id: Category) {
    const v = Number(editVal);
    if (v > 0) updateEnvelopeBudget(id, v);
    setEditing(null);
  }

  return (
    <div className="flex flex-col gap-4 pb-24 pt-10">
      {/* Header */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-0.5">
          <h2 className="text-xl font-bold text-gray-900">
            {language === 'en' ? 'Envelopes' : 'लिफ़ाफ़े'}
          </h2>
          {/* Real-time indicator */}
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Wifi className="w-2.5 h-2.5" />
            {language === 'en' ? 'Live' : 'लाइव'}
          </div>
        </div>
        <p className="text-xs text-gray-400">
          {language === 'en'
            ? 'Shared with family · updates in real-time'
            : 'परिवार के साथ साझा · रियल-टाइम अपडेट'}
        </p>
      </div>

      {/* Total summary bar */}
      <div className="px-4">
        <div className="bg-white rounded-2xl px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">
                {language === 'en' ? 'Total family budget' : 'कुल पारिवारिक बजट'}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-700">
              {fmt(totalSpent)} / {fmt(totalBudget)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
                background: totalRemaining < 0 ? '#f43f5e' : '#f97316',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">
              {Math.round((totalSpent / totalBudget) * 100)}%{' '}
              {language === 'en' ? 'used' : 'उपयोग'}
            </span>
            <span
              className={`text-[11px] font-bold ${totalRemaining >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {totalRemaining >= 0 ? fmt(totalRemaining) : '−' + fmt(Math.abs(totalRemaining))}{' '}
              {language === 'en' ? 'left' : 'बचा'}
            </span>
          </div>
        </div>
      </div>

      {/* Envelope cards */}
      <div className="px-4 flex flex-col gap-2">
        {rows.map(({ cat, env, txns, spent, remaining, pct, isLow, isOver }) => {
          const isExpanded = expanded === cat.id;
          const barColor = isOver ? '#f43f5e' : isLow ? '#f59e0b' : '#22c55e';

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl overflow-hidden"
            >
              {/* Envelope row */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : cat.id)}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: cat.bg }}
                >
                  {cat.icon}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-gray-800">
                      {language === 'en'
                        ? cat.id.charAt(0).toUpperCase() + cat.id.slice(1)
                        : cat.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isOver && (
                        <span className="text-[9px] bg-rose-100 text-rose-600 font-bold px-1.5 py-0.5 rounded-full">
                          {language === 'en' ? 'OVER' : 'पार'}
                        </span>
                      )}
                      {isLow && !isOver && (
                        <span className="text-[9px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full">
                          {language === 'en' ? 'LOW' : 'कम'}
                        </span>
                      )}
                      <span
                        className="text-sm font-black"
                        style={{ color: isOver ? '#f43f5e' : isLow ? '#f59e0b' : '#22c55e' }}
                      >
                        {remaining >= 0 ? fmt(remaining) : '−' + fmt(Math.abs(remaining))}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-400">
                      {fmt(spent)} {language === 'en' ? 'spent' : 'खर्च'}
                    </span>
                    {/* Budget edit */}
                    {editing === cat.id ? (
                      <input
                        autoFocus
                        type="number"
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        onBlur={() => commitEdit(cat.id)}
                        onKeyDown={(e) => e.key === 'Enter' && commitEdit(cat.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-gray-500 bg-gray-100 rounded px-1 w-20 outline-none text-right"
                      />
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(cat.id, env.budget); }}
                        className="text-[10px] text-gray-300 hover:text-brand-500 transition-colors"
                      >
                        {fmt(env.budget)} {language === 'en' ? 'budget' : 'बजट'} ✏️
                      </button>
                    )}
                  </div>
                </div>

                {/* Chevron */}
                <div className="text-gray-300 shrink-0">
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                </div>
              </button>

              {/* Expanded: transaction list with who spent */}
              {isExpanded && (
                <div className="border-t border-gray-50">
                  {txns.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-4">
                      {language === 'en' ? 'No spending yet' : 'अभी कोई खर्च नहीं'}
                    </p>
                  ) : (
                    txns.map((tx) => {
                      const member = members.find((m) => m.id === tx.memberId);
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50"
                        >
                          {/* Member avatar */}
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: member?.color ?? '#9ca3af' }}
                          >
                            {member?.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">
                              {tx.note}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {member?.name} · {timeAgo(tx.date)}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-rose-500 shrink-0">
                            −{fmt(tx.amount)}
                          </span>
                        </div>
                      );
                    })
                  )}

                  {/* Add to this envelope shortcut */}
                  <button
                    onClick={() => { useStore.setState({ currentTab: 'add' }); }}
                    className="w-full py-2.5 text-xs text-brand-500 font-semibold bg-brand-50/50 active:bg-brand-50 transition-colors"
                  >
                    + {language === 'en' ? `Add to ${cat.id}` : `${cat.id} में जोड़ें`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Real-time family activity feed */}
      <div className="px-4">
        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <p className="text-xs text-white/60 font-semibold uppercase">
              {language === 'en' ? 'Family Activity' : 'परिवार की गतिविधि'}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {expenses.slice(0, 4).map((tx) => {
              const member = members.find((m) => m.id === tx.memberId);
              const cat = getCat(tx.category);
              return (
                <div key={tx.id} className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: member?.color ?? '#9ca3af' }}
                  >
                    {member?.avatar}
                  </div>
                  <span className="text-xs text-white/70 flex-1">
                    <span className="text-white font-semibold">{member?.name}</span>{' '}
                    {language === 'en' ? 'spent' : 'ने खर्च किया'}{' '}
                    <span className="text-rose-400 font-semibold">{fmt(tx.amount)}</span>{' '}
                    {language === 'en' ? 'from' : 'से'}{' '}
                    <span className="text-white/80">{cat.icon} {tx.category}</span>
                  </span>
                  <span className="text-[10px] text-white/30 shrink-0">{timeAgo(tx.date)}</span>
                </div>
              );
            })}
          </div>
          {!isPremium && (
            <button
              onClick={() => setTab('premium')}
              className="mt-3 w-full py-2 bg-brand-500/20 text-brand-400 text-xs font-bold rounded-xl active:scale-95"
            >
              {language === 'en' ? 'Unlock real-time sync → Pro' : 'रियल-टाइम सिंक अनलॉक → प्रो'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
