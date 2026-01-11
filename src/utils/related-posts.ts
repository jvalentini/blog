import type { CollectionEntry } from 'astro:content';

/**
 * Find related posts based on shared tags.
 * Returns up to 3 related posts, sorted by relevance (most shared tags).
 */
export function getRelatedPosts(
	currentPost: CollectionEntry<'blog'>,
	allPosts: CollectionEntry<'blog'>[],
	limit = 3,
): CollectionEntry<'blog'>[] {
	const currentTags = new Set(currentPost.data.tags || []);

	if (currentTags.size === 0) {
		// No tags - return most recent posts
		return allPosts.filter((post) => post.id !== currentPost.id).slice(0, limit);
	}

	// Calculate relevance score for each post
	const scored = allPosts
		.filter((post) => post.id !== currentPost.id)
		.map((post) => {
			const postTags = new Set(post.data.tags || []);
			const sharedTags = [...currentTags].filter((tag) => postTags.has(tag));
			return {
				post,
				score: sharedTags.length,
			};
		})
		.filter((item) => item.score > 0) // Only include posts with at least one shared tag
		.sort((a, b) => {
			// Sort by score descending, then by date descending
			if (b.score !== a.score) {
				return b.score - a.score;
			}
			return b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf();
		});

	// If we have fewer related posts than limit, fill with recent posts
	const related = scored.slice(0, limit).map((item) => item.post);

	if (related.length < limit) {
		const remaining = allPosts
			.filter((post) => post.id !== currentPost.id && !related.some((r) => r.id === post.id))
			.slice(0, limit - related.length);

		related.push(...remaining);
	}

	return related;
}
