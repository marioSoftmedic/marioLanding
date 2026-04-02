# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Blog Publishing Protocol (MANDATORY)

The Obsidian vault is the source of truth for the blog. Claude NEVER creates blog posts directly in the repo — the flow always starts in the vault.

### Full protocol (follow in order, every time)

**Before writing any post:**
1. Read `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Proyectos/05_Blog/_INDEX.md`
   - Check "Temas cubiertos" — never duplicate a covered topic
   - Check "Temas disponibles" — use these as candidates

**To create a draft:**
2. Copy `_template.md` in the vault to `borradores/{slug}.md`
3. Fill in frontmatter — always start with `draft: true`
4. Add entry to `_INDEX.md` under "Borradores pendientes"
5. Add topic to "Temas cubiertos"

**When the user says "publicá el post X":**
6. Read `borradores/{slug}.md` from the vault
7. Create `src/content/blog/YYYY-MM-DD-{slug}.mdx` in this repo with `lang: 'es'`
8. Create `src/content/blog/YYYY-MM-DD-{slug}.en.mdx` with `lang: 'en'` (translated)
9. Move `borradores/{slug}.md` → `publicados/{slug}.md` in the vault
10. Update `_INDEX.md`: move from "Borradores pendientes" to "Publicados"
11. Commit and push both repos

**Vault paths (local iCloud):**
```
~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Proyectos/05_Blog/
  _INDEX.md          ← source of truth, always keep in sync
  _template.md       ← base for every new post
  borradores/        ← drafts (draft: true)
  publicados/        ← published posts
```

**Blog file naming in this repo:**
- ES: `src/content/blog/YYYY-MM-DD-{slug}.mdx` with `lang: 'es'`
- EN: `src/content/blog/YYYY-MM-DD-{slug}.en.mdx` with `lang: 'en'`

## Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run preview   # Preview production build locally
```

> **Never run `npm run build` after changes** — this is a rule.

## Architecture

**Framework**: Astro 6 with `output: 'static'` (fully static). React islands via `@astrojs/react`. Tailwind CSS 4 loaded through `@tailwindcss/vite` — **do not add `@astrojs/tailwind`**, it's incompatible with Astro 6.

**Node version**: 22 (`.node-version` file pins this for Vercel).

### Routing & Pages

| Route | File |
|---|---|
| `/` | `src/pages/index.astro` — hero, projects grid, stack, news preview, contact |
| `/news` | `src/pages/news/index.astro` — full NewsFeed |
| `/projects/[slug]` | `src/pages/projects/[slug].astro` — dynamic from content collection |

### Content Collections

Projects are MDX files in `src/content/projects/`. Schema defined in `src/content.config.ts`:

```ts
{ title, description, descriptionEn?, emoji, techStack: string[], featured?, githubUrl?, demoUrl?, lang: 'es'|'en' }
```

The project card links to `/projects/{id}` unless only `demoUrl` is set (external link).

## Internationalization (i18n)

**Routes**: Spanish at `/`, English at `/en/`. Astro native i18n with `prefixDefaultLocale: false`.

### Bilingual project file convention

For each project, two MDX files exist:

| File | ID | lang | description field |
|---|---|---|---|
| `{slug}.mdx` | `{slug}` | `es` | Spanish text |
| `{slug}.en.mdx` | `{slug}.en` | `en` | English text |

**Rules — always follow when adding or editing projects:**

1. **ES file** (`{slug}.mdx`): `lang: 'es'`, `description` in Spanish, `descriptionEn` in English (required — used for EN home page cards).
2. **EN file** (`{slug}.en.mdx`): `lang: 'en'`, `description` in English (NOT Spanish), no `descriptionEn` field.
3. **Titles must match exactly** between ES and EN files (the EN lookup used `p.id === '${esProject.id}.en'` — so file naming is the source of truth).
4. **File slug = URL slug**: the ES file name determines the URL for both languages. `openclaw.mdx` → `/projects/openclaw` and `/en/projects/openclaw`.

### Filtering projects in pages

Always filter by `p.data.lang === 'es'` to get the 3 base projects (never iterate all 6 — the `.en` files are content variants, not separate entries for display):

```ts
const projects = (await getCollection('projects')).filter((p) => p.data.lang === 'es');
```

### EN project detail page lookup

`src/pages/en/projects/[slug].astro` maps ES slugs and finds the EN version by ID:

```ts
const enProject = allProjects.find((p) => p.id === `${esProject.id}.en`);
// Falls back to ES entry if no .en file exists
props: { project: enProject ?? esProject }
```

### Description display on EN pages

- **Home cards** (`en/index.astro`): `project.data.descriptionEn ?? project.data.description` (reads from ES entry)
- **Detail page** (`en/projects/[slug].astro`): `project.data.descriptionEn ?? project.data.description` (reads from EN entry, whose `description` is already in English)

### When adding a new project

1. Create `src/content/projects/{slug}.mdx` with `lang: 'es'`, Spanish `description`, and `descriptionEn` in English
2. Create `src/content/projects/{slug}.en.mdx` with `lang: 'en'` and English `description`
3. Both files must have the same `title` value
4. Restart the dev server after adding new content files (`npm run dev`) — content collection changes are not picked up by HMR alone

### Design System

All colors, radii, and fonts are CSS custom properties defined in `src/styles/global.css`. **Always use variables, never hardcode values**:

- Backgrounds: `--bg-deep`, `--bg-base`, `--bg-elevated`, `--bg-surface`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`, `--text-faint`
- Accents: `--accent-orange`, `--accent-cyan`, `--accent-green` (and `*-glow` variants)
- Borders: `--border-subtle`, `--border-default`, `--border-strong`
- Fonts: `--font-heading` (Space Grotesk), `--font-body` (DM Sans), `--font-mono` (JetBrains Mono)

### React Island

`src/components/NewsFeed.tsx` is the **only** React component. It runs `client:load` (browser-only). It fetches live news from:
- Hacker News Algolia API (`hn.algolia.com`)
- Reddit JSON API (`reddit.com/r/artificial.json`)

Sorts by points, categorizes by keyword matching. Accepts a `limit` prop for the homepage preview.

**Critical**: always keep `import React` at the top. Astro 6 SSR prerender fails with "React is not defined" even with automatic JSX runtime if the import is missing.

### Layout

`src/layouts/Base.astro` is the single layout. It includes: global CSS, Google Fonts, fixed nav with scroll-blur effect, mobile hamburger menu, footer, skip-to-content link.

## Deployment

Deployed to Vercel. Config in `vercel.json` (`framework: astro`, `buildCommand: npm run build`).
