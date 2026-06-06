#!/usr/bin/env node
/**
 * validate-newsletter-draft.mjs
 *
 * Validates a Healthbits Brief draft before it is copied into Brevo.
 * This checks the operating contract, not deliverability.
 *
 * Usage:
 *   pnpm newsletter:validate path/to/draft.md              # pre-send gate; requires approval: approved
 *   pnpm newsletter:validate --allow-pending path/to/draft.md
 */

import { readFileSync } from "node:fs";

const allowPending = process.argv.includes("--allow-pending");
const file = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
if (!file) {
	console.error(
		"[newsletter:validate] Usage: pnpm newsletter:validate [--allow-pending] <draft.md>",
	);
	process.exit(1);
}

const source = readFileSync(file, "utf8");
const frontmatter = extractFrontmatter(source);
if (!frontmatter) fail("Missing YAML frontmatter.");

const data = parseFrontmatter(frontmatter);
const body = source.slice(source.indexOf("---", 3) + 3);
const minWords = Number(data.minWords ?? 0);
const maxWords = Number(data.maxWords ?? 1200);
const editorialSection =
	extractBetweenSections(body, "Preview editorial para Obsidian", "Email HTML para Brevo") ??
	extractBetweenSections(body, "Email HTML / Markdown", "Texto plano") ??
	body;
const wordCount = countWords(editorialSection);

const errors = [];
if (!data.status) errors.push("Missing status.");
if (!data.approval) errors.push("Missing approval.");
if (data.sender !== "brevo") errors.push('sender must be "brevo".');
if (data.orchestrator !== "n8n") errors.push('orchestrator must be "n8n".');
if (data.pdfDelivery !== "linked") errors.push('pdfDelivery must be "linked" by default.');
if (data.visualMode && !["blog-assets", "premium-b2b"].includes(data.visualMode)) {
	errors.push('visualMode should be "blog-assets" or "premium-b2b" for this workflow.');
}
if (minWords && wordCount < minWords) {
	errors.push(`Editorial preview has ${wordCount} words; minWords is ${minWords}.`);
}
if (wordCount > maxWords) {
	errors.push(`Editorial preview has ${wordCount} words; maxWords is ${maxWords}.`);
}
if (data.approval !== "approved") {
	if (allowPending) {
		console.warn(
			`[newsletter:validate] Draft structure is valid but not approved yet: approval=${data.approval}`,
		);
	} else {
		errors.push(
			`Draft is not approved. Set approval: approved before Brevo send, or use --allow-pending for draft-only review. Current approval=${data.approval}.`,
		);
	}
}

if (errors.length > 0) {
	for (const error of errors) console.error(`[newsletter:validate] ${error}`);
	process.exit(1);
}

console.log(
	`[newsletter:validate] OK — ${wordCount}/${maxWords} words, sender=${data.sender}, approval=${data.approval}.`,
);

function extractFrontmatter(text) {
	const trimmed = text.replace(/^\uFEFF/, "");
	if (!trimmed.startsWith("---")) return null;
	const afterOpen = trimmed.slice(3);
	const closeMatch = afterOpen.match(/\r?\n---\s*(\r?\n|$)/);
	if (!closeMatch) return null;
	return afterOpen.slice(0, closeMatch.index);
}

function parseFrontmatter(text) {
	const data = {};
	for (const line of text.split(/\r?\n/)) {
		const match = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/);
		if (!match) continue;
		const [, key, raw] = match;
		data[key] = raw.replace(/^['"]|['"]$/g, "").trim();
	}
	return data;
}

function extractBetweenSections(text, startHeading, endHeading) {
	const startPattern = new RegExp(`^##\\s+${escapeRegExp(startHeading)}\\s*$`, "m");
	const endPattern = new RegExp(`^##\\s+${escapeRegExp(endHeading)}\\s*$`, "m");
	const startMatch = text.match(startPattern);
	if (!startMatch || startMatch.index === undefined) return null;
	const start = startMatch.index + startMatch[0].length;
	const rest = text.slice(start);
	const endMatch = rest.match(endPattern);
	return endMatch && endMatch.index !== undefined ? rest.slice(0, endMatch.index) : rest;
}

function countWords(markdown) {
	return markdown
		.replace(/https?:\/\/\S+/g, "")
		.replace(/[`*_>#\-[\]()]/g, " ")
		.trim()
		.split(/\s+/)
		.filter(Boolean).length;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(message) {
	console.error(`[newsletter:validate] ${message}`);
	process.exit(1);
}
