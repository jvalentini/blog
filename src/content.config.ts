import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.union([image(), z.string().url()]).optional(),
			canonicalUrl: z.string().url().optional(),
			syndication: z
				.object({
					twitter: z.string().url().optional(),
					linkedin: z.string().url().optional(),
					devto: z.string().url().optional(),
					hashnode: z.string().url().optional(),
					medium: z.string().url().optional(),
				})
				.optional(),
			tags: z.array(z.string()).default([]),
			draft: z.boolean().default(false),
			howTo: z
				.object({
					steps: z.array(
						z.object({
							name: z.string(),
							text: z.string(),
						}),
					),
					totalTime: z.string().optional(),
				})
				.optional(),
			faq: z
				.array(
					z.object({
						question: z.string(),
						answer: z.string(),
					}),
				)
				.optional(),
		}),
});

export const collections = { blog };
