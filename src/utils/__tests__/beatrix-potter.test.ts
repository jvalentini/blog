import { describe, expect, it } from 'vitest';
import { BEATRIX_POTTER_PLAYLIST_ID, buildBeatrixPotterPodcastFeed, getBeatrixPotterChapters } from '../beatrix-potter';

describe('Beatrix Potter audiobook chapter list', () => {
	it('returns the full ordered chapter list for the Yoto helper surfaces', () => {
		const chapters = getBeatrixPotterChapters();

		expect(chapters).toHaveLength(19);
		expect(chapters[0]).toMatchObject({
			id: `${BEATRIX_POTTER_PLAYLIST_ID}-the-tale-of-peter-rabbit`,
			title: 'The Tale of Peter Rabbit',
			assetPath: '/assets/audiobooks/beatrix-potter/01-the-tale-of-peter-rabbit.mp3',
		});
		expect(chapters.at(-1)).toMatchObject({
			id: `${BEATRIX_POTTER_PLAYLIST_ID}-ginger-and-pickles`,
			title: 'Ginger and Pickles',
			assetPath: '/assets/audiobooks/beatrix-potter/19-ginger-and-pickles.mp3',
		});
	});

	it('builds podcast-compatible XML for Yoto RSS import', () => {
		const xml = buildBeatrixPotterPodcastFeed({
			authorName: 'Beatrix Potter',
			chapters: [
				{
					id: 'beatrix-potter-the-tale-of-peter-rabbit',
					title: 'The Tale of Peter Rabbit',
					filePath: 'audiobooks/beatrix-potter/01-the-tale-of-peter-rabbit.mp3',
					assetPath: '/assets/audiobooks/beatrix-potter/01-the-tale-of-peter-rabbit.mp3',
					size: 4048959,
					durationSeconds: 506,
					url: 'https://jval.dev/assets/audiobooks/beatrix-potter/01-the-tale-of-peter-rabbit.mp3',
				},
				{
					id: 'beatrix-potter-the-tailor-of-gloucester',
					title: 'The Tailor of Gloucester',
					filePath: 'audiobooks/beatrix-potter/02-the-tailor-of-gloucester.mp3',
					assetPath: '/assets/audiobooks/beatrix-potter/02-the-tailor-of-gloucester.mp3',
					size: 8584443,
					durationSeconds: 1073,
					url: 'https://jval.dev/assets/audiobooks/beatrix-potter/02-the-tailor-of-gloucester.mp3',
				},
			],
			publishedAt: new Date('2009-10-18T00:00:00.000Z'),
			siteUrl: 'https://jval.dev',
		});

		expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
		expect(xml).toContain(
			'<atom:link href="https://jval.dev/yoto/beatrix-potter.xml" rel="self" type="application/rss+xml" />',
		);
		expect(xml).toContain('<itunes:author>Beatrix Potter</itunes:author>');
		expect(xml).toContain('<itunes:category text="Kids &amp; Family" />');
		expect(xml).toContain('<itunes:episode>1</itunes:episode>');
		expect(xml).toContain('<itunes:duration>00:08:26</itunes:duration>');
		expect(xml).toContain('<itunes:duration>00:17:53</itunes:duration>');
		expect(xml).toContain(
			'<link>https://jval.dev/assets/audiobooks/beatrix-potter/01-the-tale-of-peter-rabbit.mp3</link>',
		);
		expect(xml).not.toContain('<author>');
		expect(xml).not.toContain('\\n');
		expect(xml.match(/<enclosure /g)).toHaveLength(2);
	});
});
