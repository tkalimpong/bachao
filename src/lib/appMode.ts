import { isEmbeddedPreviewBrowser } from './embeddedBrowser';

/**
 * Dev-only UI preview: skip Google login and use demo seed data.
 * - Automatic in Cursor / VS Code Simple Browser (iframe)
 * - Or set VITE_PREVIEW_UI=true in .env.local (dev only)
 */
export function isPreviewUiMode(): boolean {
  if (!import.meta.env.DEV) return false;
  if (import.meta.env.VITE_PREVIEW_UI === 'true') return true;
  return isEmbeddedPreviewBrowser();
}

/** Firebase Auth + Firestore sync active (not preview/demo). */
export function isLiveFirebase(): boolean {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
  if (!apiKey || !projectId || !authDomain) return false;
  if (apiKey.includes('your-') || projectId.includes('your-')) return false;
  return !isPreviewUiMode();
}
