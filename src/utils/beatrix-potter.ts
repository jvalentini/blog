import tracksData from '../data/tracks.json';
import { type AudioVersionMap, getAbsoluteAudioAssetUrl, getAudioAssetPath } from './audio-assets';

export const BEATRIX_POTTER_PLAYLIST_ID = 'beatrix-potter';
export const BEATRIX_POTTER_RSS_PATH = '/yoto/beatrix-potter.xml';

const BEATRIX_POTTER_AUDIOBOOK_DURATIONS_SECONDS: Record<string, number> = {
	'audiobooks/beatrix-potter/01-the-tale-of-peter-rabbit.mp3': 506,
	'audiobooks/beatrix-potter/02-the-tailor-of-gloucester.mp3': 1073,
	'audiobooks/beatrix-potter/03-the-tale-of-squirrel-nutkin.mp3': 755,
	'audiobooks/beatrix-potter/04-the-tale-of-benjamin-bunny.mp3': 579,
	'audiobooks/beatrix-potter/05-the-tale-of-two-bad-mice.mp3': 462,
	'audiobooks/beatrix-potter/06-the-tale-of-mrs-tiggy-winkle.mp3': 700,
	'audiobooks/beatrix-potter/07-the-pie-and-the-patty-pan.mp3': 910,
	'audiobooks/beatrix-potter/08-the-tale-of-mr-jeremy-fisher.mp3': 387,
	'audiobooks/beatrix-potter/09-the-story-of-a-fierce-bad-rabbit.mp3': 128,
	'audiobooks/beatrix-potter/10-the-story-of-miss-moppet.mp3': 153,
	'audiobooks/beatrix-potter/11-the-tale-of-tom-kitten.mp3': 368,
	'audiobooks/beatrix-potter/12-the-tale-of-jemima-puddle-duck.mp3': 631,
	'audiobooks/beatrix-potter/13-the-roly-poly-pudding.mp3': 1138,
	'audiobooks/beatrix-potter/14-the-tale-of-the-flopsy-bunnies.mp3': 508,
	'audiobooks/beatrix-potter/15-the-tale-of-mrs-tittlemouse.mp3': 577,
	'audiobooks/beatrix-potter/16-the-tale-of-timmy-tiptoes.mp3': 662,
	'audiobooks/beatrix-potter/17-the-tale-of-mr-tod.mp3': 2305,
	'audiobooks/beatrix-potter/18-the-tale-of-pigling-bland.mp3': 1758,
	'audiobooks/beatrix-potter/19-ginger-and-pickles.mp3': 638,
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

export interface BeatrixPotterChapter {
	readonly id: string;
	readonly title: string;
	readonly filePath: string;
	readonly assetPath: string;
	readonly durationSeconds: number;
}

export interface BeatrixPotterPodcastChapter extends BeatrixPotterChapter {
	readonly size: number;
	readonly url: string;
}

export interface BeatrixPotterPodcastFeedOptions {
	readonly authorName: string;
	readonly chapters: readonly BeatrixPotterPodcastChapter[];
	readonly publishedAt: Date;
	readonly siteUrl: string;
}

export class MissingBeatrixPotterAudiobookVersionError extends Error {
	constructor(readonly songId: string) {
		super(`Missing Beatrix Potter audiobook version for ${songId}`);
		this.name = 'MissingBeatrixPotterAudiobookVersionError';
	}
}

export class MissingBeatrixPotterAudiobookDurationError extends Error {
	constructor(readonly filePath: string) {
		super(`Missing Beatrix Potter audiobook duration for ${filePath}`);
		this.name = 'MissingBeatrixPotterAudiobookDurationError';
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

export function getBeatrixPotterChapters(): readonly BeatrixPotterChapter[] {
	const config = tracksData as TracksConfig;
	return config.songs
		.filter((song) => song.playlist === BEATRIX_POTTER_PLAYLIST_ID)
		.map((song) => {
			const filePath = song.versions.audiobook;
			if (!filePath) {
				throw new MissingBeatrixPotterAudiobookVersionError(song.id);
			}
			const durationSeconds = BEATRIX_POTTER_AUDIOBOOK_DURATIONS_SECONDS[filePath];
			if (durationSeconds === undefined) {
				throw new MissingBeatrixPotterAudiobookDurationError(filePath);
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

export function getBeatrixPotterChapterUrl(filePath: string, siteUrl: string): string {
	return getAbsoluteAudioAssetUrl(filePath, siteUrl);
}

function formatPodcastDuration(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return [hours, minutes, seconds].map((part) => part.toString().padStart(2, '0')).join(':');
}

export function buildBeatrixPotterPodcastFeed(options: BeatrixPotterPodcastFeedOptions): string {
	const feedTitle = 'The Great Big Treasury of Beatrix Potter';
	const feedDescription = 'Public-domain LibriVox Beatrix Potter audiobook feed for Yoto offline playback.';
	const publishedAt = options.publishedAt.toUTCString();
	const feedUrl = new URL(BEATRIX_POTTER_RSS_PATH, options.siteUrl).toString();
	const pageUrl = new URL('/yoto/beatrix-potter', options.siteUrl).toString();

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
	<itunes:type>episodic</itunes:type>
	<itunes:category text="${escapeXml('Kids & Family')}" />
	<pubDate>${publishedAt}</pubDate>
	<lastBuildDate>${publishedAt}</lastBuildDate>
	${items}
</channel>
</rss>`;
}
