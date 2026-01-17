# Playlist Selector - Implementation Checklist

Quick reference guide for implementing the playlist selector component.

---

## Phase 1: Component Creation

### 1.1 Create PlaylistSelector.astro Component
Location: `src/components/player/PlaylistSelector.astro`

**File Structure**:
```astro
---
interface Props {
  playlists: Array<{
    id: string;
    label: string;
    visible: boolean;
  }>;
  defaultPlaylist: string;
}

const { playlists, defaultPlaylist } = Astro.props;
---

<div class="playlist-selector">
  <!-- Icon -->
  <div class="playlist-icon">
    <!-- SVG folder icon here -->
  </div>
  
  <!-- Button group -->
  <div class="playlist-toggle" role="radiogroup" aria-label="Playlist selection">
    {playlists.map((playlist) => (
      <button 
        class:list={[
          'playlist-btn',
          { 'active': playlist.id === defaultPlaylist },
          { 'hidden': !playlist.visible }
        ]}
        data-playlist-id={playlist.id}
        role="radio"
        aria-checked={playlist.id === defaultPlaylist}
        aria-hidden={!playlist.visible}
      >
        {playlist.label}
      </button>
    ))}
  </div>
</div>

<style>
  /* Copy CSS from design spec */
</style>
```

**Tasks**:
- [ ] Create file
- [ ] Add folder icon SVG
- [ ] Add CSS from PLAYLIST_SELECTOR_DESIGN.md section 3
- [ ] Test component renders in isolation

---

## Phase 2: Data Structure Updates

### 2.1 Update tracks.json (or create playlists.json)
Location: `src/data/`

**Option A: Extend tracks.json**
```json
{
  "playlists": [
    {
      "id": "ai",
      "label": "AI",
      "visible": true,
      "songs": ["slop-slinger", "without-me", ...]
    },
    {
      "id": "scott-adams",
      "label": "Scott Adams",
      "visible": true,
      "songs": ["song-id-1", "song-id-2", ...]
    },
    {
      "id": "politics",
      "label": "Politics",
      "visible": false,
      "songs": ["song-id-3", ...]
    }
  ],
  "songs": [ /* existing songs array */ ],
  "genres": [ /* existing genres array */ ],
  "defaultGenre": "hip-hop",
  "defaultPlaylist": "ai"
}
```

**Option B: Create playlists.json**
```json
{
  "defaultPlaylist": "ai",
  "playlists": [
    /* same structure as above */
  ]
}
```

**Tasks**:
- [ ] Decide on data structure approach
- [ ] Create/update JSON file
- [ ] Organize songs into playlists
- [ ] Set default playlist

---

## Phase 3: MusicPlayer.astro Integration

### 3.1 Import Component
```astro
---
import PlaylistSelector from './player/PlaylistSelector.astro';
// ... existing imports
---
```

### 3.2 Update QueueList Integration
**Current** (QueueList.astro line 16-18):
```astro
<div class="queue-section">
  <div class="queue-header">
    <h3 class="queue-title" id="queue-title">Queue</h3>
```

**New**:
```astro
<div class="queue-section">
  <div class="queue-header">
    <div class="queue-header-left">
      <h3 class="queue-title" id="queue-title">Queue</h3>
      <PlaylistSelector 
        playlists={playlists} 
        defaultPlaylist={defaultPlaylist} 
      />
    </div>
    <div class="queue-header-right">
      <!-- genre selector stays here -->
```

### 3.3 Update Queue Header CSS
Add to QueueList.astro `<style>`:
```css
.queue-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

@media (max-width: 768px) {
  .queue-header-left {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
}
```

**Tasks**:
- [ ] Import PlaylistSelector component
- [ ] Add `.queue-header-left` wrapper
- [ ] Move queue title inside wrapper
- [ ] Add PlaylistSelector component
- [ ] Update CSS for new layout
- [ ] Test desktop layout
- [ ] Test mobile layout

---

## Phase 4: State Management

### 4.1 Create Playlist State Module
Location: `src/scripts/music-player/playlist-state.ts`

```typescript
export interface Playlist {
  id: string;
  label: string;
  visible: boolean;
  songs: string[];
}

export interface PlaylistState {
  activePlaylistId: string;
  playlists: Playlist[];
  politicsRevealed: boolean;
}

const STORAGE_KEY = 'musicPlayer.playlistState';

export function loadPlaylistState(defaultState: PlaylistState): PlaylistState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultState;
  
  try {
    const parsed = JSON.parse(stored);
    return {
      ...defaultState,
      activePlaylistId: parsed.activePlaylistId || defaultState.activePlaylistId,
      politicsRevealed: parsed.politicsRevealed || false,
    };
  } catch {
    return defaultState;
  }
}

export function savePlaylistState(state: PlaylistState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    activePlaylistId: state.activePlaylistId,
    politicsRevealed: state.politicsRevealed,
  }));
}

export function getActivePlaylist(state: PlaylistState): Playlist | undefined {
  return state.playlists.find(p => p.id === state.activePlaylistId);
}

export function getPlaylistSongs(playlistId: string, state: PlaylistState): string[] {
  const playlist = state.playlists.find(p => p.id === playlistId);
  return playlist?.songs || [];
}
```

**Tasks**:
- [ ] Create playlist-state.ts file
- [ ] Implement load/save functions
- [ ] Export helper functions
- [ ] Add TypeScript types

---

## Phase 5: Event Handlers

### 5.1 Update music-player/index.ts

**Add to initMusicPlayer function**:
```typescript
// Initialize playlist state
const playlistState = loadPlaylistState({
  activePlaylistId: config.defaultPlaylist,
  playlists: config.playlists,
  politicsRevealed: false,
});

// Update Politics button visibility on load
const politicsBtn = document.querySelector('[data-playlist-id="politics"]');
if (politicsBtn && playlistState.politicsRevealed) {
  politicsBtn.classList.remove('hidden');
  politicsBtn.classList.add('revealed');
  politicsBtn.setAttribute('aria-hidden', 'false');
}

// Playlist button click handler
document.querySelectorAll('.playlist-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.currentTarget as HTMLButtonElement;
    const playlistId = target.dataset.playlistId;
    
    if (!playlistId) return;
    
    handlePlaylistSwitch(playlistId, playlistState, config);
  });
});

// 'P' key handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'p' || e.key === 'P') {
    // Don't trigger if typing in input
    if (e.target instanceof HTMLInputElement) return;
    
    togglePoliticsPlaylist(playlistState);
  }
});
```

### 5.2 Create Handler Functions

```typescript
function handlePlaylistSwitch(
  playlistId: string, 
  state: PlaylistState,
  config: MusicPlayerConfig
): void {
  // 1. Update active state
  state.activePlaylistId = playlistId;
  
  // 2. Update button states
  document.querySelectorAll('.playlist-btn').forEach(btn => {
    const btnPlaylistId = (btn as HTMLElement).dataset.playlistId;
    const isActive = btnPlaylistId === playlistId;
    
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', String(isActive));
  });
  
  // 3. Load playlist tracks into queue
  const playlistSongs = getPlaylistSongs(playlistId, state);
  updateQueueWithPlaylist(playlistSongs, config);
  
  // 4. Update shuffle/repeat scope
  resetPlaybackControls(playlistSongs);
  
  // 5. Save state
  savePlaylistState(state);
  
  // 6. Announce to screen readers
  const playlist = getActivePlaylist(state);
  announcePlaylistChange(playlist);
}

function togglePoliticsPlaylist(state: PlaylistState): void {
  const politicsBtn = document.querySelector('[data-playlist-id="politics"]');
  if (!politicsBtn) return;
  
  state.politicsRevealed = !state.politicsRevealed;
  
  if (state.politicsRevealed) {
    // Reveal animation
    politicsBtn.classList.remove('hidden');
    politicsBtn.classList.add('revealed', 'flash');
    politicsBtn.setAttribute('aria-hidden', 'false');
    
    // Remove flash class after animation
    setTimeout(() => {
      politicsBtn.classList.remove('flash');
    }, 1800); // 600ms reveal + 1200ms flash
    
    announceToScreenReader('Politics playlist revealed. Press P again to hide.');
  } else {
    // Hide animation
    politicsBtn.classList.add('hidden');
    politicsBtn.classList.remove('revealed');
    politicsBtn.setAttribute('aria-hidden', 'true');
    
    announceToScreenReader('Politics playlist hidden.');
  }
  
  savePlaylistState(state);
}

function updateQueueWithPlaylist(songIds: string[], config: MusicPlayerConfig): void {
  // Filter config.tracks to only include songs in playlist
  const playlistTracks = config.tracks.filter(track => 
    songIds.includes(track.songId)
  );
  
  // Re-render queue list
  // (Implementation depends on existing queue rendering logic)
  renderQueue(playlistTracks);
}

function announceToScreenReader(message: string): void {
  const liveRegion = document.getElementById('playlist-announcer');
  if (liveRegion) {
    liveRegion.textContent = message;
    
    // Clear after 1 second
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}
```

**Tasks**:
- [ ] Add playlist state initialization
- [ ] Implement handlePlaylistSwitch
- [ ] Implement togglePoliticsPlaylist
- [ ] Implement updateQueueWithPlaylist
- [ ] Add keyboard handler for 'P' key
- [ ] Test playlist switching
- [ ] Test Politics reveal/hide

---

## Phase 6: Accessibility Enhancements

### 6.1 Add ARIA Live Region
In QueueList.astro, add after queue section:
```astro
<!-- Screen reader announcements -->
<div 
  id="playlist-announcer" 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  class="sr-only"
></div>
```

### 6.2 Add Keyboard Navigation
```typescript
// Arrow key navigation between playlists
document.querySelector('.playlist-toggle')?.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement;
  if (!target.classList.contains('playlist-btn')) return;
  
  const buttons = Array.from(
    document.querySelectorAll('.playlist-btn:not(.hidden)')
  ) as HTMLElement[];
  
  const currentIndex = buttons.indexOf(target);
  
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
    buttons[prevIndex]?.focus();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    const nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
    buttons[nextIndex]?.focus();
  }
});
```

**Tasks**:
- [ ] Add ARIA live region
- [ ] Implement arrow key navigation
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Test keyboard-only navigation
- [ ] Verify focus indicators visible

---

## Phase 7: Update Hotkeys Modal

### 7.1 Add 'P' Key Documentation
In HotkeysModal.astro, add new row:

```astro
<tr>
  <td class="hotkey-key">P</td>
  <td class="hotkey-action">Toggle Politics Playlist</td>
</tr>
```

**Tasks**:
- [ ] Update HotkeysModal.astro
- [ ] Test modal displays correctly
- [ ] Verify 'P' key works as documented

---

## Phase 8: Testing

### 8.1 Visual Testing
- [ ] Default state renders correctly
- [ ] AI playlist active by default
- [ ] Scott Adams playlist clickable
- [ ] Politics playlist hidden initially
- [ ] Hover states work on all buttons
- [ ] Active state shows green glow + indicator bar
- [ ] Container glow effect works on hover
- [ ] Icon renders and pulses subtly
- [ ] Mobile layout stacks properly
- [ ] Touch targets ≥44px on mobile

### 8.2 Functional Testing
- [ ] Clicking "Scott Adams" switches playlist
- [ ] Queue updates with correct tracks
- [ ] Current track continues playing during switch
- [ ] 'P' key reveals Politics playlist
- [ ] Reveal animation plays smoothly (60fps)
- [ ] Flash effect completes after 1.2s
- [ ] 'P' key toggles visibility (reveal/hide)
- [ ] State persists in localStorage
- [ ] Page reload restores Politics visibility if revealed

### 8.3 Accessibility Testing
- [ ] Tab navigates through playlist buttons
- [ ] Arrow keys navigate left/right
- [ ] Enter/Space activates focused playlist
- [ ] Focus indicators clearly visible
- [ ] Screen reader announces playlist changes
- [ ] ARIA attributes correct (role, aria-checked, aria-hidden)
- [ ] Color contrast meets WCAG AAA
- [ ] Keyboard-only navigation fully functional

### 8.4 Edge Case Testing
- [ ] Empty playlist shows "No tracks" message
- [ ] Politics revealed on load (localStorage test)
- [ ] Rapid 'P' key presses (debouncing)
- [ ] Playlist switch mid-track playback
- [ ] Genre switch after playlist switch
- [ ] Shuffle respects playlist boundaries
- [ ] Repeat respects playlist boundaries

### 8.5 Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Desktop)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

### 8.6 Performance Testing
- [ ] Reveal animation runs at 60fps
- [ ] No layout thrashing during transitions
- [ ] No memory leaks on repeated toggles
- [ ] Fast initial render (<100ms)
- [ ] Smooth on low-end devices

---

## Phase 9: Documentation

### 9.1 Update README
Add section explaining playlist feature:
```markdown
## Music Player Playlists

The music player supports multiple playlists:
- **AI**: AI-themed parody songs
- **Scott Adams**: Scott Adams-themed songs
- **Politics**: Political parody songs (hidden by default)

Press `P` to reveal/hide the Politics playlist.
```

### 9.2 Code Comments
- [ ] Add JSDoc comments to playlist-state.ts functions
- [ ] Document 'P' key behavior in music-player/index.ts
- [ ] Add component prop documentation in PlaylistSelector.astro

---

## Phase 10: Cleanup & Optimization

### 10.1 CSS Optimization
- [ ] Remove unused styles
- [ ] Consolidate duplicate rules
- [ ] Verify mobile-first approach
- [ ] Check for CSS specificity issues

### 10.2 JavaScript Optimization
- [ ] Debounce 'P' key handler (500ms)
- [ ] Cache DOM queries
- [ ] Remove event listeners on cleanup (if needed)
- [ ] Verify no memory leaks

### 10.3 Accessibility Audit
- [ ] Run axe DevTools
- [ ] Run Lighthouse accessibility scan
- [ ] Manual keyboard navigation test
- [ ] Screen reader announcement test

---

## Quick Reference: File Changes Summary

### New Files
- `src/components/player/PlaylistSelector.astro` - Main component
- `src/scripts/music-player/playlist-state.ts` - State management
- `src/data/playlists.json` (optional) - Playlist data

### Modified Files
- `src/components/MusicPlayer.astro` - Import PlaylistSelector
- `src/components/player/QueueList.astro` - Update header layout
- `src/scripts/music-player/index.ts` - Add playlist logic
- `src/components/player/HotkeysModal.astro` - Add 'P' key docs
- `src/data/tracks.json` - Add playlist structure (or keep separate)

### CSS Changes
- QueueList.astro: Add `.queue-header-left` styles
- PlaylistSelector.astro: ~200 lines of CSS from design spec

### JavaScript Changes
- music-player/index.ts: ~150 lines for playlist handling
- playlist-state.ts: ~80 lines for state management

---

## Estimated Time Breakdown

| Phase | Task | Time |
|-------|------|------|
| 1 | Create PlaylistSelector component | 1 hour |
| 2 | Update data structure | 30 min |
| 3 | Integrate with MusicPlayer | 45 min |
| 4 | Implement state management | 1 hour |
| 5 | Add event handlers | 1.5 hours |
| 6 | Accessibility enhancements | 45 min |
| 7 | Update hotkeys modal | 15 min |
| 8 | Testing (all phases) | 2 hours |
| 9 | Documentation | 30 min |
| 10 | Cleanup & optimization | 45 min |
| **Total** | | **~9 hours** |

---

## Success Criteria

✓ Component renders with correct visual design
✓ Playlist switching works smoothly
✓ Politics playlist reveals/hides with 'P' key
✓ Animations run at 60fps
✓ State persists across page reloads
✓ Full keyboard navigation support
✓ Screen reader announces changes
✓ WCAG AAA compliance
✓ No console errors
✓ Mobile responsive (tested on real devices)

---

**Status**: Ready for implementation
**Next Step**: Create PlaylistSelector.astro component (Phase 1)
