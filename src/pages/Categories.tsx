import { useState } from 'react';
import { Check, RotateCcw, EyeOff, Eye, Lock } from 'lucide-react';
import { useStore, type Category } from '../store/useStore';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  getVisibleCategories,
  resolveCategoryIcon,
  resolveCategoryLabel,
} from '../lib/categories';
import { canEditCategories, isPlus } from '../lib/plan';
import SubScreenHeader from '../components/SubScreenHeader';
import { goBackToTab } from '../lib/mainScroll';

export default function Categories() {
  const {
    language, plan, setTab,
    categoryOverrides, setCategoryOverride, resetCategoryOverride,
    hiddenCategories, setCategoryHidden,
  } = useStore();

  const L = (en: string, hi: string) => (language === 'en' ? en : hi);
  const plus = isPlus(plan);
  const canEdit = canEditCategories(plan);
  const visible = getVisibleCategories(hiddenCategories);
  const hidden = CATEGORIES.filter((c) => hiddenCategories.includes(c.id));

  const [editing, setEditing] = useState<Category | null>(null);
  const [icon, setIcon] = useState('');
  const [en, setEn] = useState('');
  const [hi, setHi] = useState('');

  function startEdit(id: Category) {
    if (!canEdit) {
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

  function renderCategoryRow(cat: typeof CATEGORIES[number], isHidden: boolean) {
    const label = resolveCategoryLabel(cat.id, language, categoryOverrides);
    const iconDisplay = resolveCategoryIcon(cat.id, categoryOverrides);
    const customized = !!categoryOverrides[cat.id];
    const defaultLabel = CATEGORY_LABELS[cat.id][language];

    return (
      <div
        key={cat.id}
        className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => startEdit(cat.id)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-80"
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: cat.bg, opacity: isHidden ? 0.5 : 1 }}
          >
            {iconDisplay}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${isHidden ? 'text-gray-400' : 'text-gray-900'}`}>
              {label}
            </p>
            <p className="text-sm text-gray-400">
              {isHidden
                ? L('Hidden from lists', 'सूची से छुपा')
                : customized && label !== defaultLabel
                  ? L(`Default: ${defaultLabel}`, `डिफ़ॉल्ट: ${defaultLabel}`)
                  : cat.id}
            </p>
          </div>
          {customized && !isHidden && (
            <span className="text-xs font-bold bg-brand-50 text-brand-500 px-2 py-0.5 rounded-full shrink-0">
              {L('Edited', 'संपादित')}
            </span>
          )}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={() => setCategoryHidden(cat.id, !isHidden)}
            className="p-2 rounded-xl text-gray-400 active:bg-gray-100 shrink-0"
            aria-label={isHidden ? L('Restore', 'वापस') : L('Hide', 'छुपाएं')}
          >
            {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      <SubScreenHeader
        title={L('Categories', 'कैटेगरी')}
        onBack={() => goBackToTab('settings')}
      />

      {!plus ? (
        <div className="mx-4 mb-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-start gap-2">
          <Lock className="w-6 h-6 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {L(
                'Category editing is a Plus feature. Free uses the default list.',
                'कैटेगरी संपादन Plus में। Free में डिफ़ॉल्ट सूची।',
              )}
            </p>
            <button
              type="button"
              onClick={() => setTab('premium')}
              className="text-xs font-bold text-brand-600 mt-2"
            >
              {L('Upgrade to Plus →', 'Plus में अपग्रेड →')}
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-4 mb-4 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-violet-700 leading-relaxed">
            {L(
              'Tap to edit name and icon. Use the eye icon to hide or restore categories.',
              'नाम/आइकन बदलने के लिए टैप करें। आँख से छुपाएं या वापस लाएं।',
            )}
          </p>
        </div>
      )}

      <div className="px-4 flex flex-col gap-2">
        {visible.map((cat) => renderCategoryRow(cat, false))}
      </div>

      {plus && hidden.length > 0 && (
        <>
          <p className="text-sm text-gray-400 font-semibold uppercase ml-5 mt-4 mb-2">
            {L('Hidden', 'छुपी हुई')}
          </p>
          <div className="px-4 flex flex-col gap-2">
            {hidden.map((cat) => renderCategoryRow(cat, true))}
          </div>
        </>
      )}

      {editing && canEdit && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEditing(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-sm mx-auto">
            <div className="pt-3 pb-4 px-5">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {L('Edit category', 'कैटेगरी संपादित करें')}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {L('Set names for English and Hindi UI', 'अंग्रेज़ी और हिन्दी दोनों के नाम')}
              </p>

              <div className="flex flex-col gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-1 block">
                    {L('Icon', 'आइकन')}
                  </label>
                  <input
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength={4}
                    className="w-full bg-gray-50 rounded-xl px-4 h-12 text-2xl text-center outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-1 block">
                    {L('Name (English)', 'नाम (English)')}
                  </label>
                  <input
                    value={en}
                    onChange={(e) => setEn(e.target.value)}
                    placeholder={CATEGORY_LABELS[editing].en}
                    className="w-full bg-gray-50 rounded-xl px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase ml-1 mb-1 block">
                    {L('Name (Hindi)', 'नाम (हिन्दी)')}
                  </label>
                  <input
                    value={hi}
                    onChange={(e) => setHi(e.target.value)}
                    placeholder={CATEGORY_LABELS[editing].hi}
                    className="w-full bg-gray-50 rounded-xl px-4 h-11 text-sm outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
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
                  type="button"
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
