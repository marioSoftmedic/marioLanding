import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const pages = ["src/pages/index.astro", "src/pages/en/index.astro"];
const maxCandidateBytes = 500_000;

test("homepages define responsive Picture contracts and exclusive LCP priority", () => {
	for (const page of pages) {
		const source = read(page);
		assert.match(source, /import \{ Picture \} from 'astro:assets'/);
		assert.match(source, /import heroImage from ['"]\.\.\/.*assets\/images\/marioHealthBits4\.png['"]/);
		assert.match(source, /import cotochaImage from ['"]\.\.\/.*assets\/images\/projects\/cotocha\.png['"]/);
		assert.match(source, /src=\{heroImage\}[\s\S]*formats=\{\['avif', 'webp'\]\}[\s\S]*fallbackFormat="jpeg"[\s\S]*width=\{640\}[\s\S]*height=\{357\}[\s\S]*widths=\{\[260, 320, 520, 640\]\}[\s\S]*sizes="\(min-width: 768px\) 320px, 260px"/);
		assert.match(source, /data-image-role="hero"/);
		assert.equal((source.match(/loading="eager"/g) ?? []).length, 1);
		assert.equal((source.match(/fetchpriority="high"/g) ?? []).length, 1);
		assert.match(source, /project\.id === 'openclaw'[\s\S]*src=\{cotochaImage\}[\s\S]*width=\{720\}[\s\S]*height=\{666\}[\s\S]*widths=\{\[320, 480, 720\]\}[\s\S]*loading="lazy"[\s\S]*data-image-role="cotocha"/);
		assert.doesNotMatch(source, /<img[\s\S]*src="\/img\/marioHealthBits4\.png"/);
	}
});

test("source originals and lightweight compatibility PNGs preserve valid image contracts", async () => {
	const images = [
		["src/assets/images/marioHealthBits4.png", 2752, 1536],
		["src/assets/images/projects/cotocha.png", 2144, 1984],
		["public/img/marioHealthBits4.png", 640, 357],
		["public/img/projects/cotocha.png", 720, 666],
	];
	for (const [path, width, height] of images) {
		const file = new URL(path, root);
		assert.ok(existsSync(file), path);
		const metadata = await sharp(fileURLToPath(file)).metadata();
		assert.equal(metadata.format, "png", path);
		assert.equal(metadata.width, width, path);
		assert.equal(metadata.height, height, path);
		if (path.startsWith("public/")) assert.ok(statSync(file).size < maxCandidateBytes, path);
	}
	assert.match(read("src/content/projects/openclaw.mdx"), /image: "\/img\/projects\/cotocha\.png"/);
	assert.match(read("src/content/projects/openclaw.en.mdx"), /image: "\/img\/projects\/cotocha\.png"/);
});

const builtTest = process.env.ISSUE20_BUILT === "1" ? test : test.skip;
const devTest = process.env.ISSUE20_DEV === "1" ? test : test.skip;

function attribute(tag, name) {
	return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function pictureFor(html, role) {
	const picture = (html.match(/<picture\b[^>]*>[\s\S]*?<\/picture>/g) ?? []).find((tag) => tag.includes(`data-image-role="${role}"`));
	assert.ok(picture, `missing ${role} picture`);
	return picture;
}

function pictureUrls(picture) {
	const tags = picture.match(/<(?:source|img)\b[^>]*>/g) ?? [];
	return [...new Set(tags.flatMap((tag) => {
		const srcset = attribute(tag, "srcset")?.split(",").map((candidate) => candidate.trim().split(/\s+/)[0]) ?? [];
		return [attribute(tag, "src"), ...srcset].filter(Boolean);
	}))];
}

function decodeHtmlUrl(url) {
	return url.replaceAll("&amp;", "&").replaceAll("&#38;", "&");
}

devTest("Astro dev compiles target pictures and serves every generated URL", { timeout: 120_000 }, async () => {
	const port = 4390;
	const origin = `http://127.0.0.1:${port}`;
	const child = spawn("pnpm", ["exec", "astro", "dev", "--host", "127.0.0.1", "--port", String(port)], {
		cwd: fileURLToPath(root),
		stdio: "ignore",
	});
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	try {
		let ready = false;
		for (let attempt = 0; attempt < 120; attempt++) {
			try {
				if ((await fetch(`${origin}/`, { signal: AbortSignal.timeout(2_000) })).ok) { ready = true; break; }
			} catch {}
			await sleep(500);
		}
		assert.equal(ready, true, "Astro dev did not start");

		const largestBytes = { hero: 0, cotocha: 0 };
		for (const path of ["/", "/en/"]) {
			const response = await fetch(`${origin}${path}`);
			assert.equal(response.status, 200, path);
			const html = await response.text();
			for (const role of ["hero", "cotocha"]) {
				for (const url of pictureUrls(pictureFor(html, role))) {
					const image = await fetch(new URL(decodeHtmlUrl(url), origin));
					assert.equal(image.status, 200, `${role}: ${url}`);
					const bytes = (await image.arrayBuffer()).byteLength;
					largestBytes[role] = Math.max(largestBytes[role], bytes);
					assert.ok(bytes < maxCandidateBytes, `${role}: ${url}`);
				}
			}
		}
		for (const path of ["/img/marioHealthBits4.png", "/img/projects/cotocha.png"]) {
			assert.equal((await fetch(`${origin}${path}`)).status, 200, path);
		}
		console.log(`largest generated candidates: hero=${largestBytes.hero} bytes, cotocha=${largestBytes.cotocha} bytes`);
	} finally {
		child.kill("SIGTERM");
		await Promise.race([once(child, "exit"), sleep(3_000)]);
		if (child.exitCode === null) child.kill("SIGKILL");
	}
});

function builtFile(url) {
	const pathname = new URL(url, "https://mariohealthbits.dev").pathname;
	return new URL(`dist${pathname}`, root);
}

function assertPicture(html, role, expectedSizes, expectedWidths) {
	const picture = pictureFor(html, role);
	const image = picture.match(/<img\b[^>]*>/)?.[0];
	assert.ok(image, `${role} fallback image`);
	assert.equal(attribute(image, "sizes"), expectedSizes);
	assert.ok(Number(attribute(image, "width")) > 0, `${role} width`);
	assert.ok(Number(attribute(image, "height")) > 0, `${role} height`);

	const sources = picture.match(/<source\b[^>]*>/g) ?? [];
	assert.deepEqual(sources.map((source) => attribute(source, "type")), ["image/avif", "image/webp"]);
	for (const tag of [...sources, image]) {
		const candidates = attribute(tag, "srcset").split(",").map((candidate) => candidate.trim().split(/\s+/));
		assert.deepEqual(candidates.map(([, width]) => width), expectedWidths.map((width) => `${width}w`));
	}
	const urls = pictureUrls(picture);
	for (const url of urls) {
		const file = builtFile(url);
		assert.ok(existsSync(file), `${role} URL does not map to a built file: ${url}`);
		assert.ok(statSync(file).size < maxCandidateBytes, `${role} candidate exceeds 500 KB: ${url}`);
	}
	return image;
}

builtTest("built ES and EN homepages emit valid optimized target images", () => {
	for (const path of ["dist/index.html", "dist/en/index.html"]) {
		const html = read(path);
		const hero = assertPicture(html, "hero", "(min-width: 768px) 320px, 260px", [260, 320, 520, 640]);
		const cotocha = assertPicture(html, "cotocha", "(min-width: 1024px) 368px, (min-width: 768px) calc((100vw - 56px) / 2), calc(100vw - 32px)", [320, 480, 720]);
		assert.equal(attribute(hero, "loading"), "eager");
		assert.equal(attribute(hero, "fetchpriority"), "high");
		assert.equal(attribute(cotocha, "loading"), "lazy");
		assert.notEqual(attribute(cotocha, "fetchpriority"), "high");
		assert.equal((html.match(/loading="eager"/g) ?? []).length, 1, path);
		assert.equal((html.match(/fetchpriority="high"/g) ?? []).length, 1, path);
	}
	for (const path of ["dist/img/marioHealthBits4.png", "dist/img/projects/cotocha.png"]) {
		const file = new URL(path, root);
		assert.ok(existsSync(file), path);
		assert.ok(statSync(file).size < maxCandidateBytes, path);
	}
});
