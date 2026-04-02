import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
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
    lang: z.enum(['es', 'en']).default('es'),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    lang: z.enum(['es', 'en']).default('es'),
    canonicalSlug: z.string().optional(),
  }),
});

export const collections = { projects, blog };
