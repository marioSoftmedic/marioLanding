import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { canonicalInternalLinks, canonicalPath } from "./src/lib/routes.mjs";

export default defineConfig({
	site: "https://mariohealthbits.dev",
	trailingSlash: "always",
	integrations: [
		react(),
		mdx({ remarkPlugins: [canonicalInternalLinks] }),
		sitemap({
			filter: (page) => canonicalPath(new URL(page).pathname) === new URL(page).pathname,
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
