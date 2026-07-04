// @ts-check

import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://jval.dev',
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => {
				const url = new URL(page);
				const nonIndexablePrefixes = ['/diagnostics/', '/embed/', '/oembed/'];
				return !nonIndexablePrefixes.some((prefix) => url.pathname.startsWith(prefix));
			},
			lastmod: new Date(),
		}),
		partytown({
			config: {
				forward: ['dataLayer.push'],
			},
		}),
	],
	output: 'static',
	build: {
		// Cloudflare Pages compatible output
		format: 'directory',
	},
});
