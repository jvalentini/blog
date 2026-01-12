import { createAudioController } from './audio-controller';
import { KeyboardShortcutsManager } from './keyboard-shortcuts';
import { LyricsSyncManager } from './lyrics-sync';
import { MediaSessionManager } from './media-session-manager';
import { QueueManager } from './queue-manager';
import { createPlayerState, type Genre } from './state';
import { PlayerStorage } from './storage';
import type { MusicPlayerAPI, MusicPlayerState, ParsedLyrics, Track } from './types';

export interface MusicPlayerConfig {
	tracks: Track[];
	lyricsData: Record<string, Record<string, ParsedLyrics>>;
	defaultGenre: Genre;
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
	const progressSlider = document.getElementById('progress-slider') as HTMLInputElement | null;
	const currentTime = document.getElementById('current-time');
	const durationTime = document.getElementById('duration-time');
	const progressCurrent = document.getElementById('progress-current');
	const progressDuration = document.getElementById('progress-duration');
	const currentTrackTitle = document.getElementById('current-track-title');
	const volumePercent = document.getElementById('volume-percent');
	const queueTitle = document.getElementById('queue-title');
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

	const { tracks, lyricsData, defaultGenre, genres, genreColors } = config;

	const storage = new PlayerStorage();
	const savedSettings = storage.load();

	const initialGenre = (savedSettings.currentGenre as Genre) || defaultGenre;
	const initialVolume = savedSettings.volume ?? 0.7;

	const state = createPlayerState({
		currentGenre: initialGenre,
		volume: initialVolume,
	});

	const audioController = createAudioController();

	const loadTrackAtIndex = (index: number, autoplay: boolean): void => {
		if (index < 0 || index >= elements.queueItems.length) return;

		const item = elements.queueItems[index];
		if (!item) return;
		const title = item.dataset.title;
		const songId = item.dataset.songId;

		if (!title || !songId) return;

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
		if (src) {
			audioController.setSrc(src);
			audioController.load();
		}

		loadLyricsForTrack(index);

		// Update media session metadata
		updateMediaSessionMetadata();
		updateMediaSessionActionAvailability();

		if (autoplay) {
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

	const queueManager = new QueueManager(tracks, initialGenre, {
		onTrackLoad: loadTrackAtIndex,
		onGenreChange: (genre) => {
			state.set('currentGenre', genre as Genre);
			updateGenreUI(genre as Genre);
			updateQueueListTheme(genre as Genre);
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
		onShuffleChange: (mode) => {
			state.set('shuffleMode', mode);
			updateShuffleUI(mode);
			storage.save({ shuffleMode: mode });
			// Update action availability when shuffle mode changes
			updateMediaSessionActionAvailability();
		},
		onRepeatModeChange: (mode) => {
			state.set('repeatMode', mode);
			updateRepeatUI(mode);
			storage.save({ repeatMode: mode });
			// Update action availability when repeat mode changes
			updateMediaSessionActionAvailability();
		},
	});

	const lyricsSync = new LyricsSyncManager('lyrics-content');

	const mediaSessionManager = new MediaSessionManager();

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
			if (duration > 0) {
				mediaSessionManager.updatePositionState({
					duration,
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
		},
		onSeekForward: () => {
			const currentTime = audioController.getCurrentTime();
			const duration = audioController.getDuration();
			audioController.seek(Math.min(duration, currentTime + 5));
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
		},
	});

	keyboardShortcuts.init();

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
			// Validate duration before seeking
			if (!Number.isFinite(duration) || duration <= 0) {
				return;
			}
			audioController.seek(Math.max(0, currentTime - 10));
		},
		onSeekForward: () => {
			const currentTime = audioController.getCurrentTime();
			const duration = audioController.getDuration();
			// Validate duration before seeking
			if (!Number.isFinite(duration) || duration <= 0) {
				return;
			}
			audioController.seek(Math.min(duration, currentTime + 10));
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
					audioController.seek(Math.min(duration, currentTime + HOLD_SEEK_STEP_SECONDS));
				} else {
					audioController.seek(Math.max(0, currentTime - HOLD_SEEK_STEP_SECONDS));
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

	elements.progressSlider.addEventListener('input', () => {
		const percent = parseFloat(elements.progressSlider.value);
		audioController.seekPercent(percent);
	});

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
		const genreBtn = target.closest('.genre-btn') as HTMLButtonElement | null;
		if (genreBtn && !genreBtn.disabled) {
			const genre = genreBtn.getAttribute('data-genre');
			if (genre && state.get('currentGenre') !== genre) {
				hapticFeedback('medium');
				queueManager.switchGenre(genre);
			}
		}
	});

	elements.queueItems.forEach((item, idx) => {
		const titleEl = item.querySelector('.queue-item-title');
		if (titleEl) {
			titleEl.addEventListener('click', (e) => {
				e.stopPropagation();
				hapticFeedback('light');
				queueManager.loadTrack(idx, true);
			});
		}
		item.addEventListener('click', () => {
			hapticFeedback('light');
			queueManager.loadTrack(idx, true);
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

				if (Math.abs(deltaX) > 10) {
					wrapper.classList.add('swiping');
					const clampedDelta = Math.max(-SWIPE_THRESHOLD, Math.min(SWIPE_THRESHOLD, deltaX));
					item.style.transform = `translateX(${clampedDelta}px)`;
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
			elements.queueItems.forEach((item, idx) => {
				if (item.dataset.songId === songId) {
					queueManager.loadTrack(idx, false);
				}
			});
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
		elements.queueItems.forEach((item, idx) => {
			if (item.dataset.songId === songId) {
				queueManager.loadTrack(idx, false);
			}
		});
	} else if (savedSettings.currentTrackId) {
		let foundSavedTrack = false;
		elements.queueItems.forEach((item, idx) => {
			if (item.dataset.songId === savedSettings.currentTrackId) {
				queueManager.loadTrack(idx, false);
				foundSavedTrack = true;
			}
		});
		if (!foundSavedTrack && elements.queueItems.length > 0) {
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
	const cleanup = (): void => {
		mediaSessionManager.destroy();
	};

	// Register cleanup handlers
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', cleanup);
		window.addEventListener('pagehide', cleanup);
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
