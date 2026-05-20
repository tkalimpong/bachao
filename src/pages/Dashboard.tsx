import { useStore } from '../store/useStore';
import { getCat, CATEGORIES } from '../lib/categories';
import { Globe, TrendingDown, TrendingUp, Minus } from 'lucide-react';

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

const SOURCE_ICONS: Record<string, string> = {
  salary: '💼', freelance: '💻', business: '🏪', gift: '🎁', rent: '🏠', other_income: '💰',
};

// ── SVG circular gauge ──────────────────────────────────────────────────────
// リングは「残高」を表す。
//   100% 残高 → 緑の満タンリング
//   40% 以下  → オレンジに変わりリングが縮む
//   0% (ちょうど使い切り) → リング消滅
//   マイナス  → 赤リングが 0 から時計回りに伸びる（赤字が増えるほど長くなる）
const RING_R    = 21;
const RING_CIRC = 2 * Math.PI * RING_R;

function GaugeRing({ budget, remaining }: { budget: number; remaining: number }) {
  const isOver = remaining < 0;

  // ── 緑 / オレンジ リング ──────────────────────────────────────────────
  // strokeDasharray 4値方式：「0-長dash, spentLen-gap, remainLen-dash, 大gap」
  //   → 最初の 0-dash ＋ gap が 12時から時計回りにギャップを作る
  //   → 残高 arc は その後ろ（時計回り方向の後ろ = 反時計回り側）に出る
  const remainPct  = budget > 0 ? Math.max((remaining / budget) * 100, 0) : 0;
  const spentPct   = 100 - remainPct;
  const spentLen   = (spentPct   / 100) * RING_CIRC;  // 12時から CW に広がるギャップ長
  const remainLen  = (remainPct  / 100) * RING_CIRC;  // 残高 arc 長
  const remainColor = remainPct > 40 ? '#22c55e' : '#f97316';

  // ── 赤（超過）リング ──────────────────────────────────────────────────
  // dashLen を変える方式：
  //   dashLen = overPct/100 × CIRC、offset = 0
  //   → 12時からそのまま「時計回り」に伸びる
  const overPct = isOver ? Math.min((Math.abs(remaining) / budget) * 100, 100) : 0;
  const overLen = (overPct / 100) * RING_CIRC;

  return (
    <>
      {/* トラック（背景の薄いリング） */}
      <circle cx="29" cy="29" r={RING_R} fill="none" stroke="#f3f4f6" strokeWidth="3.5" />

      {/* 残高リング
          dasharray = "0 {spentLen} {remainLen} {RING_CIRC}"
          └ [0-dash][spentLen-gap][remainLen-dash][大gap]
          → 12時から spentLen 分のギャップ(CW) → 残高 arc → 以降は非表示 */}
      {remainLen > 0 && (
        <circle
          cx="29" cy="29" r={RING_R}
          fill="none"
          stroke={remainColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`0 ${spentLen} ${remainLen} ${RING_CIRC}`}
          strokeDashoffset={0}
          transform="rotate(-90 29 29)"
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s ease' }}
        />
      )}

      {/* 超過リング（12時から時計回りに伸びる） */}
      {overLen > 0 && (
        <circle
          cx="29" cy="29" r={RING_R}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${overLen} ${RING_CIRC}`}
          strokeDashoffset={0}
          transform="rotate(-90 29 29)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      )}
    </>
  );
}

export default function Dashboard() {
  const { expenses, incomes, envelopes, members, language, toggleLanguage, setTab } = useStore();

  const thisMonth    = new Date().toISOString().slice(0, 7);
  const monthExpenses = expenses.filter((e) => e.date.startsWith(thisMonth));
  const monthIncomes  = incomes.filter((i)  => i.date.startsWith(thisMonth));

  const totalIn  = monthIncomes.reduce((s, i)  => s + i.amount, 0);
  const totalOut = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const balance  = totalIn - totalOut;

  // merged recent transactions (latest 8)
  type TxEntry =
    | { kind: 'expense'; data: typeof expenses[0] }
    | { kind: 'income';  data: typeof incomes[0] };

  const allTx: TxEntry[] = [
    ...expenses.map((e) => ({ kind: 'expense' as const, data: e })),
    ...incomes.map((i)  => ({ kind: 'income'  as const, data: i })),
  ].sort((a, b) => b.data.date.localeCompare(a.data.date)).slice(0, 8);

  // Envelope gauge data — all 10 categories
  const gaugeData = CATEGORIES.map((cat) => {
    const env   = envelopes.find((e) => e.id === cat.id)!;
    const spent = monthExpenses
      .filter((e) => e.category === cat.id)
      .reduce((s, e) => s + e.amount, 0);
    const remaining  = env.budget - spent;
    const remainPct  = env.budget > 0 ? (remaining / env.budget) * 100 : 0;
    const isLow      = remainPct > 0 && remainPct <= 40;
    const isOver     = remaining < 0;
    return { cat, env, spent, remaining, remainPct, isLow, isOver };
  });

  return (
    <div className="flex flex-col gap-4 pb-24">

      {/* ── Header ── */}
      <div className="bg-white pt-10 pb-4 px-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">
              {new Date().toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN', { month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-lg font-bold text-gray-900">
              {language === 'en' ? 'Bachao' : 'बचाओ'}
            </h1>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 active:scale-95"
          >
            <Globe className="w-3 h-3" />
            {language === 'en' ? 'EN' : 'हि'}
          </button>
        </div>
      </div>

      {/* ── IN / OUT / BALANCE ── */}
      <div className="px-4">
        <div className="bg-gray-900 rounded-3xl p-5 text-white">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs text-white/60 font-medium">
                  {language === 'en' ? 'Money In' : 'आया'}
                </span>
              </div>
              <p className="text-xl font-black text-emerald-400">{fmt(totalIn)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-full bg-rose-400/20 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-xs text-white/60 font-medium">
                  {language === 'en' ? 'Money Out' : 'गया'}
                </span>
              </div>
              <p className="text-xl font-black text-rose-400">{fmt(totalOut)}</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-white/40" />
              <span className="text-sm text-white/60">
                {language === 'en' ? 'Balance' : 'बचत'}
              </span>
            </div>
            <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {balance < 0 ? '−' : '+'}{fmt(balance)}
            </p>
          </div>
          {totalIn > 0 && (
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((totalOut / totalIn) * 100, 100)}%` }}
              />
            </div>
          )}
          <p className="text-[10px] text-white/30 mt-1 text-right">
            {totalIn > 0 ? Math.round((totalOut / totalIn) * 100) : 0}%{' '}
            {language === 'en' ? 'of income spent' : 'आय का खर्च'}
          </p>
        </div>
      </div>

      {/* ── アイデア1: Envelope gauge grid ─────────────────────────────────── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2 ml-1">
          <p className="text-xs text-gray-400 font-semibold uppercase">
            {language === 'en' ? 'Envelopes' : 'लिफ़ाफ़े'}
          </p>
          <button
            onClick={() => setTab('envelopes')}
            className="text-xs text-brand-500 font-semibold"
          >
            {language === 'en' ? 'Details →' : 'विवरण →'}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-3">
          <div className="grid grid-cols-5 gap-1">
            {gaugeData.map(({ cat, env, remaining, remainPct, isLow, isOver }) => {
              const amtColor = isOver
                ? 'text-rose-500'
                : isLow
                ? 'text-orange-500'
                : 'text-emerald-500';

              return (
                <button
                  key={cat.id}
                  onClick={() => setTab('envelopes')}
                  className="flex flex-col items-center gap-0.5 py-1 active:scale-95 transition-transform"
                >
                  {/* SVG ring + icon */}
                  <svg width="58" height="58" viewBox="0 0 58 58">
                    <GaugeRing budget={env.budget} remaining={remaining} />
                    {/* icon background circle */}
                    <circle cx="29" cy="29" r="17" fill={cat.bg} />
                    {/* emoji */}
                    <text
                      x="29" y="35"
                      textAnchor="middle"
                      fontSize="18"
                      style={{ fontFamily: 'system-ui' }}
                    >
                      {cat.icon}
                    </text>
                  </svg>

                  {/* remaining amount */}
                  <span className={`text-[9px] font-black leading-tight ${amtColor}`}>
                    {remaining >= 0
                      ? fmtShort(remaining)
                      : '−' + fmtShort(Math.abs(remaining))}
                  </span>
                </button>
              );
            })}
          </div>

          {/* legend */}
          <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-gray-50">
            {[
              { color: '#22c55e', en: 'Plenty',  hi: 'पर्याप्त' },
              { color: '#f97316', en: '≤40% left', hi: '≤40% बचा' },
              { color: '#f43f5e', en: 'Over',    hi: 'पार'       },
            ].map((l) => (
              <div key={l.en} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[9px] text-gray-400">
                  {language === 'en' ? l.en : l.hi}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── アイデア2: Visual-first recent transactions ─────────────────────── */}
      <div className="px-4">
        <p className="text-xs text-gray-400 font-semibold uppercase mb-2 ml-1">
          {language === 'en' ? 'Recent' : 'हालिया'}
        </p>
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
          {allTx.map(({ kind, data }) => {
            const member = members.find((m) => m.id === data.memberId);

            if (kind === 'expense') {
              const cat = getCat(data.category as any);
              return (
                <div key={data.id} className="flex items-center gap-3 px-4 py-3">
                  {/* ① 誰が — member avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
                    style={{ background: member?.color ?? '#9ca3af' }}
                  >
                    {member?.avatar ?? '?'}
                  </div>

                  {/* ② 何に — category icon badge */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: cat.bg }}
                  >
                    {cat.icon}
                  </div>

                  {/* note + date (very subdued) */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{data.note}</p>
                    <p className="text-[10px] text-gray-300">
                      {relativeDate(data.date, language)}
                    </p>
                  </div>

                  {/* ③ いくら — amount */}
                  <span className="text-sm font-black text-rose-500 shrink-0">
                    −{fmt(data.amount)}
                  </span>
                </div>
              );
            } else {
              const icon = SOURCE_ICONS[(data as any).source] ?? '💰';
              return (
                <div key={data.id} className="flex items-center gap-3 px-4 py-3">
                  {/* member avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm"
                    style={{ background: member?.color ?? '#9ca3af' }}
                  >
                    {member?.avatar ?? '?'}
                  </div>

                  {/* source icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 bg-emerald-50">
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{data.note}</p>
                    <p className="text-[10px] text-gray-300">
                      {relativeDate(data.date, language)}
                    </p>
                  </div>

                  <span className="text-sm font-black text-emerald-500 shrink-0">
                    +{fmt(data.amount)}
                  </span>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
