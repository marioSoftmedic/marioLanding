#!/usr/bin/env node
/**
 * render-newsletter-preview.mjs
 *
 * Extracts the `Email HTML para Brevo` block from a Healthbits Brief draft
 * and renders local HTML, PDF and PNG previews for visual review.
 *
 * Usage:
 *   pnpm newsletter:preview                         # latest Obsidian draft
 *   pnpm newsletter:preview /path/to/draft.md
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { homedir } from "node:os";
import puppeteer from "puppeteer";

const ROOT = resolve(process.cwd());
const VAULT_NEWSLETTERS_DIR = join(
	homedir(),
	"Library",
	"Mobile Documents",
	"iCloud~md~obsidian",
	"Documents",
	"Proyectos",
	"05_Blog",
	"newsletters",
);
const DRAFTS_DIR = join(VAULT_NEWSLETTERS_DIR, "drafts");
const PREVIEWS_DIR = join(VAULT_NEWSLETTERS_DIR, "previews");
const draftPath = process.argv[2] ? resolve(process.argv[2]) : latestDraftPath();

if (!draftPath) {
	console.error(`[newsletter:preview] No draft found in ${DRAFTS_DIR}`);
	process.exit(1);
}
if (!existsSync(draftPath)) {
	console.error(`[newsletter:preview] Draft not found: ${draftPath}`);
	process.exit(1);
}

const source = readFileSync(draftPath, "utf8");
const html = extractBrevoHtml(source);
if (!html) {
	console.error('[newsletter:preview] No HTML block found under "Email HTML para Brevo".');
	process.exit(1);
}

mkdirSync(PREVIEWS_DIR, { recursive: true });
const baseName = basename(draftPath, extname(draftPath));
const htmlPath = join(PREVIEWS_DIR, `${baseName}-premium.html`);
const pdfPath = join(PREVIEWS_DIR, `${baseName}-premium.pdf`);
const pngPath = join(PREVIEWS_DIR, `${baseName}-premium.png`);
writeFileSync(htmlPath, localizePreviewAssets(html), "utf8");

const browser = await puppeteer.launch({ headless: "new" });
try {
	const page = await browser.newPage({
		viewport: { width: 760, height: 1400, deviceScaleFactor: 2 },
	});
	await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle2" });
	await page.pdf({
		path: pdfPath,
		printBackground: true,
		width: "760px",
		height: "1600px",
		margin: { top: "0", right: "0", bottom: "0", left: "0" },
	});
	const body = await page.$("body");
	await body.screenshot({ path: pngPath });
} finally {
	await browser.close();
}

console.log(`[newsletter:preview] HTML: ${htmlPath}`);
console.log(`[newsletter:preview] PDF:  ${pdfPath}`);
console.log(`[newsletter:preview] PNG:  ${pngPath}`);

function latestDraftPath() {
	if (!existsSync(DRAFTS_DIR)) return "";
	const drafts = readdirSync(DRAFTS_DIR)
		.filter((file) => file.endsWith("-healthbits-brief.md"))
		.sort()
		.reverse();
	return drafts[0] ? join(DRAFTS_DIR, drafts[0]) : "";
}

function extractBrevoHtml(markdown) {
	const match = markdown.match(/## Email HTML para Brevo\s*\n\s*```html\s*\n([\s\S]*?)\n```/);
	return match?.[1] ?? "";
}

function localizePreviewAssets(html) {
	const localHeroPath = join(ROOT, "public", "img", "newsletter", "healthbits-brief-hero.png");
	if (!existsSync(localHeroPath)) return html;
	return html.replaceAll(
		"https://mariohealthbits.dev/img/newsletter/healthbits-brief-hero.png",
		`file://${localHeroPath}`,
	);
}
