import type { Playlist } from './types';

const STORAGE_KEY = 'music-player-hidden-playlists';

export class PlaylistState {
	private hiddenPlaylistsRevealed: Set<string>;

	constructor() {
		this.hiddenPlaylistsRevealed = this.loadRevealedPlaylists();
	}

	private loadRevealedPlaylists(): Set<string> {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) {
				return new Set();
			}
			const parsed = JSON.parse(stored);
			return new Set(Array.isArray(parsed) ? parsed : []);
		} catch {
			return new Set();
		}
	}

	private saveRevealedPlaylists(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.hiddenPlaylistsRevealed]));
		} catch {}
	}

	isPlaylistVisible(playlist: Playlist): boolean {
		if (playlist.visible) {
			return true;
		}
		return this.hiddenPlaylistsRevealed.has(playlist.id);
	}

	revealPlaylist(playlistId: string): void {
		this.hiddenPlaylistsRevealed.add(playlistId);
		this.saveRevealedPlaylists();
	}

	hidePlaylist(playlistId: string): void {
		this.hiddenPlaylistsRevealed.delete(playlistId);
		this.saveRevealedPlaylists();
	}

	togglePlaylistVisibility(playlistId: string): boolean {
		if (this.hiddenPlaylistsRevealed.has(playlistId)) {
			this.hidePlaylist(playlistId);
			return false;
		} else {
			this.revealPlaylist(playlistId);
			return true;
		}
	}

	getVisiblePlaylists(allPlaylists: Playlist[]): Playlist[] {
		return allPlaylists.filter((playlist) => this.isPlaylistVisible(playlist));
	}
}
