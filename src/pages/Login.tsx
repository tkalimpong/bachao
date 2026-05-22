import { useState } from 'react';
import AppLogo from '../components/AppLogo';
import { useStore } from '../store/useStore';
import { t } from '../lib/i18n';

type Props = {
  loading: boolean;
  error: string | null;
  onSignIn: (inviteCode?: string) => Promise<void>;
};

export default function Login({ loading, error, onSignIn }: Props) {
  const { language } = useStore();
  const [inviteCode, setInviteCode] = useState('');
  const L = (en: string, hi: string) => (language === 'en' ? en : hi);

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center">
      <div className="w-full max-w-sm min-h-screen bg-surface flex flex-col px-6 pt-16 pb-10">
        <div className="flex flex-col items-center text-center mb-10">
          <AppLogo size={72} className="rounded-2xl shadow-md mb-5" />
          <h1 className="text-3xl font-black text-gray-900">{t(language, 'appName')}</h1>
          <p className="text-base text-gray-500 mt-3 max-w-[280px] leading-relaxed">
            {L(
              'Sign in with Google to sync your family budget across devices.',
              'Google से साइन इन करें और परिवार का बजट सभी डिवाइस पर साझा करें।',
            )}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-gray-400 ml-1">
              {L('Family invite code (optional)', 'परिवार कोड (वैकल्पिक)')}
            </span>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder={L('6-letter code', '6 अक्षर का कोड')}
              maxLength={6}
              className="mt-1.5 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-center text-base font-bold tracking-[0.25em] uppercase outline-none focus:border-brand-400"
            />
            <p className="text-sm text-gray-400 mt-2 px-1 leading-relaxed">
              {L(
                'Leave blank to start a new family. Enter a code from your partner to join theirs.',
                'नया परिवार बनाने के लिए खाली छोड़ें। मौजूदा परिवार में शामिल होने के लिए कोड दर्ज करें।',
              )}
            </p>
          </label>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-2xl px-4 py-3">{error}</p>
          )}

          <p className="text-sm text-gray-400 px-1 leading-relaxed">
            {L(
              'On Android, Google account picker opens. On browser, allow popups if asked.',
              'Android पर Google खाता चुनें। ब्राउज़र में पॉपअップ की अनुमति दें।',
            )}
          </p>

          <button
            type="button"
            disabled={loading}
            onClick={() => onSignIn(inviteCode)}
            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white border border-gray-200 px-4 py-4 shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-base font-semibold text-gray-800">
              {loading
                ? L('Signing in…', 'साइन इन…')
                : L('Continue with Google', 'Google से जारी रखें')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
