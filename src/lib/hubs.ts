import type { CollectionEntry } from "astro:content";
import { tagsForPost } from "./tags";

export type Lang = "es" | "en";

export interface HubDef {
	id: string;
	slug: { es: string; en: string };
	title: { es: string; en: string };
	eyebrow: { es: string; en: string };
	description: { es: string; en: string };
	keywords: string[];
	tags: string[];
	featuredSlugs?: string[];
}

export const HUBS: HubDef[] = [
	{
		id: "digital-health-chile",
		slug: { es: "salud-digital-chile", en: "digital-health-chile" },
		eyebrow: { es: "Guía temática", en: "Topic Guide" },
		title: { es: "Salud Digital en Chile", en: "Digital Health in Chile" },
		description: {
			es: "IA, interoperabilidad, FHIR, FONASA y regulación para construir software clínico útil en el sistema de salud chileno.",
			en: "AI, interoperability, FHIR, FONASA and regulation for building useful clinical software in the Chilean healthcare system.",
		},
		keywords: [
			"salud digital chile",
			"interoperabilidad salud chile",
			"FHIR Chile",
			"FONASA tecnología",
		],
		tags: [
			"digital-health",
			"interoperability",
			"fhir",
			"hl7",
			"ley-21668",
			"fonasa",
			"clinical-labs",
			"medical",
			"healthcare",
		],
	},
	{
		id: "ai-agents-production",
		slug: { es: "agentes-ia-produccion", en: "ai-agents-production" },
		eyebrow: { es: "Guía técnica", en: "Technical Guide" },
		title: { es: "Agentes IA en Producción", en: "AI Agents in Production" },
		description: {
			es: "Arquitectura, testing, tool use, MCP y mitigación de alucinaciones para agentes que hacen trabajo real.",
			en: "Architecture, testing, tool use, MCP and hallucination mitigation for agents that do real work.",
		},
		keywords: [
			"agentes IA producción",
			"testing agentes IA",
			"MCP tool use",
			"multi-agent orchestration",
		],
		tags: [
			"ai",
			"agents",
			"multi-agent",
			"mcp",
			"testing",
			"production",
			"evaluation",
			"architecture",
			"automation",
			"opencode",
		],
	},
	{
		id: "examya",
		slug: { es: "examya", en: "examya" },
		eyebrow: { es: "Caso real", en: "Real Case" },
		title: {
			es: "Examya: IA para Órdenes Médicas",
			en: "Examya: AI for Medical Orders",
		},
		description: {
			es: "El caso real detrás de Shuri: OCR médico por WhatsApp, cotización FONASA, embeddings, compliance MINSAL y arquitectura clínica.",
			en: "The real case behind Shuri: medical OCR through WhatsApp, FONASA pricing, embeddings, MINSAL compliance and clinical architecture.",
		},
		keywords: [
			"Examya",
			"OCR médico WhatsApp",
			"cotización FONASA automática",
			"agente médico IA",
		],
		tags: [
			"examya",
			"whatsapp",
			"ocr",
			"fonasa",
			"digital-health",
			"medical",
			"architecture",
			"production",
		],
	},
	{
		id: "patagonia-builder",
		slug: { es: "builder-patagonia", en: "patagonia-builder" },
		eyebrow: { es: "Trayectoria", en: "Journey" },
		title: { es: "Builder desde la Patagonia", en: "Builder from Patagonia" },
		description: {
			es: "La línea narrativa que conecta laboratorio clínico, Biohealth, Huillín, Cotocha y construcción de IA desde Puerto Natales.",
			en: "The story line connecting clinical labs, Biohealth, Huillín, Cotocha and AI building from Puerto Natales.",
		},
		keywords: [
			"AI builder Patagonia",
			"Puerto Natales IA",
			"Biohealth laboratorio",
			"Huillín WhatsApp",
		],
		tags: [
			"patagonia",
			"story",
			"biohealth",
			"huillin",
			"cotocha",
			"entrepreneurship",
			"automation",
			"engram",
			"pkm",
			"sync",
			"memory",
			"vps",
		],
	},
];

export function hubPath(hub: HubDef, lang: Lang): string {
	return lang === "es" ? `/${hub.slug.es}` : `/en/${hub.slug.en}`;
}

export function postsForHub(
	posts: CollectionEntry<"blog">[],
	hub: HubDef,
	lang: Lang,
) {
	const tagSet = new Set(hub.tags);
	return posts
		.filter((post) => !post.data.draft && post.data.lang === lang)
		.map((post) => ({
			post,
			matchingTags: tagsForPost(post.data.tags).filter((tag) =>
				tagSet.has(tag),
			),
		}))
		.filter(({ matchingTags }) => matchingTags.length > 0)
		.sort((a, b) => b.post.data.date.valueOf() - a.post.data.date.valueOf());
}
