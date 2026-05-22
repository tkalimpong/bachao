/** Central app branding — update here when renaming. */
export const APP_NAME = 'familygullak';
export const APP_NAME_HI = 'familygullak';
export const APP_NAME_PLUS = 'familygullak Plus';
export const APP_NAME_PLUS_HI = 'familygullak Plus';
export const APP_TAGLINE_EN = 'family gullak';
export const APP_TAGLINE_HI = 'family gullak';
export const APP_SLUG = 'familygullak';
export const APP_ID = 'com.familygullak.app';
export const LOGO_MARK = '/familygullak-mark.png';
export const LOGO_FULL = '/familygullak-logo.png';

export function appName(lang: 'en' | 'hi'): string {
  return lang === 'en' ? APP_NAME : APP_NAME_HI;
}

export function appNamePlus(lang: 'en' | 'hi'): string {
  return lang === 'en' ? APP_NAME_PLUS : APP_NAME_PLUS_HI;
}
