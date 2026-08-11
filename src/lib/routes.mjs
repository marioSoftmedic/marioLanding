const FILE_PATH = /\/[^/?#]+\.[^/?#]+$/;

export function canonicalPath(value) {
	if (!value.startsWith("/") || value.startsWith("//")) return value;

	const suffixIndex = value.search(/[?#]/);
	const pathname = suffixIndex === -1 ? value : value.slice(0, suffixIndex);
	const suffix = suffixIndex === -1 ? "" : value.slice(suffixIndex);

	if (pathname === "/" || pathname.endsWith("/") || FILE_PATH.test(pathname)) {
		return value;
	}

	return `${pathname}/${suffix}`;
}

export function absoluteUrl(path, origin = "https://mariohealthbits.dev") {
	return new URL(canonicalPath(path), origin).href;
}

export function languageFromPath(pathname) {
	return /^\/en(?:\/|$)/.test(pathname) ? "en" : "es";
}

export function canonicalInternalLinks() {
	return (tree) => {
		const visit = (node) => {
			if (node?.type === "link" && typeof node.url === "string") {
				node.url = canonicalPath(node.url);
			}
			if (node?.type === "mdxJsxTextElement" || node?.type === "mdxJsxFlowElement") {
				const href = node.attributes?.find((attribute) => attribute.name === "href");
				if (href && typeof href.value === "string") href.value = canonicalPath(href.value);
			}
			for (const child of node?.children ?? []) visit(child);
		};
		visit(tree);
	};
}
