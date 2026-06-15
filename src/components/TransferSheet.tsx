import { useState, useMemo } from 'react';
import { useUiOverlay } from '../hooks/useUiOverlay';
import { useBackHandler } from '../hooks/useBackHandler';
import { useStore, type Transfer } from '../store/useStore';
import { canEditTransfer, getMemberRole } from '../lib/permissions';
import { ArrowRightLeft, CalendarDays, Check, Trash2, X } from 'lucide-react';

interface Props {
  transfer?: Transfer;
  initialFromId?: string;
  initialToId?: string;
  onClose: () => void;
}

export default function TransferSheet({
  transfer,
  initialFromId,
  initialToId,
  onClose,
}: Props) {
  useUiOverlay();
  useBackHandler(() => {
    onClose();
    return true;
  });

  const {
    language,
    members,
    currentUserId,
    addTransfer,
    updateTransfer,
    deleteTransfer,
  } = useStore();

  const isEdit = Boolean(transfer);
  const myRole = getMemberRole(members, currentUserId);
  const isHelper = myRole === 'helper';
  const canEdit = transfer && myRole
    ? canEditTransfer(myRole, transfer.fromMemberId, transfer.toMemberId, currentUserId)
    : true;

  /** helper は送る側を自分以外にできない（受取側として編集時は元の送り主を固定） */
  const lockedFromId = useMemo(() => {
    if (!isHelper) return null;
    if (isEdit && transfer && transfer.fromMemberId !== currentUserId) {
      return transfer.fromMemberId;
    }
    return currentUserId;
  }, [isHelper, isEdit, transfer, currentUserId]);

  const defaultFrom = isHelper
    ? lockedFromId!
    : initialFromId ?? transfer?.fromMemberId ?? currentUserId;
  const defaultTo =
    initialToId ??
    transfer?.toMemberId ??
    members.find((m) => m.id !== defaultFrom)?.id ??
    members[0]?.id ??
    '';

  const [fromId, setFromId] = useState(defaultFrom);
  const [toId, setToId] = useState(defaultTo);
  const [amount, setAmount] = useState(transfer ? String(transfer.amount) : '');
  const [note, setNote] = useState(transfer?.note ?? '');
  const [date, setDate] = useState(() => {
    const fullDate = transfer?.date ?? new Date().toISOString().slice(0, 10);
    return fullDate.split(' ')[0] || fullDate;
  });
  const [time, setTime] = useState(() => {
    const fullDate = transfer?.date ?? '';
    return fullDate.includes(' ') ? fullDate.split(' ')[1] : '12:00';
  });
  const [confirmDel, setConfirmDel] = useState(false);
  const [saved, setSaved] = useState(false);

  const L = (en: string, hi: string) => (language === 'en' ? en : hi);

  function getDateWithTime(): string {
    return `${date} ${time}`;
  }

  function handleSave() {
    const n = Number(amount);
    const saveFromId = lockedFromId ?? fromId;
    const dateWithTime = getDateWithTime();
    if (!n || n <= 0 || saveFromId === toId) return;
    if (isEdit && transfer) {
      if (!canEdit) return;
      updateTransfer(transfer.id, {
        fromMemberId: saveFromId,
        toMemberId: toId,
        amount: n,
        note: note.trim(),
        date: dateWithTime,
      });
    } else {
      addTransfer({
        fromMemberId: saveFromId,
        toMemberId: toId,
        amount: n,
        note: note.trim() || L('Transfer', 'ट्रांसफर'),
        date: dateWithTime,
      });
    }
    setSaved(true);
    setTimeout(onClose, 700);
  }

  function handleDelete() {
    if (!transfer || !canEdit) return;
    if (!confirmDel) {
      setConfirmDel(true);
      return;
    }
    deleteTransfer(transfer.id);
    onClose();
  }

  function pickTo(otherThan: string) {
    const next = members.find((m) => m.id !== otherThan);
    if (next) setToId(next.id);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-50 rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8">
        <div className="sticky top-0 bg-gray-50 pt-3 pb-2 px-5 z-10">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              {isEdit ? L('Edit transfer', 'ट्रांसफर संपादित') : L('Record transfer', 'पैसे भेजें')}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center active:scale-95"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-5 flex flex-col gap-4">
          <div>
            <p className="text-sm text-gray-400 font-semibold uppercase ml-1 mb-2">
              {L('From', 'से')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {members.map((m) => {
                const effectiveFrom = lockedFromId ?? fromId;
                return (
                <button
                  key={m.id}
                  disabled={Boolean(lockedFromId) || (isEdit && !canEdit)}
                  onClick={() => {
                    if (lockedFromId) return;
                    setFromId(m.id);
                    if (toId === m.id) pickTo(m.id);
                  }}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all active:scale-95 ${
                    effectiveFrom === m.id ? 'bg-ink text-white' : 'bg-white text-gray-600 shadow-sm'
                  } ${lockedFromId && m.id !== effectiveFrom ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: m.color }}
                  >
                    {m.avatar}
                  </div>
                  <span className="text-xs font-semibold">{m.name}</span>
                </button>
              );
              })}
            </div>
            {lockedFromId && lockedFromId === currentUserId && (
              <p className="text-sm text-gray-400 mt-1.5 ml-1">
                {L('You can only send from your account', 'केवल अपने खाते से भेज सकते हैं')}
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <ArrowRightLeft className="w-6 h-6 text-brand-500" />
          </div>

          <div>
            <p className="text-sm text-gray-400 font-semibold uppercase ml-1 mb-2">
              {L('To', 'को')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {members.map((m) => (
                <button
                  key={m.id}
                  disabled={isEdit && !canEdit || m.id === (lockedFromId ?? fromId)}
                  onClick={() => setToId(m.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all active:scale-95 ${
                    toId === m.id
                      ? 'bg-brand-500 text-white'
                      : m.id === (lockedFromId ?? fromId)
                      ? 'bg-gray-100 text-gray-300'
                      : 'bg-white text-gray-600 shadow-sm'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: m.color }}
                  >
                    {m.avatar}
                  </div>
                  <span className="text-xs font-semibold">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-2xl font-black text-gray-300">₹</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              disabled={isEdit && !canEdit}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 text-3xl font-black text-gray-900 bg-transparent outline-none placeholder:text-gray-200"
            />
          </div>

          <input
            type="text"
            placeholder={L('Note (optional)', 'नोट (वैकल्पिक)')}
            value={note}
            disabled={isEdit && !canEdit}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-white rounded-2xl px-4 h-12 text-sm text-gray-800 outline-none placeholder:text-gray-300"
          />

          <div className="flex gap-3">
            <div className="flex-1 bg-white rounded-2xl px-4 h-12 flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-gray-300 shrink-0" />
              <input
                type="date"
                value={date}
                disabled={isEdit && !canEdit}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 text-sm text-gray-800 bg-transparent outline-none"
              />
            </div>
            <div className="w-28 bg-white rounded-2xl px-4 h-12 flex items-center">
              <input
                type="time"
                value={time}
                disabled={isEdit && !canEdit}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1 text-sm text-gray-800 bg-transparent outline-none"
              />
            </div>
          </div>

          {isEdit && canEdit && (
            <button
              onClick={handleDelete}
              className={`w-full h-11 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 ${
                confirmDel ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-500'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {confirmDel
                ? L('Tap again to delete', 'हटाने के लिए फिर दबाएं')
                : L('Delete transfer', 'ट्रांसफर हटाएं')}
            </button>
          )}

          {(!isEdit || canEdit) && (
            <button
              onClick={handleSave}
              disabled={!amount || (lockedFromId ?? fromId) === toId || saved}
              className={`w-full h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : !amount || (lockedFromId ?? fromId) === toId
                  ? 'bg-gray-100 text-gray-300'
                  : 'bg-brand-500 text-white'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5" />
                  {L('Saved!', 'सहेजा!')}
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-5 h-5" />
                  {isEdit ? L('Save', 'सहेजें') : L('Record transfer', 'दर्ज करें')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
