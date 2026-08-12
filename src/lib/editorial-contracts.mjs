const sameFaqs = (left = [], right = []) => JSON.stringify(left) === JSON.stringify(right);

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function articleSchemaType(articleKind = 'blog') {
	return articleKind === 'technical' ? 'TechArticle' : 'BlogPosting';
}

export function validateArticleContract({ date, updatedDate, corrections = [], authorRoute, publisherLogo = 'present', visibleFaqs, schemaFaqs }) {
	const errors = [];
	if (updatedDate && updatedDate <= date) errors.push('updatedDate must be after date');
	for (const correction of corrections) {
		if (!correction.date || !correction.note?.trim()) errors.push('material correction requires a nonempty dated note');
		else if (!updatedDate || correction.date <= date || correction.date > updatedDate) errors.push('correction date must be after publication and no later than updatedDate');
	}
	if (authorRoute && !['/autor/', '/en/author/'].includes(authorRoute)) errors.push('author route does not resolve for locale');
	if (!publisherLogo) errors.push('publisher logo is required');
	if (visibleFaqs && !sameFaqs(visibleFaqs, schemaFaqs)) errors.push('FAQ schema must match visible FAQs');
	return errors;
}

export function validatePillarContract({ curatedArticles, localizedArticlePaths, faqs, schemaFaqs }) {
	const errors = [];
	if (curatedArticles.some((article) => !localizedArticlePaths.has(article.url))) errors.push('missing localized curated target');
	if (!sameFaqs(faqs, schemaFaqs)) errors.push('FAQ schema must match visible FAQs');
	return errors;
}

const source = (root, path) => readFileSync(join(root, path), 'utf8');
const publisherLogo = (schema) => schema.includes("logo: { '@type': 'ImageObject'") ? 'present' : '';
const pillarFaqs = (page) => page.includes('const pillar') ? ['visible'] : [];
const schemaFaqs = (page) => page.includes('faqs: pillar?.faqs') ? ['visible'] : [];
const postPaths = (root) => new Set(readdirSync(join(root, 'src/content/blog')).map((name) => {
	const slug = name.replace(/\.en\.mdx?$/, '').replace(/\.mdx?$/, '');
	return name.includes('.en.') ? `/en/blog/${slug}/` : `/blog/${slug}/`;
}));

export function validateProjectEditorialContracts(root) {
	const errors = [];
	const editorial = source(root, 'src/data/editorial.ts');
	const schema = source(root, 'src/lib/schema.ts');
	errors.push(...validateArticleContract({ date: new Date('2026-01-01'), authorRoute: editorial.includes("es: '/autor/'") ? '/autor/' : '', publisherLogo: publisherLogo(schema) }));
	errors.push(...validateArticleContract({ date: new Date('2026-01-01'), authorRoute: editorial.includes("en: '/en/author/'") ? '/en/author/' : '', publisherLogo: publisherLogo(schema) }));
	if (!editorial.includes("es: '/autor/'") || !editorial.includes("en: '/en/author/'")) errors.push('author route does not resolve for locale');
	for (const pagePath of ['src/pages/[hub].astro', 'src/pages/en/[hub].astro']) {
		const page = source(root, pagePath);
		errors.push(...validateArticleContract({ date: new Date('2026-01-01'), visibleFaqs: pillarFaqs(page), schemaFaqs: schemaFaqs(page) }));
	}
	const pillars = source(root, 'src/data/pillars.ts');
	const curatedArticles = [...pillars.matchAll(/curatedArticles:\s*\[([\s\S]*?)\], products:/g)].flatMap(([, block]) => [...block.matchAll(/url:\s*['\"]([^'\"]+)['\"]/g)].map(([, url]) => ({ url })));
	errors.push(...validatePillarContract({ curatedArticles, localizedArticlePaths: postPaths(root), faqs: [], schemaFaqs: [] }));
	for (const name of readdirSync(join(root, 'src/content/blog')).filter((entry) => /\.mdx?$/.test(entry))) {
		const frontmatter = source(root, `src/content/blog/${name}`).match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
		const date = frontmatter.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
		const updatedDate = frontmatter.match(/^updatedDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
		if (date && updatedDate) errors.push(...validateArticleContract({ date: new Date(`${date}T00:00:00Z`), updatedDate: new Date(`${updatedDate}T00:00:00Z`) }));
	}
	return [...new Set(errors)];
}
