---
title: 'Building a Global Terminal for My Blog'
description: 'How I built a keyboard-accessible terminal interface that lets visitors navigate my blog, control the music player, and explore content using familiar Unix commands—complete with tab completion, history, and an easter egg.'
pubDate: 'Jan 15 2026'
tags: ['web', 'astro', 'typescript', 'ux']
---

## Why Build This

Most blogs are point-and-click. You click a link, you read a post, you click another link. It works, but developers live in terminals for a reason—keyboards are faster than mice.

I wanted visitors to navigate my blog the same way I navigate my filesystem. Type `cd posts` to see blog entries, `cat worklog.md` to read a post, `ls waves` to browse music tracks. The entire site accessible from a single keyboard shortcut.

The **Terminal component** is a global command-line interface on every page. Press `/` anywhere for a terminal prompt. Type commands. Navigate. Control the music player. It's a developer's blog, so it should feel like a developer's tool.

## What It Does

The Terminal is a modal overlay that appears when you press `/` (or `Escape` to close). It supports three categories of commands:

### Navigation Commands

The core file system operations that let you explore the blog:

```bash
# Change directories
cd posts          # Navigate to blog listing
cd waves          # Navigate to music player
cd about          # Navigate to about page
cd ~              # Go home

# List contents
ls                # Show main directories
ls posts          # List all blog posts (dynamically generated)
ls waves          # List all music tracks

# View files
cat worklog.md    # Open a blog post
cat slop-slinger  # Open a music track
cat about.txt     # Open about page
cat /etc/passwd   # Easter egg: user list
```

The terminal dynamically generates file listings at build time. When Astro builds the site, it scans the `src/content/blog/` directory and `src/data/tracks.json`, then injects those slugs into the terminal component. When you type `ls posts`, you're seeing the actual blog posts that exist, not hardcoded placeholders.

### Music Player Integration

When you're on the `/waves` page, the terminal gains music control commands:

```bash
play              # Start/resume playback
pause             # Pause playback
next              # Next track
prev              # Previous track
volume 70         # Set volume (0-100)
volume up         # Increase volume
volume down       # Decrease volume
mute              # Toggle mute
shuffle           # Toggle shuffle mode
repeat            # Cycle repeat modes (off → all → one)
queue             # Show current queue
info              # Display track information
```

These commands call into the music player's API, which is exposed globally as `window.musicPlayerAPI`. The terminal checks if the API exists before showing music commands in the help text, so it gracefully degrades on pages without the music player.

### Standard Unix Commands

For authenticity, the terminal implements a bunch of standard commands that developers expect:

```bash
whoami            # Show current user
pwd               # Print working directory
date              # Current date/time
uptime            # System uptime
uname             # System information
env               # Environment variables
grep pattern      # Search (placeholder)
head file         # Show file head
tail file         # Show file tail
```

Most of these are cosmetic—they return realistic-looking output but don't actually do anything. The point isn't to build a full shell; it's to make the experience *feel* like a terminal.

## The Architecture

The Terminal is a single Astro component (`Terminal.astro`) that gets included on every page via the base layout. It's entirely client-side—no server interaction required.

### Build-Time Data Injection

At build time, Astro fetches blog post slugs and song slugs, then injects them as JSON:

```astro
---
import { getCollection } from 'astro:content';
import tracksData from '../data/tracks.json';

const allPosts = await getCollection('blog');
const blogSlugs = allPosts
  .filter((post) => !post.data.draft)
  .map((post) => post.id)
  .sort();

const songSlugs = tracksData.songs.map((song) => song.id).sort();
---

<script id="terminal-data" type="application/json" 
  set:html={JSON.stringify({ blogSlugs, songSlugs })}>
</script>
```

The client-side JavaScript reads this JSON to enable tab completion and file listing. This approach means:
- The terminal always knows what content exists
- Tab completion works correctly
- No runtime API calls needed

### Command Processing

The heart of the terminal is the `processCommand()` function, which parses input and dispatches to handlers:

```typescript
function processCommand(cmd: string) {
  const trimmed = cmd.trim().toLowerCase();
  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1).join(' ');

  clearTerminalOutput();

  // Navigation commands
  if (trimmed === 'cd posts' || trimmed === 'cd blog') {
    navigate('/blog', 'Navigating to posts...');
  }
  // ... more command handlers
}
```

Each command category has its own handler block. The code is intentionally straightforward—no complex parsing, just string matching. This makes it easy to add new commands and keeps the bundle size small.

### Tab Completion

Tab completion makes the terminal feel real. Press `Tab` once to complete a command or argument; press it twice to see all available options:

```typescript
function handleTabCompletion(input: string, isDoubleTab: boolean) {
  const parts = input.split(/\s+/);
  const command = parts[0];
  const arg = parts[1] || '';

  // Command completion
  if (parts.length === 1) {
    const commands = ['cd', 'ls', 'cat', 'open', 'clear', 'exit', 'help'];
    const matches = commands.filter(cmd => cmd.startsWith(input));
    if (matches.length === 1) {
      return { completed: matches[0] + ' ', showOptions: [] };
    }
    if (isDoubleTab) {
      return { completed: input, showOptions: matches };
    }
  }

  // Argument completion for cd
  if (command === 'cd') {
    const dirs = ['posts', 'waves', 'about', '~', 'home'];
    const matches = dirs.filter(dir => dir.startsWith(arg));
    // ... completion logic
  }

  // File completion for cat
  if (command === 'cat') {
    // Check blogSlugs and songSlugs
    const allFiles = [...blogSlugs, ...songSlugs];
    const matches = allFiles.filter(file => file.startsWith(arg));
    // ... completion logic
  }
}
```

The completion system is smart enough to:
- Complete commands (`cd <TAB>` → `cd posts`)
- Complete directory names (`cd pos<TAB>` → `cd posts`)
- Complete file names (`cat work<TAB>` → `cat worklog.md`)
- Show options on double-tab (`cd <TAB><TAB>` shows all directories)

### History Navigation

The terminal maintains a command history array and supports arrow key navigation:

```typescript
let terminalHistory: string[] = [];
let historyIndex = -1;

// On Enter
terminalHistory.push(cmd);
historyIndex = terminalHistory.length;

// On ArrowUp
if (historyIndex > 0) {
  historyIndex--;
  terminalInput.value = terminalHistory[historyIndex] || '';
}

// On ArrowDown
if (historyIndex < terminalHistory.length - 1) {
  historyIndex++;
  terminalInput.value = terminalHistory[historyIndex] || '';
}
```

History persists for the session but doesn't survive page reloads. That's intentional—it keeps the experience lightweight and avoids localStorage complexity.

### Dynamic Host Updates

The terminal prompt shows the current "host" based on the page you're on:

```typescript
function updateHost() {
  const path = window.location.pathname;
  if (path.startsWith('/waves')) {
    terminalHost.textContent = 'waves';
  } else if (path.startsWith('/blog')) {
    terminalHost.textContent = 'blog';
  } else if (path === '/about') {
    terminalHost.textContent = 'about';
  } else {
    terminalHost.textContent = 'blog';
  }
}
```

The prompt looks like `justin.valentini@blog:~$`, and the host part updates as you navigate. It's a small detail, but it makes the terminal feel integrated with the site structure.

## The Easter Egg

No terminal would be complete without an easter egg. Try typing `sudo rm -rf /`:

```typescript
if (trimmed === 'sudo rm -rf /' || trimmed === 'sudo rm -rf /*') {
  triggerDestruction();
}
```

This triggers a full-screen "system destruction" animation:
1. A fake BIOS screen appears
2. Hardware detection messages scroll
3. The screen glitches and shows a "BIOS" logo
4. Eventually, it resets back to normal

The destruction sequence is entirely CSS animations and JavaScript timers. Harmless, but it gets a reaction.

## Integration with Music Player

The terminal integrates with the music player via a global API. When the music player initializes, it exposes:

```typescript
window.musicPlayerAPI = {
  playNext: () => void;
  playPrevious: () => void;
  pauseAudio: () => void;
  playAudio: () => void;
  setVolume: (level: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  getState: () => MusicPlayerState;
};
```

The terminal checks for this API before showing music commands:

```typescript
function hasMusicPlayer(): boolean {
  return typeof window.musicPlayerAPI !== 'undefined';
}

// In help command
if (hasMusicPlayer()) {
  print('<span class="cmd">play</span> · <span class="cmd">pause</span> ...');
}
```

The terminal works on all pages—it just doesn't show music commands when the player isn't available. Commands like `play` and `pause` close the terminal after executing, so you can quickly control playback without the modal blocking the view.

## Styling the Terminal

The terminal uses a phosphor green aesthetic that matches the rest of the blog:

```css
.terminal-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.terminal-prompt-bar {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(51, 255, 51, 0.4);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(51, 255, 51, 0.2);
}
```

The prompt bar is a single-line input (not a full terminal window), which keeps the UI minimal. Output appears in a popup above the prompt when commands produce results.

## Keyboard Shortcuts

The terminal is designed to be keyboard-first:

- `/` - Open terminal (global, ignores input fields)
- `Escape` - Close terminal
- `Enter` - Execute command
- `Tab` - Complete command/argument
- `Tab Tab` - Show completion options
- `Arrow Up/Down` - Navigate history

The global keyboard listener checks if you're typing in an input field before opening the terminal:

```typescript
document.addEventListener('keydown', function(e) {
  // Ignore if typing in input fields
  if (e.target instanceof HTMLInputElement || 
      e.target instanceof HTMLTextAreaElement || 
      (e.target as HTMLElement).isContentEditable) {
    return;
  }

  if (e.key === '/') {
    e.preventDefault();
    openTerminal();
  }
});
```

This prevents the terminal from opening when you're typing in a search box or comment form.

## What It's Good For

Fast navigation: `cd posts` and Enter is quicker than clicking through menus. Content discovery: `ls posts` shows all posts at once. Music control: pause or skip tracks without leaving the page.

And there's something satisfying about typing `cat worklog.md` to read a post, or `sudo rm -rf /` to watch the screen glitch out. It turns browsing into something you interact with.

## Lessons Learned

1. **Build-time data injection is powerful**. By generating the file list at build time, the terminal always knows what content exists without runtime API calls.

2. **Simple string matching beats complex parsing**. The command processor uses straightforward `if/else` chains. It's not elegant, but it's readable and easy to extend.

3. **Tab completion is non-negotiable**. Without it, the terminal feels fake.

4. **Easter eggs get noticed**. The `sudo rm -rf /` easter egg gets more comments than I expected. People like surprises.

5. **Global keyboard shortcuts need careful handling**. Checking for input fields prevents the terminal from opening at bad times.

6. **Make integrations optional**. The music player integration works when present, doesn't break when absent. Simple.

7. **Keep the UI minimal**. A full terminal window would be too much. Single-line prompt, popup for output.

## Try It

The Terminal is live on every page of my blog. Press `/` anywhere to open it, then try:

```bash
help              # See all commands
cd posts          # Navigate to blog
ls posts          # List all posts
cat worklog.md    # Open a post
cd waves          # Go to music player
play              # Start playback (if on /waves)
```

If you're building a developer-focused site, a terminal interface isn't as hard as it sounds. And you get to add easter eggs.

---

*The Terminal component is part of my blog's codebase. Check out the [source code](https://github.com/jvalentini/blog) to see how it all fits together.*
