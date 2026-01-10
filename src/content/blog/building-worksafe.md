---
title: 'Building WorkSafe: A Profanity Filter with an Office Space Theme'
description: 'How I built a TPS Report Compliance System that transforms your unfiltered workplace rage into professional communication - complete with greenbar paper, CRT monitors, and Milton''s stapler.'
pubDate: 'Jan 01 2026'
heroImage: 'https://raw.githubusercontent.com/jvalentini/worksafe/master/banner.png'
---

## The Problem

We've all been there. You're staring at a Slack message draft that reads "This is bullshit. Why can't you idiots figure this out?" and you know—you *know*—you can't send it. So you take a deep breath, delete everything, and spend five minutes crafting something diplomatic.

What if you didn't have to?

**WorkSafe** is a browser-based "TPS Report Compliance System" that takes your raw, unfiltered thoughts and transforms them into workplace-appropriate text. Speak your frustrations into a CRT monitor interface or paste your angry draft into greenbar computer paper, and get back something you can actually send to your coworkers.

And yes, it looks like it was built in 1999—*on purpose*.

## What It Does

WorkSafe operates in two modes:

### Dictionary Mode (Local, Instant)

Pattern-based replacement that runs entirely in your browser. No data leaves your machine.

**Input:**
> "This is bullshit. Why can't you idiots figure this out? I'm sick of explaining the same damn thing."

**Output:**
> "This is nonsense. Would it be possible to work through the details? I'd like to address explaining the same darn thing."

### AI Mode (Context-Aware)

For smarter rewrites, WorkSafe can send your text to OpenAI's `gpt-4o-mini` for context-aware transformation:

**AI Output:**
> "I find this situation concerning. I'd appreciate if we could collaborate on finding a solution. I've noticed we've discussed this topic several times, and I'd like to ensure we're aligned going forward."

The difference is significant. Dictionary mode does mechanical word swapping—it's fast and private, but the output can sound stilted. AI mode understands context and produces genuinely professional prose.

## The Detection Engine

The heart of WorkSafe is its detection system, which identifies four categories of problematic language:

| Category | Examples | Replacement Strategy |
|----------|----------|---------------------|
| **Profanity** | f*ck, sh*t, damn | Direct word substitution |
| **Insults** | idiot, stupid, moron | Neutral alternatives |
| **Aggressive phrases** | "You always...", "Why can't you..." | Reframe as collaborative |
| **Passive-aggressive** | "Per my last email", "As I mentioned" | Remove or soften |

The profanity detection uses the excellent [obscenity](https://github.com/jo3-l/obscenity) library, which handles creative spellings and obfuscation attempts. For everything else, I built custom pattern matchers:

```typescript
export const aggressivePhrases: PhraseReplacement[] = [
  {
    pattern: /\byou always\b/gi,
    replacement: "it sometimes happens that",
  },
  {
    pattern: /\bwhy can't you\b/gi,
    replacement: "would it be possible to",
  },
  {
    pattern: /\bI'm sick of\b/gi,
    replacement: "I'd like to address",
  },
  {
    pattern: /\bthis is ridiculous\b/gi,
    replacement: "this is unexpected",
  },
];
```

The key insight: aggressive language often uses "you" statements that assign blame. The replacements reframe these as collaborative observations or requests.

## The CRT Monitor Voice Interface

The most satisfying feature is voice input presented as a retro CRT monitor. Click the record button, rant about your coworkers, and watch the green waveform oscillate while your words get transcribed in real-time.

The Web Speech API integration is wrapped in a Vue component that renders a canvas-based waveform:

```typescript
// VoiceInput.vue
const waveformCanvas = ref<HTMLCanvasElement | null>(null);
let animationFrame: number;

function animateWaveform() {
  if (!waveformCanvas.value) return;
  
  const ctx = waveformCanvas.value.getContext("2d");
  const width = waveformCanvas.value.width;
  const height = waveformCanvas.value.height;
  
  ctx.fillStyle = "#1a1a1a"; // CRT black
  ctx.fillRect(0, 0, width, height);
  
  if (isRecording.value) {
    // Draw animated sine wave in phosphor green
    ctx.strokeStyle = "#00ff41";
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x < width; x++) {
      const y = height / 2 + Math.sin(x * 0.02 + Date.now() * 0.005) * 20;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else {
    // Flat line when idle
    ctx.strokeStyle = "#00ff41";
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }
  
  animationFrame = requestAnimationFrame(animateWaveform);
}
```

The waveform runs continuously at 60fps, giving you that authentic oscilloscope feel. Combined with CRT scanlines overlay (via CSS pseudo-elements), it's surprisingly immersive.

The speech recognition itself uses the standard Web Speech API:

```typescript
export class SpeechHandler {
  private recognition: SpeechRecognition | null = null;

  private initRecognition(): void {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          this.fullTranscript += `${result[0].transcript} `;
          this.onTranscript(this.fullTranscript.trim(), true);
        }
      }
    };
  }
}
```

**Caveat:** Web Speech API only works in Chromium-based browsers. Firefox and Safari users get text input only (styled as greenbar paper forms).

## The Office Space Theme

The original version was functional but boring—a standard web form with basic styling. Then I had a thought: what if a profanity filter looked like it came straight out of the 1999 movie *Office Space*?

The redesign became a "TPS Report Compliance System" with:

- **Greenbar computer paper** backgrounds with authentic 24px stripe patterns
- **Bill Lumbergh's quote** prominently displayed: "Yeah, I'm going to need you to use professional language. That would be great."
- **CRT monitor interface** for voice input with phosphor green (#00FF41) waveform display
- **Post-it notes** as section dividers (yellow, pink, blue, green, orange)
- **Rubber stamps** (APPROVED, INTERNAL USE ONLY) that slam in on page load
- **Flair badges** from Chotchkie's as decorative pins
- **Swingline red** color scheme (Milton's beloved stapler) for primary actions
- **Dot matrix printer fonts** (VT323) for authentic 90s computer output
- **Perforated paper edges** with circular hole patterns

The aesthetic isn't parody—it's *authentic*. Every detail is researched from actual 90s office equipment. The greenbar stripes use the real 24px rhythm. The CRT green matches the actual phosphor color. Even the post-it note curl is subtle, not exaggerated.

### Key Design Elements

**TPS Header Component:**
```vue
<template>
  <header class="tps-header">
    <div class="perforation-strip"></div>
    <div class="logo-area">
      <img src="/stapler.png" alt="Red Swingline Stapler" />
      <h1>WORKSAFE<sup>®</sup></h1>
      <div class="division">LANGUAGE COMPLIANCE SYSTEM</div>
    </div>
    <div class="stamps-area">
      <div class="stamp approved">APPROVED</div>
      <div class="stamp internal">INTERNAL USE ONLY</div>
    </div>
    <div class="lumbergh-quote">
      <p>"Yeah, I'm going to need you to use professional language. 
         That would be great."</p>
    </div>
  </header>
</template>
```

The stamps use CSS animations that make them "slam" onto the page:

```css
@keyframes stamp-slam {
  0% { transform: scale(2); opacity: 0; }
  60% { transform: scale(0.9); opacity: 1; }  /* Overshoot */
  100% { transform: scale(1); opacity: 0.85; }
}
```

**Vintage Computer Buttons:**
All action buttons mimic 1990s keyboard keys with actual mechanical press feedback:

```css
.keyboard-button {
  background: linear-gradient(180deg, #b22222 0%, #8b0000 100%);
  border: 3px solid #6b0000;
  box-shadow: 0 4px 0 #4a0000;
  position: relative;
  top: 0;
}

.keyboard-button:active {
  top: 4px;
  box-shadow: 0 0 0 #4a0000;
}
```

The button literally moves down when you click it. Tactile feedback, 1999 style.

## Technology Choices

### Vue 3 for Component Architecture

I initially built WorkSafe with vanilla TypeScript, but the Office Space redesign demanded a component-based architecture. Vue 3's Composition API made this clean:

```typescript
// state.ts - Centralized reactive state
import { ref } from "vue";

export const inputText = ref("");
export const outputText = ref("");
export const isProcessing = ref(false);
export const isRecording = ref(false);

export function initApp() {
  // Initialize speech handler, load settings, etc.
}
```

Components import the state directly and stay in sync. Simple, no ceremony.

### The Familiar Stack

Like [Worklog](/blog/building-worklog), I used:

- **Bun** for speed (runtime, package manager, everything)
- **TypeScript** with strict mode for catching bugs at compile time
- **Biome** for formatting and linting
- **Oxlint** for TypeScript-specific rules
- **Vite** for zero-config builds and HMR

When you're building multiple projects with AI assistance, consistent tooling pays dividends. The AI knows the patterns, I know the patterns, and we move fast.

### Component Architecture

The Vue rewrite broke the monolithic app into themed components:

| Component | Purpose | Key Visual Elements |
|-----------|---------|---------------------|
| `TPSHeader.vue` | Branding and navigation | Perforation strip, Lumbergh quote, rubber stamps |
| `PostItNote.vue` | Section dividers | Random rotation, curled corners, gradients |
| `FlairBadge.vue` | Decorative pins | Circular badges, hover animations |
| `VoiceInput.vue` | Speech interface | CRT monitor bezel, green waveform, scanlines |
| `TextInput.vue` | Manual entry | Greenbar paper textarea, keyboard button |
| `OutputPanel.vue` | Results display | TPS stamp, clipboard copy, modification log |
| `SettingsPanel.vue` | Configuration | Mechanical toggle, API key management |

Each component has scoped styles implementing the Office Space design system. The `App.vue` orchestrates everything:

```vue
<template>
  <TPSHeader />
  <PostItNote color="yellow">INPUT</PostItNote>
  
  <div class="input-tabs">
    <button @click="activeTab = 'voice'">🎙️ Voice</button>
    <button @click="activeTab = 'text'">⌨️ Text</button>
  </div>
  
  <VoiceInput v-if="activeTab === 'voice'" />
  <TextInput v-else />
  
  <SettingsPanel />
  
  <PostItNote color="pink">OUTPUT</PostItNote>
  <OutputPanel />
</template>
```

The reactive state lives in `state.ts` and gets imported by components that need it. No props drilling, no context providers, just direct imports.

### OpenAI Integration

The AI rewriting is straightforward—a single API call with a carefully crafted system prompt:

```typescript
const systemPrompt = `You are a professional communication assistant. 
Your job is to rewrite text to be workplace-appropriate while 
preserving the core message and intent.

Guidelines:
- Remove all profanity, insults, and aggressive language
- Maintain the original meaning and key points
- Use ${tone} tone
- Keep the rewritten text concise
- Do not add unnecessary pleasantries or filler
- Preserve any technical terms or specific details
- Return ONLY the rewritten text, no explanations`;
```

The key is telling the model to preserve the *intent* while changing the *delivery*. You want "this deadline is impossible" to become "I have concerns about the timeline," not "everything is fine!"

## Privacy Considerations

This is a tool for processing potentially sensitive workplace communications. Privacy matters:

- **Dictionary mode**: 100% local. Text never leaves your browser.
- **AI mode**: Text is sent to OpenAI. Users must explicitly enable this and provide their own API key.
- **API key storage**: localStorage only. Never transmitted to any server I control.

I could have built a backend that proxies OpenAI calls, but that would mean routing sensitive workplace messages through my infrastructure. Hard pass.

## The Email Formatter

A small but useful feature: WorkSafe can format output as email-ready text:

```typescript
export function formatAsEmail(text: string): string {
  const lines = text.split("\n").filter((line) => line.trim());
  let email = "";

  // Add greeting if missing
  if (!firstLine.toLowerCase().startsWith("hi") &&
      !firstLine.toLowerCase().startsWith("hello")) {
    email += "Hi,\n\n";
  }

  email += lines.join("\n\n");

  // Add sign-off if missing
  if (!lastLine.toLowerCase().includes("thanks") &&
      !lastLine.toLowerCase().includes("regards")) {
    email += "\n\nBest regards";
  }

  return email;
}
```

It's simple heuristics, but it turns a transformed rant into something you can copy-paste directly into Outlook.

## Building with AI

The original version came together in about 2 hours with Claude assistance for the pattern detection logic. The Office Space redesign took another 3 hours—most of it spent on the visual details.

The interesting collaboration was around the design system. I gave Claude the concept ("Office Space themed profanity filter") and it generated:

- A complete color palette with authentic 90s office colors
- CSS for greenbar paper backgrounds, perforated edges, and dot matrix effects
- Component structure for the Vue rewrite
- Animation keyframes for stamps and button presses

But AI can't tell you if something *feels* right. I spent time tweaking:
- The exact shade of Swingline red (#b22222 vs #dc143c)
- The rotation angle for rubber stamps (-5deg felt more realistic than -8deg)
- The timing of the stamp-slam animation (60% keyframe for the overshoot)
- The opacity of the scanlines overlay (1% was perfect, 2% was too heavy)

The TypeScript strict mode was crucial for the Vue migration:
- Null checks on speech recognition results
- Proper reactive state typing with `Ref<T>`
- Component prop validation
- Canvas context null handling

When you're building something visual with AI, use it for scaffolding and structure. Then trust your eyes for the details.

## Try It

**WorkSafe is live at [worksafe.pages.dev](https://worksafe.pages.dev)!** Experience the full TPS Report Compliance System with voice input and Office Space theming—no installation required.

For local development or to explore the code, WorkSafe is a static Vue app you can run locally:

```bash
git clone https://github.com/jvalentini/worksafe
cd worksafe
bun install
bun run dev
```

Open http://localhost:3000 and experience the full Office Space aesthetic. Click the CRT monitor to start voice input, or use the greenbar paper form for text entry.

For AI mode, you'll need an OpenAI API key. Open the settings panel (⚙️ icon), toggle "AI Rewrite" on, and enter your key. The `gpt-4o-mini` model keeps costs minimal—we're talking fractions of a cent per transformation.

**Pro tip:** Use voice mode for maximum catharsis. There's something deeply satisfying about watching your profane rant get transcribed in green phosphor text before being sanitized into corporate-speak.

## Lessons Learned

1. **Theming transforms utility into experience.** The core functionality didn't change between versions, but the Office Space theme made it *delightful* to use. A profanity filter is inherently funny—lean into it.

2. **Authenticity over parody.** When doing retro design, research the details. The greenbar paper uses real 24px stripes. The CRT green is the actual phosphor color. The VT323 font matches real dot matrix printers. These details add up.

3. **Canvas animations are cheap.** The CRT waveform runs at 60fps and barely registers on CPU. For visual feedback on audio/voice interfaces, `requestAnimationFrame` + canvas beats CSS every time.

4. **Web Speech API is underrated.** Real-time speech-to-text in the browser, no dependencies, no API keys. The browser support is limited, but when it works, it's magical.

5. **Vue 3 Composition API feels like React hooks, but simpler.** No rules about hook ordering, no dependency arrays to maintain, just `ref()` and you're done. State management without the ceremony.

6. **Pattern matching goes far.** You don't always need AI. The dictionary mode handles 80% of cases with zero latency and perfect privacy.

7. **AI for the last mile.** When pattern matching produces awkward output, AI smooths it into natural prose. The hybrid approach gives users the best of both worlds.

8. **Component libraries are overrated for themed projects.** When you have a strong design system (Office Space aesthetic), vanilla CSS + scoped styles gives you more control than fighting against a component library's opinions.

---

*Next time you're drafting an angry message, fire up the TPS Report Compliance System. Your coworkers don't need to know what you really think—they just need the professional version. Preferably printed on greenbar paper.*
