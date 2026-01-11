# MusicPlayer.astro Refactoring Plan

## Overview

Refactor the 2366-line monolithic `MusicPlayer.astro` component into a maintainable, debuggable architecture.

## Current State Analysis

| Section | Lines | Description |
|---------|-------|-------------|
| Frontmatter (server-side) | 1-178 | TypeScript interfaces, lyrics parsing, track building |
| HTML Template | 179-404 | UI markup with inline SVGs |
| Client Script | 405-1065 | ~660 lines of JavaScript |
| Styles | 1067-2366 | ~1300 lines of CSS |

**Problems:**
- Single file doing everything (god component)
- 660+ lines of inline JavaScript - hard to debug
- No type safety in client code
- Tightly coupled concerns
- Difficult to test any piece in isolation

## Target Architecture

```
src/
├── components/
│   ├── MusicPlayer.astro           # ~100 lines - composition only
│   └── player/
│       ├── PlayerControls.astro    # Play/pause, prev/next, shuffle, repeat
│       ├── VolumeControl.astro     # Volume slider with blocks
│       ├── ProgressBar.astro       # Seek slider with time displays
│       ├── LyricsPanel.astro       # Lyrics container with scroll
│       ├── QueueList.astro         # Track queue with genre toggle
│       └── HotkeysModal.astro      # Keyboard shortcuts help
├── scripts/
│   └── music-player/
│       ├── index.ts                # Main orchestrator, exports window.musicPlayerAPI
│       ├── state.ts                # Centralized state management
│       ├── audio-controller.ts     # Audio element control
│       ├── queue-manager.ts        # Track loading, shuffle, repeat
│       ├── lyrics-sync.ts          # Lyrics scrolling/highlighting
│       ├── keyboard-shortcuts.ts   # Hotkey handling
│       └── types.ts                # Shared TypeScript interfaces
├── utils/
│   └── lyrics-parser.ts            # Server-side lyrics parsing
└── styles/
    └── music-player.css            # Extracted styles (optional phase 2)
```

## Implementation Tasks

### Phase 1: Extract TypeScript Modules (Foundation)

#### Task 1.1: Create types.ts
- Define all TypeScript interfaces
- Track, LyricLine, ParsedLyrics, PlayerState, etc.
- Export for use across modules

#### Task 1.2: Create state.ts  
- Centralized reactive state
- currentIndex, currentGenre, shuffleEnabled, repeatMode, volume, isPlaying
- Event emitter for state changes

#### Task 1.3: Create audio-controller.ts
- Wrap audio element operations
- play(), pause(), seek(), setVolume()
- Event listeners for timeupdate, ended, etc.

#### Task 1.4: Create queue-manager.ts
- loadTrack(), playNext(), playPrevious()
- Shuffle logic (Fisher-Yates)
- Repeat mode handling

#### Task 1.5: Create lyrics-sync.ts
- syncLyrics() function
- Timestamp-based highlighting
- Scroll position management

#### Task 1.6: Create keyboard-shortcuts.ts
- Global keydown handler
- All hotkey logic (space, arrows, m, g, s, r, ?, /)

#### Task 1.7: Create index.ts (orchestrator)
- Initialize all modules
- Wire up event handlers
- Export window.musicPlayerAPI

### Phase 2: Extract Server-Side Utilities

#### Task 2.1: Create lyrics-parser.ts utility
- Move parseLyrics(), parseTimestamp(), isTimestamp(), escapeHtml()
- Add proper TypeScript types
- Export for use in frontmatter

### Phase 3: Extract Sub-Components

#### Task 3.1: Create PlayerControls.astro
- Shuffle, prev, play/pause, next, repeat buttons
- All SVG icons
- Accepts callbacks as props

#### Task 3.2: Create VolumeControl.astro
- Volume blocks UI
- Volume percentage display

#### Task 3.3: Create ProgressBar.astro
- Range input slider
- Current time / duration displays

#### Task 3.4: Create LyricsPanel.astro
- Lyrics container
- Scroll progress track

#### Task 3.5: Create QueueList.astro
- Track list
- Genre toggle buttons
- Genre icons (mic/lasso SVGs)

#### Task 3.6: Create HotkeysModal.astro
- Keyboard shortcuts modal
- Backdrop click handling

### Phase 4: Integration

#### Task 4.1: Refactor MusicPlayer.astro
- Import all sub-components
- Import external script
- Minimal composition logic only

#### Task 4.2: Verify and test
- Build passes
- No runtime errors
- All features work (play, pause, seek, shuffle, repeat, genre switch, lyrics sync, hotkeys)

## Dependencies

```
Task 1.1 (types) ─┬─> Task 1.2 (state)
                  ├─> Task 1.3 (audio)
                  ├─> Task 1.4 (queue)
                  ├─> Task 1.5 (lyrics)
                  └─> Task 1.6 (keyboard)

Task 1.2-1.6 ────────> Task 1.7 (orchestrator)

Task 2.1 (lyrics-parser) ─> Independent

Task 1.7 + Task 2.1 ─────> Phase 3 (sub-components)

Phase 3 ─────────────────> Task 4.1 (integration)

Task 4.1 ────────────────> Task 4.2 (verification)
```

## Success Criteria

1. MusicPlayer.astro reduced from 2366 lines to ~150 lines
2. All JavaScript in typed TypeScript modules
3. Each sub-component < 100 lines
4. Build passes with no errors
5. All existing functionality preserved:
   - Play/pause audio
   - Next/previous track
   - Shuffle and repeat modes
   - Genre switching (hip-hop/country)
   - Lyrics sync with timestamps
   - Keyboard shortcuts
   - Volume control
   - Progress seek
   - URL-based track loading
   - Terminal integration (musicPlayerAPI)
