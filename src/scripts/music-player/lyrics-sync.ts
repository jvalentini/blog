import type { LyricLine, ParsedLyrics } from './types';

export class LyricsSyncManager {
	private container: HTMLElement | null;
	private scrollProgressIndicator: HTMLElement | null;
	private currentLines: LyricLine[] = [];
	private hasTimestamps = false;
	private activeLineIndex = -1;

	constructor(containerId: string) {
		this.container = document.getElementById(containerId);
		this.scrollProgressIndicator = document.getElementById('lyrics-scroll-progress');
	}

	loadLyrics(lyricsData: ParsedLyrics): void {
		this.currentLines = [];
		this.hasTimestamps = false;
		this.activeLineIndex = -1;

		if (!this.container) return;

		if (lyricsData.html && lyricsData.html.trim() !== '') {
			this.container.innerHTML = lyricsData.html;
			this.currentLines = lyricsData.lines || [];
			this.hasTimestamps = lyricsData.hasTimestamps || false;
		} else {
			this.container.innerHTML =
				'<div class="lyrics-empty"><p>No lyrics available for this track</p></div>';
		}
	}

	clearLyrics(): void {
		this.currentLines = [];
		this.hasTimestamps = false;
		this.activeLineIndex = -1;

		if (this.container) {
			this.container.innerHTML =
				'<div class="lyrics-empty"><p>Select a track to view lyrics</p></div>';
		}

		this.updateScrollProgress(0);
	}

	syncLyrics(currentTime: number, duration: number): void {
		if (!this.container || this.currentLines.length === 0) return;

		if (this.hasTimestamps) {
			this.syncByTimestamp(currentTime);
		} else {
			this.syncByProportionalScroll(currentTime, duration);
		}
	}

	private syncByTimestamp(currentTime: number): void {
		let newActiveIndex = -1;
		for (let i = this.currentLines.length - 1; i >= 0; i--) {
			const line = this.currentLines[i];
			if (line.time !== null && line.time <= currentTime) {
				newActiveIndex = i;
				break;
			}
		}

		if (newActiveIndex !== this.activeLineIndex) {
			this.activeLineIndex = newActiveIndex;
			this.updateActiveLine();
		}
	}

	private syncByProportionalScroll(currentTime: number, duration: number): void {
		if (!this.container || duration <= 0) return;

		const progress = currentTime / duration;
		const maxScroll = this.container.scrollHeight - this.container.clientHeight;

		if (maxScroll > 0) {
			const targetScroll = progress * maxScroll;
			this.smoothScrollTo(targetScroll);
		}

		this.updateScrollProgress(progress);
	}

	private updateActiveLine(): void {
		if (!this.container) return;

		const allLines = this.container.querySelectorAll('.lyrics-line, .lyrics-header');
		allLines.forEach((el) => {
			el.classList.remove('active');
		});

		if (this.activeLineIndex >= 0) {
			const activeLine = this.container.querySelector(
				`[data-index="${this.activeLineIndex}"]`
			) as HTMLElement | null;

			if (activeLine) {
				activeLine.classList.add('active');
				this.scrollToLine(activeLine);
			}
		}
	}

	private scrollToLine(element: HTMLElement): void {
		element.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
	}

	private smoothScrollTo(targetScroll: number): void {
		if (!this.container) return;

		this.container.scrollTo({
			top: targetScroll,
			behavior: 'smooth',
		});
	}

	private updateScrollProgress(progress: number): void {
		if (this.scrollProgressIndicator) {
			const clampedProgress = Math.max(0, Math.min(1, progress));
			this.scrollProgressIndicator.style.height = `${clampedProgress * 100}%`;
		}
	}
}
