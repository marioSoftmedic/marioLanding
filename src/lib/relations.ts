/**
 * Relation helpers for the blog: series, explicit related, tag similarity.
 *
 * Three layers of relation, applied in this priority order:
 *   1. Explicit `related: [slug]` in frontmatter — author's manual choice.
 *   2. Same `series` — narrative arc (e.g. "examya"). Ordered by seriesOrder.
 *   3. Tag similarity — Jaccard score over canonical tag slugs.
 *
 * The site uses `getRelated(post, allPosts, lang, limit)` to render a
 * "Related posts" block at the bottom of every post.
 */

import type { CollectionEntry } from 'astro:content';
import { tagsForPost, type Lang } from './tags';

export type BlogPost = CollectionEntry<'blog'>;

/**
 * Stable URL slug for a post in its language.
 * Mirrors the logic used in /pages/blog/[slug].astro and /pages/en/blog/[slug].astro
 * so internal links never drift from the actual routing.
 */
export function postUrlSlug(post: BlogPost): string {
  return post.data.canonicalSlug ?? post.id.replace(/\.en\.(md|mdx)$/, '').replace(/\.en$/, '');
}

/**
 * Build the public URL for a post in the given language.
 * basePath: '' for es, '/en' for en.
 */
export function postUrl(post: BlogPost, basePath: string): string {
  return `${basePath}/blog/${postUrlSlug(post)}`;
}

/**
 * Filter to "publishable" posts in a language. Used everywhere we need
 * the same definition of "what's live."
 */
export function postsForLang(all: readonly BlogPost[], lang: Lang): BlogPost[] {
  return all.filter((p) => !p.data.draft && p.data.lang === lang);
}

interface ScoredPost {
  post: BlogPost;
  score: number;
  reason: 'related' | 'series' | 'tags';
}

/**
 * Jaccard similarity over canonical tag slugs.
 * 0 = no shared tags, 1 = identical tag sets.
 */
function tagJaccard(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Get up to `limit` related posts for a given post, in priority order:
 *   - explicit `related` slugs (preserved order)
 *   - other posts in the same `series` (by seriesOrder, excluding self)
 *   - top tag-similarity matches
 *
 * Same-language only — we never cross-link es ↔ en here. The lang switcher
 * in the layout handles that.
 *
 * Deduplicates: a post that's both in `related` and shares tags appears once.
 */
export function getRelated(
  post: BlogPost,
  allPosts: readonly BlogPost[],
  lang: Lang,
  limit = 3,
): ScoredPost[] {
  const candidates = postsForLang(allPosts, lang).filter((p) => p.id !== post.id);
  const selfSlug = postUrlSlug(post);
  const seen = new Set<string>([selfSlug]);
  const out: ScoredPost[] = [];

  const pushUnique = (entry: ScoredPost) => {
    const slug = postUrlSlug(entry.post);
    if (seen.has(slug)) return;
    seen.add(slug);
    out.push(entry);
  };

  // Layer 1: explicit related, in author-given order
  const relatedSlugs = post.data.related ?? [];
  for (const slug of relatedSlugs) {
    const match = candidates.find((p) => postUrlSlug(p) === slug);
    if (match) pushUnique({ post: match, score: 1, reason: 'related' });
    if (out.length >= limit) return out;
  }

  // Layer 2: same series, sorted by seriesOrder
  if (post.data.series) {
    const seriesPeers = candidates
      .filter((p) => p.data.series === post.data.series)
      .sort((a, b) => (a.data.seriesOrder ?? 999) - (b.data.seriesOrder ?? 999));
    for (const p of seriesPeers) {
      pushUnique({ post: p, score: 0.9, reason: 'series' });
      if (out.length >= limit) return out;
    }
  }

  // Layer 3: tag similarity (Jaccard on canonical slugs)
  const myTags = tagsForPost(post.data.tags);
  if (myTags.length > 0) {
    const scored = candidates
      .map((p): ScoredPost => ({
        post: p,
        score: tagJaccard(myTags, tagsForPost(p.data.tags)),
        reason: 'tags',
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Tie-break: newer first, so related blocks stay fresh.
        return b.post.data.date.valueOf() - a.post.data.date.valueOf();
      });
    for (const s of scored) {
      pushUnique(s);
      if (out.length >= limit) return out;
    }
  }

  return out;
}

/**
 * Get all posts in a series (including the current one), ordered by seriesOrder.
 * Used to render a "This is part N of M in the {series} series" breadcrumb.
 */
export function getSeriesPosts(
  series: string,
  allPosts: readonly BlogPost[],
  lang: Lang,
): BlogPost[] {
  return postsForLang(allPosts, lang)
    .filter((p) => p.data.series === series)
    .sort((a, b) => (a.data.seriesOrder ?? 999) - (b.data.seriesOrder ?? 999));
}
