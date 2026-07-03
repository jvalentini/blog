import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { APIContext } from 'astro';
import { AUTHOR_NAME } from '../../consts';
import {
	buildFrogAndToadPodcastFeed,
	getFrogAndToadChapters,
	getFrogAndToadChapterUrl,
} from '../../utils/frog-and-toad';

async function getPublicAssetSize(assetPath: string): Promise<number> {
	const publicPath = fileURLToPath(new URL(`../../../public${assetPath}`, import.meta.url));
	const stats = await stat(publicPath);
	return stats.size;
}

export async function GET(context: APIContext): Promise<Response> {
	const siteUrl = context.site?.origin ?? 'https://jval.dev';
	const chapters = await Promise.all(
		getFrogAndToadChapters().map(async (chapter) => ({
			...chapter,
			size: await getPublicAssetSize(chapter.assetPath),
			url: getFrogAndToadChapterUrl(chapter.filePath, siteUrl),
		})),
	);
	const xml = buildFrogAndToadPodcastFeed({
		authorName: AUTHOR_NAME,
		chapters,
		publishedAt: new Date('2026-07-03T00:00:00.000Z'),
		siteUrl,
	});

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
		},
	});
}
