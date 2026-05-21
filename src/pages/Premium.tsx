import { useState } from 'react';
import { useStore } from '../store/useStore';
import { canUsePremium, getMemberRole } from '../lib/permissions';
import {
  Check, Zap, Users, BarChart2, Tag, Download,
  ShieldCheck, Star, Lock,
} from 'lucide-react';
import SubScreenHeader from '../components/SubScreenHeader';

const PLANS = [
  {
    id: 'plus',
    name: 'Bachao Plus',
    nameHi: 'बचाओ प्लस',
    price: '₹99',
    period: '/mo',
    periodHi: '/माह',
    color: '#8b5cf6',
    features: [
      { icon: Users,    en: 'Family sharing (up to 6)',   hi: '6 सदस्य तक शेयरिंग' },
      { icon: Tag,      en: 'Custom categories',           hi: 'कस्टम कैटेगरी' },
      { icon: BarChart2,en: 'Full reports & analytics',    hi: 'पूरी रिपोर्ट' },
      { icon: ShieldCheck, en: 'No ads',                  hi: 'कोई विज्ञापन नहीं' },
    ],
  },
  {
    id: 'pro',
    name: 'Bachao Pro',
    nameHi: 'बचाओ प्रो',
    price: '₹199',
    period: '/mo',
    periodHi: '/माह',
    color: '#f97316',
    popular: true,
    features: [
      { icon: Users,    en: 'Family sharing (up to 10)',   hi: '10 सदस्य तक शेयरिंग' },
      { icon: Tag,      en: 'Custom categories',           hi: 'कस्टम कैटेगरी' },
      { icon: Download, en: 'Backup & CSV export',         hi: 'बैकअप और CSV एक्सपोर्ट' },
      { icon: Star,     en: 'AI spending advice',          hi: 'AI सुझाव' },
    ],
  },
];

const FEATURE_LIST = [
  { icon: '🔒', en: 'Bank-grade encryption',                    hi: 'बैंक-स्तरीय सुरक्षा',        tier: 'free' },
  { icon: '🇮🇳', en: 'Data stored in India (DPDP compliant)',   hi: 'डेटा भारत में (DPDP अनुपालित)', tier: 'free' },
  { icon: '📴', en: 'Works offline',                            hi: 'ऑफलाइन भी काम करता है',       tier: 'free' },
  { icon: '👨‍👩‍👧', en: 'Family sharing with roles',            hi: 'परिवार साझाकरण',               tier: 'plus' },
  { icon: '🏷️', en: 'Custom category add / edit',              hi: 'कस्टम कैटेगरी',                tier: 'plus' },
  { icon: '💾', en: 'Backup & CSV export',                      hi: 'बैकअप और CSV एक्सपोर्ट',      tier: 'pro'  },
] as const;

const TESTIMONIALS = [
  { name: 'Shreya M.', city: 'Mumbai',    text: '"Saved ₹8,000 in first month!"',   hi: '"पहले महीने ₹8,000 बचाए!"' },
  { name: 'Vikram S.', city: 'Bangalore', text: '"Perfect for joint families"',      hi: '"संयुक्त परिवार के लिए बेस्ट"' },
];

const tierLabel: Record<string, { en: string; hi: string; color: string }> = {
  free: { en: 'Free',  hi: 'मुफ़्त', color: '#6b7280' },
  plus: { en: 'Plus',  hi: 'प्लस',  color: '#8b5cf6' },
  pro:  { en: 'Pro',   hi: 'प्रो',  color: '#f97316' },
};

export default function Premium() {
  const { language, isPremium, members, currentUserId, setTab } = useStore();
  const [selected, setSelected] = useState<'plus' | 'pro'>('pro');
  const [buying, setBuying]     = useState(false);

  function handleBuy() {
    setBuying(true);
    setTimeout(() => {
      setBuying(false);
      useStore.setState({ isPremium: true });
    }, 1500);
  }

  const myRole = getMemberRole(members, currentUserId);
  if (myRole && !canUsePremium(myRole)) {
    const L = (en: string, hi: string) => (language === 'en' ? en : hi);
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 pt-24 pb-24 text-center">
        <Lock className="w-12 h-12 text-gray-300" />
        <p className="text-sm font-semibold text-gray-600">
          {L('Only the owner can manage premium.', 'Premium केवल Owner प्रबंधित कर सकता है।')}
        </p>
        <button onClick={() => setTab('settings')} className="text-sm font-bold text-brand-500">
          {L('Back to Settings →', 'सेटिंग पर वापस →')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <SubScreenHeader
        title={language === 'en' ? 'Plan' : 'प्लान'}
        onBack={() => setTab('settings')}
      />

      <div className="px-5 -mt-2">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <p className="text-sm font-semibold text-gray-700">
            {language === 'en' ? 'Go Premium' : 'प्रीमियम बनें'}
          </p>
        </div>
        <p className="text-sm text-gray-400">
          {language === 'en'
            ? 'Unlock everything. Cancel anytime.'
            : 'सब कुछ अनलॉक करें। कभी भी रद्द करें।'}
        </p>
      </div>

      {/* Plan cards */}
      <div className="px-4 flex gap-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id as 'plus' | 'pro')}
            className={`flex-1 rounded-2xl p-4 text-left transition-all active:scale-95 relative ${
              selected === plan.id ? 'ring-2 ring-brand-500' : 'bg-white'
            }`}
            style={selected === plan.id ? { background: plan.color + '11' } : {}}
          >
            {plan.popular && (
              <div
                className="absolute -top-2.5 right-3 text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                style={{ background: plan.color }}
              >
                {language === 'en' ? 'POPULAR' : 'लोकप्रिय'}
              </div>
            )}
            <p className="font-bold text-sm text-gray-900 mb-0.5">
              {language === 'en' ? plan.name : plan.nameHi}
            </p>
            <div className="flex items-baseline gap-0.5 mb-3">
              <span className="text-2xl font-black" style={{ color: plan.color }}>
                {plan.price}
              </span>
              <span className="text-xs text-gray-400">
                {language === 'en' ? plan.period : plan.periodHi}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {plan.features.map((f) => (
                <div key={f.en} className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 shrink-0" style={{ color: plan.color }} />
                  <span className="text-[11px] text-gray-600">
                    {language === 'en' ? f.en : f.hi}
                  </span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      {!isPremium ? (
        <div className="px-4">
          <button
            onClick={handleBuy}
            disabled={buying}
            className="w-full h-14 rounded-2xl font-bold text-lg text-white active:scale-95 transition-all flex items-center justify-center gap-2 bg-brand-500"
          >
            {buying ? (
              <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5 fill-white" />
                {language === 'en'
                  ? `Start ${selected === 'pro' ? '₹199' : '₹99'}/mo`
                  : `शुरू करें ${selected === 'pro' ? '₹199' : '₹99'}/माह`}
              </>
            )}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            {language === 'en'
              ? '7-day free trial · Cancel anytime · Google Play Billing'
              : '7 दिन मुफ़्त · कभी भी रद्द · Google Play Billing'}
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
                {language === 'en' ? "You're a Pro member!" : 'आप प्रो सदस्य हैं!'}
              </p>
              <p className="text-xs text-green-600">
                {language === 'en' ? 'All features unlocked' : 'सभी फीचर अनलॉक'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature comparison */}
      <div className="px-4">
        <p className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-2">
          {language === 'en' ? "What's included" : 'क्या शामिल है'}
        </p>
        <div className="bg-white rounded-2xl divide-y divide-gray-50 overflow-hidden">
          {FEATURE_LIST.map((item) => {
            const label = tierLabel[item.tier];
            return (
              <div key={item.en} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg w-7 shrink-0">{item.icon}</span>
                <span className="text-sm text-gray-700 flex-1">
                  {language === 'en' ? item.en : item.hi}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: label.color + '18', color: label.color }}
                >
                  {language === 'en' ? label.en : label.hi}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Locked feature previews */}
      {!isPremium && (
        <div className="px-4">
          <p className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-2">
            {language === 'en' ? 'Locked features' : 'लॉक फीचर'}
          </p>
          <div className="flex flex-col gap-2">
            {[
              { icon: '👨‍👩‍👧', en: 'Family sharing',      hi: 'फ़ैमिली शेयरिंग', tier: 'Plus' },
              { icon: '🏷️',     en: 'Custom categories', hi: 'कस्टम कैटेगरी',   tier: 'Plus' },
              { icon: '💾',     en: 'Backup & export',   hi: 'बैकअप और एक्सपोर्ट', tier: 'Pro'  },
            ].map((f) => (
              <div
                key={f.en}
                className="bg-white rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm text-gray-500 flex-1">
                  {language === 'en' ? f.en : f.hi}
                </span>
                <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400">{f.tier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      <div className="px-4">
        <p className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-2">
          {language === 'en' ? 'Loved across India' : 'भारत भर में पसंद'}
        </p>
        <div className="flex gap-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="flex-1 bg-white rounded-2xl p-4">
              <p className="text-xs text-gray-700 italic mb-2">
                {language === 'en' ? t.text : t.hi}
              </p>
              <p className="text-[10px] font-bold text-gray-400">
                {t.name} · {t.city}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
