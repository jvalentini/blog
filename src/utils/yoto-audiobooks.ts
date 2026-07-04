import { YOTO_AUDIOBOOK_CONFIGS, type YotoAudiobookConfig } from '../data/yoto-audiobook-configs';
import { getAbsoluteAudioAssetUrl, getAudioAssetPath } from './audio-assets';

export interface YotoAudiobookChapter {
	readonly id: string;
	readonly title: string;
	readonly filePath: string;
	readonly assetPath: string;
	readonly durationSeconds: number;
}

export interface YotoAudiobookPodcastChapter extends YotoAudiobookChapter {
	readonly size: number;
	readonly url: string;
}

export interface YotoAudiobookPodcastFeedOptions {
	readonly chapters: readonly YotoAudiobookPodcastChapter[];
	readonly config: YotoAudiobookConfig;
	readonly siteUrl: string;
}

export class UnknownYotoAudiobookError extends Error {
	constructor(readonly audiobookId: string) {
		super(`Unknown Yoto audiobook: ${audiobookId}`);
		this.name = 'UnknownYotoAudiobookError';
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

export function getYotoAudiobookConfigs(): readonly YotoAudiobookConfig[] {
	return YOTO_AUDIOBOOK_CONFIGS;
}

export function getYotoAudiobookConfig(audiobookId: string): YotoAudiobookConfig {
	const config = YOTO_AUDIOBOOK_CONFIGS.find((audiobook) => audiobook.id === audiobookId);
	if (!config) {
		throw new UnknownYotoAudiobookError(audiobookId);
	}

	return config;
}

export function getYotoAudiobookChapters(config: YotoAudiobookConfig): readonly YotoAudiobookChapter[] {
	return config.chapters.map((chapter) => ({
		...chapter,
		assetPath: getAudioAssetPath(chapter.filePath),
	}));
}

export function getYotoAudiobookChapterUrl(filePath: string, siteUrl: string): string {
	return getAbsoluteAudioAssetUrl(filePath, siteUrl);
}

function formatPodcastDuration(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return [hours, minutes, seconds].map((part) => part.toString().padStart(2, '0')).join(':');
}

export function getYotoAudiobookRssPath(config: YotoAudiobookConfig): string {
	return `/yoto/${config.id}.xml`;
}

export function getYotoAudiobookArtworkUrl(config: YotoAudiobookConfig, siteUrl: string): string {
	return new URL(config.artworkPath, siteUrl).toString();
}

export function buildYotoAudiobookPodcastFeed(options: YotoAudiobookPodcastFeedOptions): string {
	const feedDescription = `${options.config.sourceNote} Built for Yoto offline playback.`;
	const publishedAt = new Date(options.config.publishedAt).toUTCString();
	const feedUrl = new URL(getYotoAudiobookRssPath(options.config), options.siteUrl).toString();
	const pageUrl = new URL(`/yoto/${options.config.id}`, options.siteUrl).toString();
	const artworkUrl = getYotoAudiobookArtworkUrl(options.config, options.siteUrl);

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
	<title>${escapeXml(options.config.feedTitle)}</title>
	<link>${escapeXml(pageUrl)}</link>
	<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
	<description>${escapeXml(feedDescription)}</description>
	<image>
		<url>${escapeXml(artworkUrl)}</url>
		<title>${escapeXml(options.config.feedTitle)}</title>
		<link>${escapeXml(pageUrl)}</link>
	</image>
	<language>en-us</language>
	<itunes:author>${escapeXml(options.config.authorName)}</itunes:author>
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
