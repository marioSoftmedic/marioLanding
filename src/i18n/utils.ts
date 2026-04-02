import { ui, defaultLang, type Lang, type TranslationKey } from './ui';

export type { Lang, TranslationKey };

export function getLang(pathname: string): Lang {
  return pathname.startsWith('/en') ? 'en' : 'es';
}

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKey): string {
    return (ui[lang] as Record<string, string>)[key]
      ?? (ui[defaultLang] as Record<string, string>)[key]
      ?? key;
  };
}

/**
 * Returns the equivalent path in the other language.
 * /blog/post  → /en/blog/post
 * /en/blog/post → /blog/post
 */
export function getAlternatePath(pathname: string, currentLang: Lang): string {
  if (currentLang === 'en') {
    const stripped = pathname.replace(/^\/en/, '');
    return stripped === '' ? '/' : stripped;
  }
  return '/en' + (pathname === '/' ? '' : pathname);
}

/** Base path prefix for a given lang: '' for es, '/en' for en */
export function basePath(lang: Lang): string {
  return lang === 'en' ? '/en' : '';
}
