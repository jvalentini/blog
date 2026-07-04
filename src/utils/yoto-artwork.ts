export const YOTO_DISPLAY_ARTWORK_SIZE = 440;

export function getYotoDisplayArtworkPath(artworkPath: string): string {
	return artworkPath.replace('/assets/yoto-art/', '/assets/yoto-art/display/').replace(/\.png$/, '.webp');
}
