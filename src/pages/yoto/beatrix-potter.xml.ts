import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { APIContext } from 'astro';
import {
	buildBeatrixPotterPodcastFeed,
	getBeatrixPotterChapters,
	getBeatrixPotterChapterUrl,
} from '../../utils/beatrix-potter';

async function getPublicAssetSize(assetPath: string): Promise<number> {
	const publicPath = fileURLToPath(new URL(`../../../public${assetPath}`, import.meta.url));
	const stats = await stat(publicPath);
	return stats.size;
}

export async function GET(context: APIContext): Promise<Response> {
	const siteUrl = context.site?.origin ?? 'https://jval.dev';
	const chapters = await Promise.all(
		getBeatrixPotterChapters().map(async (chapter) => ({
			...chapter,
			size: await getPublicAssetSize(chapter.assetPath),
			url: getBeatrixPotterChapterUrl(chapter.filePath, siteUrl),
		})),
	);
	const xml = buildBeatrixPotterPodcastFeed({
		authorName: 'Beatrix Potter',
		chapters,
		publishedAt: new Date('2009-10-18T00:00:00.000Z'),
		siteUrl,
	});

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
		},
	});
}
