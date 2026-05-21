import { useState } from 'react';
import { Lock, Check, RotateCcw } from 'lucide-react';
import { useStore, type Category } from '../store/useStore';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  resolveCategoryIcon,
  resolveCategoryLabel,
} from '../lib/categories';
import SubScreenHeader from '../components/SubScreenHeader';

export default function Categories() {
  const {
    language, isPremium, setTab,
    categoryOverrides, setCategoryOverride, resetCategoryOverride,
  } = useStore();

  const L = (en: string, hi: string) => (language === 'en' ? en : hi);
  const [editing, setEditing] = useState<Category | null>(null);
  const [icon, setIcon] = useState('');
  const [en, setEn] = useState('');
  const [hi, setHi] = useState('');

  function startEdit(id: Category) {
    if (!isPremium) {
      setTab('premium');
      return;
    }
    const base = CATEGORY_LABELS[id];
    const o = categoryOverrides[id];
    setEditing(id);
    setIcon(o?.icon ?? CATEGORIES.find((c) => c.id === id)!.icon);
    setEn(o?.en ?? base.en);
    setHi(o?.hi ?? base.hi);
  }

  function saveEdit() {
    if (!editing || !icon.trim() || !en.trim() || !hi.trim()) return;
    setCategoryOverride(editing, { icon: icon.trim(), en: en.trim(), hi: hi.trim() });
    setEditing(null);
  }

  return (
    <div className="flex flex-col pb-24">
      <SubScreenHeader
        title={L('Categories', 'कैटेगरी')}
        onBack={() => setTab('settings')}
      />

      {!isPremium && (
        <div className="mx-4 mb-4 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Lock className="w-4 h-4 text-violet-400 shrink-0" />
          <p className="text-xs text-violet-700 flex-1">
            {L('Upgrade to Plus to edit categories', 'संपादन के लिए Plus अपग्रेड करें')}
          </p>
          <button
            onClick={() => setTab('premium')}
            className="text-xs font-bold text-violet-600 shrink-0"
          >
            {L('Upgrade', 'अपग्रेड')}
          </button>
        </div>
      )}

      <div className="px-4 flex flex-col gap-2">
        {CATEGORIES.map((cat) => {
          const label = resolveCategoryLabel(cat.id, language, categoryOverrides);
          const iconDisplay = resolveCategoryIcon(cat.id, categoryOverrides);
          const customized = !!categoryOverrides[cat.id];

          return (
            <button
              key={cat.id}
              onClick={() => startEdit(cat.id)}
              className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: cat.bg }}
              >
                {iconDisplay}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-[10px] text-gray-400 capitalize">{cat.id}</p>
              </div>
              {customized && (
                <span className="text-[9px] font-bold bg-brand-50 text-brand-500 px-2 py-0.5 rounded-full shrink-0">
                  {L('Edited', 'संपादित')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {editing && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEditing(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-sm mx-auto">
            <div className="pt-3 pb-4 px-5">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <h3 className="text-base font-bold text-gray-900 mb-4">
                {L('Edit category', 'कैटेगरी संपादित करें')}
              </h3>

              <div className="flex flex-col gap-3 mb-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase ml-1 mb-1 block">
                    {L('Icon', 'आइकन')}
                  </label>
                  <input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength={4}
                    className="w-full bg-gray-50 rounded-xl px-4 h-12 text-2xl text-center outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase ml-1 mb-1 block">
                    English
                  </label>
                  <input
                    value={en}
                    onChange={(e) => setEn(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl px-4 h-11 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase ml-1 mb-1 block">
                    हिन्दी
                  </label>
                  <input
                    value={hi}
                    onChange={(e) => setHi(e.target.value)}
                    className="w-full bg-gray-50 rounded-xl px-4 h-11 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resetCategoryOverride(editing);
                    setEditing(null);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  {L('Reset', 'रीसेट')}
                </button>
                <button
                  onClick={saveEdit}
                  className="flex-[2] h-12 rounded-2xl bg-brand-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  {L('Save', 'सहेजें')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
