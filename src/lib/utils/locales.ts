/** Centralised locale configuration — single source of truth for the entire app.
 *  To add a new language: add one entry here, create messages/<locale>.json,
 *  add DB columns via migration + seed, and everything else picks it up. */
export const LOCALE_CONFIG = {
	en: { flag: '🇺🇸', label: 'English', bcp47: 'en-US', path: '' },
	es: { flag: '🇺🇾', label: 'Español', bcp47: 'es-UY', path: '/es' },
	pt: { flag: '🇧🇷', label: 'Português', bcp47: 'pt-BR', path: '/br' },
	ja: { flag: '🇯🇵', label: '日本語', bcp47: 'ja-JP', path: '/jp' },
	fr: { flag: '🇫🇷', label: 'Français', bcp47: 'fr-FR', path: '/fr' }
} as const;

export type LocaleKey = keyof typeof LOCALE_CONFIG;
export const LOCALES = Object.keys(LOCALE_CONFIG) as LocaleKey[];
