---
title: 'TabGen: Automatic Tab Completion for the Tools I Actually Use'
description: 'TabGen scans my PATH, parses --help and man pages, and generates Bash/Zsh completions so I don’t have to hand-roll tab completion for every new CLI.'
pubDate: 'Jan 04 2026'
heroImage: 'https://raw.githubusercontent.com/jvalentini/tabgen/master/banner.png'
---

## The Problem

I build a lot of small CLI tools.

Some of them are serious. Some are one-off utilities that start as “I’ll just write a quick script” and then quietly become something I run every day. Either way, the lifecycle is always the same:

1. I ship the first version.
2. I immediately miss tab completion.

If you use your shell heavily, tab completion isn’t a nice-to-have. It’s muscle memory:

- `tool <TAB>` to discover subcommands
- `tool subcommand --<TAB>` to see flags
- `tool --format <TAB>` to get allowed values

When a tool doesn’t have completions, it’s friction every single time you use it.

The obvious fix is “just add completions.” But that’s the part I hate: I don’t want to implement completion logic *again* for every new tool I write. That work is repetitive, easy to get wrong, and never feels worth the time when you’re still iterating on the CLI.

So I built **[TabGen](https://github.com/jvalentini/tabgen)**: a tool that generates completions for other tools.

## What TabGen Does

TabGen automatically generates tab completion scripts for:

- **Bash**
- **Zsh**

It does that by inspecting the documentation you already ship with your CLI:

- `--help` output (and `-h` as a fallback)
- man pages (`man <tool>`)

From there, TabGen builds a structured model of each tool:

- subcommands (and simple aliases)
- flags (short + long forms)
- flag arguments and known values (when they’re encoded in help text)
- nested subcommands (up to a limited depth)

Then it turns that model into shell-native completion code.

## The Workflow

The workflow is intentionally boring:

```bash
# Install
go install github.com/jvalentini/tabgen@latest

# Find tools worth caring about
tabgen scan

# Generate completions
tabgen generate

# Hook it into your shell
tabgen install
```

A small detail that ended up mattering: **TabGen filters by shell history**.

Your `$PATH` contains a lot of junk you never invoke. Generating completions for every executable is noisy and slow, and it clutters up completion directories with scripts you’ll never use.

Instead, TabGen reads your history (`.bash_history`, `.zsh_history`) and focuses on the commands you actually run.

## How It Works (Under the Hood)

TabGen is a Go CLI with a pretty clean separation of responsibilities:

- `cmd/` orchestrates commands like `scan`, `generate`, `install`, `status`.
- `internal/scanner/` walks `$PATH`, parses history files, and builds a catalog.
- `internal/parser/` runs help commands with a timeout and extracts structure.
- `internal/generator/` emits completion scripts for Bash and Zsh.
- `internal/config/` reads/writes everything under `~/.tabgen/`.

The data model lives on disk, which makes it easy to debug and avoids re-parsing on every shell startup.

### Data Layout

TabGen stores state in `~/.tabgen/`:

- `catalog.json`: discovered tools and metadata (paths, versions, hashes)
- `tools/<tool>.json`: parsed command/flag structure for each tool
- `completions/bash/<tool>` and `completions/zsh/_<tool>`: generated scripts

### Parsing Is Pragmatic

The parser isn’t trying to understand every CLI framework in existence. It’s built around the conventions most tools already follow:

- sections like “Commands:”, “Options:”, “Flags:”
- common flag formats like `-f, --flag`, `--flag=value`, `--flag <value>`
- simple “two column” help formatting (`subcommand     description`)

It will also recurse into subcommands (`tool subcommand --help`) up to a fixed depth, so you can get reasonable completions for command trees like `docker container ls` without attempting to fully model arbitrarily deep CLIs.

### Smart Regeneration

I wanted TabGen to be something you can just leave running in the background without it constantly thrashing.

So generation is incremental:

- it tries to detect tool versions (`--version`, `-V`, `version`, `-v`)
- it computes a **content hash** of the parsed command/flag structure

That second part matters because not every tool bumps a version when its help output changes. The hash gives TabGen a way to notice “something changed” even when the version string stays the same.

### Fast by Default

TabGen generates completions with a worker pool (defaulting to CPU count). That means:

- generating for a single tool is quick
- generating for a whole catalog stays fast enough to run regularly

## Coexisting with System Completions

I didn’t want TabGen to be the kind of tool that breaks your existing completions.

It uses a “side-by-side” approach:

- **Bash** uses `complete -o default -o bashdefault` so there’s a fallback path.
- **Zsh** integrates via `$fpath`, with the intent that system completions keep precedence.

TabGen’s job is to fill gaps, not replace what already works.

## Why TabGen Was Needed

I’m allergic to anything that adds “maintenance tax” to every new CLI.

Tab completion is one of those recurring taxes:

- you don’t think about it until you don’t have it
- when you finally do it, you end up writing a bunch of repetitive glue
- you have to keep it in sync as the CLI changes

TabGen flips that around.

If a tool has decent `--help` output (and ideally a man page), you get a baseline completion story essentially for free. And if the tool evolves, TabGen can regenerate completions without you touching each project.

## Try It

If you want to kick the tires:

- Repo: **https://github.com/jvalentini/tabgen**
- Install: `go install github.com/jvalentini/tabgen@latest`

Then run `tabgen scan`, `tabgen generate`, and `tabgen install`, and enjoy not typing the same flags over and over.
