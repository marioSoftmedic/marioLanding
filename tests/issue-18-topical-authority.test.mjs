import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isIndexableTag, isSitemapPage } from '../src/lib/tag-indexability.mjs';

test('indexes a locale tag only when it has three published posts and a unique description', () => {
	assert.equal(isIndexableTag({ publishedCount: 3, description: 'Clinical interoperability.' }), true);
	assert.equal(isIndexableTag({ publishedCount: 2, description: 'Clinical interoperability.' }), false);
});

test('defines the approved bilingual author routes and editorial safeguards', async () => {
	const [es, en, editorial] = await Promise.all([
		readFile(new URL('../src/pages/autor.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/en/author.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/data/editorial.ts', import.meta.url), 'utf8'),
	]);
	assert.match(es, /EDITORIAL_ENTITY\.role\.es/);
	assert.match(en, /EDITORIAL_ENTITY\.role\.en/);
	assert.match(editorial, /Tecnólogo Médico y builder de sistemas de salud e inteligencia artificial/);
	assert.match(editorial, /Medical Technologist and builder of health and artificial intelligence systems/);
	assert.match(editorial, /quarterly/);
	assert.match(editorial, /educational/);
});

test('contains all four localized pillars with visible FAQs and required product links', async () => {
	const pillars = await readFile(new URL('../src/data/pillars.ts', import.meta.url), 'utf8');
	for (const marker of ["'clinical-lab-api': {", "'ai-agents-production': {", 'Examya', 'Fhirex', 'faqs:']) {
		assert.match(pillars, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
	}
});

test('does not index a tag with an empty or reused locale description', () => {
	assert.equal(isIndexableTag({ publishedCount: 3, description: '' }), false);
	assert.equal(isIndexableTag({ publishedCount: 3, description: 'Clinical interoperability.', duplicateDescription: true }), false);
});

test('keeps tag-page robots and sitemap filtering on the shared policy', async () => {
	const [config, esTag, enTag] = await Promise.all([
		readFile(new URL('../astro.config.mjs', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/blog/tags/[tag].astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/en/blog/tags/[tag].astro', import.meta.url), 'utf8'),
	]);
	assert.match(config, /isSitemapPage/);
	assert.match(esTag, /isIndexableTag/);
	assert.match(enTag, /isIndexableTag/);
});

test('excludes thin tag paths from sitemap regardless of trailing-slash normalization', () => {
	const policy = new Map([['cotocha', false], ['ai', true]]);
	assert.equal(isSitemapPage('/blog/tags/cotocha/', policy), false);
	assert.equal(isSitemapPage('/en/blog/tags/cotocha', policy), false);
	assert.equal(isSitemapPage('/blog/tags/ai/', policy), true);
});

test('uses one schema and breadcrumb model for visible article and hub content', async () => {
	const [schema, breadcrumbs, esArticle, enArticle, esHub, enHub] = await Promise.all([
		readFile(new URL('../src/lib/schema.ts', import.meta.url), 'utf8'),
		readFile(new URL('../src/components/Breadcrumbs.astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/blog/[slug].astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/en/blog/[slug].astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/[hub].astro', import.meta.url), 'utf8'),
		readFile(new URL('../src/pages/en/[hub].astro', import.meta.url), 'utf8'),
	]);
	assert.match(schema, /buildArticleSchema/);
	assert.match(schema, /buildCollectionPageSchema/);
	assert.match(schema, /BreadcrumbList/);
	assert.match(breadcrumbs, /items/);
	for (const page of [esArticle, enArticle, esHub, enHub]) {
		assert.match(page, /Breadcrumbs/);
	}
});

test('renders curated pillar links from localized editorial data', async () => {
	const [pillars, component] = await Promise.all([
		readFile(new URL('../src/data/pillars.ts', import.meta.url), 'utf8'),
		readFile(new URL('../src/components/PillarContent.astro', import.meta.url), 'utf8'),
	]);
	assert.match(pillars, /curatedArticles/);
	assert.match(component, /Curated reading|Lecturas seleccionadas/);
});

test('built pages keep visible and JSON-LD trust, FAQ, breadcrumb, author, and sitemap parity', { skip: !process.env.ISSUE18_BUILT }, () => {
	const dist = new URL('../dist/', import.meta.url);
	for (const path of ['autor/index.html', 'en/author/index.html', 'laboratorio-clinico-api/index.html', 'en/clinical-lab-api/index.html', 'agentes-ia-produccion/index.html', 'en/ai-agents-production/index.html']) {
		const html = readFileSync(new URL(path, dist), 'utf8');
		assert.match(html, /application\/ld\+json/);
		assert.match(html, /BreadcrumbList/);
	}
	for (const path of ['blog/2026-04-01-cotocha-orquestador-agentes-ia/index.html', 'en/blog/2026-04-01-cotocha-orquestador-agentes-ia/index.html']) {
		const html = readFileSync(new URL(path, dist), 'utf8');
		assert.match(html, /href="\/autor\/"|href="\/en\/author\//);
		assert.match(html, /dateModified/);
		assert.match(html, /mainEntityOfPage/);
	}
	const sitemap = readFileSync(new URL('sitemap-0.xml', dist), 'utf8');
	const thinTag = 'https://mariohealthbits.dev/blog/tags/cotocha/';
	assert.equal(sitemap.includes(thinTag), false);
	assert.equal(existsSync(new URL('blog/tags/cotocha/index.html', dist)), true);
});
