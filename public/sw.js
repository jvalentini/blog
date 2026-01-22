const AUDIO_CACHE = 'waves-audio-v1';
const AUDIO_PATH_PREFIX = '/assets/music/';

self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(
				keys.filter((key) => key.startsWith('waves-audio-') && key !== AUDIO_CACHE).map((key) => caches.delete(key)),
			);
			await self.clients.claim();
		})(),
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (!request || request.method !== 'GET') {
		return;
	}

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) {
		return;
	}

	if (!url.pathname.startsWith(AUDIO_PATH_PREFIX)) {
		return;
	}

	event.respondWith(handleAudioRequest(request));
});

async function handleAudioRequest(request) {
	const cache = await caches.open(AUDIO_CACHE);
	const rangeHeader = request.headers.get('range');
	const cachedResponse = await cache.match(request.url);

	if (rangeHeader && cachedResponse) {
		const rangeResponse = await buildRangeResponse(rangeHeader, cachedResponse);
		if (rangeResponse) {
			return rangeResponse;
		}
	}

	if (rangeHeader && !cachedResponse) {
		return fetch(request);
	}

	if (cachedResponse) {
		return cachedResponse;
	}

	const response = await fetch(request);
	if (response?.ok) {
		cache.put(request.url, response.clone());
	}
	return response;
}

async function buildRangeResponse(rangeHeader, response) {
	const buffer = await response.arrayBuffer();
	const total = buffer.byteLength;

	const range = parseRange(rangeHeader, total);
	if (!range) {
		return new Response(null, {
			status: 416,
			headers: { 'Content-Range': `bytes */${total}` },
		});
	}

	const { start, end } = range;
	const sliced = buffer.slice(start, end + 1);
	const contentType = response.headers.get('Content-Type') || 'audio/mpeg';

	return new Response(sliced, {
		status: 206,
		statusText: 'Partial Content',
		headers: {
			'Content-Range': `bytes ${start}-${end}/${total}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': String(sliced.byteLength),
			'Content-Type': contentType,
		},
	});
}

function parseRange(rangeHeader, total) {
	const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
	if (!match) {
		return null;
	}

	const start = Number.parseInt(match[1], 10);
	const end = match[2] ? Number.parseInt(match[2], 10) : total - 1;

	if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end >= total) {
		return null;
	}

	return { start, end };
}
