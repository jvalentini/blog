import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { APIContext } from 'astro';
import { AUTHOR_NAME } from '../../consts';
import { getAbsoluteAudioAssetUrl } from '../../utils/audio-assets';
import { getFrogAndToadChapters } from '../../utils/frog-and-toad';

const FEED_TITLE = 'Frog and Toad Audiobook';
const FEED_DESCRIPTION = 'Private licensed Frog and Toad audiobook feed for online playback fallback.';

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

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
			url: getAbsoluteAudioAssetUrl(chapter.filePath, siteUrl),
		})),
	);
	const publishedAt = new Date('2026-07-03T00:00:00.000Z').toUTCString();

	const items = chapters
		.map(
			(chapter) => `<item>
	<title>${escapeXml(chapter.title)}</title>
	<guid isPermaLink="false">${escapeXml(chapter.id)}</guid>
	<pubDate>${publishedAt}</pubDate>
	<enclosure url="${escapeXml(chapter.url)}" length="${chapter.size}" type="audio/mpeg" />
</item>`,
		)
		.join('\\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
	<title>${escapeXml(FEED_TITLE)}</title>
	<link>${escapeXml(new URL('/yoto/frog-and-toad', siteUrl).toString())}</link>
	<description>${escapeXml(FEED_DESCRIPTION)}</description>
	<language>en-us</language>
	<author>${escapeXml(AUTHOR_NAME)}</author>
	<pubDate>${publishedAt}</pubDate>
	${items}
</channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
		},
	});
}
