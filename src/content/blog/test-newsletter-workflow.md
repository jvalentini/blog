---
title: 'Testing Automated Newsletter Workflow'
description: 'This is a test post to verify that the automated newsletter workflow sends emails when new blog posts are published.'
pubDate: 'Jan 01 2026'
---

# Testing Automated Newsletter Workflow

This is a test blog post created to verify that the GitHub Actions workflow correctly detects new posts and sends newsletter emails via the Buttondown API.

## What This Tests

- ✅ GitHub Actions workflow triggers on blog post changes
- ✅ Front-matter parsing extracts post metadata correctly
- ✅ Buttondown API integration sends newsletter emails
- ✅ Draft posts are skipped (this post is not marked as draft)

## Workflow Details

The workflow:
1. Monitors pushes to the `master` branch
2. Detects changes to files in `src/content/blog/`
3. Parses post frontmatter using the `front-matter` package
4. Generates HTML newsletter content
5. Sends via Buttondown API using the `BUTTONDOWN_API_KEY` secret

## Expected Result

If everything works correctly, subscribers should receive an email with:
- Subject: "Testing Automated Newsletter Workflow"
- Content excerpt with a "Read the full post" link
- Proper HTML formatting

---

*This is an automated test of the newsletter workflow. You can safely delete this post after testing.*