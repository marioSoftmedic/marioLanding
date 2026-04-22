#!/usr/bin/env node
/**
 * validate-posts.mjs
 *
 * Two checks per post:
 *
 * 1. Every EN blog post (src/content/blog/*.en.{md,mdx}) MUST have a
 *    `canonicalSlug` in its YAML frontmatter.
 *    Why: src/pages/en/blog/[slug].astro builds URLs from
 *    `post.data.canonicalSlug ?? post.id.replace(/\.en\.(md|mdx)$/, '')`.
 *    Astro 6's content loader doesn't always produce a post.id matching the
 *    clean URL we want, so EN posts without canonicalSlug 404 in production.
 *
 * 2. Every blog post (ES + EN) MUST only use tags that exist in the canonical
 *    taxonomy (src/lib/tags.ts). Without this, "IA" vs "AI" vs "ia" each
 *    create their own /blog/tags/<slug> page with one post — useless.
 *
 * Usage:
 *   node scripts/validate-posts.mjs          # validate all blog posts
 *   node scripts/validate-posts.mjs file...  # validate specific files only
 *
 * Exit codes: 0 ok, 1 validation failed, 2 config/IO error.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, relative, basename } from 'node:path';

const ROOT = resolve(process.cwd());
const BLOG_DIR = join(ROOT, 'src', 'content', 'blog');
const EN_PATTERN = /\.en\.(md|mdx)$/;
const ANY_POST_PATTERN = /\.(md|mdx)$/;

const tty = process.stdout.isTTY;
const red = (s) => (tty ? `\x1b[31m${s}\x1b[0m` : s);
const green = (s) => (tty ? `\x1b[32m${s}\x1b[0m` : s);
const yellow = (s) => (tty ? `\x1b[33m${s}\x1b[0m` : s);
const bold = (s) => (tty ? `\x1b[1m${s}\x1b[0m` : s);

/**
 * Load the tag taxonomy by parsing src/lib/tags.ts as text.
 *
 * Strategy: extract only the `slug:` and `aliases:` fields from each TagDef
 * entry with two narrow regexes. This avoids evaluating TypeScript at all,
 * which means no tsx/ts-node dev dep AND no fragility from type annotations.
 *
 * The trade-off: if you add a TagDef in a wildly different shape (computed
 * keys, spread, etc.), this parser will silently miss aliases. The taxonomy
 * file documents the shape it expects.
 *
 * Returns a Set of every accepted alias (lowercased) plus an isKnownTag()
 * helper that mirrors the runtime behavior of src/lib/tags.ts.
 */
function loadTaxonomy() {
  const tagsTs = join(ROOT, 'src', 'lib', 'tags.ts');
  let source;
  try {
    source = readFileSync(tagsTs, 'utf8');
  } catch (err) {
    console.error(red(`[validate-posts] Could not read tags taxonomy at ${tagsTs}: ${err.message}`));
    process.exit(2);
  }

  const acceptedLower = new Set();
  const aliasArrayRe = /aliases\s*:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = aliasArrayRe.exec(source)) !== null) {
    const inner = m[1];
    const stringRe = /["']([^"']+)["']/g;
    let s;
    while ((s = stringRe.exec(inner)) !== null) {
      acceptedLower.add(s[1].toLowerCase().trim());
    }
  }

  const slugRe = /slug\s*:\s*["']([^"']+)["']/g;
  let sm;
  while ((sm = slugRe.exec(source)) !== null) {
    acceptedLower.add(sm[1].toLowerCase().trim());
  }

  if (acceptedLower.size === 0) {
    console.error(red(`[validate-posts] Parsed 0 tags from ${tagsTs} — the taxonomy parser is broken or the file is empty.`));
    process.exit(2);
  }

  return {
    isKnownTag: (raw) => acceptedLower.has(String(raw).toLowerCase().trim()),
    size: acceptedLower.size,
  };
}

function extractFrontmatter(source) {
  const trimmed = source.replace(/^\uFEFF/, '');
  if (!trimmed.startsWith('---')) return null;
  const afterOpen = trimmed.slice(3);
  const closeMatch = afterOpen.match(/\r?\n---\s*(\r?\n|$)/);
  if (!closeMatch) return null;
  return afterOpen.slice(0, closeMatch.index);
}

function hasCanonicalSlug(frontmatter) {
  const re = /^\s*canonicalSlug\s*:\s*(["']?)([^"'\n\r]+)\1\s*$/m;
  const m = frontmatter.match(re);
  if (!m) return false;
  return m[2].trim().length > 0;
}

/**
 * Extract the `tags:` array from frontmatter as a list of raw strings.
 * Supports both inline `tags: ["a", "b"]` and `tags: [a, b]` plus the YAML
 * block form:
 *   tags:
 *     - foo
 *     - "bar baz"
 *
 * Returns [] if no tags field is found (consistent with the schema default).
 */
function extractTags(frontmatter) {
  // Inline form on the same line
  const inlineMatch = frontmatter.match(/^\s*tags\s*:\s*\[([^\]]*)\]\s*$/m);
  if (inlineMatch) {
    const inner = inlineMatch[1].trim();
    if (inner === '') return [];
    return inner
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter((s) => s.length > 0);
  }

  // Block form across multiple lines
  const blockHeaderRe = /^\s*tags\s*:\s*$/m;
  const headerMatch = frontmatter.match(blockHeaderRe);
  if (headerMatch) {
    const after = frontmatter.slice(headerMatch.index + headerMatch[0].length);
    const lines = after.split(/\r?\n/);
    const tags = [];
    for (const line of lines) {
      const itemMatch = line.match(/^\s*-\s*(["']?)([^"'\n\r]+)\1\s*$/);
      if (itemMatch) {
        tags.push(itemMatch[2].trim());
      } else if (line.trim() === '' || /^\s*-/.test(line)) {
        continue;
      } else {
        break;
      }
    }
    return tags;
  }

  return [];
}

function listAllPosts() {
  let entries;
  try {
    entries = readdirSync(BLOG_DIR, { withFileTypes: true });
  } catch (err) {
    console.error(red(`[validate-posts] Could not read ${BLOG_DIR}: ${err.message}`));
    process.exit(2);
  }
  return entries
    .filter((e) => e.isFile() && ANY_POST_PATTERN.test(e.name))
    .map((e) => join(BLOG_DIR, e.name));
}

function filterPosts(paths) {
  return paths
    .map((p) => resolve(p))
    .filter((p) => {
      const rel = relative(ROOT, p);
      return rel.startsWith(join('src', 'content', 'blog') + '/') && ANY_POST_PATTERN.test(basename(p));
    });
}

function isEnPost(filePath) {
  return EN_PATTERN.test(basename(filePath));
}

function validatePost(filePath, taxonomy) {
  let source;
  try {
    source = readFileSync(filePath, 'utf8');
  } catch (err) {
    return [{ ok: false, file: filePath, error: `cannot read: ${err.message}` }];
  }
  const fm = extractFrontmatter(source);
  if (fm === null) {
    return [{ ok: false, file: filePath, error: 'no YAML frontmatter found (expected --- ... --- block at top)' }];
  }

  const errors = [];

  if (isEnPost(filePath) && !hasCanonicalSlug(fm)) {
    errors.push({ ok: false, file: filePath, error: 'missing required field `canonicalSlug` (EN posts only)' });
  }

  const rawTags = extractTags(fm);
  const unknownTags = rawTags.filter((t) => !taxonomy.isKnownTag(t));
  if (unknownTags.length > 0) {
    errors.push({
      ok: false,
      file: filePath,
      error: `unknown tag(s) not in taxonomy: ${unknownTags.map((t) => `"${t}"`).join(', ')}`,
    });
  }

  if (errors.length === 0) return [{ ok: true, file: filePath }];
  return errors;
}

function main() {
  const taxonomy = loadTaxonomy();
  const argv = process.argv.slice(2);
  let targets;
  if (argv.length > 0) {
    targets = filterPosts(argv);
    if (targets.length === 0) {
      process.exit(0);
    }
  } else {
    targets = listAllPosts();
  }

  if (targets.length === 0) {
    console.log(yellow('[validate-posts] No blog posts found. Nothing to validate.'));
    process.exit(0);
  }

  const allResults = targets.flatMap((f) => validatePost(f, taxonomy));
  const failures = allResults.filter((r) => !r.ok);

  if (failures.length === 0) {
    console.log(green(`[validate-posts] ✓ ${targets.length} post(s) validated — canonicalSlug + taxonomy OK.`));
    process.exit(0);
  }

  console.error(bold(red(`\n[validate-posts] ✗ ${failures.length} validation issue(s):\n`)));
  for (const f of failures) {
    const rel = relative(ROOT, f.file);
    console.error(`  ${red('✗')} ${bold(rel)}`);
    console.error(`      ${f.error}`);
  }
  console.error(
    yellow(
      '\nFix instructions:\n' +
        '  • Missing canonicalSlug → add `canonicalSlug: "YYYY-MM-DD-your-slug"` to the EN post frontmatter.\n' +
        '  • Unknown tag → either fix the tag in the post (use a taxonomy alias) or add it to TAG_TAXONOMY in src/lib/tags.ts.\n' +
        '    See _TAXONOMY.md in the Obsidian vault for the canonical list of allowed tags.\n'
    )
  );
  process.exit(1);
}

main();
