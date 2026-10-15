import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

function sectionOffsets(html) {
	return {
		blog: html.indexOf('id="blog"'),
		stack: html.indexOf('id="stack"'),
	};
}

function assertBlogBeforeStack(html, label) {
	const { blog, stack } = sectionOffsets(html);
	assert.ok(blog > -1, `${label}: Blog section not found`);
	assert.ok(stack > -1, `${label}: Stack section not found`);
	assert.ok(blog < stack, `${label}: Blog section must render before Stack`);
}

function assertHubLinks(html, paths, label) {
	for (const path of paths) {
		assert.ok(html.includes(`href="${path}"`), `${label}: home is missing hub link ${path}`);
	}
}

const built = process.env.HOME_SEO_BUILT === "1";
const builtTest = built ? test : test.skip;

builtTest("ES home renders Blog before Stack and links every hub", () => {
	const html = read("dist/index.html");
	assertBlogBeforeStack(html, "ES");
	assertHubLinks(
		html,
		[
			"/salud-digital-chile/",
			"/laboratorio-clinico-api/",
			"/agentes-ia-produccion/",
			"/examya/",
			"/builder-patagonia/",
		],
		"ES",
	);
});

builtTest("EN home mirrors the structure with localized hub links", () => {
	const html = read("dist/en/index.html");
	assertBlogBeforeStack(html, "EN");
	assertHubLinks(
		html,
		[
			"/en/digital-health-chile/",
			"/en/clinical-lab-api/",
			"/en/ai-agents-production/",
			"/en/examya/",
			"/en/patagonia-builder/",
		],
		"EN",
	);
});
