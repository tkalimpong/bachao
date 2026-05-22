import { useState } from 'react';
import { useStore } from '../store/useStore';
import { t } from '../lib/i18n';
import { getCat, getVisibleCategories } from '../lib/categories';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip,
} from 'recharts';

function fmt(n: number) {
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'k';
  return '₹' + n;
}

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Reports() {
  const { expenses, language, hiddenCategories } = useStore();
  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth));

  // Category breakdown
  const catTotals = monthExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const pieData = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([catId, value]) => ({ catId, value, ...getCat(catId as any) }));

  // Weekly bar chart (last 7 days)
  const weekData = WEEK_LABELS.map((day, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const total = expenses
      .filter((e) => e.date === dateStr)
      .reduce((s, e) => s + e.amount, 0);
    return { day, total };
  });

  // Monthly bar chart (last 6 months)
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const ym = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('en-IN', { month: 'short' });
    const total = expenses
      .filter((e) => e.date.startsWith(ym))
      .reduce((s, e) => s + e.amount, 0);
    return { label, total };
  });

  const barData = view === 'weekly' ? weekData.map((d) => ({ label: d.day, total: d.total })) : monthlyData;
  const totalThisMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const avgPerDay = monthExpenses.length
    ? Math.round(totalThisMonth / new Date().getDate())
    : 0;

  return (
    <div className="flex flex-col gap-4 pb-24 pt-10">
      <div className="px-5 mb-1">
        <h2 className="text-2xl font-bold text-gray-900">
          {language === 'en' ? 'Reports' : 'रिपोर्ट'}
        </h2>
      </div>

      {/* Summary stats */}
      <div className="px-4 grid grid-cols-3 gap-2">
        {[
          { label: language === 'en' ? 'This Month' : 'इस माह', value: fmt(totalThisMonth), color: '#2563eb' },
          { label: language === 'en' ? 'Daily Avg' : 'प्रतिदिन', value: fmt(avgPerDay), color: '#8b5cf6' },
          { label: language === 'en' ? 'Entries' : 'एंट्री', value: String(monthExpenses.length), color: '#22c55e' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl px-3 py-4 flex flex-col items-center gap-1">
            <span className="text-lg font-bold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-xs text-gray-400 text-center">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toggle */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-1 flex gap-1">
          {(['monthly', 'weekly'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === v ? 'bg-brand-500 text-white' : 'text-gray-400'
              }`}
            >
              {t(language, v)}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm text-gray-400 font-semibold uppercase mb-3">
            {language === 'en' ? 'Spending Trend' : 'खर्च का ट्रेंड'}
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barSize={view === 'weekly' ? 20 : 16}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [fmt(Number(v)), '']}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie chart */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-sm text-gray-400 font-semibold uppercase mb-3">
            {t(language, 'categories')}
          </p>
          <div className="flex items-center gap-4">
            <PieChart width={120} height={120}>
              <Pie
                data={pieData}
                cx={55}
                cy={55}
                innerRadius={32}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.catId} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex flex-col gap-1.5 flex-1">
              {pieData.map((d) => (
                <div key={d.catId} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: d.color }}
                  />
                  <span className="text-xs text-gray-600 flex-1">{d.icon} {t(language, d.catId as any)}</span>
                  <span className="text-xs font-bold text-gray-800">{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category list */}
      <div className="px-4">
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
          {getVisibleCategories(hiddenCategories).filter((c) => catTotals[c.id]).map((cat) => {
            const amt = catTotals[cat.id] ?? 0;
            const pct = (amt / totalThisMonth) * 100;
            return (
              <div key={cat.id} className="px-4 py-3 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ background: cat.bg }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-800">{t(language, cat.id as any)}</span>
                    <span className="text-xs font-bold text-gray-700">₹{amt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: cat.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
