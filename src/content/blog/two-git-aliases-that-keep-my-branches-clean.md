---
title: 'Two Git Aliases That Keep My Branches Clean'
description: 'How my upmaster and merge-pr Git aliases stash safely, sync the default branch, merge PRs, and prune branches in one move.'
heroImage: '../../assets/git-aliases-hero.png'
pubDate: 'Jan 28 2026'
tags: ['git', 'productivity', 'workflow', 'developer-experience']
---

I ship small changes all day. The churn isn’t writing code — it’s the clicks and commands around it. Sync main, prune old branches, merge a PR, switch back, clean up. I got tired of typing the same sequence and missing a step when I was in a hurry.

So I added two Git aliases to my `~/.gitconfig`. They’re short, but they do the boring work consistently.

## Alias 1: `git upmaster`

`upmaster` keeps my default branch current without me thinking about it. It does three things every time:

1. Stash local changes (including untracked files) if my working tree isn’t clean.
2. Fetch and prune `origin`.
3. Update the default branch (main or master), then restore the stash.

That means I can run it from any branch, with or without local edits, and still end up with a clean, synced default branch.

Example flow:

```bash
git upmaster
```

Under the hood it detects the default branch from `origin/HEAD`, updates that ref, and pops the stash if it created one. I’m not babysitting any of those steps anymore.

## Alias 2: `git merge-pr`

`merge-pr` is my one command to finish a pull request. I pass a PR number, or it grabs the PR for the current branch.

```bash
git merge-pr 142
```

What it handles:

- Stashes local work if needed.
- Checks that the PR is mergeable.
- Tries a rebase merge first, then falls back to squash.
- Runs `git upmaster` after the merge.
- Switches back to the default branch.
- Deletes the merged branch locally and on `origin` (only if I own it).

This has reduced the “merge clean‑up” routine to one command. I don’t forget to prune or switch back, and I’m not leaving a wake of stale branches behind me.

## Why this saves time (and mistakes)

- Less context switching. I don’t leave my editor to remember a five‑step checklist.
- Safer merges. Stashing is automatic, so I’m not merging with dirty state.
- Cleaner repo. The branch cleanup happens every time, not “when I remember.”

## The same workflow in my Claude skills

I keep matching Claude skills for these in my OpenCode setup: `upmaster` and `merge-pr`. They call the same Git aliases, so when I ask an agent to sync or merge, it runs the exact steps I use at the keyboard. That keeps my manual workflow and my automated workflow in lock‑step.

If you already have strong muscle memory for Git, aliases won’t change your life. But if you want your default branch clean and your merges boring, these two are worth the few minutes it takes to wire them up.
