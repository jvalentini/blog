# jval.dev Design System

## 1. Atmosphere & Identity

jval.dev feels like a working terminal for a technical blog: compact, dark, readable, and deliberately phosphor-lit. The signature is the CRT command surface: mono typography, green/amber signal colors, faint scanlines, and restrained glow used to communicate interaction rather than decoration.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/deep | `--bg-deep` | N/A | `#050508` | Terminal wells, code blocks, deepest panels |
| Surface/base | `--bg-base` | N/A | `#0a0a0f` | Page background |
| Surface/default | `--bg-surface` | N/A | `#12121a` | Cards and panels |
| Surface/elevated | `--bg-elevated` | N/A | `#1a1a24` | Raised controls and embedded tools |
| Text/primary | `--text-primary` | N/A | `#e0e0e0` | Body text |
| Text/secondary | `--text-secondary` | N/A | `#a0a0a8` | Captions and secondary labels |
| Text/muted | `--text-muted` | N/A | `#8a8a92` | Disabled or quiet metadata |
| Text/bright | `--text-bright` | N/A | `#ffffff` | Headings and active text |
| Accent/phosphor | `--phosphor-base` | N/A | `#33ff33` | Primary controls, active states, links |
| Accent/phosphor-dim | `--phosphor-dim` | N/A | `#2fbf2f` | Low-emphasis terminal text that must still pass contrast |
| Accent/phosphor-bright | `--phosphor-bright` | N/A | `#66ff66` | Hover and emphasis |
| Accent/amber | `--amber-base` | N/A | `#ffb000` | Warnings, metadata, alternate command accent |
| Border/default | `--border-base` | N/A | `#333340` | Panel boundaries |
| Border/subtle | `--border-dim` | N/A | `#222230` | Interior dividers |

### Rules

- Phosphor green is the primary interactive color. Amber is secondary and should not compete with green on the same control.
- Genre colors may override the phosphor accent inside the Waves player only.
- New colors must be added here before use.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | `2.5rem` | 700 | 1.2 | 0 | Waves hero title |
| H1 | `2rem` | 600 | 1.3 | 0 | Page titles |
| H2 | `1.5rem` | 600 | 1.3 | 0 | Section headers |
| H3 | `1.25rem` | 600 | 1.4 | 0 | Panel titles |
| Body/lg | `1.125rem` | 400 | 1.7 | 0 | Lead copy |
| Body | `1rem` | 400 | 1.7 | 0 | Default text |
| Body/sm | `0.875rem` | 400 | 1.5 | 0 | Secondary UI copy |
| Caption | `0.8125rem` | 500 | 1.4 | 0 | Labels and metadata |

### Font Stack

- Primary: `SF Mono`, `Fira Code`, `Consolas`, `Liberation Mono`, monospace.
- Mono: same as primary.

### Rules

- The site is mono-first. Do not introduce a second family unless the whole design direction changes.
- Body text never goes below `0.875rem`; visible UI captions never go below `0.8125rem`.
- Letter spacing stays at `0` unless matching the existing uppercase command-label pattern.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a 4px base through the existing global tokens.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `0.25rem` | Tight icon and text gaps |
| `--space-sm` | `0.5rem` | Compact inline groups |
| `--space-md` | `1rem` | Standard control and paragraph spacing |
| `--space-lg` | `1.5rem` | Panel padding |
| `--space-xl` | `2rem` | Section-internal rhythm |
| `--space-2xl` | `3rem` | Major content separation |
| `--space-3xl` | `4rem` | Page-level breathing room |

### Grid

- Max content width: `--content-width` at 720px; `--content-wide` at 900px; Waves uses an explicit 1100px page shell.
- Breakpoints follow existing CSS media queries at 768px and 900px.

### Rules

- Prefer existing spacing tokens over raw values.
- Audio/player surfaces can be denser than blog prose, but must keep 44px minimum touch targets.

## 5. Components

### Terminal Panel

- **Structure**: dark surface, subtle border, mono label, phosphor or amber accent.
- **Spacing**: `--space-md` to `--space-lg`.
- **States**: hover increases border/accent glow; focus uses visible phosphor outline.
- **Accessibility**: semantic controls first; ARIA only where native semantics are insufficient.
- **Motion**: opacity/transform only, using `--transition-fast` or `--transition-base`.

### Waves Player

- **Structure**: hero audio surface, playlist selector, controls, queue list, optional lyrics panel.
- **Variants**: music playlist with genre controls; single-genre audiobook playlist with genre controls hidden.
- **Spacing**: dense control rows, readable queue rows, no nested cards.
- **States**: active track, hover, focus, disabled genre, download progress.
- **Accessibility**: keyboard playback controls, radiogroup playlist selector, visible focus states.
- **Motion**: transform/opacity and glow transitions only.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 150ms | ease | Button hover and active states |
| Standard | 250ms | ease | Control transitions |
| Emphasis | 600ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Playlist reveal |

### Rules

- Animate `transform`, `opacity`, `filter`, and glow only.
- Respect `prefers-reduced-motion`.
- Every interactive element has hover, active, and focus states.

## 7. Depth & Surface

### Strategy

Depth is mixed but disciplined: dark tonal shifts plus thin borders, with glow reserved for interactive emphasis.

| Level | Value | Usage |
|-------|-------|-------|
| Subtle glow | `--glow-sm` | Inline links and small active controls |
| Default glow | `--glow-md` | Focused player elements |
| Prominent glow | `--glow-lg` | Hero/player emphasis |

### Rules

- Cards and panels use 8px to 12px radius; small controls use 4px to 8px.
- Do not introduce decorative gradient orbs or unrelated background effects.
