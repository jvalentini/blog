import { describe, expect, it } from 'vitest';
import { getAbsoluteAudioAssetUrl, getAudioAssetPath } from '../audio-assets';

describe('audio asset URL resolution', () => {
	it('resolves music tracks under the music asset root', () => {
		expect(getAudioAssetPath('rock/fail-forward-rock.mp3')).toBe('/assets/music/rock/fail-forward-rock.mp3');
	});

	it('resolves audiobook tracks under the general asset root', () => {
		expect(getAudioAssetPath('audiobooks/frog-and-toad/1-02-spring.mp3')).toBe(
			'/assets/audiobooks/frog-and-toad/1-02-spring.mp3',
		);
	});

	it('preserves already absolute paths and URLs', () => {
		expect(getAudioAssetPath('/assets/custom.mp3')).toBe('/assets/custom.mp3');
		expect(getAudioAssetPath('https://cdn.example.com/audio.mp3')).toBe('https://cdn.example.com/audio.mp3');
	});

	it('builds absolute site URLs for Yoto feed enclosures', () => {
		expect(getAbsoluteAudioAssetUrl('audiobooks/frog-and-toad/1-02-spring.mp3', 'https://jval.dev')).toBe(
			'https://jval.dev/assets/audiobooks/frog-and-toad/1-02-spring.mp3',
		);
	});
});
