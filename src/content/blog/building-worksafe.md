---
title: 'What the Heck: Building a Profanity-to-Professional Translator'
description: 'How I built a browser-based tool that transforms your unfiltered thoughts into workplace-appropriate communication—with voice input and optional AI rewriting.'
pubDate: 'Jan 01 2026'
---

## The Problem

We've all been there. You're staring at a Slack message draft that reads "This is bullshit. Why can't you idiots figure this out?" and you know—you *know*—you can't send it. So you take a deep breath, delete everything, and spend five minutes crafting something diplomatic.

What if you didn't have to?

**WorkSafe** is a browser-based tool that takes your raw, unfiltered thoughts and transforms them into workplace-appropriate text. Speak your frustrations into the microphone or paste your angry draft, and get back something you can actually send to your coworkers.

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

## Voice Input with Web Speech API

The most satisfying feature is voice input. Click the microphone, rant about your coworkers, and watch the professional version appear in real-time.

The Web Speech API is surprisingly capable:

```typescript
export class SpeechHandler {
  private recognition: SpeechRecognition | null = null;
  private fullTranscript = "";

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
        const transcript = result[0].transcript;

        if (result.isFinal) {
          this.fullTranscript += `${transcript} `;
          this.onTranscript(this.fullTranscript.trim(), true);
        } else {
          // Show interim results for real-time feedback
          this.onTranscript(
            (this.fullTranscript + transcript).trim(),
            false
          );
        }
      }
    };
  }
}
```

The `interimResults` flag is crucial—it provides real-time feedback as you speak, so you can see your words being transcribed (and transformed) instantly.

**Caveat:** Web Speech API only works in Chromium-based browsers. Firefox and Safari users get text input only.

## Technology Choices

### Vite for Zero-Config Web Apps

WorkSafe is a pure client-side app with no backend (in dictionary mode). Vite made this trivial:

```bash
bun create vite worksafe --template vanilla-ts
```

Hot module replacement, TypeScript support, and optimized production builds—all out of the box. The entire dev experience is `bun run dev` and you're coding.

### The Familiar Stack

Like [Worklog](/blog/building-worklog), I used:

- **Bun** for speed (runtime, package manager, everything)
- **TypeScript** with strict mode for catching bugs at compile time
- **Biome** for formatting and linting
- **Oxlint** for TypeScript-specific rules

When you're building multiple projects with AI assistance, consistent tooling pays dividends. The AI knows the patterns, I know the patterns, and we move fast.

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

This project came together in about 2 hours with Claude assistance. The pattern detection logic was the most interesting collaboration—I described the categories of language I wanted to catch, and Claude helped generate comprehensive regex patterns and replacement dictionaries.

The TypeScript strict mode caught several edge cases:
- Null checks on speech recognition results (not every browser supports it)
- Proper handling of the `interimResults` array indices
- API response validation for the OpenAI integration

When you're moving fast with AI, strict types are your safety net.

## Try It

WorkSafe is a static site you can run locally:

```bash
git clone https://github.com/jvalentini/worksafe
cd worksafe
bun install
bun run dev
```

Open http://localhost:3000, click the microphone, and let it rip.

For AI mode, you'll need an OpenAI API key. The `gpt-4o-mini` model keeps costs minimal—we're talking fractions of a cent per transformation.

## Lessons Learned

1. **Web Speech API is underrated.** Real-time speech-to-text in the browser, no dependencies, no API keys. The browser support is limited, but when it works, it's magical.

2. **Pattern matching goes far.** You don't always need AI. The dictionary mode handles 80% of cases with zero latency and perfect privacy.

3. **AI for the last mile.** When pattern matching produces awkward output, AI smooths it into natural prose. The hybrid approach gives users the best of both worlds.

4. **Privacy as a feature.** For tools that handle sensitive content, local-first isn't just nice to have—it's table stakes.

5. **Consistent tooling compounds.** Using the same stack (Bun, TypeScript, Biome) across projects means less context switching and faster AI assistance.

---

*Next time you're drafting an angry message, remember: your coworkers don't need to know what you really think. They just need the professional version.*
