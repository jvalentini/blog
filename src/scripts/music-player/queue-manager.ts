import type { RepeatMode, ShuffleMode, Track } from './types';

export type TrackLoadCallback = (index: number, autoplay: boolean) => void;
export type GenreChangeCallback = (genre: string) => void;
export type ShuffleChangeCallback = (mode: ShuffleMode) => void;
export type RepeatModeChangeCallback = (mode: RepeatMode) => void;

export interface QueueManagerCallbacks {
	onTrackLoad?: TrackLoadCallback;
	onGenreChange?: GenreChangeCallback;
	onShuffleChange?: ShuffleChangeCallback;
	onRepeatModeChange?: RepeatModeChangeCallback;
}

export class QueueManager {
	private allTracks: Track[];
	private currentPlaylist: string;
	private currentIndex: number = -1;
	private currentGenre: string;
	private defaultGenre: string;
	private shuffleMode: ShuffleMode = 'off';
	private shuffledIndices: number[] = [];
	private shuffleDeck: Array<{ trackIndex: number; genre: string }> = [];
	private shuffleDeckPos: number = -1;
	private shuffleDeckPlayed: Set<number> = new Set();
	private currentShuffleGenre: string | null = null;
	private repeatMode: RepeatMode = 'off';
	private callbacks: QueueManagerCallbacks;

	constructor(
		tracks: Track[],
		defaultGenre: string = 'hip-hop',
		defaultPlaylist: string = 'ai',
		callbacks: QueueManagerCallbacks = {},
	) {
		this.allTracks = tracks;
		this.defaultGenre = defaultGenre;
		this.currentGenre = defaultGenre;
		this.currentPlaylist = defaultPlaylist;
		this.callbacks = callbacks;
	}

	private get tracks(): Track[] {
		return this.allTracks.filter((track) => track.playlist === this.currentPlaylist);
	}

	loadTrack(index: number, autoplay: boolean = false): boolean {
		if (!this.isValidIndex(index)) {
			return false;
		}

		if (this.shuffleMode === 'tracks+genres') {
			this.ensureShuffleDeck();
			const deckPos = this.findDeckPosForTrack(index);
			if (deckPos !== null) {
				this.setDeckPosition(deckPos, true);
			} else {
				this.currentShuffleGenre = null;
				this.currentIndex = index;
			}
		} else {
			this.currentIndex = index;
		}

		this.callbacks.onTrackLoad?.(index, autoplay);
		return true;
	}

	playNext(): boolean {
		if (this.tracks.length === 0) {
			return false;
		}

		if (this.repeatMode === 'one') {
			this.callbacks.onTrackLoad?.(this.currentIndex, true);
			return true;
		}

		if (this.shuffleMode !== 'tracks+genres' && this.repeatMode === 'off' && this.isAtEndOfQueue()) {
			return false;
		}

		if (this.shuffleMode === 'tracks+genres') {
			if (this.isShuffleDeckExhausted()) {
				if (this.repeatMode === 'all') {
					this.generateShuffleDeck();
				} else {
					return false;
				}
			}

			const nextPos = this.getNextDeckPos();
			if (nextPos < 0) {
				return false;
			}

			this.setDeckPosition(nextPos, true);
			if (this.currentShuffleGenre) {
				this.switchGenre(this.currentShuffleGenre);
			}
			this.callbacks.onTrackLoad?.(this.currentIndex, true);
			return true;
		}

		const nextIndex = this.getNextIndex();
		const isAtEnd = this.isAtEndOfQueue();

		if (this.repeatMode === 'off' && isAtEnd) {
			this.currentIndex = nextIndex;
			this.callbacks.onTrackLoad?.(nextIndex, false);
			return false;
		}

		this.currentIndex = nextIndex;
		this.callbacks.onTrackLoad?.(nextIndex, true);
		return true;
	}

	playPrevious(): boolean {
		if (this.tracks.length === 0) {
			return false;
		}

		if (this.repeatMode === 'off' && this.isAtStartOfQueue()) {
			return false;
		}

		if (this.shuffleMode === 'tracks+genres') {
			const prevPos = this.getPrevDeckPos();
			if (prevPos < 0) {
				return false;
			}
			this.setDeckPosition(prevPos, false);
			if (this.currentShuffleGenre) {
				this.switchGenre(this.currentShuffleGenre);
			}
			this.callbacks.onTrackLoad?.(this.currentIndex, true);
			return true;
		}

		const prevIndex = this.getPrevIndex();
		this.currentIndex = prevIndex;
		this.callbacks.onTrackLoad?.(prevIndex, true);
		return true;
	}

	toggleShuffle(): ShuffleMode {
		// Cycle through modes: off -> tracks -> tracks+genres -> off
		if (this.shuffleMode === 'off') {
			this.shuffleMode = 'tracks';
		} else if (this.shuffleMode === 'tracks') {
			this.shuffleMode = 'tracks+genres';
		} else {
			this.shuffleMode = 'off';
		}

		if (this.shuffleMode !== 'off') {
			if (this.shuffleMode === 'tracks+genres') {
				this.generateShuffleDeck();
			} else {
				this.generateShuffledIndices();
			}

			if (this.currentIndex >= 0) {
				if (this.shuffleMode === 'tracks+genres') {
					this.alignShuffleDeckToCurrentTrack();
				} else {
					const currentPos = this.shuffledIndices.indexOf(this.currentIndex);
					if (currentPos > 0) {
						this.shuffledIndices.splice(currentPos, 1);
						this.shuffledIndices.unshift(this.currentIndex);
					}
				}
			}
		} else {
			// Clear shuffled data when turning off
			this.shuffledIndices = [];
			this.resetShuffleDeck();
		}

		this.callbacks.onShuffleChange?.(this.shuffleMode);
		return this.shuffleMode;
	}

	getShuffleMode(): ShuffleMode {
		return this.shuffleMode;
	}

	setShuffleMode(mode: ShuffleMode): void {
		if (this.shuffleMode === mode) {
			return;
		}

		this.shuffleMode = mode;

		if (this.shuffleMode !== 'off') {
			if (this.shuffleMode === 'tracks+genres') {
				this.generateShuffleDeck();
			} else {
				this.generateShuffledIndices();
			}

			if (this.currentIndex >= 0) {
				if (this.shuffleMode === 'tracks+genres') {
					this.alignShuffleDeckToCurrentTrack();
				} else {
					const currentPos = this.shuffledIndices.indexOf(this.currentIndex);
					if (currentPos > 0) {
						this.shuffledIndices.splice(currentPos, 1);
						this.shuffledIndices.unshift(this.currentIndex);
					}
				}
			}
		} else {
			this.shuffledIndices = [];
			this.resetShuffleDeck();
		}

		this.callbacks.onShuffleChange?.(this.shuffleMode);
	}

	isShuffleEnabled(): boolean {
		return this.shuffleMode !== 'off';
	}

	toggleRepeat(): RepeatMode {
		if (this.repeatMode === 'off') {
			this.repeatMode = 'all';
		} else if (this.repeatMode === 'all') {
			this.repeatMode = 'one';
		} else {
			this.repeatMode = 'off';
		}

		this.callbacks.onRepeatModeChange?.(this.repeatMode);
		return this.repeatMode;
	}

	getRepeatMode(): RepeatMode {
		return this.repeatMode;
	}

	setRepeatMode(mode: RepeatMode): void {
		this.repeatMode = mode;
		this.callbacks.onRepeatModeChange?.(mode);
	}

	switchGenre(genre: string): boolean {
		if (genre === this.currentGenre) {
			return false;
		}

		this.currentGenre = genre;
		this.callbacks.onGenreChange?.(genre);
		return true;
	}

	getCurrentGenre(): string {
		return this.currentGenre;
	}

	getDefaultGenre(): string {
		return this.defaultGenre;
	}

	getCurrentTrack(): Track | null {
		if (!this.isValidIndex(this.currentIndex)) {
			return null;
		}
		return this.tracks[this.currentIndex] ?? null;
	}

	getCurrentIndex(): number {
		return this.currentIndex;
	}

	getTrackCount(): number {
		return this.tracks.length;
	}

	getTrack(index: number): Track | null {
		if (!this.isValidIndex(index)) {
			return null;
		}
		return this.tracks[index] ?? null;
	}

	getAllTracks(): Track[] {
		return [...this.tracks];
	}

	getCurrentPlaylist(): string {
		return this.currentPlaylist;
	}

	switchPlaylist(playlistId: string): boolean {
		if (playlistId === this.currentPlaylist) {
			return false;
		}

		const playlistTracks = this.allTracks.filter((track) => track.playlist === playlistId);
		if (playlistTracks.length === 0) {
			return false;
		}

		this.currentPlaylist = playlistId;
		this.currentIndex = -1;

		if (this.shuffleMode !== 'off') {
			if (this.shuffleMode === 'tracks+genres') {
				this.generateShuffleDeck();
			} else {
				this.generateShuffledIndices();
			}
		}

		return true;
	}

	getCurrentTrackSrc(): string | null {
		const track = this.getCurrentTrack();
		if (!track) {
			return null;
		}

		return (
			track.versions[this.currentGenre] ?? track.versions[this.defaultGenre] ?? Object.values(track.versions)[0] ?? null
		);
	}

	getTrackSrc(index: number, genre?: string): string | null {
		const track = this.getTrack(index);
		if (!track) {
			return null;
		}

		const targetGenre = genre ?? this.currentGenre;
		return track.versions[targetGenre] ?? track.versions[this.defaultGenre] ?? Object.values(track.versions)[0] ?? null;
	}

	getAvailableGenresForTrack(index: number): string[] {
		const track = this.getTrack(index);
		if (!track) {
			return [];
		}
		return Object.keys(track.versions);
	}

	getAvailableGenresForCurrentTrack(): string[] {
		return this.getAvailableGenresForTrack(this.currentIndex);
	}

	getGenreForTrack(_index: number): string | null {
		if (this.shuffleMode !== 'tracks+genres') {
			return null;
		}

		return this.currentShuffleGenre;
	}

	private getNextIndex(): number {
		if (this.tracks.length === 0) {
			return -1;
		}

		if (this.tracks.length === 1) {
			return 0;
		}

		if (this.shuffleMode !== 'off') {
			const currentShufflePos = this.shuffledIndices.indexOf(this.currentIndex);
			const nextShufflePos = (currentShufflePos + 1) % this.shuffledIndices.length;
			return this.shuffledIndices[nextShufflePos] ?? -1;
		}

		return (this.currentIndex + 1) % this.tracks.length;
	}

	private getNextDeckPos(): number {
		if (this.shuffleDeck.length === 0) {
			return -1;
		}

		for (let i = 0; i < this.shuffleDeck.length; i++) {
			const pos = (this.shuffleDeckPos + 1 + i) % this.shuffleDeck.length;
			if (!this.shuffleDeckPlayed.has(pos)) {
				return pos;
			}
		}

		return -1;
	}

	private getPrevDeckPos(): number {
		if (this.shuffleDeck.length === 0) {
			return -1;
		}

		if (this.shuffleDeckPos < 0) {
			return -1;
		}

		return (this.shuffleDeckPos - 1 + this.shuffleDeck.length) % this.shuffleDeck.length;
	}

	private getPrevIndex(): number {
		if (this.tracks.length === 0) {
			return -1;
		}

		if (this.tracks.length === 1) {
			return 0;
		}

		if (this.shuffleMode !== 'off') {
			const currentShufflePos = this.shuffledIndices.indexOf(this.currentIndex);
			const prevShufflePos = currentShufflePos <= 0 ? this.shuffledIndices.length - 1 : currentShufflePos - 1;
			return this.shuffledIndices[prevShufflePos] ?? -1;
		}

		return this.currentIndex <= 0 ? this.tracks.length - 1 : this.currentIndex - 1;
	}

	private isAtEndOfQueue(): boolean {
		if (this.tracks.length === 0) {
			return true;
		}

		if (this.shuffleMode === 'tracks+genres') {
			return this.isShuffleDeckExhausted();
		}

		if (this.shuffleMode !== 'off') {
			const currentShufflePos = this.shuffledIndices.indexOf(this.currentIndex);
			return currentShufflePos === this.shuffledIndices.length - 1;
		}

		return this.currentIndex === this.tracks.length - 1;
	}

	/**
	 * Check if we're at the start of the queue (for Media Session API)
	 * Takes shuffle mode into account
	 */
	isAtStartOfQueue(): boolean {
		if (this.tracks.length === 0 || this.currentIndex < 0) {
			return true;
		}

		if (this.shuffleMode === 'tracks+genres') {
			return this.shuffleDeckPos <= 0;
		}

		if (this.shuffleMode !== 'off') {
			const currentShufflePos = this.shuffledIndices.indexOf(this.currentIndex);
			return currentShufflePos === 0;
		}

		return this.currentIndex === 0;
	}

	/**
	 * Check if we're at the end of the queue (for Media Session API)
	 * Takes shuffle mode into account
	 */
	isAtEndOfQueuePublic(): boolean {
		return this.isAtEndOfQueue();
	}

	/** Fisher-Yates shuffle algorithm */
	private generateShuffledIndices(): void {
		this.shuffledIndices = Array.from({ length: this.tracks.length }, (_, i) => i);

		for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = this.shuffledIndices[i]!;
			this.shuffledIndices[i] = this.shuffledIndices[j]!;
			this.shuffledIndices[j] = temp;
		}
	}

	private generateShuffleDeck(): void {
		const deck: Array<{ trackIndex: number; genre: string }> = [];

		this.tracks.forEach((track, trackIndex) => {
			const genres = Object.keys(track.versions);
			if (genres.length === 0) {
				deck.push({ trackIndex, genre: this.defaultGenre });
				return;
			}
			genres.forEach((genre) => {
				deck.push({ trackIndex, genre });
			});
		});

		for (let i = deck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = deck[i]!;
			deck[i] = deck[j]!;
			deck[j] = temp;
		}

		this.shuffleDeck = deck;
		this.shuffleDeckPos = -1;
		this.shuffleDeckPlayed.clear();
		this.currentShuffleGenre = null;
	}

	private resetShuffleDeck(): void {
		this.shuffleDeck = [];
		this.shuffleDeckPos = -1;
		this.shuffleDeckPlayed.clear();
		this.currentShuffleGenre = null;
	}

	private ensureShuffleDeck(): void {
		if (this.shuffleDeck.length === 0) {
			this.generateShuffleDeck();
		}
	}

	private isShuffleDeckExhausted(): boolean {
		if (this.shuffleDeck.length === 0) {
			return true;
		}
		return this.shuffleDeckPlayed.size >= this.shuffleDeck.length;
	}

	private setDeckPosition(pos: number, markPlayed: boolean): void {
		const entry = this.shuffleDeck[pos];
		if (!entry) {
			return;
		}
		this.shuffleDeckPos = pos;
		this.currentShuffleGenre = entry.genre;
		this.currentIndex = entry.trackIndex;
		if (markPlayed) {
			this.shuffleDeckPlayed.add(pos);
		}
	}

	private findDeckPosForTrack(trackIndex: number): number | null {
		if (this.shuffleDeck.length === 0) {
			return null;
		}

		for (let i = 0; i < this.shuffleDeck.length; i++) {
			const pos = (this.shuffleDeckPos + 1 + i) % this.shuffleDeck.length;
			const entry = this.shuffleDeck[pos];
			if (entry && entry.trackIndex === trackIndex && !this.shuffleDeckPlayed.has(pos)) {
				return pos;
			}
		}

		const fallback = this.shuffleDeck.findIndex((entry) => entry.trackIndex === trackIndex);
		return fallback >= 0 ? fallback : null;
	}

	private alignShuffleDeckToCurrentTrack(): void {
		const currentTrack = this.currentIndex;
		if (currentTrack < 0) {
			return;
		}
		const pos = this.findDeckPosForTrack(currentTrack);
		if (pos !== null) {
			this.setDeckPosition(pos, true);
			return;
		}

		this.shuffleDeckPos = -1;
		this.currentShuffleGenre = null;
	}

	private isValidIndex(index: number): boolean {
		return index >= 0 && index < this.tracks.length;
	}
}
