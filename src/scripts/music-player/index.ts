import { createAudioController } from './audio-controller';
import { DownloadManager } from './download-manager';
import { KeyboardShortcutsManager } from './keyboard-shortcuts';
import { LyricsSyncManager } from './lyrics-sync';
import { MediaSessionManager } from './media-session-manager';
import { PlaylistState } from './playlist-state';
import { QueueManager } from './queue-manager';
import { createPlayerState, type Genre } from './state';
import { PlayerStorage } from './storage';
import type { MusicPlayerAPI, MusicPlayerState, ParsedLyrics, Playlist, RepeatMode, ShuffleMode, Track } from './types';

export interface MusicPlayerConfig {
	tracks: Track[];
	lyricsData: Record<string, Record<string, ParsedLyrics>>;
	defaultGenre: Genre;
	defaultPlaylist: string;
	playlists: Record<string, Playlist>;
	genres: string[];
	genreColors: Record<string, { base: string; bright: string; dim: string }>;
}

interface DOMElements {
	audio: HTMLAudioElement;
	btnPlay: HTMLButtonElement;
	btnNext: HTMLButtonElement;
	btnPrevious: HTMLButtonElement;
	btnShuffle: HTMLButtonElement;
	btnRepeat: HTMLButtonElement;
	btnDownload: HTMLButtonElement | null;
	progressSlider: HTMLInputElement;
	volumeSlider: HTMLInputElement | null;
	currentTime: HTMLElement;
	durationTime: HTMLElement;
	progressCurrent: HTMLElement;
	progressDuration: HTMLElement;
	currentTrackTitle: HTMLElement;
	volumePercent: HTMLElement;
	volumeBlocks: NodeListOf<HTMLElement>;
	queueItems: NodeListOf<HTMLElement>;
	queueTitle: HTMLElement;
	playlistToggle: HTMLElement | null;
	genreToggle: HTMLElement;
	genreIcon: HTMLElement;
	hotkeysModal: HTMLElement;
	playIcon: HTMLElement;
	pauseIcon: HTMLElement;
	lyricsFullscreenBtn: HTMLButtonElement | null;
	lyricsFullscreenOverlay: HTMLElement | null;
	lyricsFullscreenClose: HTMLButtonElement | null;
	lyricsFullscreenTrack: HTMLElement | null;
	lyricsFullscreenContent: HTMLElement | null;
	lyricsContent: HTMLElement | null;
	downloadStatusLabel: HTMLElement | null;
}

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds)) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light'): void {
	if (!navigator.vibrate) return;
	const durations = { light: 10, medium: 20, heavy: 30 };
	navigator.vibrate(durations[style]);
}

function getElements(): DOMElements | null {
	const audio = document.getElementById('audio-player') as HTMLAudioElement | null;
	const btnPlay = document.getElementById('btn-play') as HTMLButtonElement | null;
	const btnNext = document.getElementById('btn-next') as HTMLButtonElement | null;
	const btnPrevious = document.getElementById('btn-previous') as HTMLButtonElement | null;
	const btnShuffle = document.getElementById('btn-shuffle') as HTMLButtonElement | null;
	const btnRepeat = document.getElementById('btn-repeat') as HTMLButtonElement | null;
	const btnDownload = document.getElementById('btn-download') as HTMLButtonElement | null;
	const progressSlider = document.getElementById('progress-slider') as HTMLInputElement | null;
	const currentTime = document.getElementById('current-time');
	const durationTime = document.getElementById('duration-time');
	const progressCurrent = document.getElementById('progress-current');
	const progressDuration = document.getElementById('progress-duration');
	const currentTrackTitle = document.getElementById('current-track-title');
	const volumePercent = document.getElementById('volume-percent');
	const queueTitle = document.getElementById('queue-title');
	const playlistToggle = document.querySelector('.playlist-toggle') as HTMLElement | null;
	const genreToggle = document.getElementById('genre-toggle');
	const genreIcon = document.getElementById('genre-icon');
	const hotkeysModal = document.getElementById('hotkeys-modal');
	const volumeBlocks = document.querySelectorAll('.volume-block') as NodeListOf<HTMLElement>;
	const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement | null;
	const queueItems = document.querySelectorAll('.queue-item') as NodeListOf<HTMLElement>;
	const lyricsFullscreenBtn = document.getElementById('lyrics-fullscreen-btn') as HTMLButtonElement | null;
	const lyricsFullscreenOverlay = document.getElementById('lyrics-fullscreen-overlay');
	const lyricsFullscreenClose = document.getElementById('lyrics-fullscreen-close') as HTMLButtonElement | null;
	const lyricsFullscreenTrack = document.getElementById('lyrics-fullscreen-track');
	const lyricsFullscreenContent = document.getElementById('lyrics-fullscreen-content');
	const lyricsContent = document.getElementById('lyrics-content');
	const downloadStatusLabel = document.getElementById('download-status-label');

	if (!audio || !btnPlay) {
		console.warn('[MusicPlayer] Required DOM elements not found');
		return null;
	}

	const playIcon = btnPlay.querySelector('.play-icon') as HTMLElement | null;
	const pauseIcon = btnPlay.querySelector('.pause-icon') as HTMLElement | null;

	if (
		!btnNext ||
		!btnPrevious ||
		!btnShuffle ||
		!btnRepeat ||
		!progressSlider ||
		!currentTime ||
		!durationTime ||
		!progressCurrent ||
		!progressDuration ||
		!currentTrackTitle ||
		!volumePercent ||
		!queueTitle ||
		!genreToggle ||
		!genreIcon ||
		!hotkeysModal ||
		!playIcon ||
		!pauseIcon
	) {
		console.warn('[MusicPlayer] Some DOM elements are missing');
		return null;
	}

	return {
		audio,
		btnPlay,
		btnNext,
		btnPrevious,
		btnShuffle,
		btnRepeat,
		btnDownload,
		progressSlider,
		volumeSlider,
		currentTime,
		durationTime,
		progressCurrent,
		progressDuration,
		currentTrackTitle,
		volumePercent,
		volumeBlocks,
		queueItems,
		queueTitle,
		playlistToggle,
		genreToggle,
		genreIcon,
		hotkeysModal,
		playIcon,
		pauseIcon,
		lyricsFullscreenBtn,
		lyricsFullscreenOverlay,
		lyricsFullscreenClose,
		lyricsFullscreenTrack,
		lyricsFullscreenContent,
		lyricsContent,
		downloadStatusLabel,
	};
}

// Icon mapping for genres
const genreIcons: Record<string, string> = {
	'hip-hop': 'turntable',
	country: 'cowboy-hat',
	rock: 'guitar',
	weird: 'spiral',
	pop: 'microphone',
	bluegrass: 'banjo',
};

export function initMusicPlayer(config: MusicPlayerConfig): MusicPlayerAPI | null {
	const elements = getElements();
	if (!elements) return null;

	const { tracks, lyricsData, defaultGenre, defaultPlaylist, playlists, genres, genreColors } = config;

	const storage = new PlayerStorage();
	const savedSettings = storage.load();

	const initialGenre = (savedSettings.currentGenre as Genre) || defaultGenre;
	const initialPlaylist = savedSettings.currentPlaylist || defaultPlaylist;
	const initialVolume = savedSettings.volume ?? 0.7;

	const state = createPlayerState({
		currentGenre: initialGenre,
		volume: initialVolume,
	});

	const audioController = createAudioController();

	const loadTrackAtIndex = (index: number, autoplay: boolean): void => {
		const track = queueManager.getTrack(index);
		if (!track) return;

		const item = elements.queueItems[index];
		if (!item) return;

		const title = track.title;
		const songId = track.songId;

		// Mark that we're changing tracks - this ensures we start at 0:00
		isTrackChange = true;
		// Clear any pending seek time when loading a new track
		pendingSeekTime = null;

		state.set('currentIndex', index);
		elements.currentTrackTitle.textContent = title;

		Array.from(elements.queueItems).forEach((el) => {
			el.classList.remove('active');
		});
		const activeItem = elements.queueItems[index];
		if (activeItem) {
			activeItem.classList.add('active');
		}

		const newURL = `/waves/${songId}`;
		if (window.location.pathname !== newURL) {
			window.history.pushState({ songId }, '', newURL);
		}

		storage.save({ currentTrackId: songId });

		// Check if we're in tracks+genres shuffle mode and get the assigned genre
		const shuffleMode = queueManager.getShuffleMode();
		let genreToUse: Genre;

		if (shuffleMode === 'tracks+genres') {
			// Get the pre-assigned genre for this track from shuffle
			const assignedGenre = queueManager.getGenreForTrack(index);
			if (assignedGenre) {
				genreToUse = assignedGenre as Genre;
				state.set('currentGenre', genreToUse);
				queueManager.switchGenre(genreToUse);
				updateGenreUI(genreToUse);
			} else {
				// Fallback to current genre logic
				const currentGenre = state.get('currentGenre');
				const availableGenres = queueManager.getAvailableGenresForCurrentTrack();
				genreToUse = availableGenres.includes(currentGenre)
					? currentGenre
					: ((availableGenres[0] || currentGenre) as Genre);
				if (genreToUse !== currentGenre) {
					state.set('currentGenre', genreToUse);
					queueManager.switchGenre(genreToUse);
				}
				updateGenreUI(genreToUse);
			}
		} else {
			// Normal genre selection logic
			const currentGenre = state.get('currentGenre');
			const availableGenres = queueManager.getAvailableGenresForCurrentTrack();

			// If current genre is not available for this track, switch to first available
			if (!availableGenres.includes(currentGenre) && availableGenres.length > 0) {
				genreToUse = availableGenres[0] as Genre;
				state.set('currentGenre', genreToUse);
				queueManager.switchGenre(genreToUse);
				updateGenreUI(genreToUse);
			} else {
				genreToUse = currentGenre;
				updateGenreUI(currentGenre);
			}
		}

		// Now get the source with the correct genre and set it
		const src = queueManager.getTrackSrc(index, genreToUse);
		const hasSrc = Boolean(src);
		if (src) {
			audioController.setSrc(src);
			audioController.load();
		} else {
			console.warn('[MusicPlayer] Missing audio source for track', track);
			audioController.pause();
			audioController.setSrc('');
			audioController.load();
			state.set('isPlaying', false);
			showPlayIcon();
			mediaSessionManager.clearPositionState();
		}

		loadLyricsForTrack(index);

		if (
			elements.lyricsFullscreenOverlay?.classList.contains('visible') &&
			elements.lyricsFullscreenContent &&
			elements.lyricsContent
		) {
			elements.lyricsFullscreenContent.innerHTML = elements.lyricsContent.innerHTML;
			if (elements.lyricsFullscreenTrack) {
				elements.lyricsFullscreenTrack.textContent = title;
			}
		}

		// Update media session metadata
		updateMediaSessionMetadata();
		updateMediaSessionActionAvailability();

		if (autoplay && hasSrc) {
			audioController.play().then(() => {
				state.set('isPlaying', true);
			});
		}
	};

	const loadLyricsForTrack = (index: number): void => {
		const track = queueManager.getTrack(index);
		if (!track) {
			lyricsSync.clearLyrics();
			return;
		}

		const trackLyrics = lyricsData[track.title];
		if (!trackLyrics) {
			lyricsSync.clearLyrics();
			return;
		}

		const currentGenre = state.get('currentGenre');
		const lyricsObj = trackLyrics[currentGenre] || trackLyrics[defaultGenre] || Object.values(trackLyrics)[0];

		if (lyricsObj) {
			lyricsSync.loadLyrics(lyricsObj);
			const convertedLines = (lyricsObj.lines || []).map((line) => ({
				time: line.time ?? undefined,
				text: line.text,
			}));
			state.setState({
				currentLyricsLines: convertedLines,
				currentLyricsHasTimestamps: lyricsObj.hasTimestamps || false,
				activeLineIndex: -1,
			});
		} else {
			lyricsSync.clearLyrics();
		}
	};

	const updateGenreUI = (genre: Genre): void => {
		const currentIndex = state.get('currentIndex');
		const availableGenres = currentIndex >= 0 ? queueManager.getAvailableGenresForCurrentTrack() : genres;

		// Update all genre buttons
		const genreButtons = elements.genreToggle.querySelectorAll('.genre-btn');
		genreButtons.forEach((btn) => {
			const btnGenre = btn.getAttribute('data-genre');
			const isAvailable = availableGenres.includes(btnGenre || '');
			const isActive = btnGenre === genre;

			btn.classList.toggle('active', isActive);
			btn.classList.toggle('disabled', !isAvailable);
			(btn as HTMLButtonElement).disabled = !isAvailable;

			// Add tooltip for disabled buttons
			if (!isAvailable) {
				const availableCount = availableGenres.length;
				btn.setAttribute(
					'title',
					`This song only has ${availableCount} version${availableCount !== 1 ? 's' : ''} available`,
				);
			} else {
				btn.removeAttribute('title');
			}
		});

		// Update icon based on genre
		const iconType = genreIcons[genre] || 'generic';
		const iconElement = elements.genreIcon;
		if (iconElement) {
			iconElement.setAttribute('data-icon', iconType);
			// Show the correct icon, hide others
			const allIcons = iconElement.querySelectorAll('.genre-icon-svg');
			allIcons.forEach((icon) => {
				const iconTypeAttr = icon.getAttribute('data-icon-type');
				if (iconTypeAttr === iconType) {
					(icon as HTMLElement).style.display = 'block';
				} else {
					(icon as HTMLElement).style.display = 'none';
				}
			});
		}

		// Apply genre colors via CSS variables
		const colors = genreColors[genre];
		if (colors) {
			const musicPlayer = document.querySelector('.music-player') as HTMLElement;
			if (musicPlayer) {
				musicPlayer.style.setProperty('--genre-base', colors.base);
				musicPlayer.style.setProperty('--genre-bright', colors.bright);
				musicPlayer.style.setProperty('--genre-dim', colors.dim);
			}
		}
	};

	const updateQueueListTheme = (genre: Genre): void => {
		// Apply genre colors to queue list
		const colors = genreColors[genre];
		if (colors) {
			const queueList = document.getElementById('queue-list');
			const queueTitle = document.getElementById('queue-title');
			if (queueList) {
				queueList.style.setProperty('--genre-base', colors.base);
				queueList.style.setProperty('--genre-bright', colors.bright);
				queueList.style.setProperty('--genre-dim', colors.dim);
			}
			if (queueTitle) {
				queueTitle.style.setProperty('--genre-base', colors.base);
				queueTitle.style.setProperty('--genre-bright', colors.bright);
			}
		}
	};

	const updateQueueGenreBadges = (genre: Genre): void => {
		elements.queueItems.forEach((item) => {
			const badge = item.querySelector('.queue-item-genre-badge') as HTMLElement | null;
			if (badge) {
				badge.textContent = genre;
			}
		});
	};

	const updateShuffleUI = (mode: string): void => {
		const shuffleOff = elements.btnShuffle.querySelector('.shuffle-off') as HTMLElement | null;
		const shuffleTracks = elements.btnShuffle.querySelector('.shuffle-tracks') as HTMLElement | null;
		const shuffleTracksGenres = elements.btnShuffle.querySelector('.shuffle-tracks-genres') as HTMLElement | null;
		const shuffleWrapper = elements.btnShuffle.closest('.shuffle-control-wrapper') as HTMLElement | null;
		const shuffleLabel = shuffleWrapper?.querySelector('.shuffle-mode-label') as HTMLElement | null;

		elements.btnShuffle.classList.toggle('active', mode !== 'off');
		// Add/remove class to distinguish tracks+genres mode
		elements.btnShuffle.classList.toggle('shuffle-tracks-genres', mode === 'tracks+genres');

		if (shuffleOff) shuffleOff.style.display = mode === 'off' ? 'block' : 'none';
		if (shuffleTracks) shuffleTracks.style.display = mode === 'tracks' ? 'block' : 'none';
		if (shuffleTracksGenres) shuffleTracksGenres.style.display = mode === 'tracks+genres' ? 'block' : 'none';

		// Update label text above button
		const labels: Record<string, string> = {
			off: 'None',
			tracks: 'Song',
			'tracks+genres': 'Genre',
		};
		if (shuffleLabel) {
			shuffleLabel.textContent = labels[mode] || 'None';
		}
		if (shuffleWrapper) {
			// Always show the label, but style it differently when off
			shuffleWrapper.classList.toggle('has-mode', mode !== 'off');
			shuffleWrapper.classList.toggle('shuffle-off', mode === 'off');
		}

		// Update tooltip
		const tooltips: Record<string, string> = {
			off: 'Shuffle: Off (S)',
			tracks: 'Shuffle: Tracks (S)',
			'tracks+genres': 'Shuffle: Tracks + Genres (S)',
		};
		elements.btnShuffle.setAttribute('title', tooltips[mode] || 'Shuffle (S)');
	};

	const updateRepeatUI = (mode: string): void => {
		const repeatOff = elements.btnRepeat.querySelector('.repeat-off') as HTMLElement | null;
		const repeatAll = elements.btnRepeat.querySelector('.repeat-all') as HTMLElement | null;
		const repeatOne = elements.btnRepeat.querySelector('.repeat-one') as HTMLElement | null;
		const repeatWrapper = elements.btnRepeat.closest('.repeat-control-wrapper') as HTMLElement | null;
		const repeatLabel = repeatWrapper?.querySelector('.repeat-mode-label') as HTMLElement | null;

		elements.btnRepeat.classList.toggle('active', mode !== 'off');
		// Add/remove class to distinguish repeat-one mode
		elements.btnRepeat.classList.toggle('repeat-one', mode === 'one');

		if (repeatOff) repeatOff.style.display = mode === 'off' ? 'block' : 'none';
		if (repeatAll) repeatAll.style.display = mode === 'all' ? 'block' : 'none';
		if (repeatOne) repeatOne.style.display = mode === 'one' ? 'block' : 'none';

		// Update label text above button
		const labels: Record<string, string> = {
			off: 'None',
			all: 'All',
			one: 'One',
		};
		if (repeatLabel) {
			repeatLabel.textContent = labels[mode] || 'None';
		}
	};

	let pendingSeekTime: number | null = null;
	let pendingAutoplay: boolean = false;
	let isTrackChange: boolean = false;

	const queueManager = new QueueManager(tracks, initialGenre, initialPlaylist, {
		onTrackLoad: loadTrackAtIndex,
		onGenreChange: (genre: string) => {
			state.set('currentGenre', genre as Genre);
			updateGenreUI(genre as Genre);
			updateQueueListTheme(genre as Genre);
			updateQueueGenreBadges(genre as Genre);
			storage.save({ currentGenre: genre as Genre });

			const currentIndex = state.get('currentIndex');
			if (currentIndex >= 0) {
				const wasPlaying = state.get('isPlaying');
				const currentTime = audioController.getCurrentTime();
				const src = queueManager.getTrackSrc(currentIndex, genre);
				if (src) {
					// Only preserve seek time if we're not changing tracks (just changing genre)
					if (!isTrackChange) {
						pendingSeekTime = currentTime;
						pendingAutoplay = wasPlaying;
					}
					audioController.setSrc(src);
					audioController.load();
				}
				loadLyricsForTrack(currentIndex);
				// Update media session metadata when genre changes
				updateMediaSessionMetadata();
			}
		},
		onShuffleChange: (mode: ShuffleMode) => {
			state.set('shuffleMode', mode);
			updateShuffleUI(mode);
			storage.save({ shuffleMode: mode });
			// Update action availability when shuffle mode changes
			updateMediaSessionActionAvailability();
		},
		onRepeatModeChange: (mode: RepeatMode) => {
			state.set('repeatMode', mode);
			updateRepeatUI(mode);
			storage.save({ repeatMode: mode });
			// Update action availability when repeat mode changes
			updateMediaSessionActionAvailability();
		},
	});

	const lyricsSync = new LyricsSyncManager('lyrics-content');

	const mediaSessionManager = new MediaSessionManager();
	const downloadManager = new DownloadManager(tracks);
	let activeDownload: { playlistId: string; completed: number; total: number } | null = null;
	let downloadResetTimeout: ReturnType<typeof setTimeout> | null = null;

	const updateDownloadUI = (playlistId: string): void => {
		const btnDownload = elements.btnDownload;
		const downloadStatusLabel = elements.downloadStatusLabel;

		if (!btnDownload || !downloadStatusLabel) {
			return;
		}

		if (!downloadManager.isSupported()) {
			downloadStatusLabel.textContent = 'Offline unavailable';
			btnDownload.disabled = true;
			btnDownload.classList.remove('downloading', 'active');
			return;
		}

		if (activeDownload) {
			const percent = activeDownload.total ? Math.round((activeDownload.completed / activeDownload.total) * 100) : 0;
			downloadStatusLabel.textContent =
				activeDownload.playlistId === playlistId ? `Downloading ${percent}%` : 'Downloading...';
			btnDownload.disabled = true;
			btnDownload.classList.add('downloading');
			btnDownload.classList.remove('active');
			return;
		}

		btnDownload.classList.remove('downloading');
		if (downloadManager.isPlaylistDownloaded(playlistId)) {
			downloadStatusLabel.textContent = 'Downloaded';
			btnDownload.disabled = true;
			btnDownload.classList.add('active');
			return;
		}

		downloadStatusLabel.textContent = 'Download';
		btnDownload.disabled = false;
		btnDownload.classList.remove('active');
	};

	// Helper function to check if we can go to previous track
	const canGoPrevious = (): boolean => {
		const repeatMode = state.get('repeatMode');

		// Always allow if repeat mode is enabled
		if (repeatMode !== 'off') {
			return true;
		}

		// Use QueueManager's method which handles shuffle mode correctly
		return !queueManager.isAtStartOfQueue();
	};

	// Helper function to check if we can go to next track
	const canGoNext = (): boolean => {
		const repeatMode = state.get('repeatMode');

		// Always allow if repeat mode is enabled
		if (repeatMode !== 'off') {
			return true;
		}

		// Use QueueManager's method which handles shuffle mode correctly
		return !queueManager.isAtEndOfQueuePublic();
	};

	// Helper function to update media session metadata
	const updateMediaSessionMetadata = (): void => {
		const currentTrack = queueManager.getCurrentTrack();
		if (!currentTrack) {
			return;
		}

		const currentGenre = state.get('currentGenre');
		const formattedGenre = MediaSessionManager.formatGenre(currentGenre);
		// Use track ID for race condition protection
		const trackId = currentTrack.songId || currentTrack.id;
		const title = `${currentTrack.title || 'Unknown Track'} (${formattedGenre} Version)`;

		mediaSessionManager.updateMetadata(
			{
				title,
				artist: 'jvalentini',
				album: 'waves',
			},
			trackId,
		);
	};

	// Helper function to update media session action availability
	const updateMediaSessionActionAvailability = (): void => {
		const repeatMode = state.get('repeatMode');

		mediaSessionManager.updateActionAvailability({
			canGoPrevious: canGoPrevious(),
			canGoNext: canGoNext(),
			repeatMode,
		});
	};

	let previousVolume = 0.7;

	const showPlayIcon = (): void => {
		elements.playIcon.style.display = 'inline';
		elements.pauseIcon.style.display = 'none';
	};

	const showPauseIcon = (): void => {
		elements.playIcon.style.display = 'none';
		elements.pauseIcon.style.display = 'inline';
	};

	const updateTimeDisplay = (current: number, duration: number): void => {
		const currentStr = formatTime(current);
		const durationStr = formatTime(duration);

		elements.currentTime.textContent = currentStr;
		elements.progressCurrent.textContent = currentStr;
		elements.durationTime.textContent = durationStr;
		elements.progressDuration.textContent = durationStr;

		if (duration > 0) {
			elements.progressSlider.value = String((current / duration) * 100);
		}
	};

	const updateVolumeUI = (level: number): void => {
		elements.volumePercent.textContent = `${level * 10}%`;
		elements.volumeBlocks.forEach((block, idx) => {
			block.classList.toggle('active', idx < level);
		});
		if (elements.volumeSlider) {
			elements.volumeSlider.value = String(level * 10);
		}
	};

	const setVolume = (level: number): void => {
		audioController.setVolume(level);
		state.set('volume', level / 10);
		updateVolumeUI(level);
		storage.save({ volume: level / 10 });
	};

	audioController.init(elements.audio, {
		onTimeUpdate: (currentTime, duration) => {
			state.setState({ currentTime, duration });
			updateTimeDisplay(currentTime, duration);
			lyricsSync.syncLyrics(currentTime, duration);
			if (elements.lyricsFullscreenOverlay?.classList.contains('visible') && elements.lyricsContent) {
				const fullscreenLines = elements.lyricsFullscreenContent?.querySelectorAll('.lyrics-line');
				if (fullscreenLines) {
					fullscreenLines.forEach((line, idx) => {
						const originalLine = elements.lyricsContent?.children[idx];
						if (originalLine?.classList.contains('active')) {
							line.classList.add('active');
							line.scrollIntoView({ behavior: 'smooth', block: 'center' });
						} else {
							line.classList.remove('active');
						}
					});
				}
			}
			// Update media session position state
			// For streaming audio, duration might be Infinity initially
			// Always try to update position state - MediaSessionManager will handle validation
			// Only skip if duration is explicitly invalid (negative and finite)
			if (duration >= 0 || !Number.isFinite(duration)) {
				mediaSessionManager.updatePositionState({
					duration: Number.isFinite(duration) && duration > 0 ? duration : Infinity,
					playbackRate: 1,
					position: currentTime,
				});
			}
		},
		onEnded: () => {
			mediaSessionManager.clearPositionState();
			queueManager.playNext();
		},
		onLoadedMetadata: (duration) => {
			state.set('duration', duration);
			updateTimeDisplay(0, duration);

			// If we're changing tracks, always start at 0:00
			// Only use pendingSeekTime if we're just changing genre (not changing tracks)
			if (isTrackChange) {
				audioController.seek(0);
				isTrackChange = false;
			} else if (pendingSeekTime !== null && pendingSeekTime > 0 && pendingSeekTime < duration) {
				audioController.seek(pendingSeekTime);
				pendingSeekTime = null;
			}

			if (pendingAutoplay) {
				audioController.play();
				pendingAutoplay = false;
			}
		},
		onPlay: () => {
			state.set('isPlaying', true);
			showPauseIcon();
		},
		onPause: () => {
			state.set('isPlaying', false);
			showPlayIcon();
			// Don't clear position state on pause - keep it to show where user paused
		},
	});

	const initialVolumeLevel = Math.round(initialVolume * 10);
	audioController.setVolume(initialVolumeLevel);
	updateVolumeUI(initialVolumeLevel);

	const keyboardShortcuts = new KeyboardShortcutsManager({
		onPlayPause: () => {
			if (state.get('currentIndex') < 0) {
				queueManager.loadTrack(0, true);
			} else {
				audioController.togglePlayPause();
			}
		},
		onVolumeUp: () => {
			const currentLevel = audioController.getVolume();
			setVolume(Math.min(10, currentLevel + 1));
		},
		onVolumeDown: () => {
			const currentLevel = audioController.getVolume();
			setVolume(Math.max(0, currentLevel - 1));
		},
		onPrevious: () => {
			if (audioController.getCurrentTime() > 3) {
				audioController.seek(0);
			} else {
				queueManager.playPrevious();
			}
		},
		onNext: () => {
			queueManager.playNext();
		},
		onSeekBackward: () => {
			const currentTime = audioController.getCurrentTime();
			audioController.seek(Math.max(0, currentTime - 5));
			// Force immediate position state update after seek
			const duration = audioController.getDuration();
			if (duration > 0 || !Number.isFinite(duration)) {
				mediaSessionManager.clearThrottle();
				mediaSessionManager.updatePositionState({
					duration: Number.isFinite(duration) && duration > 0 ? duration : Infinity,
					playbackRate: 1,
					position: Math.max(0, currentTime - 5),
				});
			}
		},
		onSeekForward: () => {
			const currentTime = audioController.getCurrentTime();
			const duration = audioController.getDuration();
			// Allow seek even if duration is Infinity (streaming)
			const seekTime =
				Number.isFinite(duration) && duration > 0 ? Math.min(duration, currentTime + 5) : currentTime + 5;
			audioController.seek(seekTime);
			// Force immediate position state update after seek
			if (duration > 0 || !Number.isFinite(duration)) {
				mediaSessionManager.clearThrottle();
				mediaSessionManager.updatePositionState({
					duration: Number.isFinite(duration) && duration > 0 ? duration : Infinity,
					playbackRate: 1,
					position: seekTime,
				});
			}
		},
		onMuteToggle: () => {
			const currentVolume = audioController.getVolume();
			if (currentVolume > 0) {
				previousVolume = currentVolume / 10;
				setVolume(0);
			} else {
				setVolume(Math.round(previousVolume * 10) || 7);
			}
		},
		onGenreToggle: () => {
			const currentIndex = state.get('currentIndex');
			if (currentIndex < 0) return;

			const availableGenres = queueManager.getAvailableGenresForCurrentTrack();
			if (availableGenres.length <= 1) return; // Don't toggle if only one genre available

			const currentGenre = state.get('currentGenre');
			const currentAvailableIndex = availableGenres.indexOf(currentGenre);
			const nextAvailableIndex = (currentAvailableIndex + 1) % availableGenres.length;
			const newGenre = availableGenres[nextAvailableIndex];
			if (newGenre) {
				queueManager.switchGenre(newGenre);
			}
		},
		onShuffleToggle: () => {
			queueManager.toggleShuffle();
		},
		onRepeatToggle: () => {
			queueManager.toggleRepeat();
		},
		onShowHotkeys: () => {
			elements.hotkeysModal.classList.toggle('visible');
		},
		onOpenTerminal: () => {
			if (window.terminalAPI?.open) {
				window.terminalAPI.open();
			}
		},
		onCloseModals: () => {
			elements.hotkeysModal.classList.remove('visible');
			if (window.terminalAPI?.close) {
				window.terminalAPI.close();
			}
			if (elements.lyricsFullscreenOverlay?.classList.contains('visible')) {
				elements.lyricsFullscreenOverlay.classList.remove('visible');
				document.body.style.overflow = '';
			}
		},
		onPlaylistReveal: () => {
			const hiddenPlaylist = playlistsArray.find((p) => !p.visible);
			if (!hiddenPlaylist || !elements.playlistToggle) return;

			const isCurrentlyVisible = playlistState.isPlaylistVisible(hiddenPlaylist);
			playlistState.togglePlaylistVisibility(hiddenPlaylist.id);

			const btn = elements.playlistToggle.querySelector(`[data-playlist-id="${hiddenPlaylist.id}"]`);
			if (btn) {
				if (!isCurrentlyVisible) {
					btn.classList.add('revealed');
					btn.removeAttribute('data-visible');
					const indicator = document.querySelector('.playlist-reveal-indicator');
					if (indicator) {
						indicator.textContent = `${hiddenPlaylist.name} playlist revealed`;
						setTimeout(() => {
							indicator.textContent = '';
						}, 2000);
					}
				} else {
					btn.classList.remove('revealed');
					btn.setAttribute('data-visible', 'false');
				}
			}
			hapticFeedback('light');
		},
	});

	keyboardShortcuts.init();

	downloadManager
		.init()
		.then(() => {
			updateDownloadUI(queueManager.getCurrentPlaylist());
		})
		.catch(() => {
			updateDownloadUI(queueManager.getCurrentPlaylist());
		});

	// Initialize Media Session Manager
	mediaSessionManager.init({
		onPlay: async () => {
			if (state.get('currentIndex') < 0) {
				queueManager.loadTrack(0, true);
			} else {
				await audioController.play();
			}
		},
		onPause: () => {
			audioController.pause();
		},
		onPreviousTrack: () => {
			if (audioController.getCurrentTime() > 3) {
				audioController.seek(0);
			} else {
				queueManager.playPrevious();
			}
		},
		onNextTrack: () => {
			queueManager.playNext();
		},
		onSeekBackward: () => {
			const currentTime = audioController.getCurrentTime();
			const duration = audioController.getDuration();
			// Allow seek even if duration is Infinity (streaming)
			// Only block if duration is explicitly invalid (NaN or negative finite number)
			if (Number.isFinite(duration) && duration <= 0) {
				return;
			}
			const seekTime = Math.max(0, currentTime - 10);
			audioController.seek(seekTime);
			// Force immediate position state update
			mediaSessionManager.clearThrottle();
			mediaSessionManager.updatePositionState({
				duration: Number.isFinite(duration) && duration > 0 ? duration : Infinity,
				playbackRate: 1,
				position: seekTime,
			});
		},
		onSeekForward: () => {
			const currentTime = audioController.getCurrentTime();
			const duration = audioController.getDuration();
			// Allow seek even if duration is Infinity (streaming)
			// Only block if duration is explicitly invalid (NaN or negative finite number)
			if (Number.isFinite(duration) && duration <= 0) {
				return;
			}
			const seekTime =
				Number.isFinite(duration) && duration > 0 ? Math.min(duration, currentTime + 10) : currentTime + 10;
			audioController.seek(seekTime);
			// Force immediate position state update
			mediaSessionManager.clearThrottle();
			mediaSessionManager.updatePositionState({
				duration: Number.isFinite(duration) && duration > 0 ? duration : Infinity,
				playbackRate: 1,
				position: seekTime,
			});
		},
		onSeekTo: (details) => {
			if (!details || typeof details.seekTime !== 'number' || !Number.isFinite(details.seekTime)) {
				return;
			}
			const seekTime = Math.max(0, details.seekTime);

			if (details.fastSeek && typeof elements.audio.fastSeek === 'function') {
				elements.audio.fastSeek(seekTime);
			} else {
				audioController.seek(seekTime);
			}

			const duration = audioController.getDuration();
			mediaSessionManager.clearThrottle();
			mediaSessionManager.updatePositionState({
				duration: Number.isFinite(duration) && duration > 0 ? duration : Infinity,
				playbackRate: 1,
				position: seekTime,
			});
		},
	});

	elements.btnPlay.addEventListener('click', () => {
		hapticFeedback('medium');
		if (state.get('currentIndex') < 0) {
			queueManager.loadTrack(0, true);
		} else {
			audioController.togglePlayPause();
		}
	});

	elements.btnNext.addEventListener('click', () => {
		hapticFeedback('light');
		queueManager.playNext();
	});
	elements.btnPrevious.addEventListener('click', () => {
		hapticFeedback('light');
		if (audioController.getCurrentTime() > 3) {
			audioController.seek(0);
		} else {
			queueManager.playPrevious();
		}
	});

	if (elements.btnDownload) {
		const btnDownload = elements.btnDownload;
		const downloadStatusLabel = elements.downloadStatusLabel;

		btnDownload.addEventListener('click', async () => {
			hapticFeedback('light');
			const playlistId = queueManager.getCurrentPlaylist();
			if (downloadManager.isPlaylistDownloaded(playlistId) || activeDownload) {
				return;
			}

			activeDownload = { playlistId, completed: 0, total: 0 };
			updateDownloadUI(playlistId);

			const success = await downloadManager.downloadPlaylist(playlistId, (progress) => {
				activeDownload = progress;
				updateDownloadUI(playlistId);
			});

			activeDownload = null;
			updateDownloadUI(playlistId);

			if (!success && downloadStatusLabel) {
				downloadStatusLabel.textContent = 'Download failed';
				btnDownload.disabled = false;
				btnDownload.classList.remove('downloading');

				if (downloadResetTimeout) {
					clearTimeout(downloadResetTimeout);
				}
				downloadResetTimeout = setTimeout(() => {
					updateDownloadUI(playlistId);
				}, 2000);
			}
		});
	}

	const HOLD_SEEK_DELAY_MS = 300;
	const HOLD_SEEK_INTERVAL_MS = 100;
	const HOLD_SEEK_STEP_SECONDS = 2;

	let seekInterval: ReturnType<typeof setInterval> | null = null;
	let seekHoldTimeout: ReturnType<typeof setTimeout> | null = null;
	let isHoldSeek = false;

	const startHoldSeek = (direction: 'forward' | 'backward') => {
		seekHoldTimeout = setTimeout(() => {
			isHoldSeek = true;
			seekInterval = setInterval(() => {
				const currentTime = audioController.getCurrentTime();
				const duration = audioController.getDuration();
				if (direction === 'forward') {
					// Allow seek even if duration is Infinity (streaming)
					const seekTime =
						Number.isFinite(duration) && duration > 0
							? Math.min(duration, currentTime + HOLD_SEEK_STEP_SECONDS)
							: currentTime + HOLD_SEEK_STEP_SECONDS;
					audioController.seek(seekTime);
					// Force immediate position state update
					mediaSessionManager.clearThrottle();
					mediaSessionManager.updatePositionState({
						duration: Number.isFinite(duration) && duration > 0 ? duration : Infinity,
						playbackRate: 1,
						position: seekTime,
					});
				} else {
					const seekTime = Math.max(0, currentTime - HOLD_SEEK_STEP_SECONDS);
					audioController.seek(seekTime);
					// Force immediate position state update
					mediaSessionManager.clearThrottle();
					mediaSessionManager.updatePositionState({
						duration: Number.isFinite(duration) && duration > 0 ? duration : Infinity,
						playbackRate: 1,
						position: seekTime,
					});
				}
			}, HOLD_SEEK_INTERVAL_MS);
		}, HOLD_SEEK_DELAY_MS);
	};

	const stopHoldSeek = () => {
		if (seekHoldTimeout) {
			clearTimeout(seekHoldTimeout);
			seekHoldTimeout = null;
		}
		if (seekInterval) {
			clearInterval(seekInterval);
			seekInterval = null;
		}
		const wasHoldSeek = isHoldSeek;
		isHoldSeek = false;
		return wasHoldSeek;
	};

	// Hold-to-seek: track touch state per button
	let nextTouchActive = false;
	let prevTouchActive = false;

	// Prevent long-press context menu on seek buttons
	elements.btnNext.addEventListener('contextmenu', (e) => e.preventDefault());
	elements.btnPrevious.addEventListener('contextmenu', (e) => e.preventDefault());

	elements.btnNext.addEventListener(
		'touchstart',
		() => {
			nextTouchActive = true;
			startHoldSeek('forward');
		},
		{ passive: true },
	);

	elements.btnNext.addEventListener('touchend', (e) => {
		if (!nextTouchActive) return;
		nextTouchActive = false;
		if (!stopHoldSeek()) {
			// Tap, not hold - trigger action
			e.preventDefault(); // Prevent duplicate click
			hapticFeedback('light');
			queueManager.playNext();
		}
	});

	elements.btnNext.addEventListener('touchcancel', () => {
		nextTouchActive = false;
		stopHoldSeek();
	});

	elements.btnPrevious.addEventListener(
		'touchstart',
		() => {
			prevTouchActive = true;
			startHoldSeek('backward');
		},
		{ passive: true },
	);

	elements.btnPrevious.addEventListener('touchend', (e) => {
		if (!prevTouchActive) return;
		prevTouchActive = false;
		if (!stopHoldSeek()) {
			// Tap, not hold - trigger action
			e.preventDefault(); // Prevent duplicate click
			hapticFeedback('light');
			if (audioController.getCurrentTime() > 3) {
				audioController.seek(0);
			} else {
				queueManager.playPrevious();
			}
		}
	});

	elements.btnPrevious.addEventListener('touchcancel', () => {
		prevTouchActive = false;
		stopHoldSeek();
	});

	elements.btnShuffle.addEventListener('click', () => {
		hapticFeedback('light');
		queueManager.toggleShuffle();
	});
	elements.btnRepeat.addEventListener('click', () => {
		hapticFeedback('light');
		queueManager.toggleRepeat();
	});

	// Handle progress slider - use both input and change for better mobile support
	const handleProgressSliderChange = () => {
		const percent = parseFloat(elements.progressSlider.value);
		audioController.seekPercent(percent);
		// Force immediate position state update after seek
		const currentTime = audioController.getCurrentTime();
		const duration = audioController.getDuration();
		if (duration > 0 || !Number.isFinite(duration)) {
			// Clear throttle to allow immediate update
			mediaSessionManager.clearThrottle();
			mediaSessionManager.updatePositionState({
				duration: Number.isFinite(duration) && duration > 0 ? duration : Infinity,
				playbackRate: 1,
				position: currentTime,
			});
		}
	};

	elements.progressSlider.addEventListener('input', handleProgressSliderChange);
	// Also listen to change event for mobile (fires on touch end)
	elements.progressSlider.addEventListener('change', handleProgressSliderChange);

	elements.volumeBlocks.forEach((block) => {
		block.addEventListener('click', () => {
			const level = parseInt(block.dataset.level || '5', 10);
			setVolume(level);
		});
	});

	if (elements.volumeSlider) {
		elements.volumeSlider.addEventListener('input', () => {
			const percent = parseFloat(elements.volumeSlider!.value);
			const level = Math.round(percent / 10);
			setVolume(level);
		});
	}

	elements.genreToggle.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;
		const btn = target.closest('.genre-btn') as HTMLButtonElement;
		if (btn?.dataset.genre) {
			hapticFeedback('light');
			const genre = btn.dataset.genre;
			queueManager.switchGenre(genre);
		}
	});

	const playlistState = new PlaylistState();
	const playlistsArray = Object.values(playlists);
	let updatePlaylistUI: ((activePlaylistId: string) => void) | null = null;

	if (elements.playlistToggle) {
		elements.playlistToggle.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			const btn = target.closest('.playlist-btn') as HTMLButtonElement;
			if (btn?.dataset.playlistId) {
				hapticFeedback('light');
				const playlistId = btn.dataset.playlistId;
				const success = queueManager.switchPlaylist(playlistId);
				if (success) {
					storage.save({ currentPlaylist: playlistId });
					pendingSeekTime = null;
					pendingAutoplay = false;
					audioController.pause();
					state.set('isPlaying', false);
					showPlayIcon();
					mediaSessionManager.clearPositionState();
					if (updatePlaylistUI) {
						updatePlaylistUI(playlistId);
					}
					updateDownloadUI(playlistId);
					rebuildQueue();
					queueManager.loadTrack(0, false);
				}
			}
		});

		updatePlaylistUI = (activePlaylistId: string) => {
			const buttons = elements.playlistToggle!.querySelectorAll('.playlist-btn');
			buttons.forEach((btn) => {
				const isActive = btn.getAttribute('data-playlist-id') === activePlaylistId;
				btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
			});
		};

		playlistsArray.forEach((playlist) => {
			const btn = elements.playlistToggle!.querySelector(`[data-playlist-id="${playlist.id}"]`);
			if (btn && playlistState.isPlaylistVisible(playlist)) {
				btn.classList.toggle('revealed', !playlist.visible);
			}
		});

		updatePlaylistUI(initialPlaylist);
		updateDownloadUI(initialPlaylist);
	}

	const rebuildQueue = () => {
		const tracks = queueManager.getAllTracks();
		const currentGenre = state.get('currentGenre');
		const queueCount = document.querySelector('.queue-count');

		if (queueCount) {
			queueCount.textContent = `${tracks.length} track${tracks.length !== 1 ? 's' : ''}`;
		}

		elements.queueItems.forEach((item, idx) => {
			const wrapper = item.closest('.queue-item-wrapper') as HTMLElement | null;
			if (idx < tracks.length) {
				const track = tracks[idx];
				if (!track) return;
				const titleEl = item.querySelector('.queue-item-title');
				const genreBadge = item.querySelector('.queue-item-genre-badge');
				const numberEl = item.querySelector('.queue-item-number');

				item.dataset.index = String(idx);
				item.dataset.title = track.title;
				item.dataset.songId = track.songId;
				item.dataset.versions = JSON.stringify(track.versions);

				if (wrapper) {
					wrapper.dataset.index = String(idx);
					wrapper.style.display = '';
				}

				if (numberEl) numberEl.textContent = String(idx + 1);
				if (titleEl) titleEl.textContent = track.title;
				if (genreBadge) genreBadge.textContent = currentGenre;
				item.style.display = '';
			} else {
				if (wrapper) wrapper.style.display = 'none';
				item.style.display = 'none';
			}
		});
	};

	rebuildQueue();

	const loadTrackBySongId = (songId: string, autoplay: boolean): boolean => {
		const targetTrack = tracks.find((track) => track.songId === songId);
		if (!targetTrack) return false;

		if (targetTrack.playlist !== queueManager.getCurrentPlaylist()) {
			const switched = queueManager.switchPlaylist(targetTrack.playlist);
			if (!switched) return false;
			storage.save({ currentPlaylist: targetTrack.playlist });
			if (updatePlaylistUI) {
				updatePlaylistUI(targetTrack.playlist);
			}
			updateDownloadUI(targetTrack.playlist);
			pendingSeekTime = null;
			pendingAutoplay = false;
			audioController.pause();
			state.set('isPlaying', false);
			showPlayIcon();
			mediaSessionManager.clearPositionState();
			rebuildQueue();
		}

		const playlistTracks = queueManager.getAllTracks();
		const index = playlistTracks.findIndex((track) => track.songId === songId);
		if (index < 0) return false;
		queueManager.loadTrack(index, autoplay);
		return true;
	};

	elements.queueItems.forEach((item) => {
		const loadFromDataset = () => {
			const trackIndex = parseInt(item.dataset.index || '-1', 10);
			if (trackIndex >= 0) {
				queueManager.loadTrack(trackIndex, true);
			}
		};
		const titleEl = item.querySelector('.queue-item-title');
		if (titleEl) {
			titleEl.addEventListener('click', (e) => {
				e.stopPropagation();
				hapticFeedback('light');
				loadFromDataset();
			});
		}
		item.addEventListener('click', () => {
			hapticFeedback('light');
			loadFromDataset();
		});
	});

	const SWIPE_THRESHOLD = 80;
	const queueWrappers = document.querySelectorAll('.queue-item-wrapper');

	queueWrappers.forEach((wrapper) => {
		const item = wrapper.querySelector('.queue-item') as HTMLElement;
		if (!item) return;

		let startX = 0;
		let currentX = 0;
		let isSwiping = false;

		wrapper.addEventListener(
			'touchstart',
			(e) => {
				const touch = (e as TouchEvent).touches[0];
				if (touch) {
					startX = touch.clientX;
					currentX = startX;
					isSwiping = true;
				}
			},
			{ passive: true },
		);

		wrapper.addEventListener(
			'touchmove',
			(e) => {
				if (!isSwiping) return;
				const touch = (e as TouchEvent).touches[0];
				if (!touch) return;
				currentX = touch.clientX;
				const deltaX = currentX - startX;

				if (deltaX > 10) {
					wrapper.classList.add('swiping');
					const clampedDelta = Math.min(SWIPE_THRESHOLD, deltaX);
					item.style.transform = `translateX(${clampedDelta}px)`;
				} else {
					wrapper.classList.remove('swiping');
					item.style.transform = '';
				}
			},
			{ passive: true },
		);

		wrapper.addEventListener('touchend', () => {
			if (!isSwiping) return;
			isSwiping = false;
			wrapper.classList.remove('swiping');

			const deltaX = currentX - startX;
			const idx = parseInt(item.dataset.index || '0', 10);

			if (deltaX > SWIPE_THRESHOLD) {
				queueManager.loadTrack(idx, true);
			}

			item.style.transform = '';
		});

		wrapper.addEventListener('touchcancel', () => {
			isSwiping = false;
			wrapper.classList.remove('swiping');
			item.style.transform = '';
		});
	});

	elements.hotkeysModal.addEventListener('click', (e) => {
		if (e.target === elements.hotkeysModal) {
			elements.hotkeysModal.classList.remove('visible');
		}
	});

	window.addEventListener('popstate', () => {
		const match = window.location.pathname.match(/^\/waves\/(.+)$/);
		if (match) {
			const songId = match[1];
			if (songId) {
				loadTrackBySongId(songId, false);
			}
		}
	});

	updateGenreUI(initialGenre);
	updateQueueListTheme(initialGenre);

	const syncFullscreenLyrics = () => {
		if (elements.lyricsFullscreenContent && elements.lyricsContent) {
			elements.lyricsFullscreenContent.innerHTML = elements.lyricsContent.innerHTML;
		}
	};

	const openFullscreenLyrics = () => {
		if (elements.lyricsFullscreenOverlay) {
			syncFullscreenLyrics();
			const currentTrack = queueManager.getCurrentTrack();
			if (elements.lyricsFullscreenTrack && currentTrack) {
				elements.lyricsFullscreenTrack.textContent = currentTrack.title;
			}
			elements.lyricsFullscreenOverlay.classList.add('visible');
			document.body.style.overflow = 'hidden';
		}
	};

	const closeFullscreenLyrics = () => {
		if (elements.lyricsFullscreenOverlay) {
			elements.lyricsFullscreenOverlay.classList.remove('visible');
			document.body.style.overflow = '';
		}
	};

	if (elements.lyricsFullscreenBtn) {
		elements.lyricsFullscreenBtn.addEventListener('click', openFullscreenLyrics);
	}

	if (elements.lyricsFullscreenClose) {
		elements.lyricsFullscreenClose.addEventListener('click', closeFullscreenLyrics);
	}

	if (elements.lyricsFullscreenOverlay) {
		elements.lyricsFullscreenOverlay.addEventListener('click', (e) => {
			if (e.target === elements.lyricsFullscreenOverlay) {
				closeFullscreenLyrics();
			}
		});
	}

	const legacySettings = savedSettings as Record<string, unknown>;
	if (savedSettings.shuffleMode) {
		queueManager.setShuffleMode(savedSettings.shuffleMode);
	} else if (legacySettings.shuffleEnabled) {
		// Migrate old boolean to new mode (true -> 'tracks', false -> 'off')
		queueManager.setShuffleMode(legacySettings.shuffleEnabled ? 'tracks' : 'off');
	} else {
		// Initialize UI to show 'off' state
		updateShuffleUI('off');
	}

	if (savedSettings.repeatMode) {
		queueManager.setRepeatMode(savedSettings.repeatMode);
	} else {
		// Initialize UI to show 'off' state
		updateRepeatUI('off');
	}

	const urlMatch = window.location.pathname.match(/^\/waves\/(.+)$/);
	if (urlMatch) {
		const songId = urlMatch[1];
		if (songId) {
			if (!loadTrackBySongId(songId, false) && elements.queueItems.length > 0) {
				queueManager.loadTrack(0, false);
			}
		}
	} else if (savedSettings.currentTrackId) {
		const loaded = loadTrackBySongId(savedSettings.currentTrackId, false);
		if (!loaded && elements.queueItems.length > 0) {
			queueManager.loadTrack(0, false);
		}
	} else if (elements.queueItems.length > 0) {
		queueManager.loadTrack(0, false);
	}

	const api: MusicPlayerAPI = {
		playNext: () => queueManager.playNext(),
		playPrevious: () => queueManager.playPrevious(),
		pauseAudio: () => audioController.pause(),
		playAudio: () => audioController.play(),
		setVolume,
		toggleShuffle: () => queueManager.toggleShuffle(),
		toggleRepeat: () => queueManager.toggleRepeat(),
		getState: (): MusicPlayerState => {
			const currentIndex = state.get('currentIndex');
			const currentTrack = queueManager.getCurrentTrack();

			return {
				currentIndex,
				currentGenre: state.get('currentGenre'),
				currentPlaylist: queueManager.getCurrentPlaylist(),
				currentTrackTitle: currentTrack?.title ?? null,
				currentTime: formatTime(state.get('currentTime')),
				duration: formatTime(state.get('duration')),
				volume: state.get('volume'),
				shuffleMode: state.get('shuffleMode'),
				repeatMode: state.get('repeatMode'),
				queueTitles: queueManager.getAllTracks().map((t) => t.title),
			};
		},
	};

	window.musicPlayerAPI = api;

	// Cleanup on page unload to prevent memory leaks
	// Store handler references to allow removal if player is re-initialized
	let cleanupBeforeUnload: (() => void) | null = null;
	let cleanupPageHide: (() => void) | null = null;

	const cleanup = (): void => {
		mediaSessionManager.destroy();
	};

	// Type for cleanup handlers registry
	interface CleanupHandlers {
		beforeunload: () => void;
		pagehide: () => void;
	}

	// Extend Window interface for cleanup handlers registry
	interface WindowWithCleanupHandlers extends Window {
		__musicPlayerCleanupHandlers?: CleanupHandlers;
	}

	// Remove old cleanup handlers if they exist (for hot reload/SPA navigation)
	if (typeof window !== 'undefined') {
		const win = window as WindowWithCleanupHandlers;
		// Try to remove any existing handlers (they might be from previous initialization)
		// We can't directly access old handlers, but we can use a global registry
		if (win.__musicPlayerCleanupHandlers) {
			const oldHandlers = win.__musicPlayerCleanupHandlers;
			if (oldHandlers.beforeunload) {
				window.removeEventListener('beforeunload', oldHandlers.beforeunload);
			}
			if (oldHandlers.pagehide) {
				window.removeEventListener('pagehide', oldHandlers.pagehide);
			}
		}

		// Register new cleanup handlers
		cleanupBeforeUnload = cleanup;
		cleanupPageHide = cleanup;
		window.addEventListener('beforeunload', cleanupBeforeUnload);
		window.addEventListener('pagehide', cleanupPageHide);

		// Store handlers globally so they can be removed on re-initialization
		win.__musicPlayerCleanupHandlers = {
			beforeunload: cleanupBeforeUnload,
			pagehide: cleanupPageHide,
		};
	}

	return api;
}

declare global {
	interface Window {
		terminalAPI?: {
			open: () => void;
			close: () => void;
		};
	}
}

export default initMusicPlayer;
