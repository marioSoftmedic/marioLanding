export function isIndexableTag({ publishedCount, description, duplicateDescription = false }) {
	return publishedCount >= 3 && Boolean(description?.trim()) && !duplicateDescription;
}

export function tagPagePath(locale, slug) {
	return locale === 'en' ? `/en/blog/tags/${slug}/` : `/blog/tags/${slug}/`;
}

export function buildTagIndexabilitySnapshot({ taxonomy, posts }) {
	const publishedCounts = new Map();
	for (const post of posts) {
		for (const slug of new Set(post.tags)) {
			const key = `${post.locale}:${slug}`;
			publishedCounts.set(key, (publishedCounts.get(key) ?? 0) + 1);
		}
	}

	const descriptionCounts = new Map();
	for (const tag of taxonomy) {
		for (const locale of ['es', 'en']) {
			const description = tag.description?.[locale]?.trim().replace(/\s+/g, ' ').toLowerCase();
			if (!description) continue;
			const key = `${locale}:${description}`;
			descriptionCounts.set(key, (descriptionCounts.get(key) ?? 0) + 1);
		}
	}

	return new Map(taxonomy.flatMap((tag) => ['es', 'en'].map((locale) => {
		const description = tag.description?.[locale];
		const normalizedDescription = description?.trim().replace(/\s+/g, ' ').toLowerCase();
		const duplicateDescription = Boolean(normalizedDescription && descriptionCounts.get(`${locale}:${normalizedDescription}`) > 1);
		const indexable = isIndexableTag({
			publishedCount: publishedCounts.get(`${locale}:${tag.slug}`) ?? 0,
			description,
			duplicateDescription,
		});
		return [tagPagePath(locale, tag.slug), indexable];
	})));
}

export function isIndexableTagPage(pathname, tagIndexability = new Map()) {
	const match = pathname.match(/^\/(?:en\/)?blog\/tags\/([^/]+)\/?$/);
	if (!match) return true;
	const canonicalPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
	return tagIndexability.get(canonicalPath) === true;
}

export const isSitemapPage = isIndexableTagPage;
