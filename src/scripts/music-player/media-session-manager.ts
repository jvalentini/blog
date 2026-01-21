import type { RepeatMode } from './types';

export interface MediaSessionCallbacks {
	onPlay?: () => void | Promise<void>;
	onPause?: () => void;
	onPreviousTrack?: () => void;
	onNextTrack?: () => void;
	onSeekBackward?: () => void;
	onSeekForward?: () => void;
}

export interface MediaSessionMetadata {
	title: string;
	artist: string;
	album: string;
	artwork?: MediaImage[];
}

export interface MediaSessionPositionState {
	duration: number;
	playbackRate: number;
	position: number;
}

export class MediaSessionManager {
	private isSupported: boolean;
	private callbacks: MediaSessionCallbacks = {};
	private lastPositionUpdate: number = 0;
	private positionUpdateThrottle: number = 1000; // 1 second
	private debug: boolean;

	constructor() {
		this.isSupported = 'mediaSession' in navigator;
		// Enable debug mode if localStorage flag is set or in development
		this.debug =
			(typeof localStorage !== 'undefined' && localStorage.getItem('mediaSessionDebug') === 'true') ||
			(typeof window !== 'undefined' && window.location.hostname === 'localhost');

		if (!this.isSupported) {
			console.warn('[MediaSessionManager] Media Session API not supported');
		} else if (this.debug) {
			console.log('[MediaSessionManager] Initialized, Media Session API available');
		}
	}

	/**
	 * Initialize the media session with action handlers
	 */
	init(callbacks: MediaSessionCallbacks): void {
		if (!this.isSupported) {
			return;
		}

		this.callbacks = callbacks;

		try {
			// Register action handlers with error handling
			if (callbacks.onPlay) {
				navigator.mediaSession.setActionHandler('play', () => {
					if (this.debug) {
						console.log('[MediaSessionManager] Play action triggered from notification');
					}
					try {
						const result = callbacks.onPlay?.();
						// Handle async callbacks
						if (result instanceof Promise) {
							result.catch((error) => {
								console.error('[MediaSessionManager] Error in play action:', error);
							});
						}
					} catch (error) {
						console.error('[MediaSessionManager] Error in play action:', error);
					}
				});
			}

			if (callbacks.onPause) {
				navigator.mediaSession.setActionHandler('pause', () => {
					try {
						callbacks.onPause?.();
					} catch (error) {
						console.error('[MediaSessionManager] Error in pause action:', error);
					}
				});
			}

			if (callbacks.onPreviousTrack) {
				navigator.mediaSession.setActionHandler('previoustrack', () => {
					if (this.debug) {
						console.log('[MediaSessionManager] Previous track action triggered from notification');
					}
					try {
						callbacks.onPreviousTrack?.();
					} catch (error) {
						console.error('[MediaSessionManager] Error in previousTrack action:', error);
					}
				});
			}

			if (callbacks.onNextTrack) {
				navigator.mediaSession.setActionHandler('nexttrack', () => {
					if (this.debug) {
						console.log('[MediaSessionManager] Next track action triggered from notification');
					}
					try {
						callbacks.onNextTrack?.();
					} catch (error) {
						console.error('[MediaSessionManager] Error in nextTrack action:', error);
					}
				});
			}

			if (callbacks.onSeekBackward) {
				navigator.mediaSession.setActionHandler('seekbackward', () => {
					try {
						callbacks.onSeekBackward?.();
					} catch (error) {
						console.error('[MediaSessionManager] Error in seekBackward action:', error);
					}
				});
			}

			if (callbacks.onSeekForward) {
				navigator.mediaSession.setActionHandler('seekforward', () => {
					try {
						callbacks.onSeekForward?.();
					} catch (error) {
						console.error('[MediaSessionManager] Error in seekForward action:', error);
					}
				});
			}
		} catch (error) {
			console.warn('[MediaSessionManager] Failed to set action handlers:', error);
		}
	}

	/**
	 * Update metadata displayed in notifications/lock screen
	 * @param metadata - The metadata to set
	 * @param trackId - Optional track identifier to prevent race conditions
	 */
	updateMetadata(metadata: MediaSessionMetadata, trackId?: string | number): void {
		if (!this.isSupported) {
			return;
		}

		// Validate metadata
		if (!metadata.title || metadata.title.trim() === '') {
			console.warn('[MediaSessionManager] Cannot update metadata with empty title');
			return;
		}

		try {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: metadata.title.trim(),
				artist: metadata.artist || 'Unknown Artist',
				album: metadata.album || 'Unknown Album',
				artwork: metadata.artwork || [],
			});

			if (this.debug) {
				console.log('[MediaSessionManager] Metadata updated:', {
					title: metadata.title.trim(),
					artist: metadata.artist || 'Unknown Artist',
					album: metadata.album || 'Unknown Album',
					trackId,
				});
			}
		} catch (error) {
			console.warn('[MediaSessionManager] Failed to update metadata:', error);
		}
	}

	/**
	 * Update playback position state for progress indication
	 * Throttled to avoid excessive API calls
	 * Supports streaming audio where duration may be Infinity or unknown
	 */
	updatePositionState(positionState: MediaSessionPositionState): void {
		if (!this.isSupported) {
			return;
		}

		// Validate position state values
		const { duration, playbackRate, position } = positionState;

		// Position and playbackRate must be finite
		if (!Number.isFinite(position) || !Number.isFinite(playbackRate)) {
			return;
		}

		// Position must be non-negative
		if (position < 0 || playbackRate <= 0) {
			return;
		}

		// For streaming audio, duration can be Infinity or NaN
		// Media Session API doesn't support Infinity, so we need a workaround
		// We'll use a very large finite number to represent "unknown duration"
		const isStreaming = !Number.isFinite(duration) || duration === Infinity || duration <= 0;

		// For non-streaming audio, validate duration and position
		if (!isStreaming) {
			if (position > duration) {
				// Position exceeds duration, clamp it
				return;
			}
		}

		const now = Date.now();
		// Handle clock changes: if time went backwards, reset throttle
		if (now < this.lastPositionUpdate) {
			this.lastPositionUpdate = now;
		}

		if (now - this.lastPositionUpdate < this.positionUpdateThrottle) {
			return;
		}

		this.lastPositionUpdate = now;

		try {
			// For streaming audio (duration is Infinity or unknown), use a large duration
			// or omit duration. However, Media Session API requires a finite duration.
			// For streaming, we'll use a very large duration value to indicate "unknown"
			// and update position regularly so progress can be shown.
			const effectiveDuration = isStreaming ? Number.MAX_SAFE_INTEGER : duration;

			navigator.mediaSession.setPositionState({
				duration: effectiveDuration,
				playbackRate,
				position,
			});

			if (this.debug && Math.floor(position) % 5 === 0) {
				// Log every 5 seconds to avoid spam
				console.log('[MediaSessionManager] Position state updated:', {
					position: Math.floor(position),
					duration: isStreaming ? 'streaming' : Math.floor(duration),
					playbackRate,
					isStreaming,
				});
			}
		} catch (error) {
			console.warn('[MediaSessionManager] Failed to update position state:', error);
		}
	}

	/**
	 * Clear position state (e.g., when paused or track ends)
	 */
	clearPositionState(): void {
		if (!this.isSupported) {
			return;
		}

		try {
			// Set position state to zero to clear it
			navigator.mediaSession.setPositionState({
				duration: 0,
				playbackRate: 1,
				position: 0,
			});
		} catch (error) {
			console.warn('[MediaSessionManager] Failed to clear position state:', error);
		}
	}

	/**
	 * Clear throttle to allow immediate position state update
	 * Useful after seek operations to update position state immediately
	 */
	clearThrottle(): void {
		this.lastPositionUpdate = 0;
	}

	/**
	 * Update action availability based on queue state
	 */
	updateActionAvailability(options: { canGoPrevious: boolean; canGoNext: boolean; repeatMode: RepeatMode }): void {
		if (!this.isSupported) {
			return;
		}

		try {
			// Enable/disable previous track action
			if (options.canGoPrevious || options.repeatMode !== 'off') {
				if (this.callbacks.onPreviousTrack) {
					navigator.mediaSession.setActionHandler('previoustrack', () => {
						this.callbacks.onPreviousTrack?.();
					});
					if (this.debug) {
						console.log('[MediaSessionManager] Previous track action enabled');
					}
				}
			} else {
				navigator.mediaSession.setActionHandler('previoustrack', null);
				if (this.debug) {
					console.log('[MediaSessionManager] Previous track action disabled');
				}
			}

			// Enable/disable next track action
			if (options.canGoNext || options.repeatMode !== 'off') {
				if (this.callbacks.onNextTrack) {
					navigator.mediaSession.setActionHandler('nexttrack', () => {
						this.callbacks.onNextTrack?.();
					});
					if (this.debug) {
						console.log('[MediaSessionManager] Next track action enabled');
					}
				}
			} else {
				navigator.mediaSession.setActionHandler('nexttrack', null);
				if (this.debug) {
					console.log('[MediaSessionManager] Next track action disabled');
				}
			}
		} catch (error) {
			console.warn('[MediaSessionManager] Failed to update action availability:', error);
		}
	}

	/**
	 * Format genre name for display (capitalize properly)
	 */
	static formatGenre(genre: string | null | undefined): string {
		// Handle null/undefined/empty
		if (!genre || typeof genre !== 'string' || genre.trim() === '') {
			return 'Unknown';
		}

		const trimmedGenre = genre.trim();

		// Handle special cases
		const specialCases: Record<string, string> = {
			'hip-hop': 'Hip-Hop',
			bluegrass: 'Bluegrass',
			country: 'Country',
			rock: 'Rock',
			pop: 'Pop',
			weird: 'Weird',
		};

		const lowerGenre = trimmedGenre.toLowerCase();
		if (specialCases[lowerGenre]) {
			return specialCases[lowerGenre]!;
		}

		// Default: capitalize first letter of each word
		// Limit length to prevent overflow
		const maxLength = 50;
		const formatted = trimmedGenre
			.split(/[- ]/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join('-');

		return formatted.length > maxLength ? `${formatted.substring(0, maxLength)}...` : formatted;
	}

	/**
	 * Clean up and destroy the media session
	 */
	destroy(): void {
		if (!this.isSupported) {
			return;
		}

		try {
			// Clear all action handlers
			navigator.mediaSession.setActionHandler('play', null);
			navigator.mediaSession.setActionHandler('pause', null);
			navigator.mediaSession.setActionHandler('previoustrack', null);
			navigator.mediaSession.setActionHandler('nexttrack', null);
			navigator.mediaSession.setActionHandler('seekbackward', null);
			navigator.mediaSession.setActionHandler('seekforward', null);

			// Clear metadata
			navigator.mediaSession.metadata = null;
		} catch (error) {
			console.warn('[MediaSessionManager] Failed to destroy media session:', error);
		}

		this.callbacks = {};
	}
}
