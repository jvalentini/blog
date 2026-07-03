import { describe, expect, it } from 'vitest';
import { buildFrogAndToadPodcastFeed, FROG_AND_TOAD_PLAYLIST_ID, getFrogAndToadChapters } from '../frog-and-toad';

describe('Frog and Toad audiobook chapter list', () => {
	it('returns the full ordered chapter list for the Yoto helper surfaces', () => {
		const chapters = getFrogAndToadChapters();

		expect(chapters).toHaveLength(22);
		expect(chapters[0]).toMatchObject({
			id: `${FROG_AND_TOAD_PLAYLIST_ID}-frog-and-toad-are-friends`,
			title: 'Frog and Toad Are Friends',
			assetPath: '/assets/audiobooks/frog-and-toad/1-01-frog-and-toad-are-friends.mp3',
		});
		expect(chapters.at(-1)).toMatchObject({
			id: `${FROG_AND_TOAD_PLAYLIST_ID}-alone`,
			title: 'Alone',
			assetPath: '/assets/audiobooks/frog-and-toad/2-12-alone.mp3',
		});
	});

	it('builds podcast-compatible XML for Yoto RSS import', () => {
		const xml = buildFrogAndToadPodcastFeed({
			authorName: 'Justin Valentini',
			chapters: [
				{
					id: 'frog-and-toad-frog-and-toad-are-friends',
					title: 'Frog and Toad Are Friends',
					filePath: 'audiobooks/frog-and-toad/1-01-frog-and-toad-are-friends.mp3',
					assetPath: '/assets/audiobooks/frog-and-toad/1-01-frog-and-toad-are-friends.mp3',
					size: 1084519,
					url: 'https://jval.dev/assets/audiobooks/frog-and-toad/1-01-frog-and-toad-are-friends.mp3',
				},
				{
					id: 'frog-and-toad-spring',
					title: 'Spring',
					filePath: 'audiobooks/frog-and-toad/1-02-spring.mp3',
					assetPath: '/assets/audiobooks/frog-and-toad/1-02-spring.mp3',
					size: 5068486,
					url: 'https://jval.dev/assets/audiobooks/frog-and-toad/1-02-spring.mp3',
				},
			],
			publishedAt: new Date('2026-07-03T00:00:00.000Z'),
			siteUrl: 'https://jval.dev',
		});

		expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
		expect(xml).toContain(
			'<atom:link href="https://jval.dev/yoto/frog-and-toad.xml" rel="self" type="application/rss+xml" />',
		);
		expect(xml).toContain('<itunes:author>Justin Valentini</itunes:author>');
		expect(xml).toContain(
			'<link>https://jval.dev/assets/audiobooks/frog-and-toad/1-01-frog-and-toad-are-friends.mp3</link>',
		);
		expect(xml).not.toContain('<author>');
		expect(xml).not.toContain('\\n');
		expect(xml.match(/<enclosure /g)).toHaveLength(2);
	});
});
