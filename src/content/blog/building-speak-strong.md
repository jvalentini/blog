---
title: 'Building Speak Strong: Eliminating Weak Language from Your Communication'
description: 'How I built a CLI tool that transforms hesitant, hedging language into confident, direct communication—helping you sound as capable as you actually are.'
pubDate: 'Jan 08 2026'
---

## The Problem

We undermine ourselves constantly with the words we choose.

"I just wanted to check in on this." "I think we should maybe consider..." "Sorry to bother you, but..." "I'll try to get this done."

These phrases feel polite, but they broadcast uncertainty. Every "just" minimizes your intent. Every "I think" hedges your expertise. Every "sorry to bother" positions you as an imposition rather than a colleague.

The worst part? We don't even notice we're doing it. These weak language patterns are so ingrained that we write them automatically—even when we have valuable insights to share.

**Speak Strong** is a CLI tool that catches these patterns and transforms them into confident, direct language. Paste in your email draft, Slack message, or document, and get back text that sounds like someone who knows what they're talking about.

## What It Does

Speak Strong analyzes your text for patterns in five categories of weak language:

| Category | Before | After |
|----------|--------|-------|
| **Hedging** | "I think we should consider" | "We should consider" |
| **Minimizing** | "I just wanted to check" | "I wanted to check" |
| **Over-apologizing** | "Sorry to bother you, but" | "Excuse me, but" |
| **Non-committal** | "I'll try to finish this" | "I will finish this" |
| **Approval-seeking** | "Does that make sense?" | "Let me know if you have questions" |

The transformation preserves your meaning while removing the verbal tics that make you sound uncertain.

### Three Strictness Levels

Not everyone wants the same level of intervention. Speak Strong offers three modes:

```bash
# Conservative (default) - catches obvious hedges and apologies
speak-strong -m "I think we should try this approach"
# Output: We should try this approach

# Moderate - also removes "kind of", "sort of", "I guess"
speak-strong -m "I kind of think we should try" --moderate
# Output: We should try

# Aggressive - flags filler phrases for manual review
speak-strong -m "Basically, in my opinion, we should try" --aggressive
# Output: We should try
# Suggestion: "in my opinion" - your opinion is implied when you speak
```

## The Detection Engine

The core of Speak Strong is a pattern-matching engine that replaces weak phrases with stronger alternatives. The rules are stored in a JSON database:

```typescript
// Conservative level rules
{
  "pattern": "I think we should",
  "replacement": "We should",
  "level": "conservative",
  "category": "hedging"
},
{
  "pattern": "I just wanted to",
  "replacement": "I wanted to",
  "level": "conservative", 
  "category": "minimizing"
},
{
  "pattern": "sorry to bother",
  "replacement": "excuse me",
  "level": "conservative",
  "category": "apologizing"
}
```

For aggressive mode, some patterns only trigger suggestions rather than automatic replacement:

```typescript
{
  "pattern": "in my opinion",
  "replacement": null,
  "level": "aggressive",
  "category": "filler",
  "suggestion": "Consider removing - your opinion is implied when you speak"
}
```

The replacer processes text through each rule at the selected strictness level:

```typescript
export function processText(
  text: string,
  level: StrictnessLevel
): ProcessResult {
  const rules = getRulesForLevel(level);
  let result = text;
  const replacements: Replacement[] = [];
  const suggestions: Suggestion[] = [];

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern, "gi");
    
    if (rule.replacement) {
      // Auto-replace
      const matches = result.match(regex);
      if (matches) {
        replacements.push({
          original: matches[0],
          replacement: rule.replacement,
          category: rule.category,
        });
        result = result.replace(regex, rule.replacement);
      }
    } else if (rule.suggestion) {
      // Suggest for manual review
      if (regex.test(result)) {
        suggestions.push({
          phrase: rule.pattern,
          suggestion: rule.suggestion,
          category: rule.category,
        });
      }
    }
  }

  return { result, replacements, suggestions };
}
```

The key insight: most weak language follows predictable patterns. You don't need AI to catch "I just wanted to"—simple pattern matching handles it instantly.

## Interactive Mode

Sometimes you want control over which replacements to accept. Interactive mode presents each potential change for review:

```bash
speak-strong -f email.txt -i
```

```
[1/3] [minimizing]
  I just wanted to → I wanted to

  accept / skip / Accept all / Skip all / quit ? a

[2/3] [hedging]
  I think we should → We should

  accept / skip / Accept all / Skip all / quit ? s

── Result ────────────────────────────────────────
I wanted to follow up. I think we should try this approach.

── Stats: 1 accepted, 1 skipped ──
```

This is useful when context matters. Sometimes "I think" is appropriate—when you're genuinely uncertain and want to signal openness to other perspectives. Interactive mode lets you make that call.

## Watch Mode

For longer writing sessions, watch mode monitors a file and reprocesses it on every save:

```bash
speak-strong -f draft.txt --watch
```

```
Watching: draft.txt
Press Ctrl+C to stop

[10:42:15] draft.txt: 2 replacements
[10:42:30] draft.txt: 3 replacements, 1 suggestion

^C
Stopped watching.
```

Pair this with your text editor, and you get real-time feedback on weak language as you write.

## History and Undo

Every transformation is logged to `~/.speak-strong/history.json`. If you accidentally mangle something important:

```bash
# View recent transformations
speak-strong --history

# Undo the last transformation
speak-strong --undo

# Undo a specific transformation
speak-strong --undo abc123
```

This was a late addition that immediately proved essential. When you're processing multiple files, undo becomes a safety net.

## Technology Choices

### Bun for Everything

Like my other CLI tools, Speak Strong is built with [Bun](https://bun.sh). The runtime is fast, TypeScript works out of the box, and `bun build --compile` produces standalone binaries for distribution.

```bash
# Install from source
git clone https://github.com/jvalentini/speak-strong
cd speak-strong
bun install
bun run speak-strong.ts --help

# Or use the installer
curl -fsSL https://raw.githubusercontent.com/jvalentini/speak-strong/main/install.sh | bash
```

### TypeScript with Strict Mode

Pattern matching seems simple until you're handling edge cases. TypeScript's strict mode caught several issues:

- Null checks when patterns don't match
- Proper typing for rule database entries
- Category validation across different strictness levels

```typescript
// tsconfig.json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noUnusedLocals": true
}
```

### Biome + Oxlint

The same fast, strict toolchain I use everywhere. Biome handles formatting and general linting in milliseconds. Oxlint catches TypeScript-specific patterns.

### Project Structure

```
speak-strong/
├── speak-strong.ts       # CLI entry point
├── src/
│   ├── lib/
│   │   ├── interactive.ts # Interactive mode prompts
│   │   ├── history.ts    # History tracking and undo
│   │   ├── replacer.ts   # Core replacement engine
│   │   ├── reporter.ts   # Output formatting
│   │   └── watcher.ts    # File watching for --watch mode
│   ├── types/
│   │   └── index.ts      # TypeScript interfaces
│   ├── utils/
│   │   ├── colors.ts     # Terminal colors
│   │   ├── errors.ts     # Custom error classes
│   │   ├── file.ts       # File I/O utilities
│   │   └── logger.ts     # Logging utility
│   └── data/
│       └── rules.json    # Replacement rules database
└── tests/                # Test files
```

Clean separation between the replacer logic, I/O handling, and formatting made it easy to add features incrementally.

## Building with AI

The initial version came together in about 2 hours with Claude's help. The interesting part was building the rules database.

I started by dumping a list of weak language patterns from memory—the "justs" and "I thinks" that immediately come to mind. Then Claude helped expand it with patterns I'd missed:

- "I was wondering if" → weak request framing
- "I'm no expert, but" → self-deprecation before expertise
- "Needless to say" → filler that adds nothing
- "To be honest" → implies you're usually dishonest

The AI was particularly useful for identifying *why* certain phrases are weak. "Does that make sense?" isn't just filler—it's approval-seeking, putting the burden on the reader to validate your communication. The replacement "Let me know if you have questions" shifts that dynamic entirely.

TypeScript strict mode caught issues where AI-generated code assumed all rules would have replacements (some only have suggestions). The tooling acts as a safety net for AI-generated code.

## Why Not AI for Replacement?

I could have sent text to GPT-4 for context-aware rewriting, like I did with [WorkSafe](/blog/building-worksafe). I deliberately chose not to for Speak Strong. Here's why:

1. **Privacy**: Weak language patterns appear in sensitive communications. I don't want my performance review draft hitting OpenAI's servers.

2. **Speed**: Pattern matching is instant. API calls add latency and failure modes.

3. **Predictability**: I want to know exactly what will change. AI rewrites can alter meaning in subtle ways.

4. **Cost**: Every transformation costs money with AI. Pattern matching is free forever.

The 80/20 rule applies: simple patterns catch 80% of weak language. AI would help with the remaining 20%, but at significant cost in privacy and simplicity.

## Lessons Learned

1. **Patterns beat AI for predictable transformations.** When the input-output mapping is well-defined, regex is faster, cheaper, and more predictable than neural networks.

2. **Interactive modes add surprising value.** What started as a batch processing tool became more useful with the ability to review changes one at a time.

3. **History/undo is essential for destructive operations.** If you're transforming files in place, you need a way back. This should have been in v1.0.

4. **Strictness levels let users self-select.** Some people want aggressive intervention. Others want conservative suggestions. Don't pick for them.

5. **Small tools compose well.** Speak Strong is ~1,200 lines of TypeScript. It does one thing. It integrates with pipes, files, and editors. That's the Unix philosophy.

## Try It

Install with one command:

```bash
curl -fsSL https://raw.githubusercontent.com/jvalentini/speak-strong/main/install.sh | bash
```

Or run from source:

```bash
git clone https://github.com/jvalentini/speak-strong
cd speak-strong
bun install
bun run speak-strong.ts -m "I just wanted to maybe check if you could try to review this"
```

Output:

```
── Replacements ──────────────────────────────────
  [minimizing]
  I just wanted to -> I wanted to
  [non-committal]
  maybe -> (removed)
  [non-committal]
  try to -> (removed)

── Result ────────────────────────────────────────
I wanted to check if you could review this

── Stats: 3 phrases replaced ──
```

Next time you're drafting an important email, run it through Speak Strong first. You might be surprised how much confidence you've been leaving on the table.

---

*Your ideas deserve to be heard without the verbal static of hedging and apologizing. Let Speak Strong help you sound as confident as you actually are.*
