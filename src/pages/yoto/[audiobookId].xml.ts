import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { APIContext, GetStaticPaths } from 'astro';
import {
	buildYotoAudiobookPodcastFeed,
	getYotoAudiobookChapters,
	getYotoAudiobookChapterUrl,
	getYotoAudiobookConfig,
	getYotoAudiobookConfigs,
} from '../../utils/yoto-audiobooks';

async function getPublicAssetSize(assetPath: string): Promise<number> {
	const publicPath = fileURLToPath(new URL(`../../../public${assetPath}`, import.meta.url));
	const stats = await stat(publicPath);
	return stats.size;
}

export const getStaticPaths: GetStaticPaths = () =>
	getYotoAudiobookConfigs().map((config) => ({
		params: { audiobookId: config.id },
	}));

export async function GET(context: APIContext): Promise<Response> {
	const audiobookId = context.params.audiobookId;
	if (!audiobookId) {
		return new Response('Not found', { status: 404 });
	}

	const siteUrl = context.site?.origin ?? 'https://jval.dev';
	const config = getYotoAudiobookConfig(audiobookId);
	const chapters = await Promise.all(
		getYotoAudiobookChapters(config).map(async (chapter) => ({
			...chapter,
			size: await getPublicAssetSize(chapter.assetPath),
			url: getYotoAudiobookChapterUrl(chapter.filePath, siteUrl),
		})),
	);
	const xml = buildYotoAudiobookPodcastFeed({
		chapters,
		config,
		siteUrl,
	});

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
		},
	});
}
