import tracksData from '../data/tracks.json';
import { type AudioVersionMap, getAudioAssetPath } from './audio-assets';

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

export class MissingAudiobookVersionError extends Error {
	constructor(readonly songId: string) {
		super(`Missing audiobook version for ${songId}`);
		this.name = 'MissingAudiobookVersionError';
	}
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
