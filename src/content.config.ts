import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    emoji: z.string(),
    techStack: z.array(z.string()),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    githubUrl: z.string().optional(),
    demoUrl: z.string().optional(),
  }),
});

export const collections = { projects };
