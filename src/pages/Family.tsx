import { useStore } from '../store/useStore';
import { getCat } from '../lib/categories';
import { UserPlus, Crown, Shield, User } from 'lucide-react';

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

const MEMBER_BUDGET: Record<string, number> = { m1: 15000, m2: 10000, m3: 3000 };

const roleIcons = { owner: Crown, adult: Shield, child: User };

export default function Family() {
  const { members, expenses, incomes, language, isPremium, setTab } = useStore();

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth));
  const monthIncomes  = incomes.filter((i) => i.date.startsWith(thisMonth));

  return (
    <div className="flex flex-col gap-4 pb-24 pt-10">
      <div className="px-5 flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Family' : 'परिवार'}
        </h2>
        <button
          onClick={() => !isPremium && setTab('premium')}
          className="flex items-center gap-1.5 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5" />
          {language === 'en' ? 'Invite' : 'जोड़ें'}
        </button>
      </div>

      {/* Member cards */}
      <div className="px-4 flex flex-col gap-3">
        {members.map((m) => {
          const RoleIcon = roleIcons[m.role];
          const memberBudget   = MEMBER_BUDGET[m.id] ?? 10000;
          const memberExpenses = monthExpenses.filter((e) => e.memberId === m.id);
          const memberIncomes  = monthIncomes.filter((i) => i.memberId === m.id);
          const spent   = memberExpenses.reduce((s, e) => s + e.amount, 0);
          const earned  = memberIncomes.reduce((s, i) => s + i.amount, 0);
          const pct     = Math.min((spent / memberBudget) * 100, 100);
          const topExpenses = [...memberExpenses]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3);

          return (
            <div key={m.id} className="bg-white rounded-2xl p-4">
              {/* Member header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-lg shrink-0"
                  style={{ background: m.color }}
                >
                  {m.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900">{m.name}</span>
                    <div
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: m.color + '22', color: m.color }}
                    >
                      <RoleIcon className="w-2.5 h-2.5" />
                      {language === 'en' ? m.role : { owner: 'मुखिया', adult: 'बड़े', child: 'बच्चा' }[m.role]}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-0.5">
                    {earned > 0 && (
                      <p className="text-xs text-emerald-500 font-semibold">+{fmt(earned)}</p>
                    )}
                    <p className="text-xs text-gray-400">{fmt(spent)} {language === 'en' ? 'spent' : 'खर्च'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{language === 'en' ? 'left' : 'बचा'}</p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: spent > memberBudget ? '#ef4444' : '#22c55e' }}
                  >
                    {fmt(Math.max(memberBudget - spent, 0))}
                  </p>
                </div>
              </div>

              {/* Budget bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: spent > memberBudget ? '#ef4444' : m.color,
                  }}
                />
              </div>

              {/* Top expenses */}
              {topExpenses.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {topExpenses.map((e) => {
                    const cat = getCat(e.category);
                    return (
                      <div key={e.id} className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-xs text-gray-600 flex-1 truncate">{e.note}</span>
                        <span className="text-xs font-semibold text-rose-500">−{fmt(e.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add member CTA */}
      {!isPremium && (
        <div className="px-4">
          <button
            onClick={() => setTab('premium')}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:scale-95 transition-transform border-2 border-dashed border-gray-200"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-gray-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-500">
                {language === 'en' ? 'Add more members' : 'और सदस्य जोड़ें'}
              </p>
              <p className="text-xs text-brand-500 font-semibold">
                {language === 'en' ? 'Upgrade to Bachao Pro →' : 'बचाओ प्रो अपग्रेड करें →'}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* UPI link banner */}
      <div className="px-4">
        <div className="bg-brand-500 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-xl">💳</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">
              {language === 'en' ? 'Link UPI' : 'UPI जोड़ें'}
            </p>
            <p className="text-white/70 text-xs">
              {language === 'en' ? 'Auto-import UPI transactions' : 'UPI लेन-देन स्वत: जोड़ें'}
            </p>
          </div>
          <button
            onClick={() => setTab('premium')}
            className="bg-white text-brand-600 text-xs font-bold px-3 py-1.5 rounded-full active:scale-95"
          >
            {language === 'en' ? 'Coming Soon' : 'जल्द आ रहा'}
          </button>
        </div>
      </div>
    </div>
  );
}
