/** Central app branding — update here when renaming. */
export const APP_NAME = 'Hamro Gullak';
export const APP_NAME_HI = 'हाम्रो गुल्लक';
export const APP_NAME_PLUS = 'Hamro Gullak Plus';
export const APP_NAME_PLUS_HI = 'हाम्रो गुल्लक Plus';
export const APP_TAGLINE_EN = 'Our family gullak';
export const APP_TAGLINE_HI = 'परिवार की गुल्लक';
export const APP_SLUG = 'hamro-gullak';
export const APP_ID = 'com.hamrogullak.app';
export const LOGO_MARK = '/hamro-gullak-mark.png';
export const LOGO_FULL = '/hamro-gullak-logo.png';

export function appName(lang: 'en' | 'hi'): string {
  return lang === 'en' ? APP_NAME : APP_NAME_HI;
}

export function appNamePlus(lang: 'en' | 'hi'): string {
  return lang === 'en' ? APP_NAME_PLUS : APP_NAME_PLUS_HI;
}
