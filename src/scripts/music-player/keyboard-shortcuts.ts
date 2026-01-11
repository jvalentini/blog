export interface KeyboardShortcutCallbacks {
  onPlayPause: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onMuteToggle: () => void;
  onGenreToggle: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  onShowHotkeys: () => void;
  onOpenTerminal: () => void;
  onCloseModals: () => void;
}

export class KeyboardShortcutsManager {
  private callbacks: KeyboardShortcutCallbacks;
  private boundHandler: (e: KeyboardEvent) => void;

  constructor(callbacks: KeyboardShortcutCallbacks) {
    this.callbacks = callbacks;
    this.boundHandler = this.handleKeydown.bind(this);
  }

  init(): void {
    document.addEventListener('keydown', this.boundHandler);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.boundHandler);
  }

  private handleKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    switch (e.key) {
      case ' ':
        e.preventDefault();
        this.callbacks.onPlayPause();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.callbacks.onVolumeUp();
        break;

      case 'ArrowDown':
        e.preventDefault();
        this.callbacks.onVolumeDown();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.callbacks.onPrevious();
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.callbacks.onNext();
        break;

      case 'm':
      case 'M':
        e.preventDefault();
        this.callbacks.onMuteToggle();
        break;

      case 'g':
      case 'G':
        e.preventDefault();
        this.callbacks.onGenreToggle();
        break;

      case 's':
      case 'S':
        e.preventDefault();
        this.callbacks.onShuffleToggle();
        break;

      case 'r':
      case 'R':
        e.preventDefault();
        this.callbacks.onRepeatToggle();
        break;

      case '?':
        e.preventDefault();
        this.callbacks.onShowHotkeys();
        break;

      case '/':
        e.preventDefault();
        this.callbacks.onOpenTerminal();
        break;

      case 'Escape':
        e.preventDefault();
        this.callbacks.onCloseModals();
        break;
    }
  }
}
