#!/usr/bin/env node
/**
 * generate-newsletter-digest.mjs
 *
 * Creates a premium B2B weekly Healthbits Brief draft from recently published ES posts.
 * It writes the draft to the Obsidian vault by default and never sends email.
 * Mario reviews/approves the draft before Brevo sends the campaign.
 *
 * Usage:
 *   pnpm newsletter:digest              # last 7 days
 *   node scripts/generate-newsletter-digest.mjs --days 14
 *   NEWSLETTER_DRAFTS_DIR=/custom/path pnpm newsletter:digest
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { homedir } from "node:os";

const ROOT = resolve(process.cwd());
const BLOG_DIR = join(ROOT, "src", "content", "blog");
const SITE_URL = "https://mariohealthbits.dev";
const HERO_IMAGE_URL = `${SITE_URL}/img/newsletter/healthbits-brief-hero.png`;
const DEFAULT_VAULT_DRAFTS_DIR = join(
	homedir(),
	"Library",
	"Mobile Documents",
	"iCloud~md~obsidian",
	"Documents",
	"Proyectos",
	"05_Blog",
	"newsletters",
	"drafts",
);
const OUT_DIR = process.env.NEWSLETTER_DRAFTS_DIR
	? resolve(process.env.NEWSLETTER_DRAFTS_DIR)
	: DEFAULT_VAULT_DRAFTS_DIR;
const MIN_WORDS = Number(process.env.NEWSLETTER_MIN_WORDS ?? 600);
const MAX_WORDS = Number(process.env.NEWSLETTER_MAX_WORDS ?? 1200);

const args = new Map(
	process.argv.slice(2).flatMap((arg, index, all) => {
		if (!arg.startsWith("--")) return [];
		const key = arg.slice(2);
		const next = all[index + 1];
		return [[key, next && !next.startsWith("--") ? next : "true"]];
	}),
);
const days = Number(args.get("days") ?? 7);
const now = new Date();
const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const posts = readdirSync(BLOG_DIR)
	.filter((file) => /\.(md|mdx)$/.test(file))
	.filter((file) => !/\.en\.(md|mdx)$/.test(file))
	.map(readPost)
	.filter(Boolean)
	.filter((post) => !post.draft && post.date >= since && post.date <= now)
	.sort((a, b) => {
		const priority = (b.newsletterPriority ?? 0) - (a.newsletterPriority ?? 0);
		if (priority !== 0) return priority;
		return b.date.valueOf() - a.date.valueOf();
	});

const selected = posts.slice(0, 4);
const dateStamp = now.toISOString().slice(0, 10);
const digest = renderDigest(selected, {
	dateStamp,
	days,
	minWords: MIN_WORDS,
	maxWords: MAX_WORDS,
});
const outputPath = join(OUT_DIR, `${dateStamp}-healthbits-brief.md`);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(outputPath, digest.markdown, "utf8");

console.log(
	`[newsletter] Wrote ${displayPath(outputPath)} with ${selected.length} selected posts and ${digest.wordCount} editorial words.`,
);
if (selected.length === 0) {
	console.warn(
		`[newsletter] No published ES posts found in the last ${days} days.`,
	);
}
if (digest.wordCount < MIN_WORDS) {
	console.warn(
		`[newsletter] Draft is ${digest.wordCount} words. Target is ${MIN_WORDS}-${MAX_WORDS}; expand the editorial preview before approval.`,
	);
}
if (digest.wordCount > MAX_WORDS) {
	console.warn(
		`[newsletter] Draft is ${digest.wordCount} words. Target is ${MIN_WORDS}-${MAX_WORDS}; shorten before approval.`,
	);
}

function readPost(file) {
	const path = join(BLOG_DIR, file);
	const source = readFileSync(path, "utf8");
	const frontmatter = extractFrontmatter(source);
	if (!frontmatter) return null;
	const data = parseFrontmatter(frontmatter);
	const date = data.date ? new Date(data.date) : null;
	if (!date || Number.isNaN(date.valueOf())) return null;
	const body = source.slice(source.indexOf("---", 3) + 3);
	return {
		file,
		slug: basename(file).replace(/\.(md|mdx)$/, ""),
		title: data.title ?? basename(file),
		description: data.description ?? "",
		date,
		draft: data.draft === "true" || data.status === "draft",
		image: normalizeAssetUrl(data.image),
		inlineVisuals: extractInlineVisuals(body),
		excerpt: extractExcerpt(body),
		tags: parseArray(data.tags),
		audience: data.audience,
		funnelStage: data.funnelStage,
		primaryCta: data.primaryCta,
		leadMagnet: data.leadMagnet,
		newsletterTopic: data.newsletterTopic,
		newsletterPriority: data.newsletterPriority
			? Number(data.newsletterPriority)
			: undefined,
	};
}

function extractFrontmatter(source) {
	const trimmed = source.replace(/^\uFEFF/, "");
	if (!trimmed.startsWith("---")) return null;
	const afterOpen = trimmed.slice(3);
	const closeMatch = afterOpen.match(/\r?\n---\s*(\r?\n|$)/);
	if (!closeMatch) return null;
	return afterOpen.slice(0, closeMatch.index);
}

function parseFrontmatter(frontmatter) {
	const data = {};
	for (const line of frontmatter.split(/\r?\n/)) {
		const match = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/);
		if (!match) continue;
		const [, key, rawValue] = match;
		data[key] = rawValue.replace(/^['"]|['"]$/g, "").trim();
	}
	return data;
}

function parseArray(value = "") {
	return value
		.replace(/^\[/, "")
		.replace(/\]$/, "")
		.split(",")
		.map((tag) => tag.replace(/^['"\s]+|['"\s]+$/g, ""))
		.filter(Boolean);
}

function renderDigest(selectedPosts, { dateStamp, days, minWords, maxWords }) {
	const visualPost = selectedPosts.find((post) => getEmailSafeVisual(post));
	const visualOfWeek = getEmailSafeVisual(visualPost);
	const subject = `Healthbits Brief: ${dateStamp}`;
	const preheader =
		"Por qué la salud digital no se destraba con más IA, sino con datos clínicos reutilizables.";
	const preview = renderEditorialPreview(selectedPosts, { visualPost, visualOfWeek });
	const html = renderEmailHtml(selectedPosts, {
		subject,
		preheader,
		visualPost,
		visualOfWeek,
	});
	const plainText = renderPlainText(selectedPosts);
	const wordCount = countWords(preview);
	const visualChecklist = renderVisualChecklist(selectedPosts, visualOfWeek);

	return {
		wordCount,
		markdown: `---
title: "${subject}"
date: ${dateStamp}
status: draft
approval: pending
sender: brevo
orchestrator: n8n
minWords: ${minWords}
maxWords: ${maxWords}
wordCount: ${wordCount}
pdfDelivery: linked
visualMode: premium-b2b
heroImage: ${HERO_IMAGE_URL}
brevoCampaignId:
sentAt:
sourceWindowDays: ${days}
---

# ${subject}

> Estado: borrador. No enviar hasta que Mario cambie \`approval\` a \`approved\` o confirme explícitamente la aprobación.

## Control de envío

- Remitente: Mario Healthbits <newsletter@mariohealthbits.dev>
- Herramienta de envío: Brevo
- Orquestador permitido: n8n, solo para preparar/crear campaña después de aprobación
- Lista Brevo: Healthbits Brief
- Límite editorial: ${minWords}-${maxWords} palabras en el cuerpo editorial
- PDFs/recursos: usar botones hacia landing/blog; no mostrar URLs largas ni adjuntar PDFs salvo excepción explícita
- Visuales: portada fija premium + máximo un diagrama grande por edición; si el visual original es SVG/HTML, exportar a PNG antes de pegar en Brevo

## Para pegar en Brevo

- Asunto: ${subject}
- Preheader: ${preheader}

## Visuales recomendados

${visualChecklist}

## Preview editorial para Obsidian

${preview}

## Email HTML para Brevo

\`\`\`html
${html}
\`\`\`

## Texto plano

${plainText}

## Referencias internas — no copiar a Brevo

${renderInternalReferences(selectedPosts)}
`,
	};
}

function renderEditorialPreview(selectedPosts, { visualPost, visualOfWeek }) {
	const mainItems = selectedPosts.slice(0, 3);
	return [
		`![Healthbits Brief — datos clínicos, no PDFs](${HERO_IMAGE_URL})`,
		"",
		"Hola, soy Mario.",
		"",
		"Esta semana la tesis es simple: muchos proyectos de salud digital no fallan por falta de IA, sino porque el dato clínico sigue atrapado en PDFs, portales y sistemas legacy que no conversan entre sí. La promesa de automatización llega tarde si antes no existe un dato reutilizable, trazable y entendible por la operación.",
		"",
		"El aprendizaje para founders, laboratorios y equipos clínicos es incómodo pero útil: modernizar no significa migrar todo de una vez. La primera victoria suele estar en una capa lateral, medible y no invasiva, que transforme un flujo real —por ejemplo un resultado de laboratorio— en una acción clínica o comercial concreta.",
		"",
		"## La idea ejecutiva",
		"",
		"La oportunidad no está en sumar otra herramienta al stack clínico. Está en reducir fricción donde hoy se pierde tiempo: resultados que hay que buscar manualmente, pacientes que llaman para preguntar por su informe, equipos que copian datos entre sistemas y decisiones que quedan sin trazabilidad. Cuando el dato clínico sale estructurado desde el origen, la operación gana velocidad sin sacrificar control.",
		"",
		visualOfWeek ? renderVisualOfWeekMarkdown(visualPost, visualOfWeek) : "",
		"",
		"## 3 decisiones para mirar esta semana",
		"",
		mainItems.map(renderMarkdownDecisionCard).join("\n\n") ||
			"Esta semana no hay posts nuevos dentro de la ventana seleccionada.",
		"",
		"## Qué haría como primer paso",
		"",
		"Elegiría un proceso clínico atrapado en PDF, correo o portal. Después definiría los cinco campos mínimos que deben sobrevivir como dato estructurado: identificación, tipo de examen o prestación, resultado, fecha y responsable de validación. Recién ahí probaría un canal de entrega que el paciente, cliente o equipo interno realmente use.",
		"",
		"Ese experimento pequeño revela rápido las preguntas que importan: quién valida, cómo se deja trazabilidad, qué consentimiento aplica, qué sistema sigue siendo fuente de verdad y qué parte del flujo puede automatizarse sin perder control humano. Es menos glamoroso que prometer “IA clínica completa”, pero es mucho más vendible y mucho más seguro.",
		"",
		"## Recurso recomendado",
		"",
		"Si tu laboratorio o clínica todavía entrega resultados por portal o PDF, parte por esta guía práctica:",
		"",
		"[Ver guía para modernizar resultados LIS + WhatsApp](https://mariohealthbits.dev/recursos/modernizar-resultados-lis-whatsapp)",
		"",
		"## Cierre",
		"",
		"Si estás evaluando cómo avanzar en interoperabilidad, FHIR o canales tipo WhatsApp sin reemplazar toda tu operación, conversemos. La mejor primera versión no es la más grande: es la que demuestra valor rápido, mantiene supervisión humana y deja el dato listo para el siguiente paso.",
		"",
		"Mario Inostroza",
	]
		.filter(Boolean)
		.join("\n");
}

function renderVisualOfWeekMarkdown(post, visual) {
	return [
		"## Visual de la semana",
		"",
		`![${escapeMarkdown(post.title)}](${visual})`,
		"",
		`Este diagrama acompaña la idea central de la edición: ${post.title}. No es decoración; es una forma rápida de mostrar dónde se pierde valor cuando el dato clínico queda encerrado en formatos que no se pueden reutilizar.`,
		"",
		`[Ver contexto completo](${SITE_URL}/blog/${post.slug})`,
	].join("\n");
}

function renderMarkdownDecisionCard(post, index) {
	const url = `${SITE_URL}/blog/${post.slug}`;
	const role = roleForPost(post, index);
	return [
		`### ${index + 1}. ${role.label}: ${post.title}`,
		"",
		role.summary,
		"",
		`**Por qué importa para un lead B2B:** ${role.businessImplication}`,
		"",
		`[${role.cta}](${url})`,
	].join("\n");
}

function renderEmailHtml(selectedPosts, { subject, preheader, visualPost, visualOfWeek }) {
	const cards = selectedPosts.slice(0, 3).map(renderHtmlDecisionCard).join("\n");
	const visualBlock = visualOfWeek ? renderHtmlVisualOfWeek(visualPost, visualOfWeek) : "";
	return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#111827;border:1px solid #27272a;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:0;">
              <img src="${HERO_IMAGE_URL}" alt="Healthbits Brief — datos clínicos, no PDFs" width="680" style="display:block;width:100%;max-width:680px;height:auto;border:0;">
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 14px 28px;">
              <p style="margin:0 0 10px 0;color:#f97316;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;">Healthbits Brief</p>
              <h1 style="margin:0;color:#ffffff;font-size:30px;line-height:1.18;">La salud digital no se destraba con más IA. Se destraba con datos clínicos reutilizables.</h1>
              <p style="margin:16px 0 0 0;color:#d4d4d8;font-size:16px;line-height:1.7;">Hola, soy Mario. Esta semana el patrón fue claro: PDFs, portales y sistemas legacy siguen frenando proyectos que podrían partir con una capa pequeña, medible y sin migrar toda la operación.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;border:1px solid #334155;border-radius:14px;">
                <tr>
                  <td style="padding:18px 18px;">
                    <p style="margin:0;color:#ffffff;font-size:17px;line-height:1.65;font-weight:700;">Tesis ejecutiva</p>
                    <p style="margin:8px 0 0 0;color:#cbd5e1;font-size:15px;line-height:1.7;">La oportunidad no está en sumar otra herramienta al stack clínico. Está en reducir fricción donde hoy se pierde tiempo: resultados que hay que buscar manualmente, pacientes que llaman por su informe y decisiones que quedan sin trazabilidad.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${visualBlock}
          <tr>
            <td style="padding:8px 28px 0 28px;">
              <h2 style="margin:0;color:#ffffff;font-size:22px;line-height:1.3;">3 decisiones para mirar esta semana</h2>
            </td>
          </tr>
          ${cards}
          <tr>
            <td style="padding:22px 28px;border-top:1px solid #27272a;">
              <h2 style="margin:0 0 10px 0;color:#ffffff;font-size:21px;">Qué haría como primer paso</h2>
              <p style="margin:0;color:#d4d4d8;font-size:15px;line-height:1.7;">Elegiría un proceso clínico atrapado en PDF, correo o portal. Definiría los cinco campos mínimos que deben sobrevivir como dato estructurado y probaría un canal de entrega que el paciente, cliente o equipo interno realmente use.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 30px 28px;">
              <p style="margin:0 0 16px 0;color:#d4d4d8;font-size:15px;line-height:1.7;">Si tu laboratorio o clínica todavía entrega resultados por portal o PDF, parte por esta guía práctica.</p>
              <a href="${SITE_URL}/recursos/modernizar-resultados-lis-whatsapp" style="display:inline-block;background:#f97316;color:#0a0a0f;text-decoration:none;font-weight:800;font-size:15px;padding:14px 18px;border-radius:10px;">Ver guía LIS + WhatsApp</a>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px;background:#0b1220;border-top:1px solid #27272a;">
              <p style="margin:0;color:#a1a1aa;font-size:13px;line-height:1.6;">Mario Inostroza · Tecnólogo Médico & AI Builder<br>Recibes este correo porque te suscribiste al Healthbits Brief en mariohealthbits.dev.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderHtmlVisualOfWeek(post, visual) {
	return `<tr>
  <td style="padding:0 28px 24px 28px;">
    <p style="margin:0 0 10px 0;color:#f97316;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Visual de la semana</p>
    <img src="${visual}" alt="${escapeHtml(post.title)}" width="624" style="display:block;width:100%;max-width:624px;height:auto;border:0;border-radius:14px;margin:0 0 12px 0;">
    <p style="margin:0;color:#a1a1aa;font-size:14px;line-height:1.7;">Un mapa rápido de dónde se pierde valor cuando el dato clínico queda encerrado en formatos que no se pueden reutilizar.</p>
  </td>
</tr>`;
}

function renderHtmlDecisionCard(post, index) {
	const url = `${SITE_URL}/blog/${post.slug}`;
	const role = roleForPost(post, index);
	return `<tr>
  <td style="padding:20px 28px;border-top:1px solid #27272a;">
    <p style="margin:0 0 8px 0;color:#f97316;font-size:12px;font-weight:800;letter-spacing:.9px;text-transform:uppercase;">${escapeHtml(role.label)}</p>
    <h3 style="margin:0 0 10px 0;color:#ffffff;font-size:21px;line-height:1.3;">${escapeHtml(post.title)}</h3>
    <p style="margin:0 0 12px 0;color:#d4d4d8;font-size:15px;line-height:1.7;">${escapeHtml(role.summary)}</p>
    <p style="margin:0 0 16px 0;color:#a1a1aa;font-size:14px;line-height:1.7;"><strong style="color:#e5e7eb;">Por qué importa:</strong> ${escapeHtml(role.businessImplication)}</p>
    <a href="${url}" style="display:inline-block;border:1px solid #f97316;color:#f97316;text-decoration:none;font-weight:800;font-size:14px;padding:11px 15px;border-radius:9px;">${escapeHtml(role.cta)}</a>
  </td>
</tr>`;
}

function roleForPost(post, index) {
	const slug = post.slug.toLowerCase();
	if (slug.includes("pdf-no-es-interoperabilidad")) {
		return {
			label: "Problema de negocio",
			summary:
				"Enviar un PDF más rápido puede mejorar la percepción, pero no transforma el resultado en dato clínico reutilizable. Si el dato queda encerrado en un adjunto, la operación sigue dependiendo de lectura manual, reclamos y reprocesos.",
			businessImplication:
				"para un laboratorio o clínica, el riesgo no es solo técnico; es comercial y regulatorio. El cliente quiere rapidez, pero también trazabilidad, integración y capacidad de responder con evidencia.",
			cta: "Ver por qué el PDF no basta",
		};
	}
	if (slug.includes("objecion") || slug.includes("migrar-lis")) {
		return {
			label: "Objeción comercial",
			summary:
				"La frase “no podemos migrar el LIS” no debería matar la venta. Debería ordenar la propuesta: no reemplazar el sistema central, sino coexistir con una capa que reduzca fricción y demuestre valor antes de tocar producción.",
			businessImplication:
				"el comprador B2B no está rechazando innovación; está rechazando riesgo operacional. El enfoque zero-migration convierte una objeción defensiva en una primera fase vendible.",
			cta: "Leer estrategia zero-migration",
		};
	}
	if (slug.includes("vender-ia") || slug.includes("reemplazar-humanos")) {
		return {
			label: "IA operacional",
			summary:
				"Prometer reemplazo humano en salud activa resistencia inmediata. Posicionar la IA como copiloto del equipo —no como sustituto— permite hablar de velocidad, consistencia y supervisión sin amenazar la operación.",
			businessImplication:
				"la venta mejora cuando la IA se presenta como una capa de apoyo medible: menos carga repetitiva, mejor triage y más foco humano donde realmente importa.",
			cta: "Ver enfoque copiloto",
		};
	}
	return {
		label: `Decisión ${index + 1}`,
		summary:
			post.description ||
			post.excerpt ||
			"Una idea práctica para pensar salud digital desde operación, datos y adopción real.",
		businessImplication:
			"la pregunta no es si la tecnología existe, sino qué fricción reduce, qué evidencia deja y qué decisión habilita para el equipo que paga o usa el sistema.",
		cta: "Leer análisis completo",
	};
}

function renderPlainText(selectedPosts) {
	const lines = [
		"Healthbits Brief",
		"",
		"La salud digital no se destraba con más IA. Se destraba con datos clínicos reutilizables.",
		"",
		"Tesis ejecutiva: la oportunidad no está en sumar otra herramienta al stack clínico, sino en reducir fricción operacional con datos clínicos reutilizables.",
		"",
		"3 decisiones para mirar esta semana:",
	];
	for (const [index, post] of selectedPosts.slice(0, 3).entries()) {
		const role = roleForPost(post, index);
		lines.push(
			"",
			`${index + 1}. ${role.label}: ${post.title}`,
			role.summary,
			`Leer: ${SITE_URL}/blog/${post.slug}`,
		);
	}
	lines.push(
		"",
		"Recurso recomendado:",
		`${SITE_URL}/recursos/modernizar-resultados-lis-whatsapp`,
		"",
		"Mario Inostroza",
		SITE_URL,
	);
	return lines.join("\n");
}

function renderVisualChecklist(selectedPosts, visualOfWeek) {
	const rows = [
		`- Portada fija premium: ${HERO_IMAGE_URL}`,
		visualOfWeek
			? `- Diagrama/visual de la semana: ${visualOfWeek} (usar solo una vez en el email)`
			: "- Diagrama/visual de la semana: sin visual email-safe detectado",
	];
	for (const post of selectedPosts.slice(0, 3)) {
		const firstVisual = getEmailSafeVisual(post) ?? post.inlineVisuals[0];
		if (!firstVisual) continue;
		const note = isEmailSafeImage(firstVisual)
			? "email-safe"
			: "exportar a PNG/JPG antes de enviar";
		rows.push(`- ${post.title}: ${firstVisual} (${note})`);
	}
	return rows.join("\n");
}

function renderInternalReferences(selectedPosts) {
	if (selectedPosts.length === 0) return "- Sin posts publicados para esta ventana.";
	return selectedPosts
		.map((post) => {
			const url = `${SITE_URL}/blog/${post.slug}`;
			return `- ${post.title} — ${url} — audiencia: ${post.audience ?? "general"}; etapa: ${post.funnelStage ?? "awareness"}; tópico: ${post.newsletterTopic ?? "healthbits-brief"}`;
		})
		.join("\n");
}

function extractInlineVisuals(body) {
	const visuals = [];
	for (const match of body.matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)) {
		visuals.push(normalizeAssetUrl(match[1]));
	}
	for (const match of body.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
		visuals.push(normalizeAssetUrl(match[1]));
	}
	for (const match of body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
		visuals.push(normalizeAssetUrl(match[1]));
	}
	return visuals.filter(Boolean);
}

function extractExcerpt(body) {
	return body
		.replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
		.split(/\n{2,}/)
		.map((paragraph) =>
			paragraph.replace(/[`*_>#\-[\]()]/g, " ").replace(/\s+/g, " ").trim(),
		)
		.find((paragraph) => paragraph.length > 80)
		?.slice(0, 260) ?? "";
}

function getEmailSafeVisual(post) {
	if (!post) return null;
	const candidates = [post.image, ...post.inlineVisuals].filter(Boolean);
	return candidates.find(isEmailSafeImage) ?? null;
}

function isEmailSafeImage(url) {
	return /\.(png|jpe?g|webp)(\?.*)?$/i.test(url);
}

function normalizeAssetUrl(url) {
	if (!url) return "";
	const clean = url.trim().replace(/^['"]|['"]$/g, "");
	if (!clean) return "";
	if (/^https?:\/\//i.test(clean)) return clean;
	if (clean.startsWith("/")) return `${SITE_URL}${clean}`;
	return clean;
}

function countWords(markdown) {
	return markdown
		.replace(/https?:\/\/\S+/g, "")
		.replace(/[`*_>#\-[\]()]/g, " ")
		.trim()
		.split(/\s+/)
		.filter(Boolean).length;
}

function escapeHtml(value = "") {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function escapeMarkdown(value = "") {
	return String(value).replace(/[\[\]]/g, "");
}

function displayPath(path) {
	const relative = path.replace(`${ROOT}/`, "");
	return relative === path ? path : relative;
}
