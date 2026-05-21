import { isPreviewUiMode } from '../lib/appMode';
import { externalAppUrl, isEmbeddedPreviewBrowser } from '../lib/embeddedBrowser';

export default function PreviewBrowserBanner() {
  if (!isPreviewUiMode()) return null;

  const url = externalAppUrl();
  const inIframe = isEmbeddedPreviewBrowser();

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-sm mx-auto flex flex-col gap-1.5">
        <p className="text-xs font-bold text-amber-900">
          Preview mode — demo data, login skipped
        </p>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          {inIframe
            ? 'Cursor preview shows the UI with sample family data. Google login is disabled here.'
            : 'VITE_PREVIEW_UI is on. Sample data only — not synced to Firebase.'}
        </p>
        {inIframe && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-brand-600 underline mt-0.5"
          >
            Open in Chrome for real login →
          </a>
        )}
      </div>
    </div>
  );
}
