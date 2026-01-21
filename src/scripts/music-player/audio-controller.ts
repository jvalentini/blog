export type AudioEventCallback = () => void;
export type TimeUpdateCallback = (currentTime: number, duration: number) => void;

export interface AudioControllerCallbacks {
	onTimeUpdate?: TimeUpdateCallback;
	onEnded?: AudioEventCallback;
	onLoadedMetadata?: (duration: number) => void;
	onPlay?: AudioEventCallback;
	onPause?: AudioEventCallback;
}

export interface AudioController {
	init(audioElement: HTMLAudioElement, callbacks?: AudioControllerCallbacks): void;
	play(): Promise<void>;
	pause(): void;
	togglePlayPause(): Promise<void>;
	seek(time: number): void;
	seekPercent(percent: number): void;
	/** @param level Volume level from 0-10 */
	setVolume(level: number): void;
	getCurrentTime(): number;
	getDuration(): number;
	/** @returns Volume level from 0-10 */
	getVolume(): number;
	isPlaying(): boolean;
	setSrc(url: string): void;
	load(): void;
	destroy(): void;
}

export function createAudioController(): AudioController {
	let audio: HTMLAudioElement | null = null;
	let callbacks: AudioControllerCallbacks = {};

	let handleTimeUpdate: (() => void) | null = null;
	let handleEnded: (() => void) | null = null;
	let handleLoadedMetadata: (() => void) | null = null;
	let handleDurationChange: (() => void) | null = null;
	let handlePlay: (() => void) | null = null;
	let handlePause: (() => void) | null = null;

	function hasFiniteDuration(): boolean {
		return !!audio && Number.isFinite(audio.duration) && audio.duration > 0;
	}

	function getSeekableRange(): { start: number; end: number } | null {
		if (!audio || !audio.seekable || audio.seekable.length === 0) {
			return null;
		}

		try {
			const start = audio.seekable.start(0);
			const end = audio.seekable.end(audio.seekable.length - 1);
			if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
				return null;
			}
			return { start, end };
		} catch {
			return null;
		}
	}

	function getEffectiveTiming(): { currentTime: number; duration: number; seekableStart: number | null } {
		if (!audio) {
			return { currentTime: 0, duration: 0, seekableStart: null };
		}

		if (hasFiniteDuration()) {
			return { currentTime: audio.currentTime, duration: audio.duration, seekableStart: null };
		}

		const range = getSeekableRange();
		if (!range) {
			return { currentTime: audio.currentTime, duration: 0, seekableStart: null };
		}

		const duration = Math.max(0, range.end - range.start);
		const currentTime = Math.max(0, audio.currentTime - range.start);
		return { currentTime, duration, seekableStart: range.start };
	}

	function getEffectiveDuration(): number {
		return getEffectiveTiming().duration;
	}

	function removeEventListeners(): void {
		if (!audio) return;

		if (handleTimeUpdate) {
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			handleTimeUpdate = null;
		}
		if (handleEnded) {
			audio.removeEventListener('ended', handleEnded);
			handleEnded = null;
		}
		if (handleLoadedMetadata) {
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
			handleLoadedMetadata = null;
		}
		if (handlePlay) {
			audio.removeEventListener('play', handlePlay);
			handlePlay = null;
		}
		if (handlePause) {
			audio.removeEventListener('pause', handlePause);
			handlePause = null;
		}
		if (handleDurationChange) {
			audio.removeEventListener('durationchange', handleDurationChange);
			handleDurationChange = null;
		}
	}

	function attachEventListeners(): void {
		if (!audio) return;

		handleTimeUpdate = () => {
			if (callbacks.onTimeUpdate && audio) {
				const timing = getEffectiveTiming();
				callbacks.onTimeUpdate(timing.currentTime, timing.duration);
			}
		};

		handleEnded = () => {
			callbacks.onEnded?.();
		};

		handleLoadedMetadata = () => {
			if (callbacks.onLoadedMetadata && audio) {
				callbacks.onLoadedMetadata(getEffectiveDuration());
			}
		};

		handleDurationChange = () => {
			// For streaming audio, duration may change as more data loads
			// Trigger a timeupdate-like callback to update position state
			if (callbacks.onTimeUpdate && audio) {
				const timing = getEffectiveTiming();
				callbacks.onTimeUpdate(timing.currentTime, timing.duration);
			}
		};

		handlePlay = () => {
			callbacks.onPlay?.();
		};

		handlePause = () => {
			callbacks.onPause?.();
		};

		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('ended', handleEnded);
		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		audio.addEventListener('durationchange', handleDurationChange);
		audio.addEventListener('play', handlePlay);
		audio.addEventListener('pause', handlePause);
	}

	return {
		init(audioElement: HTMLAudioElement, eventCallbacks?: AudioControllerCallbacks): void {
			if (audio) {
				removeEventListeners();
			}

			audio = audioElement;
			callbacks = eventCallbacks || {};
			attachEventListeners();
		},

		async play(): Promise<void> {
			if (!audio) return;

			try {
				await audio.play();
			} catch (error) {
				console.warn('AudioController: play() failed', error);
				throw error;
			}
		},

		pause(): void {
			audio?.pause();
		},

		async togglePlayPause(): Promise<void> {
			if (!audio) return;

			if (audio.paused) {
				await this.play();
			} else {
				this.pause();
			}
		},

		seek(time: number): void {
			if (!audio) return;

			if (hasFiniteDuration()) {
				audio.currentTime = Math.max(0, Math.min(time, audio.duration));
				return;
			}

			const seekable = getSeekableRange();
			if (!seekable) return;
			const range = Math.max(0, seekable.end - seekable.start);
			const clampedTime = Math.max(0, Math.min(time, range));
			audio.currentTime = seekable.start + clampedTime;
		},

		seekPercent(percent: number): void {
			if (!audio) return;

			const duration = hasFiniteDuration() ? audio.duration : getEffectiveDuration();
			if (!duration || !Number.isFinite(duration)) return;

			const clampedPercent = Math.max(0, Math.min(percent, 100));
			const seekable = hasFiniteDuration() ? null : getSeekableRange();
			if (seekable) {
				const range = seekable.end - seekable.start;
				audio.currentTime = seekable.start + (clampedPercent / 100) * range;
				return;
			}
			audio.currentTime = (clampedPercent / 100) * duration;
		},

		setVolume(level: number): void {
			if (!audio) return;
			audio.volume = Math.max(0, Math.min(level, 10)) / 10;
		},

		getCurrentTime(): number {
			return getEffectiveTiming().currentTime;
		},

		getDuration(): number {
			return getEffectiveDuration();
		},

		getVolume(): number {
			return audio ? Math.round(audio.volume * 10) : 0;
		},

		isPlaying(): boolean {
			return audio ? !audio.paused && !audio.ended : false;
		},

		setSrc(url: string): void {
			if (audio) {
				audio.src = url;
			}
		},

		load(): void {
			audio?.load();
		},

		destroy(): void {
			removeEventListeners();
			audio = null;
			callbacks = {};
		},
	};
}

export const audioController = createAudioController();
