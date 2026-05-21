/** IDE Simple Browser / iframe preview (Cursor, VS Code, etc.) */
export function isEmbeddedPreviewBrowser(): boolean {
  try {
    if (window.self !== window.top) return true;
    const ua = navigator.userAgent;
    if (/Cursor|VSCode|Electron/i.test(ua)) return true;
  } catch {
    return true;
  }
  return false;
}
