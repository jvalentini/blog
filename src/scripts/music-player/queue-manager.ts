import type { Track, RepeatMode } from './types';

export type TrackLoadCallback = (index: number, autoplay: boolean) => void;
export type GenreChangeCallback = (genre: string) => void;
export type ShuffleChangeCallback = (enabled: boolean) => void;
export type RepeatModeChangeCallback = (mode: RepeatMode) => void;

export interface QueueManagerCallbacks {
  onTrackLoad?: TrackLoadCallback;
  onGenreChange?: GenreChangeCallback;
  onShuffleChange?: ShuffleChangeCallback;
  onRepeatModeChange?: RepeatModeChangeCallback;
}

export class QueueManager {
  private tracks: Track[];
  private currentIndex: number = -1;
  private currentGenre: string;
  private defaultGenre: string;
  private shuffleEnabled: boolean = false;
  private shuffledIndices: number[] = [];
  private repeatMode: RepeatMode = 'off';
  private callbacks: QueueManagerCallbacks;

  constructor(
    tracks: Track[],
    defaultGenre: string = 'hip-hop',
    callbacks: QueueManagerCallbacks = {}
  ) {
    this.tracks = tracks;
    this.defaultGenre = defaultGenre;
    this.currentGenre = defaultGenre;
    this.callbacks = callbacks;
  }

  loadTrack(index: number, autoplay: boolean = false): boolean {
    if (!this.isValidIndex(index)) {
      return false;
    }

    this.currentIndex = index;
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

    const prevIndex = this.getPrevIndex();
    this.currentIndex = prevIndex;
    this.callbacks.onTrackLoad?.(prevIndex, true);
    return true;
  }

  toggleShuffle(): boolean {
    this.shuffleEnabled = !this.shuffleEnabled;

    if (this.shuffleEnabled) {
      this.generateShuffledIndices();

      if (this.currentIndex >= 0) {
        const currentPos = this.shuffledIndices.indexOf(this.currentIndex);
        if (currentPos > 0) {
          this.shuffledIndices.splice(currentPos, 1);
          this.shuffledIndices.unshift(this.currentIndex);
        }
      }
    }

    this.callbacks.onShuffleChange?.(this.shuffleEnabled);
    return this.shuffleEnabled;
  }

  isShuffleEnabled(): boolean {
    return this.shuffleEnabled;
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
    return this.tracks[this.currentIndex];
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
    return this.tracks[index];
  }

  getAllTracks(): Track[] {
    return [...this.tracks];
  }

  getCurrentTrackSrc(): string | null {
    const track = this.getCurrentTrack();
    if (!track) {
      return null;
    }

    return (
      track.versions[this.currentGenre] ??
      track.versions[this.defaultGenre] ??
      Object.values(track.versions)[0] ??
      null
    );
  }

  getTrackSrc(index: number, genre?: string): string | null {
    const track = this.getTrack(index);
    if (!track) {
      return null;
    }

    const targetGenre = genre ?? this.currentGenre;
    return (
      track.versions[targetGenre] ??
      track.versions[this.defaultGenre] ??
      Object.values(track.versions)[0] ??
      null
    );
  }

  private getNextIndex(): number {
    if (this.tracks.length === 0) {
      return -1;
    }

    if (this.tracks.length === 1) {
      return 0;
    }

    if (this.shuffleEnabled) {
      const currentShufflePos = this.shuffledIndices.indexOf(this.currentIndex);
      const nextShufflePos = (currentShufflePos + 1) % this.shuffledIndices.length;
      return this.shuffledIndices[nextShufflePos];
    }

    return (this.currentIndex + 1) % this.tracks.length;
  }

  private getPrevIndex(): number {
    if (this.tracks.length === 0) {
      return -1;
    }

    if (this.tracks.length === 1) {
      return 0;
    }

    if (this.shuffleEnabled) {
      const currentShufflePos = this.shuffledIndices.indexOf(this.currentIndex);
      const prevShufflePos =
        currentShufflePos <= 0
          ? this.shuffledIndices.length - 1
          : currentShufflePos - 1;
      return this.shuffledIndices[prevShufflePos];
    }

    return this.currentIndex <= 0
      ? this.tracks.length - 1
      : this.currentIndex - 1;
  }

  private isAtEndOfQueue(): boolean {
    if (this.tracks.length === 0) {
      return true;
    }

    if (this.shuffleEnabled) {
      const currentShufflePos = this.shuffledIndices.indexOf(this.currentIndex);
      return currentShufflePos === this.shuffledIndices.length - 1;
    }

    return this.currentIndex === this.tracks.length - 1;
  }

  /** Fisher-Yates shuffle algorithm */
  private generateShuffledIndices(): void {
    this.shuffledIndices = Array.from(
      { length: this.tracks.length },
      (_, i) => i
    );

    for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledIndices[i], this.shuffledIndices[j]] = [
        this.shuffledIndices[j],
        this.shuffledIndices[i],
      ];
    }
  }

  private isValidIndex(index: number): boolean {
    return index >= 0 && index < this.tracks.length;
  }
}
