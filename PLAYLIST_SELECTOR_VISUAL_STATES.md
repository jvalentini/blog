# Playlist Selector - Visual State Reference

Visual guide for implementing the playlist selector component states.

---

## Button State Visual Reference

### State 1: Inactive Button (Scott Adams - not selected)
```
┌──────────────────┐
│  SCOTT ADAMS     │  ← Text: rgba(255,255,255,0.5)
└──────────────────┘  ← Background: transparent
                      ← Border-right: rgba(51,255,51,0.15)
                      ← No shadow, no glow
```

**CSS Snapshot**:
```css
color: rgba(255, 255, 255, 0.5);
background: transparent;
border-right: 1px solid rgba(51, 255, 51, 0.15);
text-shadow: none;
box-shadow: none;
```

---

### State 2: Hover (Scott Adams - mouse over)
```
┌──────────────────┐
│  SCOTT ADAMS     │  ← Text: rgba(255,255,255,0.85) + subtle glow
└──────────────────┘  ← Background: rgba(255,255,255,0.03)
   ╰─ subtle glow ─╯  ← Glow: text-shadow(0 0 4px rgba(51,255,51,0.3))
```

**CSS Snapshot**:
```css
color: rgba(255, 255, 255, 0.85);
background: rgba(255, 255, 255, 0.03);
text-shadow: 0 0 4px rgba(51, 255, 51, 0.3);
cursor: pointer;
```

---

### State 3: Active (AI - currently selected)
```
╔══════════════════╗
║ ✓ AI             ║  ← Text: #66ff66 (phosphor-bright)
╠══════════════════╣  ← Background: rgba(51,255,51,0.12) 
║ ▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂ ║  ← Inner glow: box-shadow inset
╚══════════════════╝  ← Bottom bar: gradient with glow
        ▔▔▔            ← Indicator bar (2px height)
   ╰─ strong glow ─╯
```

**CSS Snapshot**:
```css
color: var(--phosphor-bright, #66ff66);
background: rgba(51, 255, 51, 0.12);
text-shadow: 0 0 8px currentColor;
box-shadow: inset 0 0 12px rgba(51, 255, 51, 0.1);

/* ::after pseudo-element for indicator bar */
&::after {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #33ff33, transparent);
  box-shadow: 0 0 8px #33ff33;
}
```

---

### State 4: Hidden (Politics - before 'P' key)
```
                      ← Completely invisible
                      ← Takes no space in layout
                      ← opacity: 0
                      ← max-width: 0
                      ← pointer-events: none
```

**CSS Snapshot**:
```css
opacity: 0;
max-width: 0;
padding: 0;
overflow: hidden;
pointer-events: none;
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
```

---

### State 5: Revealing (Politics - animation in progress)
```
Frame 1 (0ms):
  [blur]            ← translateX(-20px), scale(0.9), blur(4px)
  
Frame 2 (300ms):
  P[blur]           ← translateX(-10px), blur(2px), opacity: 0.7
  
Frame 3 (600ms):
┌──────────────┐
│  POLITICS    │    ← translateX(0), scale(1), blur(0), opacity: 1
└──────────────┘

Flash begins (600-1200ms):
╔══════════════╗
║ ⚡POLITICS   ║    ← Pulsing glow effect
╚══════════════╝
   ╰─ FLASH! ─╯   ← box-shadow & text-shadow pulse

Final (1200ms+):
┌──────────────┐
│  POLITICS    │    ← Normal revealed state (same as inactive)
└──────────────┘
```

**Animation Keyframes**:
```css
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

@keyframes reveal-flash {
  0%, 100% { 
    box-shadow: inset 0 0 0 rgba(51, 255, 51, 0);
    text-shadow: 0 0 0 transparent;
  }
  50% { 
    box-shadow: inset 0 0 20px rgba(51, 255, 51, 0.3);
    text-shadow: 0 0 16px #66ff66;
  }
}
```

---

### State 6: Focus (keyboard navigation)
```
╔══════════════════╗
║  SCOTT ADAMS     ║  ← 2px outline, 2px offset
╠══════════════════╣  ← Outline color: #33ff33
║   ░░ focus ░░    ║  ← Additional glow around outline
╚══════════════════╝
  ╰──────╮╭──────╯
    outline + glow
```

**CSS Snapshot**:
```css
&:focus-visible {
  outline: 2px solid var(--phosphor-base, #33ff33);
  outline-offset: 2px;
  box-shadow: 
    0 0 0 4px rgba(51, 255, 51, 0.2),
    inset 0 0 8px rgba(51, 255, 51, 0.15);
}
```

---

## Container States

### Container: Default
```
┌─────────────────────────────────────────┐
│ 📂 ┌─────────────────────────────┐      │
│    │ [✓ AI] | [Scott Adams]      │      │  ← Border: rgba(51,255,51,0.2)
│    └─────────────────────────────┘      │  ← Background: rgba(0,0,0,0.3)
└─────────────────────────────────────────┘  ← Box-shadow: 0 0 8px rgba(51,255,51,0.1)
  ╰────────── subtle glow ──────────╯
```

---

### Container: Hover
```
┌─────────────────────────────────────────┐
│ 📂 ┌─────────────────────────────┐      │
│    │ [✓ AI] | [Scott Adams]      │      │  ← Border: rgba(51,255,51,0.4)
│    └─────────────────────────────┘      │  ← Background: unchanged
└─────────────────────────────────────────┘  ← Box-shadow: 0 0 12px rgba(51,255,51,0.2)
  ╰────────── stronger glow ────────╯
```

---

### Container: Politics Revealed
```
┌──────────────────────────────────────────────────┐
│ 📂 ┌────────────────────────────────────────┐    │
│    │ [✓ AI] | [Scott Adams] | [Politics]   │    │  ← Expanded width
│    └────────────────────────────────────────┘    │  ← Same styling
└──────────────────────────────────────────────────┘
              ╰──── Politics slides in here ────╯
```

---

## Icon Visual Reference

### Folder Icon (Phosphor Green Glow)
```
        ┌────────┐
       ╱          ╲
      ╱            ╲
     ├──────────────┤
     │   📁         │  ← Folder body with subtle internal glow lines
     │   ─────      │  ← Line 1 (opacity: 0.4)
     │   ────       │  ← Line 2 (opacity: 0.3)
     └──────────────┘
     
Color: var(--phosphor-base)
Glow: drop-shadow(0 0 4px currentColor)
Size: 24x24px
Animation: Subtle pulse (2s loop)
```

**SVG Code**:
```svg
<svg viewBox="0 0 32 32" width="24" height="24" fill="none" 
     style="color: var(--phosphor-base); 
            filter: drop-shadow(0 0 4px currentColor);">
  <!-- Folder body -->
  <path d="M4 8 L4 24 L28 24 L28 8 Z" 
        stroke="currentColor" 
        stroke-width="2" 
        fill="rgba(51, 255, 51, 0.05)"/>
  
  <!-- Folder tab -->
  <path d="M4 8 L12 8 L14 5 L20 5 L22 8 L28 8" 
        stroke="currentColor" 
        stroke-width="2" 
        fill="none"/>
  
  <!-- Internal glow lines -->
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

---

## Mobile Layout Visual Reference

### Mobile: Stacked Layout (<768px)
```
┌────────────────────────────┐
│  📂 PLAYLISTS              │  ← Label (uppercase, 0.65rem)
│  ┌────────────────────────┐│
│  │ ┌────────┐ ┌─────────┐ ││  ← Two-column button grid
│  │ │ ✓ AI   │ │ Scott A.│ ││
│  │ └────────┘ └─────────┘ ││
│  │ ┌─────────────────────┐││  ← Full-width when revealed
│  │ │ ⚡ Politics         │││
│  │ └─────────────────────┘││
│  └────────────────────────┘│
└────────────────────────────┘

Button size: 
- Min-height: 44px (touch target)
- Padding: 0.5rem
- Full-width on single button rows
- 50% width on paired rows
```

---

## Color Transition Examples

### Inactive → Hover Transition (200ms)
```
Time:  0ms          100ms         200ms
       ┌──────┐    ┌──────┐    ┌──────┐
Text:  █░░░░░ →    ██████░ →    ███████   (50% → 75% → 85% white)
BG:    ░░░░░░ →    ░░░░░░ →    █░░░░░    (transparent → 3% white)
Glow:  ░░░░░░ →    ░░░░░░ →    ░░█░░░    (none → subtle)
```

---

### Hover → Active Transition (200ms)
```
Time:  0ms          100ms         200ms
       ┌──────┐    ┌──────┐    ┌──────┐
Text:  ▓▓▓▓▓▓ →    ████▓▓ →    ██████   (85% white → phosphor)
BG:    █░░░░░ →    ██░░░░ →    ██████   (3% white → 12% green)
Glow:  ░░█░░░ →    ░███░░ →    ██████   (subtle → strong)
Bar:   ░░░░░░ →    ░░░█░░ →    ██████   (none → indicator appears)
```

---

### Inactive → Active Transition (200ms)
```
Time:  0ms          100ms         200ms
       ┌──────┐    ┌──────┐    ┌──────┐
Text:  █░░░░░ →    ███░░░ →    ██████   (50% white → phosphor)
BG:    ░░░░░░ →    ░░░░░░ →    ██████   (transparent → 12% green)
Glow:  ░░░░░░ →    ░░░█░░ →    ██████   (none → strong)
Bar:   ░░░░░░ →    ░░░░░░ →    ▂▂▂▂▂▂   (none → indicator appears)
```

---

## Glow Effect Reference

### Text Glow Levels
```
None:       SCOTT ADAMS           (no text-shadow)

Subtle:     S̲C̲O̲T̲T̲ ̲A̲D̲A̲M̲S̲          (text-shadow: 0 0 4px rgba(51,255,51,0.3))

Medium:     S̳C̳O̳T̳T̳ ̳A̳D̳A̳M̳S̳          (text-shadow: 0 0 8px currentColor)

Strong:     S͟C͟O͟T͟T͟ ͟A͟D͟A͟M͟S͟          (text-shadow: 0 0 16px #66ff66)
```

### Box Glow Levels
```
Container Default:
  box-shadow: 0 0 8px rgba(51, 255, 51, 0.1);
  
Container Hover:
  box-shadow: 0 0 12px rgba(51, 255, 51, 0.2);
  
Button Active:
  box-shadow: inset 0 0 12px rgba(51, 255, 51, 0.1);
  
Button Active + Control Active:
  box-shadow: 
    0 0 16px rgba(51, 255, 51, 0.5),
    0 0 8px rgba(51, 255, 51, 0.3);
```

### Indicator Bar Glow
```
Normal:
  background: linear-gradient(90deg, transparent, #33ff33, transparent);
  box-shadow: 0 0 8px #33ff33;

Flash Peak:
  background: linear-gradient(90deg, transparent, #66ff66, transparent);
  box-shadow: 0 0 16px #66ff66, 0 0 8px #33ff33;
```

---

## Spacing & Sizing Reference

### Desktop Button Dimensions
```
┌─────────────────────────────────┐
│  Padding: 0.5rem 1rem           │
│  ┌───────────────────────────┐  │  ← Height: auto (based on padding + font)
│  │  SCOTT ADAMS              │  │  ← Font: 0.75rem
│  │  (12px padding top/bottom)│  │  ← Line-height: normal
│  └───────────────────────────┘  │  ← Width: auto (based on content)
│         16px ←→               │  │
└─────────────────────────────────┘

Total approx height: 36px
Total approx width: 120-140px (varies by label length)
```

### Mobile Button Dimensions
```
┌─────────────────────────┐
│  Padding: 0.5rem        │
│  ┌───────────────────┐  │  ← Min-height: 44px (WCAG touch target)
│  │   SCOTT ADAMS     │  │  ← Font: 0.75rem
│  │                   │  │  ← Flex: 1 1 calc(50% - 0.375rem)
│  └───────────────────┘  │
│    8px ←→             │  │
└─────────────────────────┘

Width: 50% of container minus gap
Height: Minimum 44px for touch accessibility
```

### Container Spacing
```
Desktop:
  padding: 0.5rem (8px)
  gap: 0.75rem (12px) between icon and buttons
  border-radius: 8px
  
Mobile:
  padding: 0.75rem (12px)
  gap: 0.5rem (8px) between label and buttons
  border-radius: 8px (unchanged)
```

---

## Z-Index & Layering

```
Layer 5: Focus outline         (z-index: auto, outline renders above)
Layer 4: Active indicator bar  (::after pseudo, z-index: 1)
Layer 3: Button text           (z-index: 1)
Layer 2: Button background     (z-index: auto)
Layer 1: Container background  (z-index: auto)
Layer 0: Queue section         (z-index: auto)
```

No z-index conflicts - all layers render naturally based on DOM order and pseudo-elements.

---

## Accessibility Visual Indicators

### Screen Reader Only Text
```html
<span class="sr-only">
  Currently viewing AI playlist
</span>

CSS:
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Focus Ring Visual
```
┌──────────────────────────┐
│ ╔════════════════════╗   │  ← Outer glow (4px spread, 20% opacity)
│ ║  SCOTT ADAMS       ║   │  ← Solid outline (2px, phosphor-base)
│ ╚════════════════════╝   │  ← 2px offset from button edge
└──────────────────────────┘

Total visual footprint extends 6-8px beyond button
```

---

## Print Styles (Future Enhancement)

```css
@media print {
  .playlist-selector {
    border: 1px solid #000;
    box-shadow: none;
  }
  
  .playlist-btn {
    color: #000;
    border-right: 1px solid #000;
  }
  
  .playlist-btn.active {
    font-weight: bold;
    background: #f0f0f0;
  }
  
  .playlist-btn.hidden {
    display: none;
  }
  
  /* Remove all glow/shadow effects */
  * {
    text-shadow: none !important;
    box-shadow: none !important;
  }
}
```

---

## Performance Visual Indicators

### GPU-Accelerated Properties
✓ `transform` (translateX, scale)
✓ `opacity`
✓ `filter` (blur - use sparingly)

### CPU-Heavy Properties (Avoid Animating)
✗ `width` / `height`
✗ `padding` (layout thrashing)
✗ `border-width`
✗ `box-shadow` blur radius (better: fade opacity)

### will-change Usage
```css
/* Add during animation only */
.playlist-btn.revealing {
  will-change: transform, opacity;
}

/* Remove after animation */
.playlist-btn.revealed.animation-complete {
  will-change: auto;
}
```

---

**Visual States Summary**:
1. ✓ Inactive - Muted gray, no glow
2. ✓ Hover - Brightened, subtle glow
3. ✓ Active - Strong green glow, indicator bar
4. ✓ Hidden - Invisible, no space
5. ✓ Revealing - Slide + blur + flash animation
6. ✓ Focus - Outline + glow ring

All states designed for 60fps performance and WCAG AAA accessibility.
