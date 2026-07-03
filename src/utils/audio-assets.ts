const ABSOLUTE_AUDIO_URL_PATTERN = /^(?:https?:)?\/\//;
const AUDIOBOOK_ASSET_PREFIX = 'audiobooks/';
const MUSIC_ASSET_BASE = '/assets/music/';
const GENERAL_ASSET_BASE = '/assets/';

export type AudioVersionMap = Record<string, string | undefined>;

export function getAudioVersionEntries(versions: AudioVersionMap): readonly [string, string][] {
	return Object.entries(versions).filter(
		(entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0,
	);
}

export function getAudioAssetPath(filePath: string): string {
	if (filePath.startsWith('/') || ABSOLUTE_AUDIO_URL_PATTERN.test(filePath)) {
		return filePath;
	}

	if (filePath.startsWith(AUDIOBOOK_ASSET_PREFIX)) {
		return `${GENERAL_ASSET_BASE}${filePath}`;
	}

	return `${MUSIC_ASSET_BASE}${filePath}`;
}

export function getAbsoluteAudioAssetUrl(filePath: string, siteUrl: string): string {
	const assetPath = getAudioAssetPath(filePath);
	if (ABSOLUTE_AUDIO_URL_PATTERN.test(assetPath)) {
		return assetPath;
	}

	return new URL(assetPath, siteUrl).toString();
}
