import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('ArchitectureShowcase, homepage integrations, badges, and YouTube omnichannel links are properly configured', async () => {
	const [showcaseSource, esHome, enHome, baseLayout, cardPage, uiSource] = await Promise.all([
		readFile(new URL('../src/components/ArchitectureShowcase.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/en/index.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/layouts/Base.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/card.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/i18n/ui.ts', import.meta.url), 'utf8'),
	]);

	// 1. ArchitectureShowcase component contracts
	assert.match(showcaseSource, /import YouTubeEmbed from '\.\/YouTubeEmbed\.astro'/);
	assert.match(showcaseSource, /p\.data\.youtubeId/);
	assert.match(showcaseSource, /<YouTubeEmbed/);
	assert.match(showcaseSource, /https:\/\/www\.youtube\.com\/@mario\.inostroza\.m/);
	assert.match(showcaseSource, /https:\/\/i\.ytimg\.com\/vi\/.*\/hqdefault\.jpg/);

	// 2. Spanish home page integration
	assert.match(esHome, /import ArchitectureShowcase from '\.\.\/components\/ArchitectureShowcase\.astro'/);
	assert.match(esHome, /<ArchitectureShowcase lang=\{lang\} posts=\{allPosts\} \/>/);
	assert.match(esHome, /post\.data\.youtubeId/);
	assert.match(esHome, /t\('badge\.video'\)/);
	assert.match(esHome, /'https:\/\/www\.youtube\.com\/@mario\.inostroza\.m'/);
	assert.match(esHome, /href="https:\/\/www\.youtube\.com\/@mario\.inostroza\.m"/);

	// 3. English home page integration
	assert.match(enHome, /import ArchitectureShowcase from '\.\.\/\.\.\/components\/ArchitectureShowcase\.astro'/);
	assert.match(enHome, /<ArchitectureShowcase lang=\{lang\} posts=\{allPosts\} \/>/);
	assert.match(enHome, /post\.data\.youtubeId/);
	assert.match(enHome, /t\('badge\.video'\)/);
	assert.match(enHome, /'https:\/\/www\.youtube\.com\/@mario\.inostroza\.m'/);
	assert.match(enHome, /href="https:\/\/www\.youtube\.com\/@mario\.inostroza\.m"/);

	// 4. Base layout footer has YouTube link
	assert.match(baseLayout, /href="https:\/\/www\.youtube\.com\/@mario\.inostroza\.m"/);
	assert.match(baseLayout, /aria-label="YouTube"/);

	// 5. Card page links to canonical YouTube channel
	assert.match(cardPage, /href="https:\/\/www\.youtube\.com\/@mario\.inostroza\.m"/);

	// 6. UI translations exist for ES and EN
	assert.match(uiSource, /"section\.videos\.title":\s*"Ingeniería de Sistemas Críticos"/);
	assert.match(uiSource, /"section\.videos\.title":\s*"Mission-Critical Systems Engineering"/);
	assert.match(uiSource, /"badge\.video":\s*"Video Explainer"/);
});
