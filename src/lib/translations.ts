/**
 * Detects whether the current page has a translated counterpart in the other
 * language. Used by Base.astro to render the LangSwitch correctly:
 *   - If the alternate exists → render both ES/EN buttons normally.
 *   - If not → mark the missing one as unavailable so the switch can hide or
 *     disable that button. Prevents 404s when a user clicks the lang toggle on
 *     a post that hasn't been translated yet.
 *
 * Same logic is reused to suppress the corresponding <link rel="alternate"
 * hreflang="..."> tag in <head>, so search engines don't index a 404 as the
 * canonical translation.
 *
 * Strategy: at module load, scan content collections once and build two Sets:
 *   - blogSlugs.es / blogSlugs.en — published canonical slugs per language
 *   - projectSlugs.es / projectSlugs.en — same for projects
 * Then at request time, derive the slug from pathname and look it up.
 *
 * This runs in the static build, so the Sets are computed exactly once across
 * all rendered pages. No runtime overhead per request.
 */

import { getCollection } from 'astro:content';
import type { Lang } from './tags';

interface Available {
  es: Set<string>;
  en: Set<string>;
}

let cache: { blog: Available; project: Available } | null = null;

async function buildIndex(): Promise<{ blog: Available; project: Available }> {
  if (cache) return cache;

  const allBlog = await getCollection('blog');
  const blog: Available = { es: new Set(), en: new Set() };
  for (const p of allBlog) {
    if (p.data.draft) continue;
    const slug = p.data.canonicalSlug ?? p.id.replace(/\.en\.(md|mdx)$/, '').replace(/\.en$/, '');
    blog[p.data.lang].add(slug);
  }

  const allProjects = await getCollection('projects');
  const project: Available = { es: new Set(), en: new Set() };
  for (const p of allProjects) {
    const slug = p.id.replace(/\.en$/, '');
    project[p.data.lang].add(slug);
  }

  cache = { blog, project };
  return cache;
}

/**
 * Returns true if the alternate-language version of the current pathname
 * exists in the build. For static pages (home, /blog, /news, etc.) always
 * returns true — those routes always exist in both languages.
 *
 * For dynamic pages (/blog/<slug>, /projects/<slug>), looks up the slug in
 * the precomputed index of canonical slugs per language.
 */
export async function alternateExists(pathname: string, currentLang: Lang): Promise<boolean> {
  const targetLang: Lang = currentLang === 'es' ? 'en' : 'es';
  const { blog, project } = await buildIndex();

  const stripped = pathname.replace(/^\/en/, '') || '/';

  const blogMatch = stripped.match(/^\/blog\/([^/]+)\/?$/);
  if (blogMatch) {
    return blog[targetLang].has(blogMatch[1]);
  }

  const projectMatch = stripped.match(/^\/projects\/([^/]+)\/?$/);
  if (projectMatch) {
    return project[targetLang].has(projectMatch[1]);
  }

  return true;
}
