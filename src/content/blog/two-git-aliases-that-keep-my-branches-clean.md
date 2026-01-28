---
title: 'Two Git Aliases That Keep My Branches Clean'
description: 'How my upmaster and merge-pr Git aliases stash safely, sync the default branch, merge PRs, and prune branches in one move.'
heroImage: '../../assets/git-aliases-hero.png'
pubDate: 'Jan 28 2026'
tags: ['git', 'productivity', 'workflow', 'developer-experience']
---

I ship small changes all day. The slow part is the routine: sync main, prune branches, merge a PR, switch back, clean up. I got tired of typing the same sequence and skipping steps when I was moving fast.

So I added two Git aliases to my `~/.gitconfig`. They are short and boring. That is the point.

## Alias 1: `git upmaster`

`upmaster` keeps my default branch current without me thinking about it. It always does the same three steps:

1. Stash local changes (including untracked files) if my working tree isn’t clean.
2. Fetch and prune `origin`.
3. Update the default branch (main or master), then restore the stash.

I can run it from any branch, with or without local edits, and still end up with a clean, synced default branch.

Example flow:

```bash
git upmaster
```

It detects the default branch from `origin/HEAD`, updates that ref, and pops the stash if it created one. I do not babysit any of it.

## Alias 2: `git merge-pr`

`merge-pr` finishes a pull request. I pass a PR number, or it grabs the PR for the current branch.

```bash
git merge-pr 142
```

It handles:

- Stashes local work if needed.
- Checks that the PR is mergeable.
- Tries a rebase merge first, then falls back to squash.
- Runs `git upmaster` after the merge.
- Switches back to the default branch.
- Deletes the merged branch locally and on `origin` (only if I own it).

This turns the merge clean‑up routine into muscle memory. I do not forget to prune or switch back, and I do not leave stale branches behind.

## The same workflow in my Claude skills

I keep matching Claude skills for these in my OpenCode setup: `upmaster` and `merge-pr`. They call the same Git aliases, so when I ask an agent to sync or merge, it runs the same steps I use at the keyboard.

If you already have strong muscle memory for Git, aliases might not change much. If you want your default branch clean and your merges boring, these two are worth the few minutes it takes to wire them up.
