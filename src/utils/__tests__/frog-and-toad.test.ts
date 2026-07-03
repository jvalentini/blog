import { describe, expect, it } from 'vitest';
import { FROG_AND_TOAD_PLAYLIST_ID, getFrogAndToadChapters } from '../frog-and-toad';

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
});
