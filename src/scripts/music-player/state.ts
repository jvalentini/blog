export type RepeatMode = 'off' | 'all' | 'one';

export type Genre = string;

export interface LyricsLine {
	time?: number;
	text: string;
}

export interface PlayerState {
	currentIndex: number;
	currentGenre: Genre;
	shuffleEnabled: boolean;
	repeatMode: RepeatMode;
	shuffledIndices: number[];

	currentLyricsLines: LyricsLine[];
	currentLyricsHasTimestamps: boolean;
	activeLineIndex: number;

	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
}

export type PlayerStateKey = keyof PlayerState;

export type StateChangeEvent = {
	key: PlayerStateKey;
	value: PlayerState[PlayerStateKey];
	previousValue: PlayerState[PlayerStateKey];
};

export type StateSubscriber = (event: StateChangeEvent) => void;

export type EventType = 'change' | 'play' | 'pause' | 'track-change' | 'genre-change';

export type EventData = StateChangeEvent | { index: number } | { genre: Genre } | undefined;

export type EventSubscriber = (data?: EventData) => void;

const DEFAULT_STATE: PlayerState = {
	currentIndex: -1,
	currentGenre: 'hip-hop',
	shuffleEnabled: false,
	repeatMode: 'off',
	shuffledIndices: [],
	currentLyricsLines: [],
	currentLyricsHasTimestamps: false,
	activeLineIndex: -1,
	isPlaying: false,
	currentTime: 0,
	duration: 0,
	volume: 1,
};

export interface PlayerStateManager {
	get<K extends PlayerStateKey>(key: K): PlayerState[K];
	getState(): Readonly<PlayerState>;

	set<K extends PlayerStateKey>(key: K, value: PlayerState[K]): void;
	setState(partial: Partial<PlayerState>): void;
	reset(): void;

	subscribe(event: EventType, callback: EventSubscriber): () => void;
	emit(event: EventType, data?: EventData): void;

	onChange(callback: StateSubscriber): () => void;
}

export function createPlayerState(initial: Partial<PlayerState> = {}): PlayerStateManager {
	let state: PlayerState = { ...DEFAULT_STATE, ...initial };
	const subscribers: Map<EventType, Set<EventSubscriber>> = new Map();

	function getSubscribers(event: EventType): Set<EventSubscriber> {
		if (!subscribers.has(event)) {
			subscribers.set(event, new Set());
		}
		return subscribers.get(event)!;
	}

	return {
		get<K extends PlayerStateKey>(key: K): PlayerState[K] {
			return state[key];
		},

		getState(): Readonly<PlayerState> {
			return { ...state };
		},

		set<K extends PlayerStateKey>(key: K, value: PlayerState[K]): void {
			const previousValue = state[key];
			if (previousValue === value) return;

			state = { ...state, [key]: value };

			const changeEvent: StateChangeEvent = { key, value, previousValue };
			this.emit('change', changeEvent);

			if (key === 'currentIndex') {
				this.emit('track-change', { index: value as number });
			} else if (key === 'currentGenre') {
				this.emit('genre-change', { genre: value as Genre });
			} else if (key === 'isPlaying') {
				this.emit(value ? 'play' : 'pause');
			}
		},

		setState(partial: Partial<PlayerState>): void {
			for (const [key, value] of Object.entries(partial)) {
				this.set(key as PlayerStateKey, value as PlayerState[PlayerStateKey]);
			}
		},

		reset(): void {
			const keys = Object.keys(state) as PlayerStateKey[];
			for (const key of keys) {
				this.set(key, DEFAULT_STATE[key]);
			}
		},

		subscribe(event: EventType, callback: EventSubscriber): () => void {
			const subs = getSubscribers(event);
			subs.add(callback);
			return () => {
				subs.delete(callback);
			};
		},

		emit(event: EventType, data?: EventData): void {
			const subs = getSubscribers(event);
			subs.forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error(`[PlayerState] Error in ${event} subscriber:`, error);
				}
			});
		},

		onChange(callback: StateSubscriber): () => void {
			return this.subscribe('change', callback as EventSubscriber);
		},
	};
}

export const playerState = createPlayerState();

export default playerState;
