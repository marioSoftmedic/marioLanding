#!/usr/bin/env node
/**
 * validate-posts.mjs
 *
 * Checks every EN blog post (src/content/blog/*.en.mdx or *.en.md) has a
 * `canonicalSlug` in its YAML frontmatter.
 *
 * Why: src/pages/en/blog/[slug].astro builds URLs from
 * `post.data.canonicalSlug ?? post.id.replace(/\.en\.(md|mdx)$/, '')`.
 * Astro 6's content loader doesn't always produce a post.id that matches the
 * clean URL we want — so EN posts without canonicalSlug 404 in production.
 *
 * This guard catches that before it ships.
 *
 * Usage:
 *   node scripts/validate-posts.mjs          # validate all EN posts
 *   node scripts/validate-posts.mjs file...  # validate specific files only
 *
 * Exit codes: 0 ok, 1 validation failed, 2 config/IO error.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, relative, basename } from 'node:path';

const ROOT = resolve(process.cwd());
const BLOG_DIR = join(ROOT, 'src', 'content', 'blog');
const EN_PATTERN = /\.en\.(md|mdx)$/;

// ANSI colors (only when TTY)
const tty = process.stdout.isTTY;
const red = (s) => (tty ? `\x1b[31m${s}\x1b[0m` : s);
const green = (s) => (tty ? `\x1b[32m${s}\x1b[0m` : s);
const yellow = (s) => (tty ? `\x1b[33m${s}\x1b[0m` : s);
const bold = (s) => (tty ? `\x1b[1m${s}\x1b[0m` : s);

/**
 * Extract YAML frontmatter block from a post. Returns the raw YAML string
 * between the opening `---` and the closing `---`, or null if none.
 */
function extractFrontmatter(source) {
  // Must start with ---\n (allow BOM + leading whitespace defensively)
  const trimmed = source.replace(/^\uFEFF/, '');
  if (!trimmed.startsWith('---')) return null;
  const afterOpen = trimmed.slice(3);
  // Find the closing fence on its own line
  const closeMatch = afterOpen.match(/\r?\n---\s*(\r?\n|$)/);
  if (!closeMatch) return null;
  return afterOpen.slice(0, closeMatch.index);
}

/**
 * Minimal frontmatter field check: looks for `canonicalSlug:` at the start
 * of a line (ignoring leading whitespace) with a non-empty value.
 * Intentionally avoids a full YAML parser — no runtime deps, and the rule
 * is simple enough that a regex is sound.
 */
function hasCanonicalSlug(frontmatter) {
  const re = /^\s*canonicalSlug\s*:\s*(["']?)([^"'\n\r]+)\1\s*$/m;
  const m = frontmatter.match(re);
  if (!m) return false;
  const value = m[2].trim();
  return value.length > 0;
}

function listEnPosts() {
  let entries;
  try {
    entries = readdirSync(BLOG_DIR, { withFileTypes: true });
  } catch (err) {
    console.error(red(`[validate-posts] Could not read ${BLOG_DIR}: ${err.message}`));
    process.exit(2);
  }
  return entries
    .filter((e) => e.isFile() && EN_PATTERN.test(e.name))
    .map((e) => join(BLOG_DIR, e.name));
}

/**
 * Filter a list of file paths down to EN blog posts only.
 * Used when the script is invoked from a git hook with specific staged files.
 */
function filterEnPosts(paths) {
  return paths
    .map((p) => resolve(p))
    .filter((p) => {
      const rel = relative(ROOT, p);
      return rel.startsWith(join('src', 'content', 'blog') + '/') && EN_PATTERN.test(basename(p));
    });
}

function validatePost(filePath) {
  let source;
  try {
    source = readFileSync(filePath, 'utf8');
  } catch (err) {
    return { ok: false, file: filePath, error: `cannot read: ${err.message}` };
  }
  const fm = extractFrontmatter(source);
  if (fm === null) {
    return { ok: false, file: filePath, error: 'no YAML frontmatter found (expected --- ... --- block at top)' };
  }
  if (!hasCanonicalSlug(fm)) {
    return { ok: false, file: filePath, error: 'missing required field `canonicalSlug`' };
  }
  return { ok: true, file: filePath };
}

function main() {
  const argv = process.argv.slice(2);
  let targets;
  if (argv.length > 0) {
    targets = filterEnPosts(argv);
    if (targets.length === 0) {
      // Nothing EN-shaped was passed — not our problem, exit clean.
      process.exit(0);
    }
  } else {
    targets = listEnPosts();
  }

  if (targets.length === 0) {
    console.log(yellow('[validate-posts] No EN blog posts found. Nothing to validate.'));
    process.exit(0);
  }

  const results = targets.map(validatePost);
  const failures = results.filter((r) => !r.ok);

  if (failures.length === 0) {
    console.log(green(`[validate-posts] ✓ ${results.length} EN post(s) validated — all have canonicalSlug.`));
    process.exit(0);
  }

  console.error(bold(red(`\n[validate-posts] ✗ ${failures.length} EN post(s) failed validation:\n`)));
  for (const f of failures) {
    const rel = relative(ROOT, f.file);
    console.error(`  ${red('✗')} ${bold(rel)}`);
    console.error(`      ${f.error}`);
  }
  console.error(
    yellow(
      '\nFix: add a `canonicalSlug: "YYYY-MM-DD-your-slug"` line to the frontmatter of each failing file.\n' +
        'Without it, /en/blog/<slug> 404s in production — the fallback path that Astro generates does not match the expected URL.\n'
    )
  );
  process.exit(1);
}

main();
