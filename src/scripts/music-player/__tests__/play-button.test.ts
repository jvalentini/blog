import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAudioController } from '../audio-controller';
import { QueueManager, type TrackLoadCallback } from '../queue-manager';
import type { Track } from '../types';

describe('Play Button Functionality', () => {
	describe('AudioController', () => {
		let audioController: ReturnType<typeof createAudioController>;
		let mockAudio: Partial<HTMLAudioElement>;
		let playMock: ReturnType<typeof vi.fn<() => Promise<void>>>;

		beforeEach(() => {
			playMock = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
			mockAudio = {
				play: playMock,
				pause: vi.fn(),
				paused: true,
				ended: false,
				currentTime: 0,
				duration: 180,
				volume: 1,
				src: '',
				load: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			};

			audioController = createAudioController();
			audioController.init(mockAudio as HTMLAudioElement);
		});

		afterEach(() => {
			audioController.destroy();
		});

		it('should call audio.play() when togglePlayPause is called while paused', async () => {
			await audioController.togglePlayPause();
			expect(mockAudio.play).toHaveBeenCalled();
		});

		it('should call audio.pause() when togglePlayPause is called while playing', async () => {
			Object.defineProperty(mockAudio, 'paused', {
				value: false,
				writable: true,
			});
			await audioController.togglePlayPause();
			expect(mockAudio.pause).toHaveBeenCalled();
		});

		it('should return playing state correctly', () => {
			expect(audioController.isPlaying()).toBe(false);
			Object.defineProperty(mockAudio, 'paused', {
				value: false,
				writable: true,
			});
			expect(audioController.isPlaying()).toBe(true);
		});

		it('should set audio src correctly', () => {
			const testSrc = '/audio/test.mp3';
			audioController.setSrc(testSrc);
			expect(mockAudio.src).toBe(testSrc);
		});

		it('should call load on audio element', () => {
			audioController.load();
			expect(mockAudio.load).toHaveBeenCalled();
		});

		it('should handle play() promise rejection gracefully', async () => {
			const playError = new Error('Autoplay blocked');
			playMock.mockRejectedValueOnce(playError);

			await expect(audioController.play()).rejects.toThrow('Autoplay blocked');
		});

		it('should get and set volume correctly', () => {
			audioController.setVolume(5);
			expect(audioController.getVolume()).toBe(5);

			audioController.setVolume(10);
			expect(audioController.getVolume()).toBe(10);

			audioController.setVolume(0);
			expect(audioController.getVolume()).toBe(0);
		});

		it('should clamp volume to valid range', () => {
			audioController.setVolume(15);
			expect(audioController.getVolume()).toBe(10);

			audioController.setVolume(-5);
			expect(audioController.getVolume()).toBe(0);
		});

		it('should get current time and duration', () => {
			Object.defineProperty(mockAudio, 'currentTime', {
				value: 45,
				writable: true,
			});
			Object.defineProperty(mockAudio, 'duration', {
				value: 180,
				writable: true,
			});

			expect(audioController.getCurrentTime()).toBe(45);
			expect(audioController.getDuration()).toBe(180);
		});

		it('should seek to specific time', () => {
			Object.defineProperty(mockAudio, 'duration', {
				value: 180,
				writable: true,
			});

			audioController.seek(90);
			expect(mockAudio.currentTime).toBe(90);
		});

		it('should seek by percentage', () => {
			Object.defineProperty(mockAudio, 'duration', {
				value: 100,
				writable: true,
			});

			audioController.seekPercent(50);
			expect(mockAudio.currentTime).toBe(50);
		});
	});

	describe('QueueManager', () => {
		let queueManager: QueueManager;
		let onTrackLoad: ReturnType<typeof vi.fn<TrackLoadCallback>>;

		const mockTracks: Track[] = [
			{
				id: 1,
				songId: 'song-1',
				title: 'Track 1',
				playlist: 'ai',
				lyrics: {},
				versions: { 'hip-hop': '/audio/1.mp3' },
			},
			{
				id: 2,
				songId: 'song-2',
				title: 'Track 2',
				playlist: 'ai',
				lyrics: {},
				versions: { 'hip-hop': '/audio/2.mp3' },
			},
			{
				id: 3,
				songId: 'song-3',
				title: 'Track 3',
				playlist: 'scott-adams',
				lyrics: {},
				versions: { 'hip-hop': '/audio/3.mp3' },
			},
		];

		beforeEach(() => {
			onTrackLoad = vi.fn<TrackLoadCallback>();
			queueManager = new QueueManager(mockTracks, 'hip-hop', 'ai', { onTrackLoad });
		});

		it('should load track and call callback with autoplay=true', () => {
			const result = queueManager.loadTrack(0, true);
			expect(result).toBe(true);
			expect(onTrackLoad).toHaveBeenCalledWith(0, true);
		});

		it('should load track and call callback with autoplay=false', () => {
			const result = queueManager.loadTrack(0, false);
			expect(result).toBe(true);
			expect(onTrackLoad).toHaveBeenCalledWith(0, false);
		});

		it('should return false for invalid track index', () => {
			const result = queueManager.loadTrack(99, true);
			expect(result).toBe(false);
			expect(onTrackLoad).not.toHaveBeenCalled();
		});

		it('should return true for valid track index', () => {
			const result = queueManager.loadTrack(0, true);
			expect(result).toBe(true);
		});

		it('should get current track correctly', () => {
			queueManager.loadTrack(0, false);
			const track = queueManager.getCurrentTrack();
			expect(track).toEqual(mockTracks[0]);
		});

		it('should get track source correctly', () => {
			const src = queueManager.getTrackSrc(0, 'hip-hop');
			expect(src).toBe('/audio/1.mp3');
		});

		it('should return null for invalid track source', () => {
			const src = queueManager.getTrackSrc(99, 'hip-hop');
			expect(src).toBeNull();
		});

		it('should filter tracks by playlist', () => {
			expect(queueManager.getTrackCount()).toBe(2);
		});

		it('should return false when no tracks match playlist filter', () => {
			const result = queueManager.loadTrack(0, true);
			expect(result).toBe(true);

			const switchResult = queueManager.switchPlaylist('nonexistent');
			expect(switchResult).toBe(false);
		});

		it('should switch playlist correctly', () => {
			expect(queueManager.getCurrentPlaylist()).toBe('ai');

			const result = queueManager.switchPlaylist('scott-adams');
			expect(result).toBe(true);
			expect(queueManager.getCurrentPlaylist()).toBe('scott-adams');
			expect(queueManager.getTrackCount()).toBe(1);
		});

		it('should reset currentIndex when switching playlist', () => {
			queueManager.loadTrack(0, false);
			expect(queueManager.getCurrentIndex()).toBe(0);

			queueManager.switchPlaylist('scott-adams');
			expect(queueManager.getCurrentIndex()).toBe(-1);
		});

		it('should get available genres for track', () => {
			const genres = queueManager.getAvailableGenresForTrack(0);
			expect(genres).toContain('hip-hop');
		});

		it('should get current genre', () => {
			expect(queueManager.getCurrentGenre()).toBe('hip-hop');
		});

		it('should switch genre', () => {
			const tracksWithMultipleGenres: Track[] = [
				{
					id: 1,
					songId: 'song-1',
					title: 'Track 1',
					playlist: 'ai',
					lyrics: {},
					versions: {
						'hip-hop': '/audio/1-hiphop.mp3',
						country: '/audio/1-country.mp3',
					},
				},
			];

			const qm = new QueueManager(tracksWithMultipleGenres, 'hip-hop', 'ai', {});
			qm.loadTrack(0, false);

			const result = qm.switchGenre('country');
			expect(result).toBe(true);
			expect(qm.getCurrentGenre()).toBe('country');
		});

		it('should play next track', () => {
			const onNext = vi.fn();
			const qm = new QueueManager(mockTracks.slice(0, 2), 'hip-hop', 'ai', {
				onTrackLoad: onNext,
			});

			qm.loadTrack(0, false);
			const result = qm.playNext();

			expect(result).toBe(true);
			expect(onNext).toHaveBeenCalledWith(1, true);
		});

		it('should not wrap to the first track when repeat is off and at the end', () => {
			const onNext = vi.fn<TrackLoadCallback>();
			const qm = new QueueManager(mockTracks.slice(0, 2), 'hip-hop', 'ai', {
				onTrackLoad: onNext,
			});

			qm.loadTrack(1, false);
			onNext.mockClear();
			const result = qm.playNext();

			expect(result).toBe(false);
			expect(onNext).not.toHaveBeenCalled();
			expect(qm.getCurrentIndex()).toBe(1);
		});

		it('should play previous track', () => {
			const onPrev = vi.fn();
			const qm = new QueueManager(mockTracks.slice(0, 2), 'hip-hop', 'ai', {
				onTrackLoad: onPrev,
			});

			qm.loadTrack(1, false);
			const result = qm.playPrevious();

			expect(result).toBe(true);
			expect(onPrev).toHaveBeenCalledWith(0, true);
		});

		it('should not wrap to the last track when repeat is off and at the start', () => {
			const onPrev = vi.fn<TrackLoadCallback>();
			const qm = new QueueManager(mockTracks.slice(0, 2), 'hip-hop', 'ai', {
				onTrackLoad: onPrev,
			});

			qm.loadTrack(0, false);
			onPrev.mockClear();
			const result = qm.playPrevious();

			expect(result).toBe(false);
			expect(onPrev).not.toHaveBeenCalled();
			expect(qm.getCurrentIndex()).toBe(0);
		});

		it('should handle repeat mode correctly', () => {
			const repeatMode = queueManager.toggleRepeat();
			expect(repeatMode).toBe('all');

			const repeatMode2 = queueManager.toggleRepeat();
			expect(repeatMode2).toBe('one');

			const repeatMode3 = queueManager.toggleRepeat();
			expect(repeatMode3).toBe('off');
		});

		it('should handle shuffle mode correctly', () => {
			const shuffleMode = queueManager.toggleShuffle();
			expect(shuffleMode).toBe('tracks');

			const shuffleMode2 = queueManager.toggleShuffle();
			expect(shuffleMode2).toBe('tracks+genres');

			const shuffleMode3 = queueManager.toggleShuffle();
			expect(shuffleMode3).toBe('off');
		});

		it('should not repeat track-genre pairs in tracks+genres shuffle until exhausted', () => {
			const testTracks: Track[] = [
				{
					id: 1,
					songId: 'song-1',
					title: 'Track 1',
					playlist: 'ai',
					lyrics: {},
					versions: { 'hip-hop': '/audio/1.mp3', rock: '/audio/1-rock.mp3' },
				},
				{
					id: 2,
					songId: 'song-2',
					title: 'Track 2',
					playlist: 'ai',
					lyrics: {},
					versions: { 'hip-hop': '/audio/2.mp3' },
				},
			];

			const totalPairs = Object.values(testTracks)
				.map((track) => Object.keys(track.versions).length)
				.reduce((sum, count) => sum + count, 0);

			const seenPairs = new Set<string>();
			const shuffleQueue = new QueueManager(testTracks, 'hip-hop', 'ai', {
				onTrackLoad: (index) => {
					const genre = shuffleQueue.getGenreForTrack(index) ?? shuffleQueue.getCurrentGenre();
					seenPairs.add(`${index}:${genre}`);
				},
			});

			shuffleQueue.setShuffleMode('tracks+genres');

			let safety = 0;
			while (shuffleQueue.playNext()) {
				safety += 1;
				if (safety > totalPairs + 2) {
					break;
				}
			}

			expect(seenPairs.size).toBe(totalPairs);
		});
	});

	describe('Play Button Bug Fix - Playlist Field', () => {
		it('should fail to load tracks without playlist field', () => {
			const tracksWithoutPlaylist = [
				{
					id: 1,
					songId: 'song-1',
					title: 'Track 1',
					lyrics: {},
					versions: { 'hip-hop': '/audio/1.mp3' },
				},
			] satisfies Array<Omit<Track, 'playlist'>>;

			const onTrackLoad = vi.fn<TrackLoadCallback>();
			const qm = new QueueManager(tracksWithoutPlaylist as unknown as Track[], 'hip-hop', 'ai', { onTrackLoad });

			const result = qm.loadTrack(0, true);
			expect(result).toBe(false);
			expect(onTrackLoad).not.toHaveBeenCalled();
		});

		it('should successfully load tracks WITH playlist field', () => {
			const tracksWithPlaylist: Track[] = [
				{
					id: 1,
					songId: 'song-1',
					title: 'Track 1',
					playlist: 'ai',
					lyrics: {},
					versions: { 'hip-hop': '/audio/1.mp3' },
				},
			];

			const onTrackLoad = vi.fn<TrackLoadCallback>();
			const qm = new QueueManager(tracksWithPlaylist, 'hip-hop', 'ai', { onTrackLoad });

			const result = qm.loadTrack(0, true);
			expect(result).toBe(true);
			expect(onTrackLoad).toHaveBeenCalledWith(0, true);
		});

		it('should filter tracks correctly by playlist field', () => {
			const mixedTracks: Track[] = [
				{
					id: 1,
					songId: 'song-1',
					title: 'Track 1',
					playlist: 'ai',
					lyrics: {},
					versions: { 'hip-hop': '/audio/1.mp3' },
				},
				{
					id: 2,
					songId: 'song-2',
					title: 'Track 2',
					playlist: 'scott-adams',
					lyrics: {},
					versions: { 'hip-hop': '/audio/2.mp3' },
				},
				{
					id: 3,
					songId: 'song-3',
					title: 'Track 3',
					playlist: 'ai',
					lyrics: {},
					versions: { 'hip-hop': '/audio/3.mp3' },
				},
			];

			const qm = new QueueManager(mixedTracks, 'hip-hop', 'ai', {});

			expect(qm.getTrackCount()).toBe(2);
			expect(qm.getTrack(0)?.title).toBe('Track 1');
			expect(qm.getTrack(1)?.title).toBe('Track 3');
			expect(qm.getTrack(2)).toBeNull();
		});
	});

	describe('Integration - Play Button Flow', () => {
		it('should complete full play button flow: load track -> toggle play', async () => {
			const mockAudio = {
				play: vi.fn().mockResolvedValue(undefined),
				pause: vi.fn(),
				paused: true,
				ended: false,
				currentTime: 0,
				duration: 180,
				volume: 1,
				src: '',
				load: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			};

			const audioController = createAudioController();
			audioController.init(mockAudio as unknown as HTMLAudioElement);

			const tracks: Track[] = [
				{
					id: 1,
					songId: 'song-1',
					title: 'Track 1',
					playlist: 'ai',
					lyrics: {},
					versions: { 'hip-hop': '/audio/1.mp3' },
				},
			];

			let loadedTrackIndex = -1;
			let shouldAutoplay = false;

			const queueManager = new QueueManager(tracks, 'hip-hop', 'ai', {
				onTrackLoad: (index, autoplay) => {
					loadedTrackIndex = index;
					shouldAutoplay = autoplay;
					const src = queueManager.getTrackSrc(index);
					if (src) {
						audioController.setSrc(src);
						audioController.load();
					}
					if (autoplay) {
						audioController.play();
					}
				},
			});

			if (loadedTrackIndex < 0) {
				queueManager.loadTrack(0, true);
			}

			expect(loadedTrackIndex).toBe(0);
			expect(shouldAutoplay).toBe(true);
			expect(mockAudio.src).toBe('/audio/1.mp3');
			expect(mockAudio.load).toHaveBeenCalled();
			expect(mockAudio.play).toHaveBeenCalled();

			Object.defineProperty(mockAudio, 'paused', {
				value: false,
				writable: true,
			});
			await audioController.togglePlayPause();
			expect(mockAudio.pause).toHaveBeenCalled();

			audioController.destroy();
		});
	});
});
