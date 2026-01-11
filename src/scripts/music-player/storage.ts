import type { Genre, RepeatMode, ShuffleMode } from './state';

const STORAGE_KEY = 'waves-player-settings';

export interface PlayerSettings {
	currentTrackId?: string;
	currentGenre?: Genre;
	volume?: number;
	shuffleMode?: ShuffleMode;
	repeatMode?: RepeatMode;
}

export class PlayerStorage {
	private storageAvailable: boolean;

	constructor() {
		this.storageAvailable = this.checkStorageAvailable();
	}

	private checkStorageAvailable(): boolean {
		try {
			const test = '__storage_test__';
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch {
			return false;
		}
	}

	load(): PlayerSettings {
		if (!this.storageAvailable) {
			return {};
		}

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) {
				return {};
			}
			return JSON.parse(stored) as PlayerSettings;
		} catch {
			return {};
		}
	}

	save(settings: Partial<PlayerSettings>): void {
		if (!this.storageAvailable) {
			return;
		}

		try {
			const current = this.load();
			const updated = { ...current, ...settings };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		} catch {}
	}

	clear(): void {
		if (!this.storageAvailable) {
			return;
		}

		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {}
	}
}
