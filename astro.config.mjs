// @ts-check

import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const hasAnalytics =
	typeof process.env.PUBLIC_GA_MEASUREMENT_ID === 'string' && process.env.PUBLIC_GA_MEASUREMENT_ID.length > 0;

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
		...(hasAnalytics
			? [
					partytown({
						config: {
							forward: ['dataLayer.push'],
						},
					}),
				]
			: []),
	],
	output: 'static',
	build: {
		// Cloudflare Pages compatible output
		format: 'directory',
	},
});
