import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { CloudUpload, CloudDownload, Download, Upload, AlertTriangle, Check, Loader2, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { exportFamilyBackup, readBackupFile } from '../lib/backup';
import { restoreBackupPayload, formatRestoreError, type BackupPayload } from '../lib/backupPayload';
import {
  AUTO_BACKUP_EVENT,
} from '../lib/autoBackup';
import {
  loadAutoBackupSettings,
  loadLastAutoBackupAt,
  nextAutoBackupAt,
  saveAutoBackupSettings,
  saveLastCloudBackupAt,
  type AutoBackupInterval,
  type AutoBackupSettings,
} from '../lib/backupScheduleStorage';
import {
  downloadBackupFromDrive,
  fetchDriveBackupMeta,
  formatDriveAuthError,
  uploadBackupToDrive,
  type DriveBackupMeta,
} from '../lib/googleDrive';
import {
  setPendingDriveAction,
  takePendingDriveAction,
} from '../lib/googleDriveAuth';
import { isLiveFirebase } from '../lib/appMode';
import { canBackup } from '../lib/plan';
import { canUsePremium, getMemberRole } from '../lib/permissions';
import SubScreenHeader from '../components/SubScreenHeader';
import { useBackHandler } from '../hooks/useBackHandler';
import { goBackToTab } from '../lib/mainScroll';

function fmtWhen(iso: string, lang: 'en' | 'hi'): string {
  try {
    return new Date(iso).toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function Backup() {
  const { language, plan, members, currentUserId } = useStore();
  const L = (en: string, hi: string) => (language === 'en' ? en : hi);

  const role = getMemberRole(members, currentUserId);
  const isOwner = role ? canUsePremium(role) : true;
  const plus = canBackup(plan);

  const [meta, setMeta] = useState<DriveBackupMeta | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [busy, setBusy] = useState<'save' | 'restore' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<'drive' | 'file' | false>(false);
  const [autoSettings, setAutoSettings] = useState<AutoBackupSettings>(() => loadAutoBackupSettings());
  const [lastAutoAt, setLastAutoAt] = useState<string | null>(() => loadLastAutoBackupAt());
  const pendingHandled = useRef(false);
  const pendingFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const persistAutoSettings = useCallback((next: AutoBackupSettings) => {
    setAutoSettings(next);
    saveAutoBackupSettings(next);
  }, []);

  const toggleAutoBackup = useCallback(() => {
    persistAutoSettings({ ...autoSettings, enabled: !autoSettings.enabled });
  }, [autoSettings, persistAutoSettings]);

  const setAutoInterval = useCallback((interval: AutoBackupInterval) => {
    persistAutoSettings({ ...autoSettings, interval });
  }, [autoSettings, persistAutoSettings]);

  useBackHandler(() => {
    setConfirmRestore(false);
    pendingFileRef.current = null;
    return true;
  }, confirmRestore !== false);

  const showRestoreSuccess = useCallback((payload: BackupPayload) => {
    setSuccess(
      L(
        `Restored ${payload.expenses.length} expenses from backup`,
        `${payload.expenses.length} खर्च बैकअप से वापस`,
      ),
    );
  }, [language]);

  const refreshMeta = useCallback(async () => {
    if (!plus || !isLiveFirebase()) return;
    setLoadingMeta(true);
    setError(null);
    try {
      const file = await fetchDriveBackupMeta();
      setMeta(file);
    } catch (e) {
      if (e instanceof Error && e.message === 'DRIVE_REDIRECT_PENDING') return;
      setMeta(null);
    } finally {
      setLoadingMeta(false);
    }
  }, [plus]);

  const handleRestoreFromDrive = useCallback(async (fromRedirect = false) => {
    if (!plus || !isOwner) return;
    if (!fromRedirect && confirmRestore !== 'drive') {
      setConfirmRestore('drive');
      return;
    }
    setConfirmRestore(false);
    setBusy('restore');
    setError(null);
    setSuccess(null);
    try {
      const payload = await downloadBackupFromDrive();
      await restoreBackupPayload(payload);
      showRestoreSuccess(payload);
      await refreshMeta();
    } catch (e) {
      if (e instanceof Error && e.message === 'DRIVE_REDIRECT_PENDING') {
        if (!fromRedirect) setPendingDriveAction('restore');
        setSuccess(L('Continue in Google sign-in…', 'Google साइन-इन जारी रखें…'));
        return;
      }
      setError(formatRestoreError(e));
    } finally {
      setBusy(null);
    }
  }, [plus, isOwner, confirmRestore, showRestoreSuccess, refreshMeta, language]);

  const handleRestoreFromFile = useCallback(async () => {
    if (!plus || !isOwner) return;
    const file = pendingFileRef.current;
    if (!file) return;
    setConfirmRestore(false);
    pendingFileRef.current = null;
    setBusy('restore');
    setError(null);
    setSuccess(null);
    try {
      const payload = await readBackupFile(file);
      await restoreBackupPayload(payload);
      showRestoreSuccess(payload);
    } catch (e) {
      setError(formatRestoreError(e));
    } finally {
      setBusy(null);
    }
  }, [plus, isOwner, showRestoreSuccess]);

  const onBackupFilePicked = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !plus || !isOwner) return;
    pendingFileRef.current = file;
    setConfirmRestore('file');
  }, [plus, isOwner]);

  const executeConfirmRestore = useCallback(() => {
    if (confirmRestore === 'drive') void handleRestoreFromDrive();
    else if (confirmRestore === 'file') void handleRestoreFromFile();
  }, [confirmRestore, handleRestoreFromDrive, handleRestoreFromFile]);

  const handleSaveToDrive = useCallback(async (fromRedirect = false) => {
    if (!plus || !isOwner) return;
    setBusy('save');
    setError(null);
    setSuccess(null);
    try {
      const saved = await uploadBackupToDrive();
      setMeta(saved);
      saveLastCloudBackupAt(saved.modifiedTime);
      setSuccess(L('Saved to Google Drive', 'Google Drive पर सहेजा'));
    } catch (e) {
      if (e instanceof Error && e.message === 'DRIVE_REDIRECT_PENDING') {
        if (!fromRedirect) setPendingDriveAction('save');
        setSuccess(L('Continue in Google sign-in…', 'Google साइन-इन जारी रखें…'));
        return;
      }
      setError(formatDriveAuthError(e));
    } finally {
      setBusy(null);
    }
  }, [plus, isOwner, language]);

  useEffect(() => {
    void refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    if (pendingHandled.current) return;
    const pending = takePendingDriveAction();
    if (!pending) return;
    pendingHandled.current = true;
    if (pending === 'save') void handleSaveToDrive(true);
    else void handleRestoreFromDrive(true);
  }, [handleSaveToDrive, handleRestoreFromDrive]);

  useEffect(() => {
    const onAutoBackup = (e: Event) => {
      const at = (e as CustomEvent<{ at: string }>).detail?.at;
      if (at) setLastAutoAt(at);
      void refreshMeta();
    };
    window.addEventListener(AUTO_BACKUP_EVENT, onAutoBackup);
    return () => window.removeEventListener(AUTO_BACKUP_EVENT, onAutoBackup);
  }, [refreshMeta]);

  const nextAuto = autoSettings.enabled ? nextAutoBackupAt(autoSettings) : null;

  if (!plus) {
    return (
      <div className="flex flex-col pb-24">
        <SubScreenHeader
          title={L('Backup', 'बैकअप')}
          onBack={() => goBackToTab('settings')}
        />
        <div className="px-6 pt-12 text-center text-sm text-gray-500">
          {L('Backup is a Plus feature.', 'बैकअप Plus में उपलब्ध है।')}
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col pb-24">
        <SubScreenHeader
          title={L('Backup', 'बैकअप')}
          onBack={() => goBackToTab('settings')}
        />
        <div className="px-6 pt-12 text-center text-sm text-gray-500">
          {L('Only the owner can back up or restore.', 'बैकअप केवल Owner कर सकता है।')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <SubScreenHeader
        title={L('Backup', 'बैकअप')}
        onBack={() => goBackToTab('settings')}
      />

      <div className="px-5 -mt-2">
        <p className="text-sm text-gray-500 leading-relaxed">
          {L(
            'Save your family data to your Google account. Backups are stored in a private app folder on Google Drive.',
            'परिवार का डेटा Google खाते में सुरक्षित रखें। बैकअप Google Drive के निजी ऐप फ़ोल्डर में होता है।',
          )}
        </p>
      </div>

      {isLiveFirebase() && (
        <div className="mx-4 bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
          <p className="text-[11px] text-sky-800 leading-relaxed">
            {loadingMeta
              ? L('Checking Google Drive…', 'Google Drive जाँच…')
              : meta
                ? L(`Last cloud backup: ${fmtWhen(meta.modifiedTime, language)}`, `अंतिम बैकअप: ${fmtWhen(meta.modifiedTime, language)}`)
                : L('No cloud backup yet', 'अभी कोई क्लाउड बैकअप नहीं')}
          </p>
        </div>
      )}

      {(error || success) && (
        <div className="mx-4">
          {error && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 text-xs text-rose-700">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-green-700">
              <Check className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}
        </div>
      )}

      {isLiveFirebase() && (
        <div className="px-4">
          <p className="text-[10px] font-semibold uppercase text-gray-400 ml-1 mb-2">
            {L('Automatic backup', 'स्वचालित बैकअप')}
          </p>
          <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {L('Scheduled backup', 'निर्धारित बैकअप')}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {L(
                    'Runs when you open the app if the schedule is due.',
                    'ऐप खोलने पर, समय होने पर बैकअप चलता है।',
                  )}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoSettings.enabled}
                onClick={toggleAutoBackup}
                className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                  autoSettings.enabled ? 'bg-brand-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    autoSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {autoSettings.enabled && (
              <>
                <div className="flex gap-2">
                  {(['daily', 'weekly'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAutoInterval(key)}
                      className={`flex-1 h-10 rounded-xl text-xs font-bold transition-colors ${
                        autoSettings.interval === key
                          ? 'bg-brand-50 text-brand-600'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {key === 'daily'
                        ? L('Daily', 'रोज़')
                        : L('Weekly', 'साप्ताहिक')}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed px-1">
                  {lastAutoAt
                    ? L(
                        `Last auto backup: ${fmtWhen(lastAutoAt, language)}`,
                        `अंतिम स्वचालित: ${fmtWhen(lastAutoAt, language)}`,
                      )
                    : L('No automatic backup yet', 'अभी कोई स्वचालित बैकअप नहीं')}
                  {nextAuto && (
                    <>
                      {' · '}
                      {L(
                        `Next due: ${fmtWhen(nextAuto.toISOString(), language)}`,
                        `अगला: ${fmtWhen(nextAuto.toISOString(), language)}`,
                      )}
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="px-4">
        <p className="text-[10px] font-semibold uppercase text-gray-400 ml-1 mb-2">
          {L('Manual backup', 'मैन्युअल बैकअप')}
        </p>
      </div>

      <div className="px-4 flex flex-col gap-2">
        {isLiveFirebase() && (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => handleSaveToDrive()}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 disabled:opacity-60"
            >
              <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                {busy === 'save'
                  ? <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
                  : <CloudUpload className="w-5 h-5 text-sky-500" />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {L('Save to Google Drive', 'Google Drive पर सहेजें')}
                </p>
                <p className="text-xs text-gray-400">
                  {L('Overwrite your latest cloud backup', 'नवीनतम क्लाउड बैकअप बदलें')}
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={busy !== null}
              onClick={() => handleRestoreFromDrive()}
              className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 disabled:opacity-60"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                {busy === 'restore'
                  ? <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                  : <CloudDownload className="w-5 h-5 text-violet-500" />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  {L('Restore from Google Drive', 'Google Drive से पुनर्स्थापित')}
                </p>
                <p className="text-xs text-gray-400">
                  {L('Replace current data with cloud backup', 'क्लाउड बैकअप से डेटा बदलें')}
                </p>
              </div>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => void exportFamilyBackup()}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-900">
              {L('Download JSON file', 'JSON फ़ाइल डाउनलोड')}
            </p>
            <p className="text-xs text-gray-400">
              {L('Save a copy on this device', 'इस डिवाइस पर कॉपी सहेजें')}
            </p>
          </div>
        </button>

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 active:bg-gray-50 disabled:opacity-60"
        >
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            {busy === 'restore'
              ? <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
              : <Upload className="w-5 h-5 text-teal-500" />}
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-gray-900">
              {L('Restore from JSON file', 'JSON फ़ाइल से पुनर्स्थापित')}
            </p>
            <p className="text-xs text-gray-400">
              {L('Pick a backup file saved on this device', 'इस डिवाइस की बैकअप फ़ाइल चुनें')}
            </p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onBackupFilePicked}
        />
      </div>

      {confirmRestore !== false && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => {
              setConfirmRestore(false);
              pendingFileRef.current = null;
            }}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-sm mx-auto px-5 pt-4 pb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {L('Restore backup?', 'बैकअप पुनर्स्थापित करें?')}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {confirmRestore === 'file' && pendingFileRef.current
                    ? L(
                        `File: ${pendingFileRef.current.name}`,
                        `फ़ाइल: ${pendingFileRef.current.name}`,
                      )
                    : null}
                  {confirmRestore === 'file' && pendingFileRef.current ? ' · ' : ''}
                  {L(
                    'This replaces expenses, income, transfers, budgets and category settings. Members are not changed.',
                    'खर्च, आय, ट्रांसफर, बजट और कैटेगरी सेटिंग बदल जाएंगी। सदस्य नहीं बदलेंगे।',
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmRestore(false);
                  pendingFileRef.current = null;
                }}
                className="flex-1 h-12 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm"
              >
                {L('Cancel', 'रद्द')}
              </button>
              <button
                type="button"
                onClick={executeConfirmRestore}
                className="flex-1 h-12 rounded-2xl bg-violet-600 text-white font-bold text-sm"
              >
                {L('Restore', 'पुनर्स्थापित')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
