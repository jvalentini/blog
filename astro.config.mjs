// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://jvalentini.pages.dev',
	integrations: [
		mdx(),
		sitemap({
			// Add lastmod timestamp to sitemap (build time)
			lastmod: new Date(),
		}),
	],
	output: 'static',
	build: {
		// Cloudflare Pages compatible output
		format: 'directory',
	},
});
