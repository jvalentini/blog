---
title: 'Bakery: Stop Configuring, Start Building'
description: 'A modular project scaffolder that eliminates setup time by generating production-ready TypeScript, Bun, Biome, and modern tooling projects.'
pubDate: 'Jan 10 2026'
heroImage: '../../assets/bakery-banner.webp'
tags: ['typescript', 'cli', 'developer-tools', 'project-scaffolding', 'bun']
---

## The Problem

Every new project starts the same way: hours of configuration before you write a single line of business logic.

Set up TypeScript. Pick a linter. Configure the formatter. Make them play nice together. Write the CI pipeline. Add Docker. Create the Makefile. Set up git hooks. Choose a testing framework. Wire up the build system.

By the time you're done, you've burned half a day on boilerplate—and you still haven't touched the actual problem you set out to solve.

I've done this dozens of times. Every time, I tell myself I'll just copy from the last project. Every time, I end up tweaking configs, chasing down version mismatches, and wondering why my linter suddenly hates my formatter.

So I built **[Bakery](https://github.com/jvalentini/bakery)**: a tool that bakes fresh projects from recipes, with all the modern tooling pre-configured and ready to go.

## What Bakery Does

Bakery is a project scaffolder that generates production-ready codebases in seconds.

Run one command, answer a few questions, and get a fully configured project with:

- **TypeScript + Bun** for fast development and execution
- **Biome + Oxlint** for comprehensive linting and formatting
- **Lefthook** for git hooks that catch issues before commit
- **Makefile** for consistent commands that work for humans and AI agents alike

The key insight: every project I start uses roughly the same foundation. The differences are in the archetype (CLI vs API vs full-stack) and the optional addons (Docker, CI, database). Bakery encodes those patterns.

## Quick Start

```bash
# One-liner install (recommended)
curl -fsSL https://raw.githubusercontent.com/jvalentini/bakery/master/install.sh | bash

# Or install globally
bun install -g bakery

# Run the interactive wizard
bakery
```

The wizard walks you through:
1. Choose an archetype (what kind of project)
2. Select addons (optional enhancements)
3. Name your project
4. Done—start coding

## Archetypes: Pick Your Recipe

Bakery offers five archetypes, each optimized for a different use case:

| Archetype | Best For |
|-----------|----------|
| **CLI Tool** | Command-line utilities, DevOps tools, automation scripts |
| **REST API** | Web services, microservices, backend APIs |
| **Full-Stack** | SaaS apps, dashboards, monorepos with API + web |
| **Effect CLI/API** | Type-safe functional programming with Effect-ts |
| **Effect Full-Stack** | Real-time collaborative apps with Convex |

### CLI Tool

For command-line utilities:

```bash
bakery -o my-cli
# Select: CLI Tool
```

You get a CLI with binary compilation (via Bun), commander.js for argument parsing, automatic version flags, and everything wired up for distribution.

### REST API

Backend services with your choice of framework:

```bash
bakery -o my-api
# Select: REST API
# Choose: Hono, Express, or Elysia
```

**Hono** is lightweight and fast—perfect for edge deployments. **Express** is battle-tested with a huge ecosystem. **Elysia** is Bun-native with end-to-end type safety.

### Full-Stack

Monorepo with coordinated API and web packages:

```bash
bakery -o my-app
# Select: Full-Stack
# Choose API framework + web framework
```

Web framework options include React (Vite), Next.js, Vue, and TanStack Start. Each pairs with your chosen API framework in a coherent monorepo structure.

## Addons: Enhance Any Archetype

Layer optional features onto any base archetype:

| Addon | What It Adds |
|-------|--------------|
| **Docker** | Dockerfile + docker-compose for containerized development |
| **GitHub Actions** | CI/CD pipelines, automated testing, binary releases |
| **Convex** | Real-time database with automatic sync |
| **TanStack Query** | Powerful data fetching and caching |
| **TanStack Router** | Type-safe routing for React |
| **TanStack Form** | Performant, type-safe forms |
| **TypeDoc** | API documentation generation |
| **Trivy** | Container security scanning |

Mix and match. A CLI tool with Docker and GitHub Actions. A REST API with Convex and TypeDoc. The combinations are yours.

## Every Project Gets the Same Interface

This is the part I care about most.

No matter which archetype you choose, every Bakery project uses identical Makefile commands:

```bash
make install      # Install dependencies
make dev          # Run in development mode
make check        # Run typecheck + lint + oxlint
make test         # Run tests
make build        # Build to dist/
```

Consistency matters. When I jump between projects—or when an AI agent works on my code—the commands are always the same. No hunting through package.json to remember if it's `npm run lint` or `yarn lint:fix` or `pnpm check`.

This also makes onboarding trivial. Clone the repo, run `make install`, run `make dev`. Done.

## The Tooling Stack

I'm opinionated about tooling, and Bakery encodes those opinions.

### Bun

4x faster than Node.js. Built-in TypeScript support. Fast package installs. Native binary compilation for CLIs. There's no reason to use Node anymore for new projects.

### Biome

Replaces ESLint + Prettier with a single, faster tool. Written in Rust, 25x faster than ESLint. One config file instead of two. No more conflicts between linter and formatter.

### Oxlint

Supplementary linter with TypeScript type-aware rules. Catches async/promise bugs that Biome misses. Also written in Rust, extremely fast. The two tools complement each other perfectly.

### Lefthook

Git hooks manager that runs checks automatically on commit and push. Faster than Husky, written in Go. Pre-configured to run `make check` before you can commit broken code.

## Plugins: Extend Bakery

Bakery supports plugins for custom archetypes and addons.

```bash
# List installed plugins
bakery plugins
```

Plugins load automatically from:
1. Local project: `./bakery-plugins/plugin-name/`
2. User directory: `~/.bakery/plugins/plugin-name/`
3. npm packages: `bakery-plugin-*`

A minimal plugin:

```
my-plugin/
├── plugin.json       # Plugin manifest
├── templates/
│   └── my-addon/
│       ├── template.json
│       └── files/
└── index.ts          # Optional: hooks and prompts
```

This means teams can create internal archetypes that encode their specific patterns—auth setups, database configurations, deployment targets—without forking Bakery itself.

## Teaching AI Agents to Scaffold

Here's the longer-term vision.

I use AI agents heavily in my development workflow. They're great at implementing features once a project exists. But they're less great at starting from scratch—they don't know my preferences, my tooling choices, my patterns.

Bakery is a teaching tool for AI agents.

The Makefile interface means agents know exactly how to interact with any Bakery-generated project. The consistent structure means they can navigate the codebase predictably. The plugin system means I can encode domain-specific patterns that agents can apply.

Eventually, I want to say "scaffold a new REST API with Hono and Convex" and have an agent run `bakery -o my-api --archetype=rest-api --framework=hono --addons=convex` without me touching the keyboard.

The groundwork is there. The interface is consistent. The patterns are encoded.

## Try It

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/jvalentini/bakery/master/install.sh | bash

# Or with bun
bun install -g bakery

# Run the wizard
bakery

# Or specify everything upfront
bakery -o my-project
```

Stop configuring. Start building.

---

*Bakery is open source: [github.com/jvalentini/bakery](https://github.com/jvalentini/bakery)*
