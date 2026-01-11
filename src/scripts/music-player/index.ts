import { createAudioController } from './audio-controller';
import { KeyboardShortcutsManager } from './keyboard-shortcuts';
import { LyricsSyncManager } from './lyrics-sync';
import { QueueManager } from './queue-manager';
import { createPlayerState, type Genre } from './state';
import type { MusicPlayerAPI, MusicPlayerState, ParsedLyrics, Track } from './types';

export interface MusicPlayerConfig {
	tracks: Track[];
	lyricsData: Record<string, Record<string, ParsedLyrics>>;
	defaultGenre: Genre;
	genres: string[];
}

interface DOMElements {
	audio: HTMLAudioElement;
	btnPlay: HTMLButtonElement;
	btnNext: HTMLButtonElement;
	btnPrevious: HTMLButtonElement;
	btnShuffle: HTMLButtonElement;
	btnRepeat: HTMLButtonElement;
	progressSlider: HTMLInputElement;
	currentTime: HTMLElement;
	durationTime: HTMLElement;
	progressCurrent: HTMLElement;
	progressDuration: HTMLElement;
	currentTrackTitle: HTMLElement;
	volumePercent: HTMLElement;
	volumeBlocks: NodeListOf<HTMLElement>;
	queueItems: NodeListOf<HTMLElement>;
	queueTitle: HTMLElement;
	genreBtnHipHop: HTMLButtonElement;
	genreBtnCountry: HTMLButtonElement;
	genreIconMic: HTMLElement;
	genreIconLasso: HTMLElement;
	hotkeysModal: HTMLElement;
	playIcon: HTMLElement;
	pauseIcon: HTMLElement;
}

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds)) return '0:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
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
	const genreBtnHipHop = document.getElementById('genre-btn-hip-hop') as HTMLButtonElement | null;
	const genreBtnCountry = document.getElementById('genre-btn-country') as HTMLButtonElement | null;
	const genreIconMic = document.getElementById('genre-icon-mic');
	const genreIconLasso = document.getElementById('genre-icon-lasso');
	const hotkeysModal = document.getElementById('hotkeys-modal');
	const volumeBlocks = document.querySelectorAll('.volume-block') as NodeListOf<HTMLElement>;
	const queueItems = document.querySelectorAll('.queue-item') as NodeListOf<HTMLElement>;

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
		!genreBtnHipHop ||
		!genreBtnCountry ||
		!genreIconMic ||
		!genreIconLasso ||
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
		currentTime,
		durationTime,
		progressCurrent,
		progressDuration,
		currentTrackTitle,
		volumePercent,
		volumeBlocks,
		queueItems,
		queueTitle,
		genreBtnHipHop,
		genreBtnCountry,
		genreIconMic,
		genreIconLasso,
		hotkeysModal,
		playIcon,
		pauseIcon,
	};
}

export function initMusicPlayer(config: MusicPlayerConfig): MusicPlayerAPI | null {
	const elements = getElements();
	if (!elements) return null;

	const { tracks, lyricsData, defaultGenre } = config;

	const state = createPlayerState({
		currentGenre: defaultGenre,
		volume: 0.7,
	});

	const audioController = createAudioController();

	const loadTrackAtIndex = (index: number, autoplay: boolean): void => {
		if (index < 0 || index >= elements.queueItems.length) return;

		const item = elements.queueItems[index];
		const title = item.dataset.title;
		const songId = item.dataset.songId;
		const src = queueManager.getTrackSrc(index);

		if (!src || !title || !songId) return;

		state.set('currentIndex', index);
		audioController.setSrc(src);
		elements.currentTrackTitle.textContent = title;

		Array.from(elements.queueItems).forEach((el) => {
			el.classList.remove('active');
		});
		if (index >= 0 && index < elements.queueItems.length) {
			elements.queueItems[index].classList.add('active');
		}

		const newURL = `/waves/${songId}`;
		if (window.location.pathname !== newURL) {
			window.history.pushState({ songId }, '', newURL);
		}

		loadLyricsForTrack(index);

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
		elements.genreBtnHipHop.classList.toggle('active', genre === 'hip-hop');
		elements.genreBtnCountry.classList.toggle('active', genre === 'country');
		elements.genreIconMic.style.display = genre === 'hip-hop' ? 'block' : 'none';
		elements.genreIconLasso.style.display = genre === 'country' ? 'block' : 'none';
		elements.queueTitle.classList.toggle('country-theme', genre === 'country');
	};

	const updateQueueListTheme = (genre: Genre): void => {
		const queueList = document.getElementById('queue-list');
		queueList?.classList.toggle('country-theme', genre === 'country');
	};

	const updateShuffleUI = (enabled: boolean): void => {
		elements.btnShuffle.classList.toggle('active', enabled);
	};

	const updateRepeatUI = (mode: string): void => {
		const repeatOff = elements.btnRepeat.querySelector('.repeat-off') as HTMLElement | null;
		const repeatAll = elements.btnRepeat.querySelector('.repeat-all') as HTMLElement | null;
		const repeatOne = elements.btnRepeat.querySelector('.repeat-one') as HTMLElement | null;

		elements.btnRepeat.classList.toggle('active', mode !== 'off');
		if (repeatOff) repeatOff.style.display = mode === 'off' ? 'block' : 'none';
		if (repeatAll) repeatAll.style.display = mode === 'all' ? 'block' : 'none';
		if (repeatOne) repeatOne.style.display = mode === 'one' ? 'block' : 'none';
	};

	let pendingSeekTime: number | null = null;
	let pendingAutoplay: boolean = false;

	const queueManager = new QueueManager(tracks, defaultGenre, {
		onTrackLoad: loadTrackAtIndex,
		onGenreChange: (genre) => {
			state.set('currentGenre', genre as Genre);
			updateGenreUI(genre as Genre);
			updateQueueListTheme(genre as Genre);

			const currentIndex = state.get('currentIndex');
			if (currentIndex >= 0) {
				const wasPlaying = state.get('isPlaying');
				const currentTime = audioController.getCurrentTime();
				const src = queueManager.getTrackSrc(currentIndex, genre);
				if (src) {
					// Store seek time and playing state for after metadata loads
					pendingSeekTime = currentTime;
					pendingAutoplay = wasPlaying;
					audioController.setSrc(src);
					audioController.load();
				}
				loadLyricsForTrack(currentIndex);
			}
		},
		onShuffleChange: (enabled) => {
			state.set('shuffleEnabled', enabled);
			updateShuffleUI(enabled);
		},
		onRepeatModeChange: (mode) => {
			state.set('repeatMode', mode);
			updateRepeatUI(mode);
		},
	});

	const lyricsSync = new LyricsSyncManager('lyrics-content');

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
	};

	const setVolume = (level: number): void => {
		audioController.setVolume(level);
		state.set('volume', level / 10);
		updateVolumeUI(level);
	};

	audioController.init(elements.audio, {
		onTimeUpdate: (currentTime, duration) => {
			state.setState({ currentTime, duration });
			updateTimeDisplay(currentTime, duration);
			lyricsSync.syncLyrics(currentTime, duration);
		},
		onEnded: () => {
			queueManager.playNext();
		},
		onLoadedMetadata: (duration) => {
			state.set('duration', duration);
			updateTimeDisplay(0, duration);

			if (pendingSeekTime !== null && pendingSeekTime > 0 && pendingSeekTime < duration) {
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
		},
	});

	audioController.setVolume(7);

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
			const currentGenre = state.get('currentGenre');
			const newGenre: Genre = currentGenre === 'hip-hop' ? 'country' : 'hip-hop';
			queueManager.switchGenre(newGenre);
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

	elements.btnPlay.addEventListener('click', () => {
		if (state.get('currentIndex') < 0) {
			queueManager.loadTrack(0, true);
		} else {
			audioController.togglePlayPause();
		}
	});

	elements.btnNext.addEventListener('click', () => queueManager.playNext());
	elements.btnPrevious.addEventListener('click', () => {
		if (audioController.getCurrentTime() > 3) {
			audioController.seek(0);
		} else {
			queueManager.playPrevious();
		}
	});

	elements.btnShuffle.addEventListener('click', () => queueManager.toggleShuffle());
	elements.btnRepeat.addEventListener('click', () => queueManager.toggleRepeat());

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

	elements.genreBtnHipHop.addEventListener('click', () => {
		if (state.get('currentGenre') !== 'hip-hop') {
			queueManager.switchGenre('hip-hop');
		}
	});

	elements.genreBtnCountry.addEventListener('click', () => {
		if (state.get('currentGenre') !== 'country') {
			queueManager.switchGenre('country');
		}
	});

	elements.queueItems.forEach((item, idx) => {
		const titleEl = item.querySelector('.queue-item-title');
		if (titleEl) {
			titleEl.addEventListener('click', (e) => {
				e.stopPropagation();
				queueManager.loadTrack(idx, true);
			});
		}
		item.addEventListener('click', () => {
			queueManager.loadTrack(idx, true);
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

	updateGenreUI(defaultGenre);
	updateQueueListTheme(defaultGenre);
	updateVolumeUI(7);

	const urlMatch = window.location.pathname.match(/^\/waves\/(.+)$/);
	if (urlMatch) {
		const songId = urlMatch[1];
		elements.queueItems.forEach((item, idx) => {
			if (item.dataset.songId === songId) {
				queueManager.loadTrack(idx, false);
			}
		});
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
				shuffleEnabled: state.get('shuffleEnabled'),
				repeatMode: state.get('repeatMode'),
				queueTitles: queueManager.getAllTracks().map((t) => t.title),
			};
		},
	};

	window.musicPlayerAPI = api;

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
