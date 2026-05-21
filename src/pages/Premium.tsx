import { useState } from 'react';
import { useStore } from '../store/useStore';
import { canUsePremium, getMemberRole } from '../lib/permissions';
import { isPlus, planLabel, type Plan } from '../lib/plan';
import {
  Check, Zap, Users, Tag, Download, ShieldCheck, Lock,
} from 'lucide-react';
import SubScreenHeader from '../components/SubScreenHeader';
import { goBackToTab } from '../lib/mainScroll';

const COMPARE = [
  {
    icon: '👤',
    en: 'Family sharing',
    hi: 'फ़ैमिली शेयरिंग',
    freeEn: 'You + 1 partner (fixed role)',
    freeHi: 'आप + 1 Partner (भूमिका तय)',
    plusEn: '3–6 members, flexible roles',
    plusHi: '3–6 सदस्य, भूमिका बदलें',
  },
  {
    icon: '🏷️',
    en: 'Categories',
    hi: 'कैटेगरी',
    freeEn: 'Default list only',
    freeHi: 'डिफ़ॉल्ट सूची',
    plusEn: 'Edit, hide & restore',
    plusHi: 'संपादित / छुपाएं / वापस',
  },
  {
    icon: '💾',
    en: 'Backup',
    hi: 'बैकअप',
    freeEn: '—',
    freeHi: '—',
    plusEn: 'JSON export',
    plusHi: 'JSON एक्सपोर्ट',
  },
] as const;

export default function Premium() {
  const { language, plan, setPlan, members, currentUserId } = useStore();
  const [buying, setBuying] = useState(false);
  const plus = isPlus(plan);

  function handleUpgrade() {
    setBuying(true);
    setTimeout(() => {
      setBuying(false);
      setPlan('plus');
    }, 1200);
  }

  const L = (en: string, hi: string) => (language === 'en' ? en : hi);
  const myRole = getMemberRole(members, currentUserId);

  if (myRole && !canUsePremium(myRole)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 pt-24 pb-24 text-center">
        <Lock className="w-12 h-12 text-gray-300" />
        <p className="text-sm font-semibold text-gray-600">
          {L('Only the owner can manage the plan.', 'प्लान केवल Owner बदल सकता है।')}
        </p>
        <button onClick={() => goBackToTab('settings')} className="text-sm font-bold text-brand-500">
          {L('Back to Settings →', 'सेटिंग पर वापस →')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <SubScreenHeader
        title={L('Plan', 'प्लान')}
        onBack={() => goBackToTab('settings')}
      />

      <div className="px-5 -mt-2">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <p className="text-sm font-semibold text-gray-700">
            {L('Current plan', 'वर्तमान प्लान')}: {planLabel(plan, language)}
          </p>
        </div>
        <p className="text-sm text-gray-400">
          {plus
            ? L('Plus is active for your family.', 'Plus आपके परिवार के लिए सक्रिय है।')
            : L('Free forever. Upgrade for more family & features.', 'हमेशा मुफ़्त। Plus से और फीचर।')}
        </p>
      </div>

      {/* Plan cards */}
      <div className="px-4 flex gap-3">
        {(['free', 'plus'] as Plan[]).map((tier) => {
          const active = plan === tier;
          const isPlusTier = tier === 'plus';
          const color = isPlusTier ? '#8b5cf6' : '#6b7280';
          return (
            <div
              key={tier}
              className={`flex-1 rounded-2xl p-4 relative ${
                active ? 'ring-2 ring-brand-500' : 'bg-white'
              }`}
              style={active ? { background: color + '11' } : {}}
            >
              <p className="font-bold text-sm text-gray-900 mb-0.5">
                {planLabel(tier, language)}
              </p>
              <div className="flex items-baseline gap-0.5 mb-3">
                <span className="text-2xl font-black" style={{ color }}>
                  {isPlusTier ? '₹99' : L('Free', 'मुफ़्त')}
                </span>
                {isPlusTier && (
                  <span className="text-xs text-gray-400">
                    {L('/mo', '/माह')}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                {(isPlusTier
                  ? [
                      { icon: Users, en: '3–6 members, any role', hi: '3–6 सदस्य, भूमिका बदलें' },
                      { icon: Tag, en: 'Edit & hide categories', hi: 'कैटेगरी संपादन' },
                      { icon: Download, en: 'Backup export', hi: 'बैकअप' },
                      { icon: ShieldCheck, en: 'No ads', hi: 'कोई विज्ञापन नहीं' },
                    ]
                  : [
                      { icon: Users, en: 'You + 1 partner', hi: 'आप + 1 Partner' },
                      { icon: ShieldCheck, en: 'Core budgeting', hi: 'मुख्य फीचर' },
                    ]
                ).map((f) => (
                  <div key={f.en} className="flex items-center gap-1.5">
                    <Check className="w-3 h-3 shrink-0" style={{ color }} />
                    <span className="text-[11px] text-gray-600">
                      {L(f.en, f.hi)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {!plus ? (
        <div className="px-4">
          <button
            onClick={handleUpgrade}
            disabled={buying}
            className="w-full h-14 rounded-2xl font-bold text-lg text-white active:scale-95 transition-all flex items-center justify-center gap-2 bg-brand-500"
          >
            {buying ? (
              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5 fill-white" />
                {L('Upgrade to Plus · ₹99/mo', 'Plus · ₹99/माह')}
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            {L(
              '7-day free trial · Cancel anytime · Google Play Billing',
              '7 दिन मुफ़्त · कभी भी रद्द · Google Play',
            )}
          </p>
        </div>
      ) : (
        <div className="px-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-green-800 text-sm">
                {L('Plus is active', 'Plus सक्रिय')}
              </p>
              <p className="text-xs text-green-600">
                {L('Backup, categories & up to 6 members', 'बैकअप, कैटेगरी और 6 सदस्य')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comparison */}
      <div className="px-4">
        <p className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-2">
          {L('Free vs Plus', 'Free बनाम Plus')}
        </p>
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-4 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase">
            <span>{L('Feature', 'फीचर')}</span>
            <span className="text-center">Free</span>
            <span className="text-center text-violet-600">Plus</span>
          </div>
          {COMPARE.map((row) => (
            <div key={row.en} className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-4 py-3 items-start">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{row.icon}</span>
                <span className="text-xs text-gray-700">{L(row.en, row.hi)}</span>
              </div>
              <p className="text-[10px] text-gray-500 text-center leading-snug">
                {L(row.freeEn, row.freeHi)}
              </p>
              <p className="text-[10px] text-violet-700 text-center leading-snug font-medium">
                {L(row.plusEn, row.plusHi)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
