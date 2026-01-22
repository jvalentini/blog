import type { Track } from './types';

const AUDIO_CACHE = 'waves-audio-v1';
const DOWNLOADS_STORAGE_KEY = 'waves-audio-downloads';
const DOWNLOAD_VERSION = 1;
const DEFAULT_CONCURRENCY = 2;

interface StoredDownloads {
	version: number;
	playlists: Record<string, { urls: string[]; completedAt: string }>;
}

export interface DownloadProgress {
	playlistId: string;
	completed: number;
	total: number;
}

export class DownloadManager {
	private tracks: Track[];
	private storageAvailable: boolean;
	private isDownloading: boolean = false;
	private supported: boolean;

	constructor(tracks: Track[]) {
		this.tracks = tracks;
		this.storageAvailable = this.checkStorageAvailable();
		this.supported =
			typeof window !== 'undefined' &&
			typeof navigator !== 'undefined' &&
			'caches' in window &&
			'serviceWorker' in navigator;
	}

	private checkStorageAvailable(): boolean {
		try {
			const test = '__download_storage_test__';
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch {
			return false;
		}
	}

	private loadStoredDownloads(): StoredDownloads {
		if (!this.storageAvailable) {
			return { version: DOWNLOAD_VERSION, playlists: {} };
		}

		try {
			const stored = localStorage.getItem(DOWNLOADS_STORAGE_KEY);
			if (!stored) {
				return { version: DOWNLOAD_VERSION, playlists: {} };
			}
			const parsed = JSON.parse(stored) as StoredDownloads;
			if (!parsed || parsed.version !== DOWNLOAD_VERSION) {
				return { version: DOWNLOAD_VERSION, playlists: {} };
			}
			return parsed;
		} catch {
			return { version: DOWNLOAD_VERSION, playlists: {} };
		}
	}

	private saveStoredDownloads(data: StoredDownloads): void {
		if (!this.storageAvailable) {
			return;
		}

		try {
			localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(data));
		} catch {}
	}

	private getPlaylistUrls(playlistId: string): string[] {
		const urls = new Set<string>();
		this.tracks
			.filter((track) => track.playlist === playlistId)
			.forEach((track) => {
				Object.values(track.versions || {}).forEach((url) => {
					if (url) {
						urls.add(url);
					}
				});
			});
		return Array.from(urls);
	}

	isSupported(): boolean {
		return this.supported;
	}

	isPlaylistDownloaded(playlistId: string): boolean {
		const stored = this.loadStoredDownloads();
		return Boolean(stored.playlists[playlistId]);
	}

	async init(): Promise<void> {
		if (!this.supported) {
			return;
		}

		try {
			await navigator.serviceWorker.register('/sw.js');
			await navigator.serviceWorker.ready;
		} catch (error) {
			console.warn('[DownloadManager] Failed to register service worker:', error);
			this.supported = false;
		}

		if ('storage' in navigator && 'persist' in navigator.storage) {
			try {
				await navigator.storage.persist();
			} catch {
				// Persistence is best-effort; ignore errors.
			}
		}
	}

	async downloadPlaylist(playlistId: string, onProgress?: (progress: DownloadProgress) => void): Promise<boolean> {
		if (!this.supported || this.isDownloading) {
			return false;
		}

		const urls = this.getPlaylistUrls(playlistId);
		if (urls.length === 0) {
			return false;
		}

		this.isDownloading = true;

		try {
			const cache = await caches.open(AUDIO_CACHE);
			const queue = [...urls];
			let completed = 0;
			const total = queue.length;

			const updateProgress = (): void => {
				onProgress?.({ playlistId, completed, total });
			};

			updateProgress();

			const worker = async (): Promise<void> => {
				while (queue.length > 0) {
					const url = queue.shift();
					if (!url) return;

					const cached = await cache.match(url);
					if (!cached) {
						const response = await fetch(url, { cache: 'no-cache' });
						if (response.ok) {
							await cache.put(url, response.clone());
						}
					}

					completed += 1;
					updateProgress();
				}
			};

			const workers = Array.from({ length: DEFAULT_CONCURRENCY }, () => worker());
			await Promise.all(workers);

			const stored = this.loadStoredDownloads();
			stored.playlists[playlistId] = {
				urls,
				completedAt: new Date().toISOString(),
			};
			this.saveStoredDownloads(stored);
			return true;
		} catch (error) {
			console.warn('[DownloadManager] Download failed:', error);
			return false;
		} finally {
			this.isDownloading = false;
		}
	}

	async removePlaylist(playlistId: string): Promise<boolean> {
		if (!this.supported || this.isDownloading) {
			return false;
		}

		try {
			const cache = await caches.open(AUDIO_CACHE);
			const stored = this.loadStoredDownloads();
			const storedEntry = stored.playlists[playlistId];
			const urls = storedEntry?.urls?.length ? storedEntry.urls : this.getPlaylistUrls(playlistId);

			await Promise.all(urls.map((url) => cache.delete(url)));

			if (stored.playlists[playlistId]) {
				delete stored.playlists[playlistId];
				this.saveStoredDownloads(stored);
			}

			return true;
		} catch (error) {
			console.warn('[DownloadManager] Remove failed:', error);
			return false;
		}
	}

	async logSourceUsage(url: string): Promise<void> {
		if (!url) {
			return;
		}

		if (!this.supported) {
			console.info('[DownloadManager] Streaming audio:', url);
			return;
		}

		try {
			const cache = await caches.open(AUDIO_CACHE);
			const cached = await cache.match(url);
			if (cached) {
				console.info('[DownloadManager] Using cached audio:', { cache: AUDIO_CACHE, url });
			} else {
				console.info('[DownloadManager] Streaming audio:', url);
			}
		} catch (error) {
			console.warn('[DownloadManager] Cache lookup failed, streaming:', error);
		}
	}
}
