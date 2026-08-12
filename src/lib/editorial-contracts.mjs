const sameFaqs = (left = [], right = []) => JSON.stringify(left) === JSON.stringify(right);

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
