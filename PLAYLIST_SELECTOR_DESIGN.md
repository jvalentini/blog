# Playlist Selector UI Design Specification

**Created**: January 17, 2026  
**Component**: Playlist Selector for Music Player  
**Context**: Integration with existing retro terminal / phosphor green aesthetic

---

## 1. Executive Summary

The playlist selector will allow users to switch between different song collections ("AI", "Scott Adams", "Politics") while maintaining the music player's distinctive retro terminal aesthetic. The component will feature a hidden playlist reveal mechanism (triggered by 'P' key) and seamlessly integrate with the existing genre selector pattern.

### Key Design Principles
- **Retro Terminal Aesthetic**: Phosphor green (#33ff33) glow effects, monospace typography, CRT-inspired visual language
- **Visual Hierarchy**: Clear active state, subtle inactive states, dramatic hidden→revealed transitions
- **Mobile-First Responsive**: Touch-friendly targets, collapsible layouts
- **Accessibility**: Keyboard navigation, clear focus states, semantic HTML

---

## 2. Component Placement

### Desktop Layout (>900px)
```
┌─────────────────────────────────────────────────────────┐
│  QUEUE SECTION                                          │
├─────────────────────────────────────────────────────────┤
│  Queue Header                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [PLAYLIST SELECTOR]      [GENRE SELECTOR] Count  │  │
│  │  📂 Playlists:                                    │  │
│  │  [AI] [Scott Adams] [Politics*]                   │  │
│  │  * hidden by default, shown when P pressed        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Queue List...                                          │
└─────────────────────────────────────────────────────────┘
```

**Positioning**: Above the genre selector in the queue header's left section

### Mobile Layout (<768px)
```
┌──────────────────────────┐
│  Queue                   │
├──────────────────────────┤
│  📂 PLAYLISTS (stacked)  │
│  [AI]                    │
│  [Scott Adams]           │
│  [Politics*]             │
│                          │
│  🎵 GENRES (stacked)     │
│  [Hip-Hop] [Country]     │
│  [Rock] [Weird]          │
└──────────────────────────┘
```

**Positioning**: Full-width stacked above genre selector

---

## 3. Visual Design Specification

### 3.1 Container Structure

```css
.playlist-selector {
  /* Layout */
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  /* Visual treatment - matches genre-selector */
  border: 1px solid rgba(51, 255, 51, 0.2);
  border-radius: 8px;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  
  /* Glow effect */
  box-shadow: 0 0 8px rgba(51, 255, 51, 0.1);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.playlist-selector:hover {
  border-color: rgba(51, 255, 51, 0.4);
  box-shadow: 0 0 12px rgba(51, 255, 51, 0.2);
}
```

### 3.2 Icon Design

**Folder Icon (📂)** - Stylized terminal-style folder icon
```svg
<svg viewBox="0 0 32 32" width="24" height="24" fill="none">
  <!-- Base folder body -->
  <path d="M4 8 L4 24 L28 24 L28 8 Z" 
        stroke="currentColor" 
        stroke-width="2" 
        fill="rgba(51, 255, 51, 0.05)"/>
  
  <!-- Folder tab -->
  <path d="M4 8 L12 8 L14 5 L20 5 L22 8 L28 8" 
        stroke="currentColor" 
        stroke-width="2" 
        fill="none"/>
  
  <!-- Glow accent lines inside folder -->
  <line x1="8" y1="14" x2="24" y2="14" 
        stroke="currentColor" 
        stroke-width="1" 
        opacity="0.4"/>
  <line x1="8" y1="18" x2="20" y2="18" 
        stroke="currentColor" 
        stroke-width="1" 
        opacity="0.3"/>
</svg>
```

**Visual Properties**:
- Color: `var(--phosphor-base, #33ff33)`
- Glow: `drop-shadow(0 0 4px currentColor)`
- Subtle pulse animation (2s ease-in-out infinite)
- Size: 24x24px (desktop), 20x20px (mobile)

### 3.3 Playlist Button States

#### Default State (Inactive)
```css
.playlist-btn {
  /* Reset */
  background: transparent;
  border: none;
  
  /* Typography */
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  /* Colors */
  color: rgba(255, 255, 255, 0.5);
  
  /* Spacing */
  padding: 0.5rem 1rem;
  
  /* Border */
  border-right: 1px solid rgba(51, 255, 51, 0.15);
  
  /* Interaction */
  cursor: pointer;
  transition: all 0.2s ease;
}
```

#### Hover State
```css
.playlist-btn:hover:not(.active):not(.disabled) {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.03);
  text-shadow: 0 0 4px rgba(51, 255, 51, 0.3);
}
```

#### Active State (Currently Selected Playlist)
```css
.playlist-btn.active {
  /* Strong visual emphasis */
  color: var(--phosphor-bright, #66ff66);
  background: rgba(51, 255, 51, 0.12);
  
  /* Glow effects */
  text-shadow: 0 0 8px currentColor;
  box-shadow: inset 0 0 12px rgba(51, 255, 51, 0.1);
}

/* Active indicator bar */
.playlist-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg, 
    transparent, 
    var(--phosphor-base), 
    transparent
  );
  box-shadow: 0 0 8px var(--phosphor-base);
}
```

#### Hidden State (Politics playlist - before 'P' pressed)
```css
.playlist-btn.hidden {
  /* Visual treatment */
  opacity: 0;
  max-width: 0;
  padding: 0;
  overflow: hidden;
  pointer-events: none;
  
  /* Animation */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Revealed State (Politics playlist - after 'P' pressed)
```css
.playlist-btn.revealed {
  /* Reset visibility */
  opacity: 1;
  max-width: 200px; /* Generous max-width */
  padding: 0.5rem 1rem;
  
  /* Dramatic entrance */
  animation: playlist-reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes playlist-reveal {
  0% {
    opacity: 0;
    transform: translateX(-20px) scale(0.9);
    filter: blur(4px);
  }
  50% {
    opacity: 0.7;
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
    filter: blur(0);
  }
}

/* Pulsing glow when first revealed */
.playlist-btn.revealed.flash {
  animation: 
    playlist-reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    reveal-flash 1.2s ease-out 0.6s;
}

@keyframes reveal-flash {
  0%, 100% { 
    box-shadow: inset 0 0 0 rgba(51, 255, 51, 0);
    text-shadow: 0 0 0 transparent;
  }
  50% { 
    box-shadow: inset 0 0 20px rgba(51, 255, 51, 0.3);
    text-shadow: 0 0 16px var(--phosphor-bright);
  }
}
```

---

## 4. Button Group Container

```css
.playlist-toggle {
  display: flex;
  background: var(--bg-deep, #0a0c0e);
  border: 1px solid rgba(51, 255, 51, 0.15);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

/* Remove border from last visible button */
.playlist-btn:last-of-type:not(.hidden) {
  border-right: none;
}
```

---

## 5. Label Design

```css
.playlist-label {
  /* Typography */
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  
  /* Colors */
  color: rgba(51, 255, 51, 0.6);
  
  /* Icon spacing */
  display: flex;
  align-items: center;
  gap: 0.4rem;
  
  /* Subtle glow */
  text-shadow: 0 0 4px rgba(51, 255, 51, 0.15);
}
```

---

## 6. Interaction States & Behaviors

### 6.1 Default State
- **AI**: Active (green glow, indicator bar)
- **Scott Adams**: Inactive (muted gray)
- **Politics**: Hidden (opacity: 0, no space)

### 6.2 Hover Behavior
- Button background lightens slightly
- Text color brightens to 85% opacity
- Subtle text-shadow appears
- Border glow intensifies
- Transition: 200ms ease

### 6.3 Click Behavior
1. Previous active button fades to inactive state (200ms)
2. Clicked button animates to active state (200ms)
3. Queue updates to show new playlist's tracks
4. Genre selector remains visible (genres apply to active playlist)
5. Now Playing track continues unless shuffle/next is triggered

### 6.4 'P' Key Press Behavior
1. **First Press**: Politics button reveals
   - Slides in from left with blur effect (600ms cubic-bezier)
   - Flashes with pulsing glow for 1.2s
   - Becomes clickable after animation completes
   - State persists in localStorage

2. **Subsequent Presses**: Toggle visibility
   - If visible: Slide out and fade (400ms ease-out)
   - If hidden: Slide in with same reveal animation
   - State toggles in localStorage

### 6.5 Keyboard Navigation
- **Tab**: Focus cycles through visible playlist buttons
- **Arrow Left/Right**: Navigate between playlists
- **Enter/Space**: Activate focused playlist
- **P**: Toggle Politics playlist visibility
- **Escape**: Clear focus from selector

### 6.6 Focus State
```css
.playlist-btn:focus-visible {
  outline: 2px solid var(--phosphor-base);
  outline-offset: 2px;
  box-shadow: 
    0 0 0 4px rgba(51, 255, 51, 0.2),
    inset 0 0 8px rgba(51, 255, 51, 0.15);
}
```

---

## 7. Mobile Responsive Adaptations

### 7.1 Breakpoint: <768px

```css
@media (max-width: 768px) {
  .playlist-selector {
    width: 100%;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
  }
  
  /* Icon stays visible but smaller */
  .playlist-icon {
    width: 20px;
    height: 20px;
  }
  
  .playlist-toggle {
    width: 100%;
  }
  
  /* Buttons stack in two-column grid */
  .playlist-btn {
    flex: 1 1 calc(50% - 0.375rem);
    min-width: 0;
    padding: 0.5rem;
    text-align: center;
    border-right: none;
  }
  
  /* Hidden button maintains layout space when revealed */
  .playlist-btn.hidden {
    display: none; /* Complete removal on mobile */
  }
  
  .playlist-btn.revealed {
    display: flex;
    animation: mobile-playlist-reveal 0.4s ease-out;
  }
  
  @keyframes mobile-playlist-reveal {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
```

### 7.2 Touch Target Compliance
- Minimum touch target: 44x44px (meets WCAG AAA)
- Adequate spacing between buttons (8px minimum)
- No hover-dependent interactions

---

## 8. Component Hierarchy in Queue Header

### Desktop (>768px)
```
.queue-header
├── .queue-header-left (new wrapper)
│   ├── .queue-title ("Queue")
│   └── .playlist-selector
│       ├── .playlist-icon (folder SVG)
│       └── .playlist-toggle
│           ├── button.playlist-btn.active ("AI")
│           ├── button.playlist-btn ("Scott Adams")
│           └── button.playlist-btn.hidden ("Politics")
│
└── .queue-header-right
    ├── .genre-selector
    │   ├── .genre-icon
    │   └── .genre-toggle
    └── .queue-count
```

### Mobile (<768px)
```
.queue-header (flexbox column)
├── .queue-title
├── .playlist-selector (full width, stacked)
├── .genre-selector (full width, stacked)
└── .queue-count (hidden on mobile)
```

---

## 9. Animation & Transition Timeline

### Playlist Switch Animation (AI → Scott Adams)
```
0ms:    Click detected on "Scott Adams" button
0ms:    "AI" button begins fade-out of active state
        - opacity: 1 → 0.85 (100ms)
        - box-shadow blur reduces
        - indicator bar fades

100ms:  "Scott Adams" button begins active state entrance
        - background color transitions
        - text-shadow glow appears
        - indicator bar slides in from center

200ms:  Animation complete
        - Focus state updated
        - Queue list begins updating (stagger fade)

300ms:  Queue fully updated with new playlist tracks
```

### Politics Reveal Animation ('P' key press)
```
0ms:    'P' key detected
0ms:    .hidden class removed, .revealed added
        - max-width: 0 → 200px
        - opacity: 0 → 1
        - transform: translateX(-20px) scale(0.9) blur(4px)

300ms:  Mid-point blur reduction
        - filter: blur(2px)
        - opacity: 0.7

600ms:  Slide-in complete, flash begins
        - transform: translateX(0) scale(1)
        - filter: blur(0)
        - opacity: 1

750ms:  Flash peak intensity
        - box-shadow: maximum glow
        - text-shadow: maximum brightness

1200ms: Flash complete
        - .flash class removed
        - Button settles to normal revealed state
```

---

## 10. Color Palette Reference

### Base Colors (from genre-colors.json + global.css)
```css
/* Primary (Phosphor Green) */
--phosphor-dim: #1a3a1a;
--phosphor-base: #33ff33;
--phosphor-bright: #66ff66;
--phosphor-glow: rgba(51, 255, 51, 0.15);

/* Secondary (Amber) */
--amber-base: #ffb000;
--amber-bright: #ffc433;

/* Backgrounds */
--bg-deep: #050508;
--bg-base: #0a0a0f;
--bg-surface: #12121a;
--bg-elevated: #1a1a24;

/* Text */
--text-primary: #e0e0e0;
--text-secondary: #888888;
--text-muted: #555555;

/* Borders */
--border-dim: #222230;
--border-base: #333340;
```

### Playlist Selector Specific
```css
/* Container */
border-color: rgba(51, 255, 51, 0.2) → rgba(51, 255, 51, 0.4) on hover
background: rgba(0, 0, 0, 0.3)
box-shadow: 0 0 8px rgba(51, 255, 51, 0.1) → 0 0 12px rgba(51, 255, 51, 0.2)

/* Button - Inactive */
color: rgba(255, 255, 255, 0.5)
background: transparent
border: rgba(51, 255, 51, 0.15)

/* Button - Hover */
color: rgba(255, 255, 255, 0.85)
background: rgba(255, 255, 255, 0.03)

/* Button - Active */
color: #66ff66 (--phosphor-bright)
background: rgba(51, 255, 51, 0.12)
text-shadow: 0 0 8px currentColor
box-shadow: inset 0 0 12px rgba(51, 255, 51, 0.1)
```

---

## 11. Accessibility Considerations

### 11.1 Keyboard Navigation
- **Tab order**: Natural left-to-right through visible buttons
- **Arrow keys**: Left/Right navigation between playlists
- **Enter/Space**: Activate focused playlist
- **P key**: Documented in hotkeys modal (update required)
- **Focus indicators**: High-contrast 2px outline with glow

### 11.2 Screen Reader Support
```html
<div class="playlist-selector" role="radiogroup" aria-label="Playlist selection">
  <div class="playlist-toggle">
    <button 
      class="playlist-btn active" 
      role="radio" 
      aria-checked="true"
      aria-label="AI playlist - currently playing">
      AI
    </button>
    <button 
      class="playlist-btn" 
      role="radio" 
      aria-checked="false"
      aria-label="Scott Adams playlist">
      Scott Adams
    </button>
    <button 
      class="playlist-btn hidden" 
      role="radio" 
      aria-checked="false"
      aria-hidden="true"
      aria-label="Politics playlist - hidden (press P to reveal)">
      Politics
    </button>
  </div>
</div>
```

### 11.3 ARIA Live Regions
```html
<!-- Announce playlist changes -->
<div role="status" aria-live="polite" class="sr-only">
  Now viewing: AI playlist (12 tracks)
</div>

<!-- Announce Politics reveal -->
<div role="status" aria-live="assertive" class="sr-only">
  <!-- Populated when P is pressed -->
</div>
```

### 11.4 Color Contrast Ratios
- **Active text** (#66ff66 on dark): 12.3:1 (AAA)
- **Inactive text** (rgba(255,255,255,0.5)): 4.8:1 (AA)
- **Hover text** (rgba(255,255,255,0.85)): 11.2:1 (AAA)

---

## 12. Visual Mockups (ASCII Art)

### Desktop - Default State
```
┌──────────────────────────────────────────────────────────────┐
│ Queue                                                         │
├──────────────────────────────────────────────────────────────┤
│  📂 ┌──────────────────────┐    🎵 ┌────────────────┐  12    │
│     │ [✓ AI] [Scott Adams] │       │ Hip-Hop │ Rock │  tracks│
│     └──────────────────────┘       └────────────────┘        │
└──────────────────────────────────────────────────────────────┘
Legend: ✓ = active (green glow), gray = inactive, no Politics shown
```

### Desktop - 'P' Pressed (Politics Revealed)
```
┌──────────────────────────────────────────────────────────────┐
│ Queue                                                         │
├──────────────────────────────────────────────────────────────┤
│  📂 ┌────────────────────────────────┐  🎵 ┌──────────┐  12  │
│     │ [✓ AI] [Scott Adams] [⚡Politics]│     │ Hip-Hop  │  tr.│
│     └────────────────────────────────┘     └──────────┘      │
└──────────────────────────────────────────────────────────────┘
Legend: ⚡ = newly revealed (flashing glow effect for 1.2s)
```

### Desktop - Scott Adams Active
```
┌──────────────────────────────────────────────────────────────┐
│ Queue                                                         │
├──────────────────────────────────────────────────────────────┤
│  📂 ┌────────────────────────────────┐  🎵 ┌──────────┐  8   │
│     │ [AI] [✓ Scott Adams] [Politics]│     │ Hip-Hop  │  tr. │
│     └────────────────────────────────┘     └──────────┘      │
└──────────────────────────────────────────────────────────────┘
Legend: Queue count changed to 8 (Scott Adams playlist track count)
```

### Mobile - Default State
```
┌──────────────────────┐
│ Queue                │
├──────────────────────┤
│  📂 PLAYLISTS        │
│  ┌──────────────────┐│
│  │ [✓ AI]           ││
│  │ [Scott Adams]    ││
│  └──────────────────┘│
│                      │
│  🎵 GENRES           │
│  ┌──────────────────┐│
│  │ [Hip-Hop] [Rock] ││
│  │ [Country] [Weird]││
│  └──────────────────┘│
└──────────────────────┘
```

### Mobile - Politics Revealed
```
┌──────────────────────┐
│ Queue                │
├──────────────────────┤
│  📂 PLAYLISTS        │
│  ┌──────────────────┐│
│  │ [✓ AI]           ││
│  │ [Scott Adams]    ││
│  │ [⚡Politics]      ││ ← Slides in from above
│  └──────────────────┘│
│                      │
│  🎵 GENRES           │
│  ┌──────────────────┐│
│  │ [Hip-Hop] [Rock] ││
│  └──────────────────┘│
└──────────────────────┘
```

---

## 13. Implementation Notes

### 13.1 State Management
```typescript
interface PlaylistState {
  active: string;           // "AI" | "Scott Adams" | "Politics"
  hiddenRevealed: boolean;  // Politics visibility
  playlists: {
    id: string;
    label: string;
    visible: boolean;
    tracks: Track[];
  }[];
}
```

### 13.2 LocalStorage Schema
```json
{
  "musicPlayer": {
    "activePlaylist": "AI",
    "politicsRevealed": false,
    "lastPlayed": {
      "AI": { "trackId": 2, "position": 45.2 },
      "Scott Adams": { "trackId": 0, "position": 0 }
    }
  }
}
```

### 13.3 Event Handlers
```typescript
// Playlist button click
handlePlaylistClick(playlistId: string) {
  // 1. Update active state
  // 2. Load playlist tracks into queue
  // 3. Reset shuffle/repeat to playlist scope
  // 4. Keep current track playing (don't auto-switch)
  // 5. Update localStorage
  // 6. Announce to screen readers
}

// 'P' key press
handlePKeyPress() {
  // 1. Toggle politicsRevealed state
  // 2. Add/remove .revealed class
  // 3. Update aria-hidden
  // 4. Save to localStorage
  // 5. Announce reveal to screen readers if shown
  // 6. Add .flash class, remove after 1.2s
}
```

### 13.4 CSS Variable Updates
No new CSS variables needed - reuse existing:
- `--phosphor-base`, `--phosphor-bright`, `--phosphor-dim`
- `--bg-deep`, `--bg-elevated`
- `--text-secondary`, `--text-primary`
- `--font-mono`

### 13.5 Integration Points
1. **Queue Header**: Add `.queue-header-left` wrapper, move title inside
2. **Genre Selector**: Stays in `.queue-header-right`, no changes
3. **Hotkeys Modal**: Add 'P' key documentation
4. **Track Switching**: Respect playlist boundaries in shuffle/next/prev
5. **Genre Switching**: Genres apply to current active playlist only

---

## 14. Edge Cases & Behaviors

### 14.1 Empty Playlist
- Button remains clickable
- Queue shows "No tracks in this playlist" message
- Player stops if currently playing from switched-away playlist

### 14.2 Politics Playlist Initially Revealed
- If localStorage shows `politicsRevealed: true`
- Load component with Politics visible (no animation)
- 'P' key press hides it with slide-out animation

### 14.3 Playlist Switching Mid-Track
- Current track continues playing
- Queue updates to show new playlist
- Next/Previous buttons navigate within new playlist
- Shuffle pool updates to new playlist tracks

### 14.4 Genre Switching After Playlist Switch
- Genre selector shows genres available in current playlist
- Disabled genres (no version exists) show dimmed state
- Switching genre changes version of current track

---

## 15. Performance Considerations

### 15.1 Animation Performance
- Use `transform` and `opacity` for GPU acceleration
- Avoid `width` animations (use `max-width` with `overflow: hidden`)
- Enable `will-change: transform` during animations only
- Remove animation classes after completion

### 15.2 Re-renders
- Memoize playlist buttons (React.memo or similar)
- Update queue list with virtual scrolling if >100 tracks
- Debounce rapid 'P' key presses (500ms)

---

## 16. Future Enhancements

### Phase 2 (Post-MVP)
1. **Playlist Editing**: Add/remove tracks, reorder
2. **Custom Playlists**: User-created collections
3. **Playlist Import/Export**: JSON file support
4. **Smart Playlists**: Auto-populate based on tags/genres
5. **Playlist Search**: Filter tracks within active playlist
6. **Drag-to-Reorder**: Queue item reordering
7. **Context Menu**: Right-click for "Add to Playlist"

### Phase 3 (Advanced)
1. **Collaborative Playlists**: Multi-user editing
2. **Playlist Analytics**: Most played, skip rates
3. **AI Recommendations**: "You might like..." based on listening
4. **Playlist Covers**: Custom artwork per playlist

---

## 17. Testing Checklist

### Visual Regression
- [ ] Default state matches mockup
- [ ] Hover states work on all buttons
- [ ] Active state glow renders correctly
- [ ] Politics reveal animation smooth at 60fps
- [ ] Mobile layout stacks properly
- [ ] Focus indicators visible and attractive

### Functional
- [ ] Clicking AI/Scott Adams switches playlist
- [ ] Queue updates with correct tracks
- [ ] 'P' key toggles Politics visibility
- [ ] Politics reveal animation plays once
- [ ] LocalStorage persists state across sessions
- [ ] Genre selector reflects current playlist genres

### Accessibility
- [ ] Screen reader announces playlist changes
- [ ] Keyboard navigation works (Tab, Arrow keys)
- [ ] Focus indicators meet WCAG AAA contrast
- [ ] ARIA attributes correct
- [ ] Touch targets ≥44x44px on mobile

### Cross-Browser
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (WebKit)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

### Performance
- [ ] Animations run at 60fps
- [ ] No layout thrashing during reveal
- [ ] No memory leaks on repeated toggles
- [ ] Fast initial render (<100ms)

---

## 18. Design Inspiration & References

### Visual Language Inspiration
- **Fallout Terminal UI**: Green phosphor, scan lines, CRT glow
- **Alien (1979) MU-TH-UR Interface**: Retro-futuristic monospace
- **MS-DOS Era**: Simple borders, high contrast, functional beauty
- **Apollo Guidance Computer DSKY**: Utilitarian, precise, glowing indicators

### Component Pattern References
- Existing **Genre Selector**: Button group pattern, glow effects
- **Queue Item**: Hover states, swipe actions (mobile inspiration)
- **Player Controls**: Consistent button sizing and spacing

---

## 19. Conclusion

This playlist selector design seamlessly extends the music player's retro terminal aesthetic while introducing delightful interactions (hidden playlist reveal) and maintaining accessibility standards. The component reuses existing visual patterns (genre selector) for consistency while adding unique flair through animations and the 'P' key easter egg.

**Key Differentiators**:
1. **Hidden Playlist Reveal**: Playful 'P' key interaction with dramatic animation
2. **Cohesive Aesthetic**: Perfect match to phosphor green terminal theme
3. **Responsive Excellence**: Mobile-first with touch-friendly targets
4. **Accessible by Default**: WCAG AAA contrast, full keyboard support, screen reader optimized

**Next Steps**:
1. Review and approve this design specification
2. Implement PlaylistSelector.astro component
3. Update QueueList.astro to integrate selector
4. Update music player state management for playlist switching
5. Add 'P' key handler and localStorage persistence
6. Update HotkeysModal.astro with 'P' key documentation
7. Write tests for all interaction states

---

**Document Version**: 1.0  
**Status**: Ready for Implementation Review  
**Estimated Implementation Time**: 4-6 hours (component + integration + testing)
