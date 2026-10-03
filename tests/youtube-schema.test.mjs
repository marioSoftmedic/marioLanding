import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('schema and content config support youtubeId and VideoObject structured data', async () => {
	const [contentConfig, schemaSource, esSlug, enSlug, componentSource] = await Promise.all([
		readFile(new URL('../src/content.config.ts', import.meta.url), 'utf8'),
		readFile(new URL('../src/lib/schema.ts', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/blog/[slug].astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/en/blog/[slug].astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/components/YouTubeEmbed.astro', import.meta.url), 'utf8'),
	]);

	// 1. Content config defines optional youtubeId
	assert.match(contentConfig, /youtubeId:\s*z\.string\(\)\.optional\(\)/);

	// 2. Schema generator produces VideoObject schema when youtubeId is provided
	assert.match(schemaSource, /post\.data\.youtubeId/);
	assert.match(schemaSource, /'@type':\s*'VideoObject'/);
	assert.match(schemaSource, /https:\/\/www\.youtube-nocookie\.com\/embed\//);
	assert.match(schemaSource, /https:\/\/www\.youtube\.com\/watch\?v=/);
	assert.match(schemaSource, /video:\s*videoSchema/);

	// 3. Blog pages mount YouTubeEmbed facade
	assert.match(esSlug, /import YouTubeEmbed from '\.\.\/\.\.\/components\/YouTubeEmbed\.astro'/);
	assert.match(esSlug, /post\.data\.youtubeId/);
	assert.match(esSlug, /<YouTubeEmbed/);

	assert.match(enSlug, /import YouTubeEmbed from '\.\.\/\.\.\/\.\.\/components\/YouTubeEmbed\.astro'/);
	assert.match(enSlug, /post\.data\.youtubeId/);
	assert.match(enSlug, /<YouTubeEmbed/);

	// 4. YouTubeEmbed component implements the facade pattern
	assert.match(componentSource, /class="youtube-facade/);
	assert.match(componentSource, /createElement\('iframe'\)/);
	assert.match(componentSource, /youtube-nocookie\.com/);
	assert.match(componentSource, /role="button"/);
	assert.match(componentSource, /aria-label=/);
	assert.match(componentSource, /aspect-video/);
});
