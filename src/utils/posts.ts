import { getCollection } from 'astro:content';

/**
 * Check if we're in a production environment.
 * On Cloudflare Pages:
 * - Production: CF_PAGES_BRANCH === 'master' (or your production branch)
 * - Preview: CF_PAGES_BRANCH is set but not 'master'
 * - Local dev: Neither is set, so we show drafts
 */
function isProduction(): boolean {
	// Cloudflare Pages sets CF_PAGES_BRANCH
	const branch = import.meta.env.CF_PAGES_BRANCH;
	
	// If CF_PAGES_BRANCH is 'master', it's production
	// If it's set to something else, it's a preview deployment
	// If not set at all (local dev), show drafts
	return branch === 'master';
}

/**
 * Get all published blog posts, filtering out drafts in production.
 * Drafts are visible in:
 * - Local development
 * - Preview deployments (non-master branches)
 */
export async function getPublishedPosts() {
	const allPosts = await getCollection('blog');
	const showDrafts = !isProduction();
	
	return allPosts
		.filter((post) => showDrafts || !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
