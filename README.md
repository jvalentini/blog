# Justin's Blog

Personal blog built with Astro, deployed on Cloudflare Pages.

## Quick Start

```bash
bun install
bun run dev      # Start dev server at localhost:4321
bun run build    # Build for production
bun run preview  # Preview production build
```

## Writing Posts

Create new posts in `src/content/blog/` as `.md` or `.mdx` files:

```markdown
---
title: "My Post Title"
description: "A brief description for SEO and social sharing"
pubDate: 2024-01-15
tags: ["typescript", "web"]
draft: false
# Optional: track where you've cross-posted
syndication:
  twitter: "https://twitter.com/you/status/123"
  linkedin: "https://linkedin.com/posts/..."
---

Your content here...
```

## Deploying to Cloudflare Pages

1. Push this repo to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Connect your GitHub repo
4. Settings are auto-detected (Framework: Astro, Build: `bun run build`, Output: `dist`)
5. Update `astro.config.mjs` with your actual domain

## Cross-Posting Strategy (POSSE)

Your RSS feed is at `/rss.xml`. Use it to:
- Auto-post to Twitter/X via [Zapier](https://zapier.com) or [IFTTT](https://ifttt.com)
- Syndicate to [Dev.to](https://dev.to) (supports canonical URLs)
- Syndicate to [Hashnode](https://hashnode.com) (supports canonical URLs)
- Create LinkedIn articles manually with link back

Always set `canonical_url` on syndicated posts pointing to your site.

## Newsletter Setup

The Newsletter component is a placeholder. To make it work:

1. **Buttondown** (recommended, simple): Replace form action with your Buttondown URL
2. **ConvertKit**: Use their embed form or API
3. **Substack**: Link to your Substack subscribe page

---

# Astro Starter Kit: Blog

```sh
bun create astro@latest -- --template blog
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and OpenGraph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `bun install`             | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun build`           | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
