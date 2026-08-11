import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { canonicalPath, languageFromPath } from "../src/lib/routes.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const vercel = JSON.parse(read("vercel.json"));

test("canonical policy preserves suffixes and file paths", () => {
	assert.equal(canonicalPath("/blog"), "/blog/");
	assert.equal(canonicalPath("/projects/openclaw?from=home#demo"), "/projects/openclaw/?from=home#demo");
	assert.equal(canonicalPath("/img/blog/diagram.png?v=1"), "/img/blog/diagram.png?v=1");
	assert.equal(canonicalPath("https://example.com/path"), "https://example.com/path");
	assert.equal(languageFromPath("/english/"), "es");
	assert.equal(languageFromPath("/en/clinical-lab-api/"), "en");
});

test("Astro and Vercel enforce one trailing-slash identity", () => {
	const astro = read("astro.config.mjs");
	assert.match(astro, /trailingSlash:\s*"always"/);
	assert.match(astro, /canonicalInternalLinks/);
	assert.match(astro, /sitemap\(\{[\s\S]*filter:/);
	assert.equal(vercel.trailingSlash, undefined);
	for (const path of ["/blog", "/projects/openclaw"]) assert.equal(canonicalPath(path), `${path}/`);
});

test("legacy redirects remain permanent and land directly on canonical URLs", () => {
	assert.equal(vercel.redirects.length, 9);
	assert.deepEqual(vercel.redirects.at(-1), {
		source: "/:path([^.]*(?:[^./]))",
		destination: "/:path/",
		permanent: true,
	});
	for (const redirect of vercel.redirects) {
		assert.equal(redirect.permanent, true);
		assert.equal(canonicalPath(redirect.destination), redirect.destination);
	}

	const expectedScout = [
		"/blog/2026-07-01-patron-scout-worker-reviewer-agentes-ia",
		"/blog/2026-07-01-patron-scout-worker-reviewer-agentes-ia/",
		"/en/blog/2026-07-01-patron-scout-worker-reviewer-agentes-ia",
		"/en/blog/2026-07-01-patron-scout-worker-reviewer-agentes-ia/",
	];
	assert.deepEqual(vercel.redirects.slice(4, 8).map(({ source }) => source), expectedScout);
	assert.equal(vercel.redirects[4].destination, "/blog/2026-06-17-patron-scout-worker-reviewer-agentes-ia/");
	assert.equal(vercel.redirects[6].destination, "/en/blog/2026-06-17-patron-scout-worker-reviewer-agentes-ia/");
});

const runtime = process.env.ISSUE21_VERCEL === "1";
const runtimeTest = runtime ? test : test.skip;

runtimeTest("local Vercel resolves canonical and legacy paths in one redirect", { timeout: 90_000 }, async () => {
	const port = 4391;
	const origin = `http://127.0.0.1:${port}`;
	const child = spawn("vercel", ["dev", "--listen", String(port)], { cwd: new URL("..", import.meta.url), stdio: "ignore" });
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	const request = (path) => fetch(`${origin}${path}`, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
	const trace = async (path) => {
		const first = await request(path);
		const location = first.headers.get("location");
		assert.equal(first.status, 308, path);
		assert.ok(location, path);
		return location;
	};

	try {
		let ready = false;
		for (let attempt = 0; attempt < 90; attempt++) {
			try {
				if ((await request("/favicon.svg")).status) { ready = true; break; }
			} catch {}
			await sleep(500);
		}
		assert.equal(ready, true, "vercel dev did not start");

		assert.equal(await trace("/blog"), "/blog/");
		assert.equal(await trace("/projects/openclaw"), "/projects/openclaw/");
		assert.equal(await trace("/news"), "/blog/");
		assert.equal(await trace("/news/"), "/blog/");
		assert.equal(await trace("/en/news"), "/en/blog/");
		assert.equal(await trace("/en/news/"), "/en/blog/");
		for (const redirect of vercel.redirects.slice(4, 8)) assert.equal(await trace(redirect.source), redirect.destination);
		const file = await request("/favicon.svg");
		assert.equal(file.status, 200);
		assert.equal(file.headers.get("location"), null);
		const missingFile = await request("/assets/missing.json");
		assert.equal(missingFile.status, 404);
		assert.equal(missingFile.headers.get("location"), null);
	} finally {
		child.kill("SIGTERM");
		await Promise.race([once(child, "exit"), sleep(3_000)]);
		if (child.exitCode === null) child.kill("SIGKILL");
	}
});

test("robots submits only the sitemap index", () => {
	const sitemapLines = read("public/robots.txt").split("\n").filter((line) => line.startsWith("Sitemap:"));
	assert.deepEqual(sitemapLines, ["Sitemap: https://mariohealthbits.dev/sitemap-index.xml"]);
});

const built = process.env.ISSUE21_BUILT === "1";
const builtTest = built ? test : test.skip;

function htmlPath(pathname) {
	return `dist${pathname === "/" ? "/index.html" : `${pathname}index.html`}`;
}

function linkHref(html, attributes) {
	const tags = html.match(/<link\b[^>]*>/g) ?? [];
	const tag = tags.find((candidate) => Object.entries(attributes).every(([name, value]) => candidate.includes(`${name}="${value}"`)));
	return tag?.match(/href="([^"]+)"/)?.[1];
}

function filesBelow(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
		return entry.isDirectory() ? filesBelow(path) : [path];
	});
}

const hubPairs = [
	["/agentes-ia-produccion/", "/en/ai-agents-production/"],
	["/laboratorio-clinico-api/", "/en/clinical-lab-api/"],
];

builtTest("redirect targets have matching final canonicals and internal links stay canonical", () => {
	for (const path of ["/blog/", "/projects/openclaw/"]) {
		const html = read(htmlPath(path));
		assert.equal(linkHref(html, { rel: "canonical" }), `https://mariohealthbits.dev${path}`);
	}
	for (const file of filesBelow(new URL("dist/", root)).filter((path) => path.pathname.endsWith(".html"))) {
		const html = readFileSync(file, "utf8");
		for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
			if (href.startsWith("/") && !href.startsWith("//")) assert.equal(canonicalPath(href), href, `${file.pathname}: ${href}`);
		}
	}
});

builtTest("built sitemap contains only canonical indexable URLs and excludes redirects", () => {
	assert.ok(existsSync(new URL("dist/sitemap-index.xml", root)));
	const sitemapFiles = readdirSync(new URL("dist", root)).filter((name) => /^sitemap-\d+\.xml$/.test(name));
	const locations = sitemapFiles.flatMap((name) => read(`dist/${name}`).match(/<loc>([^<]+)<\/loc>/g) ?? []).map((loc) => loc.slice(5, -6));
	for (const url of locations) assert.equal(canonicalPath(new URL(url).pathname), new URL(url).pathname);
	for (const { source } of vercel.redirects) assert.ok(!locations.includes(`https://mariohealthbits.dev${source}`));
	for (const [esPath, enPath] of hubPairs) {
		assert.ok(locations.includes(`https://mariohealthbits.dev${esPath}`));
		assert.ok(locations.includes(`https://mariohealthbits.dev${enPath}`));
	}
	for (const url of locations) {
		const path = new URL(url).pathname;
		const file = new URL(htmlPath(path), root);
		if (existsSync(file)) assert.doesNotMatch(readFileSync(file, "utf8"), /<meta name="robots" content="noindex/);
	}
});
