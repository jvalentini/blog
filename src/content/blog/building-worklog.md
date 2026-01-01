---
title: 'Building Worklog: A Developer Activity Aggregator'
description: 'How I built a CLI tool to aggregate AI coding sessions, git commits, and GitHub activity for daily standups and weekly retrospectives—in under 5 hours.'
pubDate: 'Jan 01 2026'
heroImage: '../../assets/blog-placeholder-1.jpg'
---

## The Problem

As developers increasingly work with AI coding assistants like Claude, Cursor, and other AI agents, we face a new challenge: tracking what we actually accomplished during the day. Traditional git commits only tell part of the story. When you're pairing with AI on complex refactoring tasks, experimenting with different approaches, or having the AI help you through tricky debugging sessions, that valuable context lives in session histories scattered across different tools.

For daily standups and weekly retrospectives, I needed a way to quickly answer: "What did I work on today?" This meant aggregating data from multiple sources:

- **AI coding sessions** from OpenCode, Claude Code, Codex, and Factory
- **Git commits** across all my active repositories
- **GitHub activity** including PRs, reviews, issues, and comments

Enter **[worklog](https://github.com/jvalentini/worklog)**: a CLI tool that brings all this information together in one place.

## What Worklog Does

Worklog is a command-line tool that generates daily standup summaries by pulling data from everywhere you actually work. Run `worklog` in your terminal and get a comprehensive summary of your development activity:

```bash
# Today's activity (default)
worklog

# Yesterday's standup
worklog -y

# This week's activity
worklog -w
```

The tool outputs nicely formatted markdown by default, but also supports JSON, plain text, and Slack-formatted output for posting directly to your team channels. It's configurable via a simple JSON config file that specifies which AI session directories to monitor and which git repositories to scan.

## Technology Choices

Building worklog was an exercise in choosing modern, fast, and developer-friendly tools. Here's what I used and why:

### Bun Runtime

I chose [Bun](https://bun.sh) as both the runtime and build tool. Bun's speed is remarkable—it's significantly faster than Node.js for both execution and package installation. More importantly, Bun has built-in TypeScript support, so no need for separate transpilation steps. The ability to compile to standalone binaries (`bun build --compile`) meant I could distribute worklog as a single executable with no dependencies.

### TypeScript with Strict Mode

Type safety isn't optional when building CLI tools. TypeScript's strict mode caught countless edge cases during development:

```typescript
// tsconfig.json with all the strictness
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noImplicitOverride": true
}
```

These strict checks are particularly valuable when working with AI coding assistants. The AI can generate code quickly, but TypeScript ensures the generated code is actually correct. When Claude suggests a refactoring, the type checker immediately flags any issues.

### Biome for Linting and Formatting

[Biome](https://biomejs.dev/) is a fast, all-in-one toolchain that replaces both ESLint and Prettier. Written in Rust, it's blazingly fast—formatting and linting the entire codebase takes milliseconds. The unified configuration is refreshingly simple:

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "warn"
      }
    }
  }
}
```

For AI-assisted development, consistent formatting is crucial. When you're making rapid changes with AI help, Biome ensures every generated file follows the same style without you having to think about it.

### Oxlint for Additional Type Safety

While Biome is excellent, I added [Oxlint](https://oxc-project.github.io/docs/guide/usage/linter.html) for specialized TypeScript rules. Oxlint, also written in Rust, focuses on TypeScript-specific patterns:

```json
{
  "rules": {
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "import/no-duplicates": "error",
    "promise/prefer-await-to-then": "warn"
  }
}
```

Running both Biome and Oxlint gives comprehensive coverage—Biome handles general JavaScript/TypeScript linting and formatting, while Oxlint catches TypeScript-specific issues.

### The AI Development Advantage

Here's where the tooling choices really pay off: **when coding with AI agents, having fast, automated checks is essential.**

When Claude or Cursor generates a large refactoring, I don't want to manually review every line. Instead:

1. The AI generates code
2. Biome auto-formats it on save (via lefthook git hooks)
3. TypeScript type checking catches any type errors
4. Oxlint flags TypeScript anti-patterns
5. Tests run automatically

This feedback loop happens in **milliseconds**. If something's wrong, I immediately know and can ask the AI to fix it. The tooling acts as a safety net that lets me move fast with confidence.

### Additional Technologies

- **[Zod](https://zod.dev/)** for runtime validation of configuration files and API responses
- **[Commander.js](https://github.com/tj/commander.js)** for elegant CLI argument parsing
- **[Chalk](https://github.com/chalk/chalk)** for beautiful terminal colors
- **[date-fns](https://date-fns.org/)** for date manipulation
- **[Lefthook](https://github.com/evilmartians/lefthook)** for fast git hooks

## Project Stats

Let's talk about how quickly this came together:

- **Timeline**: Built in **under 5 hours** (December 31, 2025, 7:55 PM - 10:53 PM)
- **Lines of Code**: ~1,229 lines across 16 TypeScript files
- **Commits**: 24 commits from initial implementation to v2.0.0
- **Architecture**: Clean separation with `sources/`, `formatters/`, and `utils/` directories

The source structure is straightforward:

```
src/
├── formatters/       # Output formats (markdown, json, plain, slack)
├── sources/          # Data sources (git, github, opencode, claude, etc.)
├── utils/            # Configuration and date utilities
└── types.ts          # Shared TypeScript types
```

This modular design meant I could build features incrementally. Start with git commits, add GitHub activity, then AI sessions—each as a separate source module.

## Building with AI

The entire project was built with AI assistance (primarily Claude and Cursor). Here's why the tooling choices mattered:

### Fast Feedback Loops

When asking AI to "add support for reading OpenCode sessions," I'd get back 100+ lines of code. With Biome, TypeScript, and Oxlint all running automatically:

- Formatting happens instantly
- Type errors are immediately visible
- Unused imports are flagged
- Inconsistent patterns are caught

The AI can iterate quickly because the tooling provides clear, immediate feedback.

### Catching AI Mistakes

AI is great but not perfect. TypeScript caught several issues where AI-generated code assumed data would always exist (hence `noUncheckedIndexedAccess`). Oxlint caught cases where the AI used `any` types that should have been more specific.

### Documentation as Code

With strict TypeScript, the types serve as documentation. When AI generates a new formatter or source module, the types make it immediately clear what shape of data it needs to handle. No need for extensive comments—the types tell the story.

## Lessons Learned

Building worklog reinforced several principles:

1. **Choose fast tools**: Bun, Biome, and Oxlint are all written in Rust or Zig and are blazingly fast. The faster your tools, the faster you can iterate.

2. **Strict types pay dividends**: Every strict TypeScript flag caught real bugs. `noUncheckedIndexedAccess` alone prevented a dozen runtime errors.

3. **AI + good tooling = velocity**: AI can generate code quickly, but without good linting, formatting, and type checking, you're just generating bugs quickly.

4. **Modular architecture scales**: The separation between sources and formatters made it trivial to add new features. Want a new output format? Add a formatter. New data source? Add a source module.

5. **Developer experience matters**: Using tools like @clack/prompts for the setup wizard and chalk for colored output made the tool pleasant to use, which meant I'd actually use it daily.

## Try It Yourself

Worklog is open source and available on GitHub. You can install it with a single command:

```bash
curl -fsSL https://raw.githubusercontent.com/jvalentini/worklog/main/install.sh | bash
```

The installer grabs the latest release binary for your platform and walks you through creating a config file. Within minutes, you'll have comprehensive daily standups aggregating all your development activity.

If you work with AI coding assistants and want to track your actual work—not just git commits—give worklog a try. And if you're building CLI tools or working with AI, consider the stack I used: Bun, TypeScript with strict mode, Biome, and Oxlint. These tools made it possible to build a robust, production-ready CLI tool in under a day.

---

*Check out the [worklog repository](https://github.com/jvalentini/worklog) for more details, or run it yourself to see how much you accomplished today.*
