import { describe, expect, it } from 'vitest';
import {
	buildYotoAudiobookPodcastFeed,
	getYotoAudiobookChapters,
	getYotoAudiobookConfig,
	getYotoAudiobookRssPath,
} from '../yoto-audiobooks';

describe('Archive-backed Yoto audiobook feeds', () => {
	it('returns every hosted audiobook as a separate playlist config', () => {
		const expectedCounts = new Map([
			['beatrix-potter', 19],
			['little-red-riding-hood', 6],
			['uncle-wiggily-story-book', 36],
			['roald-dahl-revolting-rhymes', 6],
			['dr-seuss-rik-mayall', 4],
			['dr-seuss-cat-in-the-hat', 8],
			['dr-seuss-scrambled-eggs-super', 7],
			['when-you-grow-up', 1],
			['roald-dahl-bfg', 4],
		]);

		for (const [audiobookId, chapterCount] of expectedCounts) {
			const config = getYotoAudiobookConfig(audiobookId);

			expect(config.artworkPath).toBe(`/assets/yoto-art/${audiobookId}.png`);
			expect(getYotoAudiobookChapters(config)).toHaveLength(chapterCount);
			expect(getYotoAudiobookRssPath(config)).toBe(`/yoto/${audiobookId}.xml`);
		}
	});

	it('returns the Little Red Riding Hood playlist chapters', () => {
		const config = getYotoAudiobookConfig('little-red-riding-hood');
		const chapters = getYotoAudiobookChapters(config);

		expect(getYotoAudiobookRssPath(config)).toBe('/yoto/little-red-riding-hood.xml');
		expect(chapters).toHaveLength(6);
		expect(chapters[0]).toMatchObject({
			id: 'little-red-riding-hood-the-little-red-engine',
			title: 'The Little Red Engine',
			assetPath: '/assets/audiobooks/little-red-riding-hood/01-the-little-red-engine.mp3',
		});
	});

	it('returns the Uncle Wiggily playlist chapters', () => {
		const config = getYotoAudiobookConfig('uncle-wiggily-story-book');
		const chapters = getYotoAudiobookChapters(config);

		expect(getYotoAudiobookRssPath(config)).toBe('/yoto/uncle-wiggily-story-book.xml');
		expect(chapters).toHaveLength(36);
		expect(chapters.at(-1)).toMatchObject({
			id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-wolf',
			title: 'Uncle Wiggily and the Wolf',
			assetPath: '/assets/audiobooks/uncle-wiggily-story-book/36-uncle-wiggily-and-the-wolf.mp3',
		});
	});

	it('builds podcast-compatible XML for Yoto RSS import', () => {
		const config = getYotoAudiobookConfig('uncle-wiggily-story-book');
		const xml = buildYotoAudiobookPodcastFeed({
			config,
			chapters: [
				{
					id: 'uncle-wiggily-story-book-uncle-wiggily-s-toothache',
					title: "Uncle Wiggily's Toothache",
					filePath: 'audiobooks/uncle-wiggily-story-book/01-uncle-wiggily-s-toothache.mp3',
					assetPath: '/assets/audiobooks/uncle-wiggily-story-book/01-uncle-wiggily-s-toothache.mp3',
					size: 6178816,
					durationSeconds: 771,
					url: 'https://jval.dev/assets/audiobooks/uncle-wiggily-story-book/01-uncle-wiggily-s-toothache.mp3',
				},
			],
			siteUrl: 'https://jval.dev',
		});

		expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
		expect(xml).toContain(
			'<atom:link href="https://jval.dev/yoto/uncle-wiggily-story-book.xml" rel="self" type="application/rss+xml" />',
		);
		expect(xml).toContain('<itunes:author>Howard R. Garis</itunes:author>');
		expect(xml).toContain('<itunes:category text="Kids &amp; Family" />');
		expect(xml).toContain('<itunes:image href="https://jval.dev/assets/yoto-art/uncle-wiggily-story-book.png" />');
		expect(xml).toContain('<url>https://jval.dev/assets/yoto-art/uncle-wiggily-story-book.png</url>');
		expect(xml).toContain('<itunes:duration>00:12:51</itunes:duration>');
		expect(xml).toContain('<title>Uncle Wiggily&apos;s Toothache</title>');
		expect(xml).not.toContain('<author>');
		expect(xml).not.toContain('\\n');
		expect(xml.match(/<enclosure /g)).toHaveLength(1);
	});
});
