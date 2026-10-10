# Architecture Video Showcase on Landing & YouTube Integration

## Objective and authorization

Integrate YouTube architecture explainer videos into the landing page (mariohealthbits.dev) and enhance channel visibility:
1. Dynamic video showcase: Create `src/components/ArchitectureShowcase.astro` that automatically pulls the latest published blog post with `youtubeId` in the current language, displaying the explainer video via `YouTubeEmbed` (facade pattern) alongside recent video cards and a direct CTA to the YouTube channel (`https://www.youtube.com/@mario.inostroza.m`).
2. Landing integration: Mount `ArchitectureShowcase` on both `src/pages/index.astro` (ES) and `src/pages/en/index.astro` (EN), plus add a `[Video Explainer]` pill badge in the `#blog` section for posts containing `youtubeId`.
3. Omnichannel links & SEO: Add the YouTube channel link to:
   - Footer in `src/layouts/Base.astro`
   - `#contacto` in `src/pages/index.astro` and `src/pages/en/index.astro`
   - `sameAs` array in `homeSchema` (Schema.org Person)
   - Canonical `https://www.youtube.com/@mario.inostroza.m` in `src/pages/card.astro` and `public/mario-inostroza.vcf`
4. Testing & validation: Add test suite `tests/video-showcase.test.mjs` verifying component contracts, links, and schema, and run `npm run validate-posts`.

Authorized scope: `marioLanding_blog` repository. No `npm run build` as per CLAUDE.md.

## Route, testing, and review

- Route: direct inline (well-defined targeted Astro components and template updates).
- Testing: `node --test tests/video-showcase.test.mjs`, `npm run validate-posts`, and existing test suites.
- Engram mirror: `odd/architecture-video-showcase/tasks`.

## Work units

- [x] T1 — Create `src/components/ArchitectureShowcase.astro` with automatic collection filtering for the latest video, facade embed, recent explainers list, and YouTube CTA.
- [x] T2 — Integrate `ArchitectureShowcase` and `Video Explainer` post badges into `src/pages/index.astro` and `src/pages/en/index.astro`, with bilingual UI copy in `src/i18n/ui.ts`.
- [x] T3 — Add YouTube channel links to footer (`src/layouts/Base.astro`), contact sections (`index.astro` & `en/index.astro`), `sameAs` Schema.org, and verify/update `src/pages/card.astro` and `mario-inostroza.vcf`.
- [x] T4 — Add automated tests in `tests/video-showcase.test.mjs` verifying video showcase component, channel links, schema, and badges.
- [x] T5 — Verification: execute `npm run validate-posts` and full test suites.

## Progress and evidence

- Architecture showcase: `src/components/ArchitectureShowcase.astro` created with automatic collection filtering on `youtubeId`, featured explainer player using `YouTubeEmbed` (zero Core Web Vitals degradation), list of secondary video explainers, and YouTube channel card.
- Landing integration: Mounted between `#proyectos` and `#stack` in both `src/pages/index.astro` and `src/pages/en/index.astro`. Added `[Video Explainer]` badge with YouTube icon in `#blog` cards.
- Omnichannel links: Added YouTube link (`https://www.youtube.com/@mario.inostroza.m`) to footer in `src/layouts/Base.astro`, `#contacto` in both `index.astro` and `en/index.astro`, `sameAs` Schema.org Person array, `card.astro`, and `mario-inostroza.vcf`.
- Tests: `node --test tests/video-showcase.test.mjs` passes (1/1 tests). `npm run validate-posts` passes (311/311 posts). Full suite `node --test tests/*.test.mjs` passes (28 passed, 7 skipped).
