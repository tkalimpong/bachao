import { useStore } from '../store/useStore';
import { Check, Zap, Users, BarChart2, Smartphone, ShieldCheck, Star } from 'lucide-react';
import { useState } from 'react';

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
      { icon: Users, en: 'Up to 6 family members', hi: '6 सदस्य तक' },
      { icon: BarChart2, en: 'Full reports & analytics', hi: 'पूरी रिपोर्ट' },
      { icon: Smartphone, en: 'Receipt scanner (OCR)', hi: 'बिल स्कैन' },
      { icon: ShieldCheck, en: 'No ads', hi: 'कोई विज्ञापन नहीं' },
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
      { icon: Users, en: 'Up to 10 family members', hi: '10 सदस्य तक' },
      { icon: Zap, en: 'UPI auto-sync', hi: 'UPI ऑटो-सिंक' },
      { icon: Star, en: 'AI spending advice', hi: 'AI सुझाव' },
      { icon: BarChart2, en: 'Custom categories & CSV export', hi: 'CSV एक्सपोर्ट' },
    ],
  },
];

const TESTIMONIALS = [
  { name: 'Shreya M.', city: 'Mumbai', text: '"Saved ₹8,000 in first month!"', hi: '"पहले महीने ₹8,000 बचाए!"' },
  { name: 'Vikram S.', city: 'Bangalore', text: '"Perfect for joint families"', hi: '"संयुक्त परिवार के लिए बेस्ट"' },
];

export default function Premium() {
  const { language, isPremium } = useStore();
  const [selected, setSelected] = useState<'plus' | 'pro'>('pro');
  const [buying, setBuying] = useState(false);

  function handleBuy() {
    setBuying(true);
    setTimeout(() => {
      setBuying(false);
      useStore.setState({ isPremium: true });
    }, 1500);
  }

  return (
    <div className="flex flex-col gap-4 pb-24 pt-10">
      {/* Header */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <h2 className="text-xl font-bold text-gray-900">
            {language === 'en' ? 'Go Premium' : 'प्रीमियम बनें'}
          </h2>
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
            onClick={() => setSelected(plan.id as any)}
            className={`flex-1 rounded-2xl p-4 text-left transition-all active:scale-95 relative ${
              selected === plan.id
                ? 'ring-2 ring-brand-500'
                : 'bg-white'
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
                {language === 'en' ? 'You\'re a Pro member!' : 'आप प्रो सदस्य हैं!'}
              </p>
              <p className="text-xs text-green-600">
                {language === 'en' ? 'All features unlocked' : 'सभी फीचर अनलॉक'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* What's included */}
      <div className="px-4">
        <p className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-2">
          {language === 'en' ? 'Everything included' : 'सब कुछ शामिल'}
        </p>
        <div className="bg-white rounded-2xl divide-y divide-gray-50 overflow-hidden">
          {[
            { icon: '🔒', en: 'Bank-grade encryption', hi: 'बैंक-स्तरीय सुरक्षा' },
            { icon: '🇮🇳', en: 'Data stored in India (DPDP Act compliant)', hi: 'डेटा भारत में (DPDP अनुपालित)' },
            { icon: '📴', en: 'Works offline', hi: 'ऑफलाइन भी काम करता है' },
            { icon: '🔄', en: 'UPI auto-sync (Phase 2)', hi: 'UPI ऑटो-सिंक (जल्द आ रहा)' },
            { icon: '👨‍👩‍👧', en: 'Family sharing with roles', hi: 'परिवार साझाकरण' },
          ].map((item) => (
            <div key={item.en} className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm text-gray-700">
                {language === 'en' ? item.en : item.hi}
              </span>
            </div>
          ))}
        </div>
      </div>

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
