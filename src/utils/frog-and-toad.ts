import tracksData from '../data/tracks.json';
import { type AudioVersionMap, getAbsoluteAudioAssetUrl, getAudioAssetPath } from './audio-assets';

export const FROG_AND_TOAD_PLAYLIST_ID = 'frog-and-toad';
export const FROG_AND_TOAD_RSS_PATH = '/yoto/frog-and-toad.xml';
export const FROG_AND_TOAD_ARTWORK_PATH = '/assets/yoto-art/frog-and-toad.png';

const FROG_AND_TOAD_AUDIOBOOK_DURATIONS_SECONDS: Record<string, number> = {
	'audiobooks/frog-and-toad/1-01-frog-and-toad-are-friends.mp3': 59,
	'audiobooks/frog-and-toad/1-02-spring.mp3': 275,
	'audiobooks/frog-and-toad/1-03-the-story.mp3': 292,
	'audiobooks/frog-and-toad/1-04-a-lost-button.mp3': 253,
	'audiobooks/frog-and-toad/1-05-a-swim.mp3': 272,
	'audiobooks/frog-and-toad/1-06-the-letter.mp3': 307,
	'audiobooks/frog-and-toad/1-07-frog-and-toad-all-year.mp3': 536,
	'audiobooks/frog-and-toad/1-08-ice-cream.mp3': 209,
	'audiobooks/frog-and-toad/1-09-the-surprise.mp3': 203,
	'audiobooks/frog-and-toad/1-10-christmas-eve.mp3': 252,
	'audiobooks/frog-and-toad/2-01-frog-and-toad-together.mp3': 60,
	'audiobooks/frog-and-toad/2-02-a-list.mp3': 307,
	'audiobooks/frog-and-toad/2-03-the-garden.mp3': 279,
	'audiobooks/frog-and-toad/2-04-cookies.mp3': 277,
	'audiobooks/frog-and-toad/2-05-dragons-and-giants.mp3': 208,
	'audiobooks/frog-and-toad/2-06-the-dream.mp3': 253,
	'audiobooks/frog-and-toad/2-07-days-with-frog-and-toad.mp3': 59,
	'audiobooks/frog-and-toad/2-08-tomorrow.mp3': 251,
	'audiobooks/frog-and-toad/2-09-the-kite.mp3': 245,
	'audiobooks/frog-and-toad/2-10-shivers.mp3': 295,
	'audiobooks/frog-and-toad/2-11-the-hat.mp3': 224,
	'audiobooks/frog-and-toad/2-12-alone.mp3': 310,
};

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
	readonly durationSeconds: number;
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

export class MissingAudiobookDurationError extends Error {
	constructor(readonly filePath: string) {
		super(`Missing audiobook duration for ${filePath}`);
		this.name = 'MissingAudiobookDurationError';
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
			const durationSeconds = FROG_AND_TOAD_AUDIOBOOK_DURATIONS_SECONDS[filePath];
			if (durationSeconds === undefined) {
				throw new MissingAudiobookDurationError(filePath);
			}

			return {
				id: song.id,
				title: song.title,
				filePath,
				assetPath: getAudioAssetPath(filePath),
				durationSeconds,
			};
		});
}

export function getFrogAndToadChapterUrl(filePath: string, siteUrl: string): string {
	return getAbsoluteAudioAssetUrl(filePath, siteUrl);
}

export function getFrogAndToadArtworkUrl(siteUrl: string): string {
	return new URL(FROG_AND_TOAD_ARTWORK_PATH, siteUrl).toString();
}

function formatPodcastDuration(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return [hours, minutes, seconds].map((part) => part.toString().padStart(2, '0')).join(':');
}

export function buildFrogAndToadPodcastFeed(options: FrogAndToadPodcastFeedOptions): string {
	const feedTitle = 'Frog and Toad Audiobook';
	const feedDescription = 'Private licensed Frog and Toad audiobook feed for online playback fallback.';
	const publishedAt = options.publishedAt.toUTCString();
	const feedUrl = new URL(FROG_AND_TOAD_RSS_PATH, options.siteUrl).toString();
	const pageUrl = new URL('/yoto/frog-and-toad', options.siteUrl).toString();
	const artworkUrl = getFrogAndToadArtworkUrl(options.siteUrl);

	const items = options.chapters
		.map((chapter, index) => {
			const chapterUrl = escapeXml(chapter.url);
			const episodeNumber = index + 1;
			const duration = formatPodcastDuration(chapter.durationSeconds);

			return `<item>
	<title>${escapeXml(chapter.title)}</title>
	<link>${chapterUrl}</link>
	<guid isPermaLink="false">${escapeXml(chapter.id)}</guid>
	<description>${escapeXml(chapter.title)}</description>
	<pubDate>${publishedAt}</pubDate>
	<itunes:episode>${episodeNumber}</itunes:episode>
	<itunes:episodeType>full</itunes:episodeType>
	<itunes:duration>${duration}</itunes:duration>
	<itunes:image href="${escapeXml(artworkUrl)}" />
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
	<image>
		<url>${escapeXml(artworkUrl)}</url>
		<title>${escapeXml(feedTitle)}</title>
		<link>${escapeXml(pageUrl)}</link>
	</image>
	<language>en-us</language>
	<itunes:author>${escapeXml(options.authorName)}</itunes:author>
	<itunes:summary>${escapeXml(feedDescription)}</itunes:summary>
	<itunes:image href="${escapeXml(artworkUrl)}" />
	<itunes:explicit>false</itunes:explicit>
	<itunes:type>episodic</itunes:type>
	<itunes:category text="${escapeXml('Kids & Family')}" />
	<pubDate>${publishedAt}</pubDate>
	<lastBuildDate>${publishedAt}</lastBuildDate>
	${items}
</channel>
</rss>`;
}
