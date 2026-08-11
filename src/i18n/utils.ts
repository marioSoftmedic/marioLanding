import { ui, defaultLang, type Lang, type TranslationKey } from './ui';

export type { Lang, TranslationKey };

export function getLang(pathname: string): Lang {
  return /^\/en(?:\/|$)/.test(pathname) ? 'en' : 'es';
}

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKey): string {
    return (ui[lang] as Record<string, string>)[key]
      ?? (ui[defaultLang] as Record<string, string>)[key]
      ?? key;
  };
}

/** Base path prefix for a given lang: '' for es, '/en' for en */
export function basePath(lang: Lang): string {
  return lang === 'en' ? '/en' : '';
}
