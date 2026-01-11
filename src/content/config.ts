import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			tags: z.array(z.string()).default([]),
			draft: z.boolean().default(false),
			syndication: z
				.object({
					twitter: z.string().url().optional(),
					linkedin: z.string().url().optional(),
					devto: z.string().url().optional(),
					hashnode: z.string().url().optional(),
				})
				.optional(),
			howTo: z
				.object({
					totalTime: z.string().optional(),
					steps: z.array(
						z.object({
							name: z.string(),
							text: z.string(),
						}),
					),
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
