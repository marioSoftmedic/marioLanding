import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isIndexableTag, isSitemapPage } from '../src/lib/tag-indexability.mjs';
import {
	articleSchemaType,
	validateArticleContract,
	validatePillarContract,
} from '../src/lib/editorial-contracts.mjs';

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
	assert.match(pillars, /idNorma=1203827/);
	assert.doesNotMatch(pillars, /idNorma=1214041|FHIR R4 Security/);
});

test('rejects invalid update and material-correction chronology', () => {
	const base = { date: new Date('2026-01-02'), updatedDate: new Date('2026-01-02'), corrections: [] };
	assert.deepEqual(validateArticleContract(base), ['updatedDate must be after date']);
	assert.match(validateArticleContract({ ...base, updatedDate: new Date('2026-01-03'), corrections: [{ date: new Date('2026-01-04'), note: 'Material correction.' }] })[0], /no later than updatedDate/);
	assert.match(validateArticleContract({ ...base, updatedDate: undefined, corrections: [{ date: new Date('2026-01-03'), note: '' }] })[0], /nonempty dated note/);
});

test('rejects unresolved author routes and visible/schema parity failures', () => {
	assert.deepEqual(validateArticleContract({ date: new Date('2026-01-01'), authorRoute: '/en/autor/' }), ['author route does not resolve for locale']);
	assert.match(validateArticleContract({ date: new Date('2026-01-01'), publisherLogo: '', visibleFaqs: [{ question: 'Visible?', answer: 'Yes.' }], schemaFaqs: [] }).join(' '), /publisher logo is required.*FAQ schema must match visible FAQs/);
});

test('rejects missing localized curated targets and FAQ drift', () => {
	assert.deepEqual(validatePillarContract({
		locale: 'en',
		curatedArticles: [{ label: 'Missing', url: '/en/blog/missing/' }],
		localizedArticlePaths: new Set(['/blog/only-es/']),
		faqs: [{ question: 'Q?', answer: 'A.' }],
		schemaFaqs: [{ question: 'Other?', answer: 'A.' }],
	}), ['missing localized curated target', 'FAQ schema must match visible FAQs']);
});

const validationRoot = new URL('..', import.meta.url);
const validator = new URL('../scripts/validate-posts.mjs', import.meta.url);

async function expectValidatorFailure({ file, replace, diagnostic }) {
	const fixtureRoot = await mkdtemp(join(tmpdir(), 'issue18-validator-'));
	try {
		await cp(new URL('../src/', import.meta.url), join(fixtureRoot, 'src'), { recursive: true });
		const fixturePath = join(fixtureRoot, file.replace(/^src\//, 'src/'));
		const source = await readFile(fixturePath, 'utf8');
		await writeFile(fixturePath, source.replace(...replace));
		let result;
		try {
			execFileSync(process.execPath, [validator.pathname, `--issue18-root=${fixtureRoot}`], { cwd: validationRoot, encoding: 'utf8', stdio: 'pipe' });
		} catch (error) {
			result = `${error.stdout}${error.stderr}`;
			assert.equal(error.status, 1);
		}
		assert.match(result ?? '', diagnostic);
	} finally {
		await rm(fixtureRoot, { recursive: true, force: true });
	}
}

test('the real validation process rejects each issue-18 contract breach', async (t) => {
	await t.test('invalid author route', () => expectValidatorFailure({ file: 'src/data/editorial.ts', replace: [/en: '\/en\/author\/'/, "en: '/en/autor/'"], diagnostic: /author route does not resolve for locale/ }));
	await t.test('FAQ-visible/schema divergence', () => expectValidatorFailure({ file: 'src/pages/[hub].astro', replace: [/faqs: pillar\?\.faqs/, 'faqs: []'], diagnostic: /FAQ schema must match visible FAQs/ }));
	await t.test('missing publisher logo', () => expectValidatorFailure({ file: 'src/lib/schema.ts', replace: [/logo: \{ '@type': 'ImageObject', url: `\$\{siteUrl\}\/favicon\.svg` \},/, ''], diagnostic: /publisher logo is required/ }));
	await t.test('missing localized curated target', () => expectValidatorFailure({ file: 'src/data/pillars.ts', replace: [/url: '\/en\/blog\//, "url: '/en/blog/missing-localized-target/"], diagnostic: /missing localized curated target/ }));
	await t.test('invalid update chronology', () => expectValidatorFailure({ file: 'src/content/blog/2026-04-17-postgresql-drizzle-orm-mi-stack-favorito-para-proyectos-con-ia.mdx', replace: [/date: 2026-04-17/, 'date: 2026-04-17\nupdatedDate: 2026-04-17'], diagnostic: /updatedDate must be after date/ }));
});

test('classifies only opted-in technical articles as TechArticle', () => {
	assert.equal(articleSchemaType(), 'BlogPosting');
	assert.equal(articleSchemaType('technical'), 'TechArticle');
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
	const readHtml = (path) => readFileSync(new URL(path, dist), 'utf8');
	const files = (path) => readdirSync(new URL(path, dist), { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(`${path}${entry.name}/`) : [`${path}${entry.name}`]);
	const articlePages = [...files('blog/'), ...files('en/blog/')].filter((path) => /^((en\/)?blog\/)\d{4}-.*\/index\.html$/.test(path));
	assert.equal(articlePages.length, 196, 'expected every built article to be audited');
	for (const path of articlePages) {
		const html = readHtml(path);
		assert.match(html, /href="\/(?:autor\/|en\/author\/)/, `${path} has an author link`);
		assert.match(html, /"@type":"(?:BlogPosting|TechArticle)"/, `${path} has an article schema type`);
		assert.match(html, /"dateModified":/, `${path} has dateModified`);
		assert.match(html, /"logo":\{"@type":"ImageObject","url":"https:\/\/mariohealthbits\.dev\/favicon\.svg"/, `${path} has a publisher logo`);
	}
	for (const path of ['autor/index.html', 'en/author/index.html', 'laboratorio-clinico-api/index.html', 'en/clinical-lab-api/index.html', 'agentes-ia-produccion/index.html', 'en/ai-agents-production/index.html']) {
		const html = readHtml(path);
		assert.match(html, /application\/ld\+json/);
		assert.match(html, /BreadcrumbList/);
	}
	for (const path of ['laboratorio-clinico-api/index.html', 'en/clinical-lab-api/index.html', 'agentes-ia-produccion/index.html', 'en/ai-agents-production/index.html']) {
		const html = readHtml(path);
		assert.match(html, /Respuesta directa|Direct answer/);
		assert.match(html, /Fuentes primarias y referencias|Primary sources and references/);
		assert.match(html, /FAQPage/);
		assert.equal((html.match(/<h3>/g) ?? []).length >= 4, true, `${path} renders four visible FAQs`);
		assert.match(html, /Examya/);
	}
	const sitemap = readHtml('sitemap-0.xml');
	const thinTag = 'https://mariohealthbits.dev/blog/tags/cotocha/';
	assert.equal(sitemap.includes(thinTag), false);
	assert.equal(existsSync(new URL('blog/tags/cotocha/index.html', dist)), true);
});
