import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import SubScreenHeader from '../components/SubScreenHeader';
import GullakPotIcon from '../components/GullakPotIcon';
import GullakCoinAnimation from '../components/GullakCoinAnimation';
import GullakDestroyAnimation from '../components/GullakDestroyAnimation';
import { goBackToTab } from '../lib/mainScroll';
import { canViewGroupFinances, getMemberRole } from '../lib/permissions';
import {
  availableBalance,
  scopeGullakDeposits,
  sumGullakDeposits,
} from '../lib/gullakBalance';
import { playCoinSound } from '../lib/coinSound';
import { TRUST_BLUE } from '../lib/theme';

function fmt(n: number) {
  return '₹' + Math.abs(n).toLocaleString('en-IN');
}

type Phase = 'input' | 'animating' | 'success' | 'destroying' | 'destroyed';

export default function Gullak() {
  const {
    language,
    expenses,
    incomes,
    members,
    currentUserId,
    gullakDeposits,
    addGullakDeposit,
    clearGullakDeposits,
    gullakPrefillAmount,
    clearGullakPrefill,
    activeMemberId,
  } = useStore();

  const L = (en: string, hi: string) => (language === 'en' ? en : hi);
  const myRole = getMemberRole(members, currentUserId);
  const showGroup = myRole ? canViewGroupFinances(myRole) : true;
  const memberScope = showGroup ? null : [currentUserId];

  const memberExpenses = showGroup
    ? expenses
    : expenses.filter((e) => e.memberId === currentUserId);
  const memberIncomes = showGroup
    ? incomes
    : incomes.filter((i) => i.memberId === currentUserId);

  const rawBalance =
    memberIncomes.reduce((s, i) => s + i.amount, 0) -
    memberExpenses.reduce((s, e) => s + e.amount, 0);

  const scopedDeposits = useMemo(
    () => scopeGullakDeposits(gullakDeposits, memberScope),
    [gullakDeposits, memberScope],
  );
  const gullakTotal = sumGullakDeposits(scopedDeposits);
  const spendable = availableBalance(rawBalance, gullakTotal);

  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<Phase>('input');
  const [lastSaved, setLastSaved] = useState(0);
  const [destroyedAmount, setDestroyedAmount] = useState(0);
  const [error, setError] = useState('');

  const isBusy = phase === 'animating' || phase === 'destroying';

  useEffect(() => {
    if (gullakPrefillAmount != null && gullakPrefillAmount > 0) {
      setAmount(String(Math.round(gullakPrefillAmount)));
      clearGullakPrefill();
    }
  }, [gullakPrefillAmount, clearGullakPrefill]);

  const parsedAmount = Number(amount.replace(/,/g, ''));
  const canSubmit =
    phase === 'input' &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= spendable;

  function handleDeposit() {
    if (!canSubmit) return;
    const memberId = currentUserId || activeMemberId;
    if (!memberId) {
      setError(L('Please wait — signing in…', 'कृपया प्रतीक्षा करें…'));
      return;
    }

    const ok = window.confirm(
      L(
        `Save ${fmt(parsedAmount)} to your Gullak?\n\nThis is physical savings at home — not counted as spending.`,
        `${fmt(parsedAmount)} अपने गुल्लक में रखें?\n\nयह घर की नकद बचत है — खर्च नहीं गिना जाएगा।`,
      ),
    );
    if (!ok) return;

    setError('');
    addGullakDeposit({
      amount: parsedAmount,
      date: new Date().toISOString().slice(0, 10),
      memberId,
    });
    setLastSaved(parsedAmount);
    setPhase('animating');
    playCoinSound(Math.min(5, Math.max(2, Math.round(parsedAmount / 500))));
  }

  const onDepositAnimationDone = useCallback(() => {
    setPhase('success');
    setAmount('');
  }, []);

  const onDestroyAnimationDone = useCallback(() => {
    clearGullakDeposits(memberScope);
    setPhase('destroyed');
  }, [clearGullakDeposits, memberScope]);

  function handleSaveAnother() {
    setPhase('input');
    setLastSaved(0);
    setError('');
  }

  function handleDestroy() {
    if (gullakTotal <= 0 || isBusy) return;

    const ok = window.confirm(
      L(
        `Did you actually break your Gullak?\n\n${fmt(gullakTotal)} will return to your app balance.`,
        `क्या आपने वास्तव में अपना गुल्लक तोड़ दिया?\n\n${fmt(gullakTotal)} ऐप की बचत में वापस जाएगा।`,
      ),
    );
    if (!ok) return;

    setDestroyedAmount(gullakTotal);
    setPhase('destroying');
    playCoinSound(7);
  }

  function handleAfterDestroy() {
    setDestroyedAmount(0);
    setPhase('input');
  }

  const potState =
    phase === 'destroying' || phase === 'destroyed' ? 'overspend' : 'savings';

  return (
    <div className="flex flex-col pb-24 min-h-full">
      <GullakCoinAnimation
        active={phase === 'animating'}
        onDone={onDepositAnimationDone}
      />
      <GullakDestroyAnimation
        active={phase === 'destroying'}
        onDone={onDestroyAnimationDone}
      />

      <SubScreenHeader
        title={L('Gullak', 'गुल्लक')}
        onBack={() => goBackToTab('home')}
      />

      <div className="px-5 flex flex-col items-center flex-1">
        <div
          className={`relative mt-2 mb-6 w-44 h-44 rounded-full flex items-center justify-center ${
            phase === 'animating' ? 'gullak-pot-glow' : ''
          } ${phase === 'destroying' ? 'gullak-pot-shatter' : ''}`}
          style={{
            background:
              phase === 'destroying' || phase === 'destroyed'
                ? 'radial-gradient(circle at 50% 40%, #fef2f2, #f9fafb)'
                : `radial-gradient(circle at 50% 40%, ${TRUST_BLUE[50]}, #f8fafc)`,
          }}
        >
          <GullakPotIcon
            state={potState}
            className={`w-28 h-28 relative z-10 ${
              potState === 'savings' ? 'text-brand-500' : 'text-rose-800'
            }`}
          />
        </div>

        <div className="w-full bg-white rounded-2xl px-4 py-3 mb-4 text-center">
          <p className="text-xs text-gray-400 font-semibold uppercase">
            {L('In your Gullak', 'आपके गुल्लक में')}
          </p>
          <p className="text-2xl font-black text-brand-600 mt-0.5">
            {phase === 'destroying' ? fmt(destroyedAmount) : gullakTotal > 0 ? fmt(gullakTotal) : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {L('Available balance', 'उपलब्ध बचत')}: {fmt(Math.max(0, spendable))}
            {gullakTotal > 0 && phase === 'input' && (
              <span className="block text-[11px] text-gray-300 mt-0.5">
                {L('Gullak is saved cash, not spending', 'गुल्लक खर्च नहीं, बचत है')}
              </span>
            )}
          </p>
        </div>

        {phase === 'success' ? (
          <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-6 text-center">
            <p className="text-xl font-black text-emerald-700">
              {L(`${fmt(lastSaved)} added!`, `${fmt(lastSaved)} जोड़ा गया!`)}
            </p>
            <p className="text-sm text-emerald-600/80 mt-3 leading-relaxed">
              {L(
                'Please put this amount in your Gullak at home.',
                'इस राशि को अपने घर के गुल्लक में रखें।',
              )}
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <button
                type="button"
                onClick={handleSaveAnother}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white font-bold active:scale-[0.98] transition-transform"
              >
                {L('Save more', 'और रखें')}
              </button>
              <button
                type="button"
                onClick={() => goBackToTab('home')}
                className="w-full py-3.5 rounded-2xl bg-white text-emerald-700 font-bold border border-emerald-200 active:scale-[0.98] transition-transform"
              >
                {L('Done', 'हो गया')}
              </button>
            </div>
          </div>
        ) : phase === 'destroyed' ? (
          <div className="w-full bg-brand-50 border border-brand-100 rounded-2xl px-5 py-6 text-center">
            <p className="text-xl font-black text-brand-700">
              {L(`${fmt(destroyedAmount)} returned!`, `${fmt(destroyedAmount)} वापस मिला!`)}
            </p>
            <p className="text-sm text-brand-600/80 mt-3 leading-relaxed">
              {L(
                'Added back to your app balance.',
                'ऐप की बचत में जोड़ दिया गया।',
              )}
            </p>
            <div className="flex flex-col gap-2 mt-6">
              <button
                type="button"
                onClick={() => goBackToTab('home')}
                className="w-full py-3.5 rounded-2xl bg-brand-500 text-white font-bold active:scale-[0.98] transition-transform"
              >
                {L('Done', 'हो गया')}
              </button>
              <button
                type="button"
                onClick={handleAfterDestroy}
                className="w-full py-3.5 rounded-2xl bg-white text-brand-700 font-bold border border-brand-200 active:scale-[0.98] transition-transform"
              >
                {L('Stay on this page', 'इसी पेज पर रहें')}
              </button>
            </div>
          </div>
        ) : phase === 'destroying' ? (
          <p className="text-sm text-rose-500 font-semibold text-center animate-pulse">
            {L('Breaking Gullak…', 'गुल्लक तोड़ा जा रहा है…')}
          </p>
        ) : (
          <>
            <p className="text-base font-semibold text-gray-800 text-center mb-4 leading-snug px-2">
              {L(
                'How much did you put in your Gullak?',
                'आपने अपने गुल्लक में कितना रखा?',
              )}
            </p>

            <div className="w-full bg-white rounded-2xl px-4 flex items-center gap-2 h-16 mb-2">
              <span className="text-2xl font-black text-brand-300">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                disabled={isBusy}
                placeholder="0"
                className="flex-1 text-3xl font-black text-gray-900 bg-transparent outline-none disabled:opacity-50"
              />
            </div>

            {error && <p className="text-sm text-rose-500 mb-2">{error}</p>}

            {spendable <= 0 && (
              <p className="text-sm text-gray-400 text-center mb-4">
                {L('No surplus balance to save.', 'बचाने के लिए बचत नहीं है।')}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                if (parsedAmount > spendable) {
                  setError(
                    L(
                      `Maximum ${fmt(spendable)} available.`,
                      `अधिकतम ${fmt(spendable)} उपलब्ध है।`,
                    ),
                  );
                  return;
                }
                handleDeposit();
              }}
              disabled={!canSubmit}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white mt-4 active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100"
              style={{
                background: canSubmit
                  ? `linear-gradient(to right, ${TRUST_BLUE[500]}, ${TRUST_BLUE[600]})`
                  : '#d1d5db',
              }}
            >
              {L('Save to Gullak', 'गुल्लक में रखें')}
            </button>

            {gullakTotal > 0 && (
              <button
                type="button"
                onClick={handleDestroy}
                className="w-full py-3.5 rounded-2xl mt-3 font-bold text-sm text-rose-600 bg-rose-50 border border-rose-100 active:scale-[0.98] transition-transform"
              >
                {L('Break Gullak', 'गुल्लक तोड़ें')}
              </button>
            )}

            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed px-2">
              {L(
                'This tracks money you physically put in your Gullak. It is deducted from your app balance.',
                'यह उस नकद को दर्ज करता है जो आप गुल्लक में रखते हैं। यह ऐप की बचत से घट जाता है।',
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
