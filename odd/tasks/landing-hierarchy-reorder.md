# Feature: Landing Narrative Hierarchy Reorder

## Objective
Reorder the landing page sections to prioritize proof-of-work (Projects and Architecture Showcase) immediately after the Hero, moving Trayectoria and Stack to the validation/authority layer, and removing redundant Hubs from the homepage.

## Flow Order
1. Hero (`#hero` / intro)
2. Proyectos (`#proyectos` - What I build)
3. Architecture Showcase (`#arquitectura-video` - How I engineer systems)
4. Trayectoria (`#trayectoria` - Domain depth & unfair moat)
5. Stack (`#stack` - Technical toolbox)
6. Blog Showcase (`#blog` - Thinking & Healthbits Brief signup)
7. Contacto (`#contacto` - Direct conversion)

## Tasks
1. [x] TASK-1: Reorder sections in `src/pages/index.astro`.
2. [x] TASK-2: Reorder sections in `src/pages/en/index.astro`.
3. [x] TASK-3: Run `npm run validate-posts` and test local dev server.
4. [x] TASK-4: Deploy preview to Vercel and verify URL.

## Evidence & Outcome
- `npm run validate-posts`: 311 posts validated OK.
- Local Astro dev server: Rendered ES & EN sections in exact order: `['proyectos', 'arquitectura-video', 'trayectoria', 'stack', 'blog', 'contacto']`.
- Vercel Preview URL: `https://portfolio-6tkv3v7fp-mariosoftmedics-projects.vercel.app`
- Inspection URL: `https://vercel.com/mariosoftmedics-projects/portfolio/6qQ2NorBmdAVgKsksYt2VKNPbuP5`
