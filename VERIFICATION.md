# Verification Test Plan

This document outlines how to verify each Cloudflare enhancement feature.

## Prerequisites

- Deploy to Cloudflare Pages (push to main or preview deploy)
- Ensure secrets are set in CF dashboard:
  - `BUTTONDOWN_API_KEY`
  - `TURNSTILE_SECRET_KEY`

---

## 1. Security Headers

**Test**: Check response headers on any page

```bash
curl -I https://jvalentini.pages.dev/
```

**Expected Headers**:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: interest-cohort=()`

**Verify**: Use [securityheaders.com](https://securityheaders.com/?q=jvalentini.pages.dev) for a grade.

---

## 2. 103 Early Hints (Font Preloading)

**Test**: Check for `Link` header on HTML pages

```bash
curl -I https://jvalentini.pages.dev/blog/
```

**Expected**: `Link` header with font preload directives

**Verify**: Check Chrome DevTools → Network → filter for fonts, look for "early" in initiator column.

---

## 3. Newsletter Subscription (Buttondown)

**Test**: Submit the newsletter form on any page

1. Go to https://jvalentini.pages.dev/
2. Enter email in newsletter form
3. Complete Turnstile (should be automatic)
4. Click Subscribe

**Expected**:
- Success message appears
- Email shows up in Buttondown dashboard
- If already subscribed: "Already subscribed!" message

**API Test**:
```bash
curl -X POST https://jvalentini.pages.dev/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 4. Turnstile Spam Protection

**Test**: Newsletter form shows Turnstile widget

1. Load any page with newsletter
2. Turnstile widget should render (dark theme, compact)
3. Submit without completing → should fail with "Bot verification failed"

**Verify**: Check Cloudflare Dashboard → Turnstile → Analytics

---

## 5. A/B Testing Infrastructure

**Test**: Check for A/B cookie and headers

```bash
curl -I https://jvalentini.pages.dev/ -c cookies.txt
cat cookies.txt  # Look for ab_bucket=A or ab_bucket=B
```

**Expected Headers**:
- `X-AB-Bucket: A` or `X-AB-Bucket: B`
- `X-Visitor-Timezone: America/New_York` (varies)
- `X-Visitor-Country: US` (varies)
- `X-Visitor-LocalTime: 3:45 PM` (varies)

---

## 6. Geo-Personalization (Timezone Headers)

**Test**: Headers contain visitor timezone info

```bash
curl -I https://jvalentini.pages.dev/
```

**Expected**: `X-Visitor-Timezone` header with IANA timezone

**Frontend Usage**: The `LocalTime.astro` component converts dates to visitor's local timezone automatically.

---

## 7. Link Shortener

**Test**: Default short links work

```bash
curl -I https://jvalentini.pages.dev/go/github
curl -I https://jvalentini.pages.dev/go/twitter
curl -I https://jvalentini.pages.dev/go/rss
```

**Expected**: 302 redirect to target URL

**Create Custom Link** (requires ADMIN_KEY secret):
```bash
curl -X POST https://jvalentini.pages.dev/api/links \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"slug": "mylink", "url": "https://example.com"}'
```

---

## 8. Analytics Engine

**Test**: Page views are tracked

1. Visit any page
2. Check Cloudflare Dashboard → Workers & Pages → blog → Analytics Engine

**Query data via API**:
```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql" \
  -H "Authorization: Bearer {api_token}" \
  -d "SELECT * FROM blog_analytics LIMIT 10"
```

---

## 9. Page View Counter (D1)

**Test**: View counts are stored

```bash
# Get view count for a page
curl "https://jvalentini.pages.dev/api/track?path=/blog/building-worklog"

# Increment view count
curl -X POST https://jvalentini.pages.dev/api/track \
  -H "Content-Type: application/json" \
  -d '{"path": "/blog/building-worklog", "event": "pageview"}'
```

**Expected**: JSON with path and count

---

## 10. LocalTime Component

**Test**: Dates render in visitor's timezone

1. Visit a blog post
2. Check date display
3. Hover over date for full timestamp

**Expected**: Shows relative time (e.g., "2d ago") with local timezone tooltip

---

## Quick Smoke Test

Run this after every deploy:

```bash
# 1. Headers present
curl -sI https://jvalentini.pages.dev/ | grep -E "X-Frame|X-Content-Type|X-AB-Bucket"

# 2. Short links work
curl -sI https://jvalentini.pages.dev/go/rss | grep "location"

# 3. API responds
curl -s https://jvalentini.pages.dev/api/track?path=/ | jq .

# 4. Newsletter endpoint exists
curl -sX POST https://jvalentini.pages.dev/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": ""}' | jq .
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Newsletter returns 500 | Check BUTTONDOWN_API_KEY secret is set |
| Turnstile always fails | Check TURNSTILE_SECRET_KEY secret is set |
| Short links 404 | Ensure KV namespace is bound in wrangler.toml |
| View counts not updating | Ensure D1 database is bound and migration ran |
| No timezone headers | Middleware may not be running - check functions/_middleware.ts |
