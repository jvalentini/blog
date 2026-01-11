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
	let handlePlay: (() => void) | null = null;
	let handlePause: (() => void) | null = null;

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
	}

	function attachEventListeners(): void {
		if (!audio) return;

		handleTimeUpdate = () => {
			if (callbacks.onTimeUpdate && audio) {
				const duration = audio.duration || 0;
				callbacks.onTimeUpdate(audio.currentTime, duration);
			}
		};

		handleEnded = () => {
			callbacks.onEnded?.();
		};

		handleLoadedMetadata = () => {
			if (callbacks.onLoadedMetadata && audio) {
				callbacks.onLoadedMetadata(audio.duration || 0);
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

			const duration = audio.duration;
			if (!duration || !Number.isFinite(duration)) return;

			audio.currentTime = Math.max(0, Math.min(time, duration));
		},

		seekPercent(percent: number): void {
			if (!audio) return;

			const duration = audio.duration;
			if (!duration || !Number.isFinite(duration)) return;

			const clampedPercent = Math.max(0, Math.min(percent, 100));
			audio.currentTime = (clampedPercent / 100) * duration;
		},

		setVolume(level: number): void {
			if (!audio) return;
			audio.volume = Math.max(0, Math.min(level, 10)) / 10;
		},

		getCurrentTime(): number {
			return audio?.currentTime ?? 0;
		},

		getDuration(): number {
			if (!audio) return 0;
			const duration = audio.duration;
			return duration && Number.isFinite(duration) ? duration : 0;
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
