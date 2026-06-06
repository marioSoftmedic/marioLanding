import { tagsForPost, type Lang } from "./tags";

export type LeadMagnetId =
	| "interoperability-checklist"
	| "lis-whatsapp-guide"
	| "healthbits-brief";

export type FunnelStage = "awareness" | "consideration" | "decision";

export interface NewsletterCtaInput {
	lang?: Lang;
	tags?: string[];
	leadMagnet?: string;
	newsletterTopic?: string;
	primaryCta?: string;
}

export interface NewsletterCta {
	id: LeadMagnetId;
	topic: string;
	title: string;
	description: string;
	benefit: string;
	resourcePath: string;
	buttonLabel: string;
	secondaryLabel: string;
}

const COPY: Record<
	LeadMagnetId,
	Record<Lang, Omit<NewsletterCta, "id" | "topic">>
> = {
	"interoperability-checklist": {
		es: {
			title: "Brief semanal de salud digital e interoperabilidad",
			description:
				"Una vez por semana: ideas prácticas sobre Ley 21.668, FHIR, evidencia regulatoria y software clínico en Chile.",
			benefit:
				"Incluye el checklist para revisar si tu clínica o laboratorio está preparado para interoperabilidad.",
			resourcePath: "/recursos/checklist-interoperabilidad-salud-chile",
			buttonLabel: "Recibir el briefing",
			secondaryLabel: "Ver checklist",
		},
		en: {
			title: "Weekly digital health and interoperability brief",
			description:
				"Once a week: practical notes on FHIR, regulation, clinical evidence and digital health in Chile.",
			benefit:
				"Includes a checklist for reviewing interoperability readiness in clinics and clinical labs.",
			resourcePath: "/recursos/checklist-interoperabilidad-salud-chile",
			buttonLabel: "Get the weekly brief",
			secondaryLabel: "View checklist",
		},
	},
	"lis-whatsapp-guide": {
		es: {
			title: "Brief semanal para laboratorios clínicos como API",
			description:
				"Ideas concretas para modernizar resultados, WhatsApp, LIS legacy e interoperabilidad sin romper la operación.",
			benefit:
				"Incluye una guía para modernizar la entrega de resultados sin reemplazar el LIS.",
			resourcePath: "/recursos/modernizar-resultados-lis-whatsapp",
			buttonLabel: "Recibir la guía y el briefing",
			secondaryLabel: "Ver guía",
		},
		en: {
			title: "Weekly brief for clinical labs as APIs",
			description:
				"Concrete notes on modernizing results delivery, WhatsApp, legacy LIS and interoperability without breaking operations.",
			benefit:
				"Includes a guide for modernizing result delivery without replacing the LIS.",
			resourcePath: "/recursos/modernizar-resultados-lis-whatsapp",
			buttonLabel: "Get the guide and brief",
			secondaryLabel: "View guide",
		},
	},
	"healthbits-brief": {
		es: {
			title: "Healthbits Brief",
			description:
				"Un resumen semanal de lo que aprendo construyendo IA clínica, agentes y software de salud desde la Patagonia.",
			benefit:
				"Sin spam: 3 ideas, 1 decisión técnica y 1 aplicación práctica cada viernes.",
			resourcePath: "/blog",
			buttonLabel: "Recibir el briefing",
			secondaryLabel: "Leer el blog",
		},
		en: {
			title: "Healthbits Brief",
			description:
				"A weekly brief on what I learn building clinical AI, agents and health software from Patagonia.",
			benefit:
				"No spam: 3 ideas, 1 technical decision and 1 practical application every Friday.",
			resourcePath: "/en/blog",
			buttonLabel: "Get the weekly brief",
			secondaryLabel: "Read the blog",
		},
	},
};

export function ctaForPost(input: NewsletterCtaInput = {}): NewsletterCta {
	const lang = input.lang ?? "es";
	const normalizedTags = tagsForPost(input.tags ?? []);
	const explicit = normalizeLeadMagnet(input.leadMagnet);
	const selected = explicit ?? inferLeadMagnet(normalizedTags);
	const copy = COPY[selected][lang];
	return {
		id: selected,
		topic: input.newsletterTopic ?? topicFor(selected),
		...copy,
	};
}

function normalizeLeadMagnet(value?: string): LeadMagnetId | undefined {
	if (!value) return undefined;
	if (value === "interoperability-checklist") return value;
	if (value === "lis-whatsapp-guide") return value;
	if (value === "healthbits-brief") return value;
	return undefined;
}

function inferLeadMagnet(tags: string[]): LeadMagnetId {
	const tagSet = new Set(tags);
	if (
		tagSet.has("interoperability") ||
		tagSet.has("fhir") ||
		tagSet.has("hl7") ||
		tagSet.has("ley-21668") ||
		tagSet.has("compliance")
	) {
		return "interoperability-checklist";
	}
	if (
		tagSet.has("clinical-labs") ||
		tagSet.has("lis") ||
		tagSet.has("diagnostic-report") ||
		tagSet.has("examya") ||
		tagSet.has("whatsapp")
	) {
		return "lis-whatsapp-guide";
	}
	return "healthbits-brief";
}

function topicFor(id: LeadMagnetId): string {
	switch (id) {
		case "interoperability-checklist":
			return "interoperability";
		case "lis-whatsapp-guide":
			return "clinical-labs-as-api";
		default:
			return "healthbits-brief";
	}
}
