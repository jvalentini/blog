/**
 * TypeScript type definitions for the music player component.
 * These types define the data structures used for track management,
 * lyrics display, and player state.
 */

/**
 * Represents the repeat mode options for the music player.
 * - 'off': No repeat, playlist ends after last track
 * - 'all': Repeat entire playlist when it ends
 * - 'one': Repeat the current track indefinitely
 */
export type RepeatMode = 'off' | 'all' | 'one';

/**
 * Represents a single line in parsed lyrics.
 * Supports both timestamped LRC format and plain text lyrics.
 */
export interface LyricLine {
  /** Time in seconds when this line should be highlighted, null if no timestamp */
  time: number | null;
  /** The text content of this lyric line */
  text: string;
  /** Whether this line is a section header (e.g., [Chorus], ## Verse 1) */
  isHeader: boolean;
  /** Whether this line is an empty spacer for visual separation */
  isSpacer: boolean;
}

/**
 * Represents parsed lyrics content for a track.
 * Contains both structured data for sync and pre-rendered HTML.
 */
export interface ParsedLyrics {
  /** Array of parsed lyric lines with timing data */
  lines: LyricLine[];
  /** Whether the lyrics contain LRC timestamps for synchronized display */
  hasTimestamps: boolean;
  /** Pre-rendered HTML string with data attributes for lyric elements */
  html: string;
}

/**
 * Represents a playable track in the music player.
 * Each track can have multiple versions (genres) and lyrics variants.
 */
export interface Track {
  /** Numeric index of the track in the playlist */
  id: number;
  /** Unique string identifier for the song (used in URLs) */
  songId: string;
  /** Display title of the track */
  title: string;
  /** Map of genre to lyrics file path (e.g., { 'hip-hop': 'song-hiphop.lrc' }) */
  lyrics: Record<string, string>;
  /** Map of genre to audio file URL (e.g., { 'hip-hop': '/assets/music/song-hiphop.mp3' }) */
  versions: Record<string, string>;
}

/**
 * Represents the current state of the music player.
 * Used for state management and terminal integration.
 */
export interface PlayerState {
  /** Index of the currently playing track (-1 if none) */
  currentIndex: number;
  /** Currently selected genre for playback */
  currentGenre: string;
  /** Whether shuffle mode is enabled */
  shuffleEnabled: boolean;
  /** Current repeat mode setting */
  repeatMode: RepeatMode;
  /** Current volume level (0-1 range) */
  volume: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
}

/**
 * State object returned by MusicPlayerAPI.getState().
 * Extended version of PlayerState with additional runtime information.
 */
export interface MusicPlayerState {
  /** Index of the currently playing track (-1 if none) */
  currentIndex: number;
  /** Currently selected genre for playback */
  currentGenre: string;
  /** Title of the current track, null if no track selected */
  currentTrackTitle: string | null;
  /** Formatted current playback time (e.g., "2:35") */
  currentTime: string;
  /** Formatted total duration (e.g., "4:12") */
  duration: string;
  /** Current volume level (0-1 range) */
  volume: number;
  /** Whether shuffle mode is enabled */
  shuffleEnabled: boolean;
  /** Current repeat mode setting */
  repeatMode: string;
  /** Array of all track titles in the queue */
  queueTitles: string[];
}

/**
 * Public API exposed on window.musicPlayerAPI for external control.
 * Used by the terminal component and other integrations.
 */
export interface MusicPlayerAPI {
  /** Advance to the next track in the playlist */
  playNext: () => void;
  /** Go to the previous track (or restart current if > 3s in) */
  playPrevious: () => void;
  /** Pause audio playback */
  pauseAudio: () => void;
  /** Resume or start audio playback */
  playAudio: () => void;
  /** Set volume level (0-10 scale) */
  setVolume: (level: number) => void;
  /** Toggle shuffle mode on/off */
  toggleShuffle: () => void;
  /** Cycle through repeat modes: off -> all -> one -> off */
  toggleRepeat: () => void;
  /** Get the current player state */
  getState: () => MusicPlayerState;
}

/**
 * Augment the global Window interface to include the music player API.
 */
declare global {
  interface Window {
    musicPlayerAPI?: MusicPlayerAPI;
  }
}
