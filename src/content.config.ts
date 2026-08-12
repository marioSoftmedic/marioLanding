import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
	loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		descriptionEn: z.string().optional(),
		emoji: z.string(),
		techStack: z.array(z.string()),
		featured: z.boolean().default(false),
		image: z.string().optional(),
		githubUrl: z.string().optional(),
		demoUrl: z.string().optional(),
		previewUrl: z.string().optional(),
		previewFallbackImage: z.string().optional(),
		lang: z.enum(["es", "en"]).default("es"),
	}),
});

const blog = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		articleKind: z.enum(['blog', 'technical']).default('blog'),
		corrections: z.array(z.object({ date: z.coerce.date(), note: z.string().min(1) })).default([]),
		description: z.string(),
		tags: z.array(z.string()).default([]),
		image: z.string().optional(),
		draft: z.boolean().default(false),
		lang: z.enum(["es", "en"]).default("es"),
		canonicalSlug: z.string().optional(),
		series: z.string().optional(),
		seriesOrder: z.number().int().positive().optional(),
		related: z.array(z.string()).default([]),
		audience: z.string().optional(),
		funnelStage: z.enum(["awareness", "consideration", "decision"]).optional(),
		primaryCta: z
			.enum(["newsletter", "resource", "contact", "demo"])
			.optional(),
		leadMagnet: z
			.enum([
				"interoperability-checklist",
				"lis-whatsapp-guide",
				"healthbits-brief",
			])
			.optional(),
		newsletterTopic: z.string().optional(),
		newsletterPriority: z.number().int().min(0).max(5).optional(),
	}).superRefine((data, ctx) => {
		if (data.updatedDate && data.updatedDate <= data.date) ctx.addIssue({ code: 'custom', path: ['updatedDate'], message: 'updatedDate must be after date' });
		for (const [index, correction] of data.corrections.entries()) {
			if (!data.updatedDate || correction.date <= data.date || correction.date > data.updatedDate) ctx.addIssue({ code: 'custom', path: ['corrections', index, 'date'], message: 'correction date must be after publication and no later than updatedDate' });
		}
	}),
});

export const collections = { projects, blog };
