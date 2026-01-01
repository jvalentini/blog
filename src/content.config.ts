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
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			// Cross-posting / syndication tracking
			canonicalUrl: z.string().url().optional(),
			syndication: z.object({
				twitter: z.string().url().optional(),
				linkedin: z.string().url().optional(),
				devto: z.string().url().optional(),
				hashnode: z.string().url().optional(),
				medium: z.string().url().optional(),
			}).optional(),
			// Content metadata for social sharing
			tags: z.array(z.string()).default([]),
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog };
