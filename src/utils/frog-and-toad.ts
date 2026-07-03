import tracksData from '../data/tracks.json';
import { type AudioVersionMap, getAbsoluteAudioAssetUrl, getAudioAssetPath } from './audio-assets';

export const FROG_AND_TOAD_PLAYLIST_ID = 'frog-and-toad';
export const FROG_AND_TOAD_RSS_PATH = '/yoto/frog-and-toad.xml';

interface Song {
	readonly id: string;
	readonly title: string;
	readonly playlist: string;
	readonly versions: AudioVersionMap;
}

interface TracksConfig {
	readonly songs: readonly Song[];
}

export interface FrogAndToadChapter {
	readonly id: string;
	readonly title: string;
	readonly filePath: string;
	readonly assetPath: string;
}

export interface FrogAndToadPodcastChapter extends FrogAndToadChapter {
	readonly size: number;
	readonly url: string;
}

export interface FrogAndToadPodcastFeedOptions {
	readonly authorName: string;
	readonly chapters: readonly FrogAndToadPodcastChapter[];
	readonly publishedAt: Date;
	readonly siteUrl: string;
}

export class MissingAudiobookVersionError extends Error {
	constructor(readonly songId: string) {
		super(`Missing audiobook version for ${songId}`);
		this.name = 'MissingAudiobookVersionError';
	}
}

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export function getFrogAndToadChapters(): readonly FrogAndToadChapter[] {
	const config = tracksData as TracksConfig;
	return config.songs
		.filter((song) => song.playlist === FROG_AND_TOAD_PLAYLIST_ID)
		.map((song) => {
			const filePath = song.versions.audiobook;
			if (!filePath) {
				throw new MissingAudiobookVersionError(song.id);
			}

			return {
				id: song.id,
				title: song.title,
				filePath,
				assetPath: getAudioAssetPath(filePath),
			};
		});
}

export function getFrogAndToadChapterUrl(filePath: string, siteUrl: string): string {
	return getAbsoluteAudioAssetUrl(filePath, siteUrl);
}

export function buildFrogAndToadPodcastFeed(options: FrogAndToadPodcastFeedOptions): string {
	const feedTitle = 'Frog and Toad Audiobook';
	const feedDescription = 'Private licensed Frog and Toad audiobook feed for online playback fallback.';
	const publishedAt = options.publishedAt.toUTCString();
	const feedUrl = new URL(FROG_AND_TOAD_RSS_PATH, options.siteUrl).toString();
	const pageUrl = new URL('/yoto/frog-and-toad', options.siteUrl).toString();

	const items = options.chapters
		.map((chapter) => {
			const chapterUrl = escapeXml(chapter.url);

			return `<item>
	<title>${escapeXml(chapter.title)}</title>
	<link>${chapterUrl}</link>
	<guid isPermaLink="false">${escapeXml(chapter.id)}</guid>
	<description>${escapeXml(chapter.title)}</description>
	<pubDate>${publishedAt}</pubDate>
	<enclosure url="${chapterUrl}" length="${chapter.size}" type="audio/mpeg" />
</item>`;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
<channel>
	<title>${escapeXml(feedTitle)}</title>
	<link>${escapeXml(pageUrl)}</link>
	<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
	<description>${escapeXml(feedDescription)}</description>
	<language>en-us</language>
	<itunes:author>${escapeXml(options.authorName)}</itunes:author>
	<itunes:summary>${escapeXml(feedDescription)}</itunes:summary>
	<itunes:explicit>false</itunes:explicit>
	<pubDate>${publishedAt}</pubDate>
	<lastBuildDate>${publishedAt}</lastBuildDate>
	${items}
</channel>
</rss>`;
}
