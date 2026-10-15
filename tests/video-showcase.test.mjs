import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

function parseEntry(path) {
	const raw = read(path);
	const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
	const scalar = (key) =>
		frontmatter.match(new RegExp(`^${key}:\\s*"?([^"\\n]+?)"?\\s*$`, "m"))?.[1]?.trim();
	const shortsRaw = frontmatter.match(/^shorts:\s*\[([^\]]*)\]/m)?.[1] ?? "";
	return {
		id: path.replace(/^src\/content\/videos\//, "").replace(/\.md$/, ""),
		date: scalar("date") ?? "",
		lang: scalar("lang") ?? "es",
		youtubeId: scalar("youtubeId"),
		relatedPost: scalar("relatedPost"),
		shorts: [...shortsRaw.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
	};
}

function entries(lang) {
	const directory = new URL("src/content/videos/", root);
	if (!existsSync(directory)) return [];
	return readdirSync(directory)
		.filter((name) => name.endsWith(".md"))
		.map((name) => parseEntry(`src/content/videos/${name}`))
		.filter((entry) => entry.lang === lang && entry.youtubeId)
		.sort((a, b) => b.date.localeCompare(a.date));
}

function htmlPath(pathname) {
	return `dist${pathname === "/" ? "/index.html" : `${pathname}index.html`}`;
}

test("video showcase source contracts hold across component, helper, pages, layout, and i18n", async () => {
	const [showcaseSource, helperSource, esHome, enHome, baseLayout, cardPage, blogShowcase, uiSource] =
		await Promise.all([
			readFile(new URL("../src/components/ArchitectureShowcase.astro", import.meta.url), "utf8"),
			readFile(new URL("../src/lib/showcase-videos.ts", import.meta.url), "utf8"),
			readFile(new URL("../src/pages/index.astro", import.meta.url), "utf8"),
			readFile(new URL("../src/pages/en/index.astro", import.meta.url), "utf8"),
			readFile(new URL("../src/layouts/Base.astro", import.meta.url), "utf8"),
			readFile(new URL("../src/pages/card.astro", import.meta.url), "utf8"),
			readFile(new URL("../src/components/BlogShowcase.astro", import.meta.url), "utf8"),
			readFile(new URL("../src/i18n/ui.ts", import.meta.url), "utf8"),
		]);

	// ArchitectureShowcase component contracts
	assert.match(showcaseSource, /import YouTubeEmbed from '\.\/YouTubeEmbed\.astro'/);
	assert.match(showcaseSource, /import \{ getShowcaseVideos \} from '\.\.\/lib\/showcase-videos'/);
	assert.match(showcaseSource, /<YouTubeEmbed/);
	assert.match(showcaseSource, /https:\/\/www\.youtube\.com\/@mario\.inostroza\.m/);
	assert.match(showcaseSource, /https:\/\/i\.ytimg\.com\/vi\/.*\/hqdefault\.jpg/);

	// Weekly-video helper owns the collection merge and the YouTube fallback
	assert.match(helperSource, /getCollection\('videos'\)/);
	assert.match(helperSource, /postUrl\(/);
	assert.match(helperSource, /https:\/\/www\.youtube\.com\/watch\?v=/);

	// Home pages integrate the showcase and link the canonical channel
	for (const [home, importPath] of [
		[esHome, "import ArchitectureShowcase from '../components/ArchitectureShowcase.astro'"],
		[enHome, "import ArchitectureShowcase from '../../components/ArchitectureShowcase.astro'"],
	]) {
		assert.ok(home.includes(importPath));
		assert.match(home, /<ArchitectureShowcase lang=\{lang\} posts=\{allPosts\} \/>/);
		assert.match(home, /href="https:\/\/www\.youtube\.com\/@mario\.inostroza\.m"/);
	}

	// Blog showcase still renders post-embedded videos and the video badge
	assert.match(blogShowcase, /data\.youtubeId/);
	assert.match(blogShowcase, /badge\.video/);

	// Base layout footer has the YouTube link; card page links the canonical channel
	assert.match(baseLayout, /href="https:\/\/www\.youtube\.com\/@mario\.inostroza\.m"/);
	assert.match(baseLayout, /aria-label="YouTube"/);
	assert.match(cardPage, /href="https:\/\/www\.youtube\.com\/@mario\.inostroza\.m"/);

	// UI translations for the video section exist in ES and EN
	assert.match(uiSource, /"section\.videos\.title":\s*"Ingeniería de Sistemas Críticos"/);
	assert.match(uiSource, /"section\.videos\.title":\s*"Mission-Critical Systems Engineering"/);
	assert.match(uiSource, /"section\.videos\.watch-youtube":\s*"Ver en YouTube"/);
	assert.match(uiSource, /"section\.videos\.watch-youtube":\s*"Watch on YouTube"/);
	assert.match(uiSource, /"badge\.video":\s*"Video Explainer"/);
});

const built = process.env.VIDEO_SHOWCASE_BUILT === "1";
const builtTest = built ? test : test.skip;

builtTest("ES home features the newest weekly video with its shorts and related post", () => {
	const [newest] = entries("es");
	assert.ok(newest, "no ES video entry found in src/content/videos");
	const html = read(htmlPath("/"));
	assert.ok(
		html.includes(`data-youtube-id="${newest.youtubeId}"`),
		`ES home does not render the player for ${newest.youtubeId}`,
	);
	for (const shortId of newest.shorts) {
		assert.ok(html.includes(`youtube.com/shorts/${shortId}`), `ES home is missing shorts link ${shortId}`);
	}
	if (newest.relatedPost) {
		assert.ok(html.includes(`/blog/${newest.relatedPost}/`), "ES home is missing the related post link");
	}
});

builtTest("EN home never embeds an ES-only weekly video", () => {
	const esVideos = entries("es");
	assert.ok(esVideos.length > 0, "no ES video entry found in src/content/videos");
	const html = read(htmlPath("/en/"));
	assert.ok(
		!html.includes(`data-youtube-id="${esVideos[0].youtubeId}"`),
		"EN home embeds an ES-only weekly video",
	);
	const [newestEn] = entries("en");
	if (newestEn) {
		assert.ok(
			html.includes(`data-youtube-id="${newestEn.youtubeId}"`),
			`EN home does not render the player for ${newestEn.youtubeId}`,
		);
	}
});

test("weekly video entry declares video id, shorts and related post", () => {
	const [newest] = entries("es");
	assert.ok(newest, "no ES video entry found in src/content/videos");
	assert.match(newest.youtubeId ?? "", /^[\w-]{11}$/);
	assert.ok(newest.shorts.length > 0, "entry declares no shorts");
	assert.ok(newest.relatedPost, "entry declares no related post");
});
