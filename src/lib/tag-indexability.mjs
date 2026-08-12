export function isIndexableTag({ publishedCount, description, duplicateDescription = false }) {
	return publishedCount >= 3 && Boolean(description?.trim()) && !duplicateDescription;
}

export function isSitemapPage(pathname, tagIndexability = new Map()) {
	const match = pathname.match(/^\/(?:en\/)?blog\/tags\/([^/]+)\/?$/);
	if (!match) return true;
	return tagIndexability.get(pathname) ?? tagIndexability.get(match[1]) === true;
}
