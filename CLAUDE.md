# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
{ title, description, emoji, techStack: string[], featured?, githubUrl?, demoUrl? }
```

The project card links to `/projects/{id}` unless only `demoUrl` is set (external link).

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
