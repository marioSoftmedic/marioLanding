# Feature: Landing Blog Showcase (Featured Hero + Sidebar Pattern)

## Objective
Upgrade the homepage blog section from a flat vertical list to an editorial asymmetric grid (Featured Hero + Sidebar) mirroring the visual hierarchy of ArchitectureShowcase.

## Scope
- Create `src/components/BlogShowcase.astro`
- Add necessary i18n translation keys in `src/i18n/ui.ts`
- Replace inline blog section in `src/pages/index.astro` and `src/pages/en/index.astro`
- Validate layout, responsive behavior, post links, and images
- Deploy preview build to Vercel

## Tasks
1. [x] TASK-1: Add translation keys in `src/i18n/ui.ts` for featured post, read article, and more articles.
2. [x] TASK-2: Build `src/components/BlogShowcase.astro` with 12-column grid (lg:col-span-8 featured, lg:col-span-4 sidebar).
3. [x] TASK-3: Integrate `BlogShowcase` into `src/pages/index.astro` and `src/pages/en/index.astro`.
4. [x] TASK-4: Validate with `npm run validate-posts` and check dev build.
5. [x] TASK-5: Deploy preview to Vercel and verify live preview URL.

## Evidence & Outcome
- `npm run validate-posts`: 311 posts validated OK.
- Local Astro dev server: HTTP 200 on `/` and `/en/`.
- Vercel Preview URL: `https://portfolio-p5yhafadj-mariosoftmedics-projects.vercel.app`
- Inspection URL: `https://vercel.com/mariosoftmedics-projects/portfolio/3WCHFtrb1wfeoXHMKZCgtStQmoFR`
