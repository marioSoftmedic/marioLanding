import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { canonicalInternalLinks, canonicalPath } from "./src/lib/routes.mjs";
import { isSitemapPage } from "./src/lib/tag-indexability.mjs";
import { TAG_TAXONOMY, normalizeTag } from "./src/lib/tags";
import { readFileSync, readdirSync } from "node:fs";

const blogDirectory = new URL('./src/content/blog/', import.meta.url);
const tagCounts = new Map();
for (const file of readdirSync(blogDirectory)) {
	if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
	const content = readFileSync(new URL(file, blogDirectory), 'utf8');
	if (/\bdraft:\s*true\b/.test(content)) continue;
	const locale = file.includes('.en.') ? 'en' : 'es';
	const inlineTags = content.match(/tags:\s*\[([^\]]*)\]/)?.[1]?.split(',') ?? [];
	const blockTags = content.match(/^tags:\s*\n((?:\s+-\s+[^\n]+\n?)+)/m)?.[1]?.match(/^\s+-\s+(.+)$/gm)?.map((line) => line.replace(/^\s+-\s+/, '')) ?? [];
	for (const tag of [...inlineTags, ...blockTags]) {
		const slug = normalizeTag(tag.trim().replace(/^['"]|['"]$/g, ''));
		const key = `${locale}:${slug}`;
		tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
	}
}
const tagIndexability = new Map(TAG_TAXONOMY.flatMap((tag) => ['es', 'en'].map((locale) => {
	const indexable = (tagCounts.get(`${locale}:${tag.slug}`) ?? 0) >= 3 && Boolean(tag.description?.[locale]?.trim());
	return [locale === 'en' ? `/en/blog/tags/${tag.slug}/` : `/blog/tags/${tag.slug}/`, indexable];
})));

export default defineConfig({
	site: "https://mariohealthbits.dev",
	trailingSlash: "always",
	integrations: [
		react(),
		mdx({ remarkPlugins: [canonicalInternalLinks] }),
		sitemap({
			filter: (page) => {
				const pathname = new URL(page).pathname;
				return canonicalPath(pathname) === pathname && isSitemapPage(pathname, tagIndexability);
			},
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
	output: "static",
	i18n: {
		defaultLocale: "es",
		locales: ["es", "en"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
