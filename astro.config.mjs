import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { canonicalInternalLinks, canonicalPath } from "./src/lib/routes.mjs";
import { buildTagIndexabilitySnapshot, isSitemapPage } from "./src/lib/tag-indexability.mjs";
import { TAG_TAXONOMY, normalizeTag } from "./src/lib/tags";
import { readFileSync, readdirSync } from "node:fs";

const blogDirectory = new URL('./src/content/blog/', import.meta.url);
const publishedPosts = [];
for (const file of readdirSync(blogDirectory)) {
	if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
	const content = readFileSync(new URL(file, blogDirectory), 'utf8');
	if (/\bdraft:\s*true\b/.test(content)) continue;
	const locale = file.includes('.en.') ? 'en' : 'es';
	const inlineTags = content.match(/tags:\s*\[([^\]]*)\]/)?.[1]?.split(',') ?? [];
	const blockTags = content.match(/^tags:\s*\n((?:\s+-\s+[^\n]+\n?)+)/m)?.[1]?.match(/^\s+-\s+(.+)$/gm)?.map((line) => line.replace(/^\s+-\s+/, '')) ?? [];
	publishedPosts.push({
		locale,
		tags: [...inlineTags, ...blockTags].map((tag) => normalizeTag(tag.trim().replace(/^['"]|['"]$/g, ''))),
	});
}
const tagIndexability = buildTagIndexabilitySnapshot({ taxonomy: TAG_TAXONOMY, posts: publishedPosts });

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
