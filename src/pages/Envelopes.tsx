import { useState } from 'react';
import { useStore, type Category, type Expense } from '../store/useStore';
import { isFirebaseConfigured } from '../lib/firebase';
import { getCat, CATEGORIES, CATEGORY_LABELS } from '../lib/categories';
import { ChevronDown, ChevronUp, Wifi, WifiOff, Users, Lock, Percent, PiggyBank, Pencil } from 'lucide-react';
import EditTransactionSheet from '../components/EditTransactionSheet';
import SubScreenHeader from '../components/SubScreenHeader';
import { canViewGroupFinances, getMemberRole } from '../lib/permissions';

const CAT_LABELS = CATEGORY_LABELS;

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
  const {
    expenses, members, language,
    syncStatus, setTab,
    allocationRules, setAllocationRule, currentUserId,
  } = useStore();

  const [expanded, setExpanded]       = useState<Category | null>(null);
  const [editTx, setEditTx]           = useState<Expense | null>(null);
  const [rulesOpen, setRulesOpen]     = useState(false);
  const [ruleVals, setRuleVals]       = useState<Record<string, string>>(
    () => Object.fromEntries(CATEGORIES.map((c) => [c.id, String(allocationRules[c.id] ?? 0)])),
  );

  const totalRulePct = CATEGORIES.reduce((s, c) => s + (Number(ruleVals[c.id]) || 0), 0);
  const savingsPct   = Math.max(100 - totalRulePct, 0);

  function commitRule(id: Category) {
    const v = Math.max(0, Math.min(100, Number(ruleVals[id]) || 0));
    setRuleVals((p) => ({ ...p, [id]: String(v) }));
    setAllocationRule(id, v);
  }

  function distributeEvenlyRules() {
    const each = Math.floor(100 / CATEGORIES.length);
    const newVals = Object.fromEntries(CATEGORIES.map((c) => [c.id, String(each)]));
    setRuleVals(newVals);
    CATEGORIES.forEach((c) => setAllocationRule(c.id, each));
  }

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth));

  const allTimeTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const firstExpenseDate = expenses.length > 0
    ? new Date(expenses.map((e) => e.date).sort()[0])
    : new Date();
  const elapsedDays = Math.max(
    Math.ceil((Date.now() - firstExpenseDate.getTime()) / 86400000),
    30,
  );
  const avg30d = Math.round(allTimeTotal / (elapsedDays / 30));

  function catAvg30d(catId: string) {
    const catTotal = expenses
      .filter((e) => e.category === catId)
      .reduce((s, e) => s + e.amount, 0);
    return Math.round(catTotal / (elapsedDays / 30));
  }

  const rows = CATEGORIES.map((cat) => {
    const txns = monthExpenses
      .filter((e) => e.category === cat.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const spent = txns.reduce((s, e) => s + e.amount, 0);
    const avg   = catAvg30d(cat.id);
    const pct   = avg > 0 ? Math.min((spent / avg) * 100, 110) : 0;
    const isOver = avg > 0 && spent > avg;
    const isWarn = avg > 0 && pct >= 75 && !isOver;
    return { cat, txns, spent, avg, pct, isWarn, isOver };
  });

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);

  const myRole = getMemberRole(members, currentUserId);
  if (myRole && !canViewGroupFinances(myRole)) {
    const L = (en: string, hi: string) => (language === 'en' ? en : hi);
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 pt-24 pb-24 text-center">
        <Lock className="w-12 h-12 text-gray-300" />
        <p className="text-sm font-semibold text-gray-600">
          {L('Group envelopes are not available for your role.', 'आपकी भूमिका के लिए समूह लिफ़ाफ़े उपलब्ध नहीं हैं।')}
        </p>
        <button
          onClick={() => setTab('settings')}
          className="text-sm font-bold text-brand-500 active:opacity-70"
        >
          {L('Back to Settings →', 'सेटिंग पर वापस →')}
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-4 pb-24">
      <SubScreenHeader
        title={language === 'en' ? 'Envelopes' : 'लिफ़ाफ़े'}
        onBack={() => setTab('settings')}
      />
      <div className="px-5 -mt-2">
        <div className="flex items-center gap-2 mb-0.5">
          {/* Real-time sync indicator */}
          {syncStatus === 'live' && (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Wifi className="w-2.5 h-2.5" />
              {language === 'en' ? 'Live' : 'लाइव'}
            </div>
          )}
          {syncStatus === 'connecting' && (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              <Wifi className="w-2.5 h-2.5" />
              {language === 'en' ? 'Syncing…' : 'सिंक हो रहा है…'}
            </div>
          )}
          {syncStatus === 'offline' && isFirebaseConfigured && (
            <div className="flex items-center gap-1 bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <WifiOff className="w-2.5 h-2.5" />
              {language === 'en' ? 'Offline' : 'ऑफ़लाइन'}
            </div>
          )}
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
                {language === 'en' ? 'Spent this month' : 'इस माह का खर्च'}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-700">
              {fmt(totalSpent)} / {avg30d > 0 ? fmt(avg30d) : '–'}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: avg30d > 0 ? `${Math.min((totalSpent / avg30d) * 100, 100)}%` : '0%',
                background: totalSpent > avg30d ? '#f43f5e' : '#f59e0b',
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-gray-400">
              {avg30d > 0
                ? `${Math.round(Math.min((totalSpent / avg30d) * 100, 110))}% ${language === 'en' ? 'of 30d avg' : '30d औसत का'}`
                : ''}
            </span>
            <span className="text-[11px] font-bold text-gray-400">
              {language === 'en' ? '30d avg' : '30d औसत'}
            </span>
          </div>
        </div>
      </div>

      {/* Envelope cards */}
      <div className="px-4 flex flex-col gap-2">
        {rows.map(({ cat, txns, spent, avg, pct, isWarn, isOver }) => {
          const isExpanded = expanded === cat.id;
          const barColor = isOver ? '#f43f5e' : isWarn ? '#f59e0b' : '#22c55e';

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
                      {isWarn && (
                        <span className="text-[9px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full">
                          {language === 'en' ? 'NEAR' : 'पास'}
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
                    <span className="text-[10px] text-gray-400">
                      {avg > 0
                        ? `${fmt(spent)} / ${fmt(avg)} ${language === 'en' ? '30d avg' : '30d औसत'}`
                        : spent > 0
                        ? fmt(spent)
                        : language === 'en' ? 'no history' : 'कोई इतिहास नहीं'}
                    </span>
                    {txns.length > 0 && (
                      <span className="text-[10px] text-gray-300">
                        {txns.length} {language === 'en' ? 'txns' : 'लेनदेन'}
                      </span>
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
                              {tx.note || (language === 'en' ? '(no note)' : '(メモなし)')}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {member?.name} · {timeAgo(tx.date)}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-rose-500 shrink-0">
                            −{fmt(tx.amount)}
                          </span>
                          <Pencil className="w-3 h-3 text-gray-300 shrink-0" />
                        </button>
                      );
                    })
                  )}

                  {/* Add to this envelope shortcut */}
                  <button
                    onClick={() => { setTab('add', 'expense'); }}
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

      {/* ── 収入配分ルール設定 ── */}
      <div className="px-4">
        <button
          onClick={() => setRulesOpen((o) => !o)}
          className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-800">
              {language === 'en' ? 'Allocation Rules' : 'आय वितरण नियम'}
            </p>
            <p className="text-xs text-gray-400">
              {language === 'en'
                ? `Auto-split income by % · ${savingsPct}% → savings`
                : `% से स्वचालित बाँटें · ${savingsPct}% → बचत`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                totalRulePct === 100
                  ? 'bg-emerald-100 text-emerald-600'
                  : totalRulePct > 100
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {totalRulePct}%
            </span>
            {rulesOpen ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
          </div>
        </button>

        {rulesOpen && (
          <div className="bg-white rounded-2xl mt-1 overflow-hidden border border-gray-50">
            {/* total bar */}
            <div className="px-4 pt-3 pb-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-gray-400 font-semibold uppercase">
                  {language === 'en' ? 'Total allocation' : 'कुल आवंटन'}
                </span>
                <span
                  className={`text-xs font-black ${
                    totalRulePct > 100
                      ? 'text-rose-500'
                      : totalRulePct === 100
                      ? 'text-emerald-500'
                      : 'text-amber-500'
                  }`}
                >
                  {totalRulePct}% / 100%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(totalRulePct, 100)}%`,
                    background: totalRulePct > 100 ? '#f43f5e' : totalRulePct === 100 ? '#22c55e' : '#f59e0b',
                  }}
                />
              </div>
              {totalRulePct !== 100 && (
                <p className={`text-[10px] text-right font-medium ${totalRulePct > 100 ? 'text-rose-400' : 'text-amber-500'}`}>
                  {totalRulePct > 100
                    ? (language === 'en' ? `${totalRulePct - 100}% over! Reduce to continue` : `${totalRulePct - 100}% ज़्यादा!`)
                    : (language === 'en' ? `${100 - totalRulePct}% unassigned → savings` : `${100 - totalRulePct}% बचत में जाएगा`)}
                </p>
              )}
            </div>

            {/* distribute evenly */}
            <div className="px-4 py-2">
              <button
                onClick={distributeEvenlyRules}
                className="w-full py-2 bg-gray-50 rounded-xl text-xs font-semibold text-gray-500 active:scale-95 transition-transform"
              >
                {language === 'en' ? '⚡ Distribute evenly (10% each)' : '⚡ बराबर बाँटें (10% प्रत्येक)'}
              </button>
            </div>

            {/* per-category % inputs */}
            <div className="flex flex-col divide-y divide-gray-50">
              {CATEGORIES.map((cat) => {
                const label = CAT_LABELS[cat.id];
                const val   = ruleVals[cat.id] ?? '0';
                const num   = Number(val) || 0;
                return (
                  <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: cat.bg }}
                    >
                      {cat.icon}
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-700">
                      {label ? (language === 'en' ? label.en : label.hi) : cat.id}
                    </span>
                    {/* mini bar */}
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(num, 100)}%`,
                          background: num > 0 ? cat.color : '#e5e7eb',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="100"
                        value={val}
                        onChange={(e) => setRuleVals((p) => ({ ...p, [cat.id]: e.target.value }))}
                        onBlur={() => commitRule(cat.id)}
                        onKeyDown={(e) => e.key === 'Enter' && commitRule(cat.id)}
                        className="w-12 text-right text-sm font-bold text-gray-900 bg-gray-50 rounded-lg px-2 py-1 outline-none"
                      />
                      <span className="text-xs text-gray-400 font-semibold">%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* savings row */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-teal-50/60 border-t border-teal-100">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <PiggyBank className="w-4 h-4 text-teal-600" />
              </div>
              <span className="flex-1 text-sm font-medium text-teal-700">
                {language === 'en' ? 'Savings (auto)' : 'बचत (स्वतः)'}
              </span>
              <span className="text-sm font-black text-teal-600">
                {savingsPct}%
              </span>
            </div>
          </div>
        )}
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
          {!isFirebaseConfigured && (
            <button
              onClick={() => setTab('premium')}
              className="mt-3 w-full py-2 bg-brand-500/20 text-brand-400 text-xs font-bold rounded-xl active:scale-95"
            >
              {language === 'en' ? 'Enable real-time sync → Setup' : 'रियल-टाइम सिंक चालू करें → सेटअप'}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Edit transaction sheet */}
    {editTx && (
      <EditTransactionSheet
        target={{ kind: 'expense', data: editTx }}
        onClose={() => setEditTx(null)}
      />
    )}
    </>
  );
}
