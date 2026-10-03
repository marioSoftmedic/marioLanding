# YouTube Support and Editorial Integration

## Objective and authorization

Implement YouTube video support in mariohealthbits.dev and integrate the editorial publishing workflow:
1. Blog schema: Add `youtubeId: z.string().optional()` in `src/content.config.ts`.
2. Lightweight player: Create a YouTube facade component (`src/components/YouTubeEmbed.astro`) that loads no iframes until clicked, preserving Core Web Vitals.
3. Templates: Mount `YouTubeEmbed` in `src/pages/blog/[slug].astro` and `src/pages/en/blog/[slug].astro`.
4. SEO: Enrich Schema.org (`VideoObject`) in `src/lib/schema.ts` when `youtubeId` is present.
5. Editorial contract: Update `~/.agents/skills/blog-publish/SKILL.md` checklist and handoff to actively request YouTube link/ID before closing publication when a 16:9 explainer video was produced.

Authorized scope: `marioLanding_blog` repository and local `blog-publish` skill. No builds (`npm run build`) in source workflow.

## Route, testing, and review

- Route: direct inline (well-defined targeted edits and components).
- Testing: `npm run validate-posts` and contract test suites (`editorial-contract.test.mjs`, `portfolio-contract.test.mjs`).
- Engram mirror: `odd/youtube-support/tasks`.

## Work units

- [x] T1 — Add `youtubeId` to blog schema in `src/content.config.ts`.
- [x] T2 — Create `src/components/YouTubeEmbed.astro` with facade pattern, accessible play button, responsive 16:9, and youtube-nocookie.
- [x] T3 — Mount `YouTubeEmbed` in `src/pages/blog/[slug].astro` and `src/pages/en/blog/[slug].astro`.
- [x] T4 — Enrich Schema.org with `VideoObject` in `src/lib/schema.ts` when `youtubeId` is present.
- [x] T5 — Update publication checklist and handoff in `~/.agents/skills/blog-publish/SKILL.md` for 16:9 explainer videos.
- [x] T6 — Verification: run `npm run validate-posts` and contract test suites.

## Progress and evidence

- Schema: `youtubeId: z.string().optional()` added to `src/content.config.ts`.
- Facade: `src/components/YouTubeEmbed.astro` created with responsive aspect-video, lazy poster loading, accessible button role/aria-label, and zero-iframe load until click/Enter.
- Blog pages: `YouTubeEmbed` mounted in both `src/pages/blog/[slug].astro` and `src/pages/en/blog/[slug].astro`.
- Schema.org: `buildArticleSchema` in `src/lib/schema.ts` updated to generate `VideoObject` (with thumbnail options, embedUrl, contentUrl, and dates) and associate it to `article.video`.
- Editorial contract: `~/.agents/skills/blog-publish/SKILL.md`, `editorial-contract.md`, and `commands/editorial.md` updated to require active prompting for YouTube link/ID before closing publication when an explainer 16:9 is generated.
- All tests pass: `node --test tests/youtube-schema.test.mjs`, `npm run validate-posts`, and editorial test suites (`editorial-contract.test.mjs`, `portfolio-contract.test.mjs`, `test:issue18`, `test:issue20`, `test:issue21`).
