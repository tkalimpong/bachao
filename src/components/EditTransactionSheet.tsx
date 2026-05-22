import { useState } from 'react';
import { useUiOverlay } from '../hooks/useUiOverlay';
import { useBackHandler } from '../hooks/useBackHandler';
import { useStore, type Expense, type Income, type Category, type IncomeSource } from '../store/useStore';
import { canEditTransaction, getMemberRole } from '../lib/permissions';
import {
  getSelectableCategories,
  resolveCategoryAppearance,
  resolveCategoryLabel,
} from '../lib/categories';
import CategoryIcon from './CategoryIcon';
import {
  INCOME_SOURCE_DEFS,
  resolveIncomeSourceAppearance,
  resolveIncomeSourceLabel,
} from '../lib/incomeSources';
import IncomeSourceIcon from './IncomeSourceIcon';
import { Check, Trash2, X } from 'lucide-react';

type EditTarget =
  | { kind: 'expense'; data: Expense }
  | { kind: 'income';  data: Income };

interface Props {
  target: EditTarget;
  onClose: () => void;
}

export default function EditTransactionSheet({ target, onClose }: Props) {
  useUiOverlay();
  useBackHandler(() => {
    onClose();
    return true;
  });

  const {
    language, members, currentUserId,
    updateExpense, deleteExpense,
    updateIncome,  deleteIncome,
    hiddenCategories,
    categoryOverrides,
    incomeSourceOverrides,
  } = useStore();

  const isExpense = target.kind === 'expense';
  const original  = target.data;

  const myRole = getMemberRole(members, currentUserId);
  const canEdit = myRole
    ? canEditTransaction(myRole, original.memberId, currentUserId)
    : true;

  const [category,   setCategory]   = useState<Category>(isExpense ? (original as Expense).category : 'food');
  const [source,     setSource]     = useState<IncomeSource>(!isExpense ? (original as Income).source : 'salary');
  const [amount,     setAmount]     = useState(String(original.amount));
  const [note,       setNote]       = useState(original.note);
  const [date,       setDate]       = useState(original.date);
  const [memberId,   setMemberId]   = useState(original.memberId);
  const [confirmDel, setConfirmDel] = useState(false);
  const [saved,      setSaved]      = useState(false);

  function handleSave() {
    if (!canEdit) return;
    const n = Number(amount);
    if (!n || n <= 0) return;
    if (isExpense) {
      updateExpense(original.id, { category, amount: n, note, date, memberId });
    } else {
      updateIncome(original.id, { source, amount: n, note, date, memberId });
    }
    setSaved(true);
    setTimeout(onClose, 700);
  }

  function handleDelete() {
    if (!canEdit) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    if (isExpense) deleteExpense(original.id);
    else           deleteIncome(original.id);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8">
        {/* Handle + header */}
        <div className="sticky top-0 bg-gray-50 pt-3 pb-2 px-5 z-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              {language === 'en'
                ? (isExpense ? 'Edit Expense' : 'Edit Income')
                : (isExpense ? 'खर्च संपादित करें' : 'आय संपादित करें')}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center active:scale-95"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-4 flex flex-col gap-4 pt-2">

          {/* Category / Source */}
          <div>
            <p className="text-sm text-gray-400 font-semibold uppercase ml-1 mb-2">
              {isExpense
                ? (language === 'en' ? 'Category' : 'कैटेगरी')
                : (language === 'en' ? 'Income source' : 'आय का स्रोत')}
            </p>
            {isExpense ? (
              <div className="grid grid-cols-5 gap-1.5">
                {getSelectableCategories(
                  hiddenCategories,
                  isExpense ? (original as Expense).category : undefined,
                ).map((cat) => {
                  const appearance = resolveCategoryAppearance(cat.id, categoryOverrides);
                  const shortLabel = resolveCategoryLabel(cat.id, language, categoryOverrides);
                  return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-2 transition-all active:scale-95 ${
                      category === cat.id ? 'ring-2 ring-brand-500 scale-105' : 'bg-white'
                    }`}
                    style={category === cat.id ? { background: appearance.bg } : {}}
                  >
                    <CategoryIcon categoryId={cat.id} overrides={categoryOverrides} size="md" />
                    <span className="text-[10px] font-medium text-gray-500 leading-tight text-center line-clamp-2">
                      {shortLabel.length > 8 ? `${shortLabel.slice(0, 7)}…` : shortLabel}
                    </span>
                  </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {INCOME_SOURCE_DEFS.map((src) => {
                  const appearance = resolveIncomeSourceAppearance(src.id, incomeSourceOverrides);
                  const shortLabel = resolveIncomeSourceLabel(src.id, language, incomeSourceOverrides);
                  return (
                  <button
                    key={src.id}
                    onClick={() => setSource(src.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-all active:scale-95 ${
                      source === src.id ? 'ring-2 ring-emerald-500 scale-105' : 'bg-white'
                    }`}
                    style={source === src.id ? { background: appearance.bg } : {}}
                  >
                    <IncomeSourceIcon sourceId={src.id} overrides={incomeSourceOverrides} size="md" />
                    <span className="text-xs font-medium text-gray-600 text-center line-clamp-2">
                      {shortLabel.length > 10 ? `${shortLabel.slice(0, 9)}…` : shortLabel}
                    </span>
                  </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="bg-white rounded-2xl px-4 flex items-center gap-2 h-14">
            <span className={`text-xl font-black ${isExpense ? 'text-rose-300' : 'text-emerald-300'}`}>₹</span>
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 text-2xl font-black text-gray-900 bg-transparent outline-none"
            />
          </div>

          {/* Note */}
          <input
            type="text"
            placeholder={language === 'en' ? 'Note' : 'नोट'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-white rounded-2xl px-4 h-12 text-sm text-gray-800 outline-none placeholder:text-gray-300"
          />

          {/* Date */}
          <div className="bg-white rounded-2xl px-4 flex items-center gap-3 h-12">
            <span className="text-xs text-gray-400 font-semibold shrink-0">
              {language === 'en' ? 'Date' : 'तारीख'}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 text-sm font-semibold text-gray-800 bg-transparent outline-none"
            />
          </div>

          {/* Member */}
          <div>
            <p className="text-sm text-gray-400 font-semibold uppercase ml-1 mb-2">
              {language === 'en' ? 'Who?' : 'कौन?'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMemberId(m.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all active:scale-95 ${
                    memberId === m.id ? 'bg-ink' : 'bg-white'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: m.color }}
                  >
                    {m.avatar}
                  </div>
                  <span className={`text-xs font-semibold ${memberId === m.id ? 'text-white' : 'text-gray-600'}`}>
                    {m.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {!canEdit && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 text-center">
              {language === 'en'
                ? 'You can only edit your own transactions.'
                : 'आप केवल अपने लेनदेन संपादित कर सकते हैं।'}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleDelete}
              disabled={!canEdit}
              className={`flex items-center justify-center gap-2 h-12 rounded-2xl font-bold text-sm transition-all active:scale-95 px-4 ${
                !canEdit ? 'opacity-40 pointer-events-none' : ''
              } ${
                confirmDel
                  ? 'bg-rose-500 text-white flex-1'
                  : 'bg-rose-50 text-rose-500 w-12'
              }`}
            >
              <Trash2 className="w-6 h-6 shrink-0" />
              {confirmDel && (language === 'en' ? 'Confirm delete' : 'हटाएं?')}
            </button>

            <button
              onClick={handleSave}
              disabled={!amount || saved || !canEdit}
              className={`flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : !amount
                  ? 'bg-gray-100 text-gray-300'
                  : isExpense
                  ? 'bg-rose-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              {saved
                ? (language === 'en' ? 'Saved!' : 'सहेजा!')
                : (language === 'en' ? 'Save changes' : 'बदलाव सहेजें')}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
