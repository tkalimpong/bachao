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

export function externalAppUrl(): string {
  const { protocol, hostname, port } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const p = port || '5173';
    return `${protocol}//localhost:${p}/`;
  }
  return window.location.href;
}
