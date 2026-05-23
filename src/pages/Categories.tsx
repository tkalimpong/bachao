import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useStore, type Category, type IncomeSource } from '../store/useStore';
import {
  CATEGORY_DEFS,
  CATEGORY_LABELS,
  categoryDefaultLabel,
  categoryOverrideFromEdit,
  getCat,
  getVisibleCategories,
  isCategoryCustomized,
  resolveCategoryAppearance,
  resolveCategoryLabel,
} from '../lib/categories';
import {
  INCOME_SOURCE_DEFS,
  INCOME_SOURCE_LABELS,
  getIncomeSourceDef,
  getVisibleIncomeSources,
  incomeSourceDefaultLabel,
  incomeSourceOverrideFromEdit,
  isIncomeSourceCustomized,
  resolveIncomeSourceAppearance,
  resolveIncomeSourceLabel,
} from '../lib/incomeSources';
import {
  CATEGORY_COLOR_PRESETS,
  EXPENSE_ICON_SECTIONS,
  INCOME_ICON_SECTION,
  type CategoryIconSectionDef,
} from '../lib/categoryIcons';
import CategoryIcon from '../components/CategoryIcon';
import IncomeSourceIcon from '../components/IncomeSourceIcon';
import TypeIconEditSheet from '../components/TypeIconEditSheet';
import { canEditCategories, isPlus } from '../lib/plan';
import SubScreenHeader from '../components/SubScreenHeader';
import { goBackToTab } from '../lib/mainScroll';

type SectionTab = 'expense' | 'income';

export default function Categories() {
  const {
    language, plan, setTab,
    categoryOverrides, setCategoryOverride, resetCategoryOverride,
    incomeSourceOverrides, setIncomeSourceOverride, resetIncomeSourceOverride,
    hiddenCategories, setCategoryHidden,
    hiddenIncomeSources, setIncomeSourceHidden,
  } = useStore();

  const L = (en: string, hi: string) => (language === 'en' ? en : hi);
  const plus = isPlus(plan);
  const canEdit = canEditCategories(plan);
  const visible = getVisibleCategories(hiddenCategories);
  const hidden = CATEGORY_DEFS.filter((c) => hiddenCategories.includes(c.id));
  const visibleIncome = getVisibleIncomeSources(hiddenIncomeSources);
  const hiddenIncome = INCOME_SOURCE_DEFS.filter((s) => hiddenIncomeSources.includes(s.id));

  const [sectionTab, setSectionTab] = useState<SectionTab>('expense');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [iconId, setIconId] = useState('');
  const [color, setColor] = useState('');
  const [name, setName] = useState('');

  function startEditCategory(id: Category) {
    if (!canEdit) {
      setTab('premium');
      return;
    }
    const o = categoryOverrides[id];
    const appearance = resolveCategoryAppearance(id, categoryOverrides);
    setSectionTab('expense');
    setEditingIncome(null);
    setEditingCategory(id);
    setIconId(o?.iconId ?? appearance.iconId);
    setColor(o?.color ?? appearance.color);
    setName(o?.label?.trim() || resolveCategoryLabel(id, language, categoryOverrides));
  }

  function startEditIncome(id: IncomeSource) {
    if (!canEdit) {
      setTab('premium');
      return;
    }
    const o = incomeSourceOverrides[id];
    const appearance = resolveIncomeSourceAppearance(id, incomeSourceOverrides);
    setSectionTab('income');
    setEditingCategory(null);
    setEditingIncome(id);
    setIconId(o?.iconId ?? appearance.iconId);
    setColor(o?.color ?? appearance.color);
    setName(o?.label?.trim() || resolveIncomeSourceLabel(id, language, incomeSourceOverrides));
  }

  function closeEdit() {
    setEditingCategory(null);
    setEditingIncome(null);
  }

  function saveCategoryEdit() {
    if (!editingCategory || !iconId || !color) return;
    const patch = categoryOverrideFromEdit(editingCategory, { iconId, color, name });
    if (patch) setCategoryOverride(editingCategory, patch);
    else resetCategoryOverride(editingCategory);
    closeEdit();
  }

  function saveIncomeEdit() {
    if (!editingIncome || !iconId || !color) return;
    const patch = incomeSourceOverrideFromEdit(editingIncome, { iconId, color, name });
    if (patch) setIncomeSourceOverride(editingIncome, patch);
    else resetIncomeSourceOverride(editingIncome);
    closeEdit();
  }

  function confirmResetCategoryToDefault() {
    if (!editingCategory) return;
    const ok = window.confirm(
      L(
        'Reset name, color and icon to defaults?',
        'नाम, रंग और आइकन डिफ़ॉल्ट पर लौटाएं?',
      ),
    );
    if (!ok) return;
    resetCategoryOverride(editingCategory);
    const def = getCat(editingCategory);
    setIconId(def.iconId);
    setColor(def.color);
    setName(categoryDefaultLabel(editingCategory, language));
  }

  function confirmResetIncomeToDefault() {
    if (!editingIncome) return;
    const ok = window.confirm(
      L(
        'Reset name, color and icon to defaults?',
        'नाम, रंग और आइकन डिफ़ॉल्ट पर लौटाएं?',
      ),
    );
    if (!ok) return;
    resetIncomeSourceOverride(editingIncome);
    const def = getIncomeSourceDef(editingIncome);
    setIconId(def.iconId);
    setColor(def.color);
    setName(incomeSourceDefaultLabel(editingIncome, language));
  }

  const previewBg =
    CATEGORY_COLOR_PRESETS.find((p) => p.color === color)?.bg ?? '#f3f4f6';
  const sectionTitle = (section: CategoryIconSectionDef) => L(section.labelEn, section.labelHi);
  const expenseIconSections = EXPENSE_ICON_SECTIONS;
  const incomeIconSections = [...EXPENSE_ICON_SECTIONS, INCOME_ICON_SECTION];

  function categorySubtext(
    isHidden: boolean,
    customized: boolean,
    label: string,
    defaultLabel: string,
  ): string | null {
    if (isHidden) return L('Hidden from lists', 'सूची से छुपा');
    if (customized && label !== defaultLabel) {
      return L(`Default: ${defaultLabel}`, `डिफ़ॉल्ट: ${defaultLabel}`);
    }
    return null;
  }

  function renderCategoryRow(cat: typeof CATEGORY_DEFS[number], isHidden: boolean) {
    const label = resolveCategoryLabel(cat.id, language, categoryOverrides);
    const customized = isCategoryCustomized(cat.id, categoryOverrides);
    const defaultLabel = CATEGORY_LABELS[cat.id][language];
    const subtext = categorySubtext(isHidden, customized, label, defaultLabel);

    return (
      <div
        key={cat.id}
        className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => startEditCategory(cat.id)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-80"
        >
          <CategoryIcon
            categoryId={cat.id}
            overrides={categoryOverrides}
            size="lg"
            faded={isHidden}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-base font-semibold ${isHidden ? 'text-gray-400' : 'text-gray-900'}`}>
              {label}
            </p>
            {subtext && <p className="text-sm text-gray-400">{subtext}</p>}
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
            {isHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        )}
      </div>
    );
  }

  function renderIncomeRow(src: typeof INCOME_SOURCE_DEFS[number], isHidden: boolean) {
    const label = resolveIncomeSourceLabel(src.id, language, incomeSourceOverrides);
    const customized = isIncomeSourceCustomized(src.id, incomeSourceOverrides);
    const defaultLabel = INCOME_SOURCE_LABELS[src.id][language];
    const subtext = categorySubtext(isHidden, customized, label, defaultLabel);

    return (
      <div
        key={src.id}
        className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => startEditIncome(src.id)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-80"
        >
          <IncomeSourceIcon
            sourceId={src.id}
            overrides={incomeSourceOverrides}
            size="lg"
            faded={isHidden}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-base font-semibold ${isHidden ? 'text-gray-400' : 'text-gray-900'}`}>
              {label}
            </p>
            {subtext && <p className="text-sm text-gray-400">{subtext}</p>}
          </div>
          {customized && !isHidden && (
            <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full shrink-0">
              {L('Edited', 'संपादित')}
            </span>
          )}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={() => setIncomeSourceHidden(src.id, !isHidden)}
            className="p-2 rounded-xl text-gray-400 active:bg-gray-100 shrink-0"
            aria-label={isHidden ? L('Restore', 'वापस') : L('Hide', 'छुपाएं')}
          >
            {isHidden ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      <SubScreenHeader
        title={L('Categories & income', 'कैटेगरी और आय')}
        onBack={() => goBackToTab('settings')}
      />

      <div className="mx-4 mb-4 flex rounded-2xl bg-gray-100 p-1">
        {([
          ['expense', L('Expense', 'खर्च'), L('Categories', 'कैटेगरी')],
          ['income', L('Income', 'आय'), L('Sources', 'स्रोत')],
        ] as const).map(([id, en, hi]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSectionTab(id);
              closeEdit();
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              sectionTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {L(en, hi)}
          </button>
        ))}
      </div>

      {!plus ? (
        <div className="mx-4 mb-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-start gap-2">
          <Lock className="w-6 h-6 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {L(
                'Editing categories and income sources is a Plus feature.',
                'कैटेगरी और आय स्रोत संपादन Plus में है।',
              )}
            </p>
            <button
              type="button"
              onClick={() => setTab('premium')}
              className="text-sm font-bold text-brand-600 mt-2"
            >
              {L('Upgrade to Plus →', 'Plus में अपग्रेड →')}
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-4 mb-4 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
          <p className="text-sm text-violet-700 leading-relaxed">
            {sectionTab === 'expense'
              ? L(
                  'Tap to edit name, color and icon. Use the eye to hide categories.',
                  'नाम, रंग, आइकन बदलें। आँख से छुपाएं।',
                )
              : L(
                  'Tap to edit name, color and icon. Use the eye to hide sources.',
                  'नाम, रंग, आइकन बदलें। आँख से छुपाएं।',
                )}
          </p>
        </div>
      )}

      {sectionTab === 'expense' ? (
        <>
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
        </>
      ) : (
        <>
          <div className="px-4 flex flex-col gap-2">
            {visibleIncome.map((src) => renderIncomeRow(src, false))}
          </div>
          {plus && hiddenIncome.length > 0 && (
            <>
              <p className="text-sm text-gray-400 font-semibold uppercase ml-5 mt-4 mb-2">
                {L('Hidden', 'छुपी हुई')}
              </p>
              <div className="px-4 flex flex-col gap-2">
                {hiddenIncome.map((src) => renderIncomeRow(src, true))}
              </div>
            </>
          )}
        </>
      )}

      {editingCategory && canEdit && (
        <TypeIconEditSheet
          onClose={closeEdit}
          title={L('Edit category', 'कैटेगरी संपादित करें')}
            nameLabel={L('Name', 'नाम')}
            namePlaceholder={CATEGORY_LABELS[editingCategory][language]}
            name={name}
            onNameChange={setName}
            colorLabel={L('Color', 'रंग')}
            iconLabel={L('Icon', 'आइकन')}
            iconSections={expenseIconSections}
            sectionTitle={sectionTitle}
            color={color}
            onColorChange={setColor}
            iconId={iconId}
            onIconIdChange={setIconId}
            previewBg={previewBg}
            onSave={saveCategoryEdit}
            onResetToDefault={confirmResetCategoryToDefault}
            resetToDefaultLabel={L('Reset to default', 'डिफ़ॉल्ट पर लौटाएं')}
            onCancel={closeEdit}
            cancelLabel={L('Cancel', 'रद्द')}
            saveLabel={L('Save', 'सहेजें')}
          />
      )}

      {editingIncome && canEdit && (
        <TypeIconEditSheet
          onClose={closeEdit}
          title={L('Edit income source', 'आय स्रोत संपादित करें')}
            nameLabel={L('Name', 'नाम')}
            namePlaceholder={INCOME_SOURCE_LABELS[editingIncome][language]}
            name={name}
            onNameChange={setName}
            colorLabel={L('Color', 'रंग')}
            iconLabel={L('Icon', 'आइकन')}
            iconSections={incomeIconSections}
            sectionTitle={sectionTitle}
            color={color}
            onColorChange={setColor}
            iconId={iconId}
            onIconIdChange={setIconId}
            previewBg={previewBg}
            onSave={saveIncomeEdit}
            onResetToDefault={confirmResetIncomeToDefault}
            resetToDefaultLabel={L('Reset to default', 'डिफ़ॉल्ट पर लौटाएं')}
            onCancel={closeEdit}
            cancelLabel={L('Cancel', 'रद्द')}
            saveLabel={L('Save', 'सहेजें')}
          />
      )}
    </div>
  );
}
