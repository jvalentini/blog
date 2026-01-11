---
title: "Building Waves: A Genre-Switching Music Player"
description: "Exploring the architecture, features, and technology behind a custom-built music player with genre variants, keyboard shortcuts, and real-time lyrics sync."
pubDate: 2026-01-11
heroImage: "../../assets/waves-hero.png"
---

I built Waves, a music player for my blog. The main feature: toggle between hip-hop and country versions of the same song. No other player does this. It's original. Started simple, grew into more.

Press G or click genre buttons. Instantly switch. Audio reloads seamlessly. Keeps playback spot and lyrics sync.

## The Idea

Came from seeing songs transform by genre. "Lose Yourself" hip-hop to country. Waves makes it happen.

Name fits the look—wave background, green phosphor like old terminals, responsive layout.

## Features

### Genre Switching

Core of Waves. Each track has two versions:
- Hip-Hop: Slop Slinger, Lose Yourself, Without Me
- Country: Same songs with country instruments

Switch instantly. Hit G key or click buttons. Player reloads audio without losing place. Lyrics stay synced.

### Keyboard Shortcuts

Waves works fully from keyboard. Here are the keys:

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← | Previous track (rewind if > 3s in) |
| → | Next track |
| ↑ | Volume up |
| ↓ | Volume down |
| M | Mute/unmute |
| S | Toggle shuffle |
| R | Cycle repeat modes (off → all → one) |
| G | Switch genre |
| / | Open terminal (if integrated) |
| ? | Show hotkeys modal |
| Esc | Close modals |

Shortcuts ignore inputs. Only fire when not typing.

### Lyrics Sync

Lyrics sync to playback. Each track has LRC files per genre. Panel scrolls and highlights lines.

Parser reads `[00:12.34] Lyric text`. No timestamps? Shows static block.

### Playback Modes

- Shuffle: Randomizes queue by genre
- Repeat: Off → All → One (indicator changes)
- Volume: 10 levels, blocks show level, click to set

### UI Feedback

The interface shows:
- Track title with glow
- Time (current / total)
- Progress bar, drag to seek
- Volume blocks, light up by level
- Queue highlights active track
- Subtle genre styling

## Architecture

### Components

Built with Astro, components split:

```
MusicPlayer.astro
├── PlayerControls.astro       (play, next, prev, shuffle, repeat)
├── ProgressBar.astro          (time slider)
├── VolumeControl.astro        (volume slider + blocks)
├── LyricsPanel.astro          (scrolling lyric display)
├── QueueList.astro            (track listing by genre)
└── HotkeysModal.astro         (keyboard shortcuts reference)
```

### TypeScript Logic

Code in `src/scripts/music-player/`, TypeScript modules:

- index.ts: Setup and events
- state.ts: Reactive store (track, genre, volume)
- audio-controller.ts: Audio wrapper (play, seek, volume)
- queue-manager.ts: Loading, shuffle, repeat, genre switch
- lyrics-sync.ts: Match time to lines, update DOM
- keyboard-shortcuts.ts: Key bindings
- types.ts: Interfaces

### Data Flow

1. tracks.json lists songs, genres, lyrics
2. Astro build reads markdown lyrics, parses LRC, sends to client
3. Client sets state, audio, listeners
4. Interactions dispatch to managers, update state, sync DOM
5. Audio events trigger time updates, drive lyrics and progress

## The Tracks

Three tracks, each in hip-hop and country.

### Slop Slinger
Quirky. Hip-hop hits hard. Country is relaxed, tells a story.

### Lose Yourself
Classic. Hip-hop energetic. Country uses acoustic sounds.

### Without Me
Moody. Genre changes the feel. Switching feels big here.

## Technical Details

### Responsive Layout

CSS grid adapts:
- Desktop: Two columns (controls left, lyrics right)
- Tablet: Stacked, fixed lyrics height
- Mobile: Single column, adjusted sizes

### Astro Build

Uses Astro for static benefits:
- Fast load from static HTML
- Islands for interactivity
- Reads lyrics at build via file API
- Mix of build data and client logic

### State in URLs

Syncs with URL. Go to /waves/slop-slinger, queues that track. Browser buttons work. Good for sharing.

### Volume Save (Later)

Starts at 70%. Ready for localStorage to save user prefs.

## Styling

Green on black, phosphor like CRTs and terminals. Elements glow. Deep shadows. Text shadows for effect.

CSS vars:
- --phosphor-base: #33ff33
- --phosphor-bright: Lighter for highlights
- --phosphor-glow: Shadow for glow
- Dark bg with opacity tweaks

## Lessons

1. HTML5 audio works well with state handling. Powers complex playback.
2. Keyboard shortcuts make it usable. Fun to use.
3. Lyrics sync needs care. Handles timing edges.
4. TypeScript modules help. Debug and add features easy.
5. Genre switch tricky. Keeps position and sync across changes.

## Next Steps

- Playlists (save/load)
- Key queue navigation
- Visualizer (bars to audio)
- Favorites via localStorage
- Embed for posts
- WebGL bg that reacts to sound

Waves began as genre variants. Became full player. Modular setup allows changes. For web audio, split early, use TypeScript, check shortcuts.

Live at /waves. Hit ? for keys.
