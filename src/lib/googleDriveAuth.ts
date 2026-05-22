import { Capacitor } from '@capacitor/core';
import {
  GoogleAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { auth } from './firebase';

export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

import { migrateSessionKey } from './storageMigrate';

const TOKEN_KEY = 'familygullak_drive_token';
const TOKEN_EXP_KEY = 'familygullak_drive_token_exp';
const PENDING_ACTION_KEY = 'familygullak_pending_drive_action';
const LEGACY_HAMRO_TOKEN_KEY = 'hamrogullak_drive_token';
const LEGACY_HAMRO_TOKEN_EXP_KEY = 'hamrogullak_drive_token_exp';
const LEGACY_HAMRO_PENDING_ACTION_KEY = 'hamrogullak_pending_drive_action';
const LEGACY_TOKEN_KEY = 'bachao_drive_token';
const LEGACY_TOKEN_EXP_KEY = 'bachao_drive_token_exp';
const LEGACY_PENDING_ACTION_KEY = 'bachao_pending_drive_action';

migrateSessionKey(TOKEN_KEY, LEGACY_HAMRO_TOKEN_KEY);
migrateSessionKey(TOKEN_EXP_KEY, LEGACY_HAMRO_TOKEN_EXP_KEY);
migrateSessionKey(PENDING_ACTION_KEY, LEGACY_HAMRO_PENDING_ACTION_KEY);
migrateSessionKey(TOKEN_KEY, LEGACY_TOKEN_KEY);
migrateSessionKey(TOKEN_EXP_KEY, LEGACY_TOKEN_EXP_KEY);
migrateSessionKey(PENDING_ACTION_KEY, LEGACY_PENDING_ACTION_KEY);

export type PendingDriveAction = 'save' | 'restore';

function cacheToken(accessToken: string): void {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + 3_500_000));
}

function readCachedToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const exp = Number(sessionStorage.getItem(TOKEN_EXP_KEY) || 0);
  if (!token || Date.now() >= exp - 60_000) return null;
  return token;
}

export function clearDriveTokenCache(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXP_KEY);
}

export function setPendingDriveAction(action: PendingDriveAction | null): void {
  if (action) sessionStorage.setItem(PENDING_ACTION_KEY, action);
  else sessionStorage.removeItem(PENDING_ACTION_KEY);
}

export function takePendingDriveAction(): PendingDriveAction | null {
  const action = sessionStorage.getItem(PENDING_ACTION_KEY);
  sessionStorage.removeItem(PENDING_ACTION_KEY);
  return action === 'save' || action === 'restore' ? action : null;
}

function driveProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_APPDATA_SCOPE);
  provider.setCustomParameters({ prompt: '' });
  return provider;
}

/** Store Drive OAuth token when present on a Firebase redirect/popup result. */
export function cacheDriveAccessTokenFromAuthResult(result: UserCredential): void {
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (token) cacheToken(token);
}

/** Read cached token after redirect (Android). Does not call getRedirectResult. */
export function readCachedDriveToken(): string | null {
  return readCachedToken();
}

/** Warm Drive token after login so backup works without another Google prompt. */
export async function prefetchDriveAccessToken(): Promise<void> {
  if (!auth?.currentUser || readCachedToken()) return;
  if (Capacitor.isNativePlatform()) return;

  try {
    const result = await reauthenticateWithPopup(auth.currentUser, driveProvider());
    cacheDriveAccessTokenFromAuthResult(result);
  } catch {
    /* backup page will retry */
  }
}

/** Cached or silent token fetch — never opens redirect (for scheduled backup). */
export async function getDriveAccessTokenSilent(): Promise<string | null> {
  if (!auth?.currentUser) return null;

  const cached = readCachedToken();
  if (cached) return cached;
  if (Capacitor.isNativePlatform()) return null;

  try {
    const result = await reauthenticateWithPopup(auth.currentUser, driveProvider());
    const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
    if (token) {
      cacheToken(token);
      return token;
    }
  } catch {
    /* scheduled backup skips until user opens Backup manually */
  }
  return null;
}

/** OAuth access token with drive.appdata scope (popup on web, redirect on native). */
export async function getDriveAccessToken(): Promise<string> {
  if (!auth?.currentUser) throw new Error('Sign in with Google first');

  const cached = readCachedToken();
  if (cached) return cached;

  const provider = driveProvider();

  if (Capacitor.isNativePlatform()) {
    await reauthenticateWithRedirect(auth.currentUser, provider);
    throw new Error('DRIVE_REDIRECT_PENDING');
  }

  const result = await reauthenticateWithPopup(auth.currentUser, provider);
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error('Google Drive access was denied');
  cacheToken(token);
  return token;
}

export function formatDriveAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Drive access failed';
  if (message === 'DRIVE_REDIRECT_PENDING') {
    return 'Opening Google sign-in for Drive access…';
  }
  if (message === 'DRIVE_TOKEN_UNAVAILABLE') {
    return 'Google Drive session expired. Open Backup again after signing in.';
  }
  const apiMessage = formatDriveApiError(message);
  if (apiMessage !== message) return apiMessage;
  if (message.includes('popup-closed') || message.includes('cancelled')) {
    return 'Google Drive access cancelled.';
  }
  if (message.includes('access_denied') || message.includes('denied')) {
    return 'Google Drive permission denied. Enable Drive API in Google Cloud Console (see docs/ANDROID.md).';
  }
  return message;
}

/** Turn raw Drive API JSON errors into a short user-facing message. */
export function formatDriveApiError(raw: string): string {
  const driveDisabledHint =
    'Enable Google Drive API in Google Cloud Console (APIs & Services → Library → Google Drive API → Enable), wait a few minutes, then try again. See docs/ANDROID.md.';

  try {
    const parsed = JSON.parse(raw) as {
      error?: {
        message?: string;
        status?: string;
        errors?: Array<{ reason?: string }>;
        details?: Array<{
          '@type'?: string;
          metadata?: { activationUrl?: string };
        }>;
      };
    };
    const err = parsed.error;
    if (!err) return raw;

    const reason = err.errors?.[0]?.reason ?? '';
    const msg = err.message ?? '';
    const activationUrl = err.details?.find((d) => d.metadata?.activationUrl)?.metadata
      ?.activationUrl;

    if (
      reason === 'accessNotConfigured'
      || msg.includes('Google Drive API has not been used')
      || msg.includes('Drive API')
        && (err.status === 'PERMISSION_DENIED' || msg.includes('disabled'))
    ) {
      return activationUrl
        ? `Google Drive API is not enabled for this project. Enable it here: ${activationUrl} — then wait a few minutes and retry.`
        : `Google Drive API is not enabled for this project. ${driveDisabledHint}`;
    }

    if (msg) return msg;
  } catch {
    /* not JSON */
  }

  if (raw.includes('accessNotConfigured') || raw.includes('Google Drive API has not been used')) {
    return `Google Drive API is not enabled for this project. ${driveDisabledHint}`;
  }

  return raw.length > 240 ? `${raw.slice(0, 240)}…` : raw;
}
