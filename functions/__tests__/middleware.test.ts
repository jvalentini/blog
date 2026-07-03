import { describe, expect, it } from 'vitest';
import { shouldBypassMiddleware } from '../_middleware';

describe('middleware bypass policy', () => {
	it('bypasses music audio assets so byte ranges are preserved', () => {
		const request = new Request('https://jval.dev/assets/music/rock/fail-forward-rock.mp3');

		expect(shouldBypassMiddleware(request)).toBe(true);
	});

	it('bypasses audiobook assets so Yoto/player downloads get static responses', () => {
		const request = new Request('https://jval.dev/assets/audiobooks/frog-and-toad/1-02-spring.mp3');

		expect(shouldBypassMiddleware(request)).toBe(true);
	});

	it('keeps page requests in the personalization middleware', () => {
		const request = new Request('https://jval.dev/waves');

		expect(shouldBypassMiddleware(request)).toBe(false);
	});
});
