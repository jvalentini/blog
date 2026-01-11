---
title: "Building Waves: A Genre-Switching Music Player"
description: "Exploring the architecture, features, and technology behind a custom-built music player with genre variants, keyboard shortcuts, and real-time lyrics sync."
pubDate: 2026-01-11
heroImage: "../../assets/waves-hero.png"
---

I recently built a music player called **Waves** for my blog—a project that turned into something more ambitious than I initially planned. It's not just a simple audio player. It's a fully-featured interface that lets you switch between genre versions of the same track, navigate with keyboard shortcuts, and sync lyrics in real-time. Here's how it works.

## The Vision

The player came from a simple observation: the same song can have dramatically different vibes depending on genre. What if you could hear "Lose Yourself" as a hip-hop anthem one moment and a country ballad the next? Waves lets you do exactly that.

The name reflects the aesthetic—there's a visual wave background, glowing green phosphor styling inspired by retro terminals, and a responsive two-column layout that adapts from desktop to mobile.

## Features

### Multi-Genre Versions

Each track in Waves has multiple versions:
- **Hip-Hop**: Slop Slinger, Lose Yourself, Without Me
- **Country**: The same tracks reimagined with country instrumentation

You can toggle between genres instantly with the **G** key or click the genre buttons. When you switch, the player seamlessly reloads the audio while maintaining your playback position and lyrics sync.

### Keyboard Shortcuts

I designed Waves to be fully keyboard-accessible. Here's the hotkey map:

| Key | Action |
|-----|--------|
| **Space** | Play/Pause |
| **←** | Previous track (rewind if > 3s in) |
| **→** | Next track |
| **↑** | Volume up |
| **↓** | Volume down |
| **M** | Mute/unmute |
| **S** | Toggle shuffle |
| **R** | Cycle repeat modes (off → all → one) |
| **G** | Switch genre |
| **/** | Open terminal (if integrated) |
| **?** | Show hotkeys modal |
| **Esc** | Close modals |

The keyboard manager is smart about context—shortcuts only fire when you're not typing in an input field.

### Synchronized Lyrics

The most ambitious feature: **real-time lyrics synchronization**. Each track can have multiple lyric files (one per genre) with LRC timestamp formatting. As the track plays, the lyrics panel scrolls and highlights the current line.

The lyrics parser understands LRC format with timestamps like `[00:12.34] Lyric text here`. If a track doesn't have timestamped lyrics, it displays them as a static block.

### Playback Modes

- **Shuffle**: Randomizes the queue while respecting genre selection
- **Repeat Modes**: Off → Repeat All → Repeat One (visual indicator updates as you cycle)
- **Volume Control**: 10-level system with block visualization and click-to-set

### Visual Feedback

The UI gives you constant feedback:
- Current track title with glowing text shadow
- Time display (current / total duration)
- Progress slider with smooth dragging
- Volume blocks that light up based on your level
- Active queue item highlighting
- Genre-specific theming (subtle styling changes when you switch)

## Architecture

### Components

The player is built with **Astro** and split into modular components:

```
MusicPlayer.astro
├── PlayerControls.astro       (play, next, prev, shuffle, repeat)
├── ProgressBar.astro          (time slider)
├── VolumeControl.astro        (volume slider + blocks)
├── LyricsPanel.astro          (scrolling lyric display)
├── QueueList.astro            (track listing by genre)
└── HotkeysModal.astro         (keyboard shortcuts reference)
```

### TypeScript State Management

The core logic lives in `src/scripts/music-player/` with modular TypeScript:

- **index.ts**: Main initialization and event wiring
- **state.ts**: Centralized reactive state store (current track, genre, volume, etc.)
- **audio-controller.ts**: Wraps the HTML5 audio element with play/pause/seek/volume methods
- **queue-manager.ts**: Handles track loading, shuffle, repeat modes, and genre switching
- **lyrics-sync.ts**: Matches current playback time to lyric lines and updates DOM
- **keyboard-shortcuts.ts**: Event dispatcher for all hotkey bindings
- **types.ts**: TypeScript interfaces for type safety

### Data Flow

1. **Configuration** (`tracks.json`) defines all songs with their genre versions and lyric files
2. **Astro build** loads lyrics from markdown files, parses LRC timestamps, and passes data to the client
3. **Client initialization** sets up state, audio element, and event listeners
4. **User interaction** (clicks/keys) dispatches through keyboard/queue managers, updates state, and syncs DOM
5. **Audio updates** trigger time updates, which drive lyrics sync and progress display

## The Tracks

Three tracks power the demo, each with hip-hop and country variants:

### Slop Slinger
A quirky track with completely different feels between genres. The hip-hop version hits hard; the country version is laid-back and storytelling-focused.

### Lose Yourself
An iconic track that translates surprisingly well across genres. The hip-hop version is energetic; country reimagines it with acoustic instrumentation.

### Without Me
A moody track that gains a different emotional weight depending on how it's produced. Genre switching here is particularly dramatic.

## Technical Highlights

### Responsive Design

The player uses CSS grid that adapts:
- **Desktop**: Two-column layout (left: controls & info, right: lyrics)
- **Tablet**: Stacked columns with fixed height on lyrics panel
- **Mobile**: Single column with adjusted typography and button sizes

### Astro & Streaming

Built with **Astro** for SSG benefits:
- Static HTML generation means fast initial load
- Islands architecture for interactive components
- File-system API for reading lyrics at build time
- Hybrid approach: build-time data + client-side interactivity

### Audio State Persistence

The player syncs URL state. Load `/waves/slop-slinger` and it automatically queues that track. Browser back/forward buttons work—useful for sharing links to specific songs.

### Volume Persistence (Future)

Currently defaults to 70%, but the architecture is set up for localStorage integration to remember user volume preferences.

## Styling Philosophy

The aesthetic is intentional: green-on-black phosphor styling inspired by old CRT monitors and hacker terminals. Every element glows slightly. Shadows are deep. Text has text-shadow for the retro effect.

CSS variables drive the theme:
- `--phosphor-base`: Main green (#33ff33)
- `--phosphor-bright`: Lighter green for highlights
- `--phosphor-glow`: Shadow color for the glow effect
- Dark backgrounds with carefully tuned opacity

## What I Learned

1. **HTML5 Audio is capable**: With good state management, it can power genuinely sophisticated playback experiences
2. **Keyboard accessibility matters**: Adding shortcuts made the player way more fun to use
3. **Lyrics sync is complex**: Handling variable timestamp precision and edge cases taught me a lot about real-time media sync
4. **Modular TypeScript scales**: Breaking the music player into focused modules made debugging and adding features straightforward
5. **Genre switching is tricky**: Maintaining playback position and lyric sync across audio source changes requires careful state handling

## Future Ideas

- Playlist support (save and load queues)
- Keyboard-driven queue navigation
- Visualizer (frequency bars synced to audio)
- Track favoriting with localStorage
- Embedded player for blog posts
- WebGL background animation that responds to audio

Waves started as "a player with two versions of each track" and evolved into a complete media control system. The modular architecture makes it easy to iterate. If you're building something with audio on the web, I'd recommend this approach: split concerns early, use TypeScript for confidence, and test keyboard shortcuts—they're surprisingly delightful.

Check it out live on the `/waves` page. Press **?** to see all shortcuts.
