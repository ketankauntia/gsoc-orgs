# Deployment Cache Issue - Fix Guide

## Problem
Production deployment shows old links (`/about-us`) but master branch has correct links (`/about`). Preview deployments show correct links.

## Root Cause
**Static Generation Caching**: Pages using `generateStaticParams()` are pre-rendered at build time and cached. Production is serving cached static HTML with old footer links.

## Solution Applied

### 1. Added Revalidation to Key Pages
Added `export const revalidate = 3600` to:
- `app/[slug]/layout.tsx` - Year pages layout
- `app/[slug]/page.tsx` - Year pages
- `app/page.tsx` - Homepage
- `app/about/page.tsx` - About page

This forces Next.js to revalidate cached pages every hour.

### 2. Immediate Fix: Force Rebuild Without Cache

**In Vercel Dashboard:**
1. Go to **Deployments** → Latest Production Deployment
2. Click **"..."** menu → **"Redeploy"**
3. **IMPORTANT**: Check **"Redeploy without cache"**
4. Click **"Redeploy"**

This will:
- Force a fresh build
- Regenerate all static pages
- Update footer links in cached HTML

### 3. Verify Footer Links

**Check these files are correct:**
- ✅ `components/footer-common.tsx` - Has `/about` (line 103)
- ✅ `components/Footer.tsx` - Uses `FOOTER_NAVIGATION_ITEMS`
- ✅ `components/footer-small.tsx` - No navigation links (correct)

**All current code is correct** - the issue is cached HTML.

## Why Preview ≠ Production

- **Preview**: Always fresh build, no long-lived cache
- **Production**: 
  - Static HTML reused from build cache
  - Layout-level caching
  - ISR artifacts reused
  - Build cache reused

## Verification Steps

After redeploying without cache:

1. **Check Production Footer**:
   - Visit production URL
   - Right-click → View Source
   - Search for "about" - should see `/about` not `/about-us`

2. **Add Debug Log** (temporary):
   ```tsx
   // In components/footer-common.tsx
   console.log("FOOTER VERSION: /about");
   ```
   - Deploy
   - Check browser console on production
   - If log exists but link is wrong → cached HTML
   - If both correct → browser cache (hard refresh)

3. **Hard Refresh Browser**:
   - Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Firefox: Ctrl+F5
   - Safari: Cmd+Option+R

## Long-term Prevention

The `revalidate = 3600` added to pages ensures:
- Pages revalidate every hour
- Footer links stay updated
- No stale cache issues

## Alternative: Force Dynamic (if needed)

If revalidation doesn't work, temporarily add to layout:
```tsx
export const dynamic = "force-dynamic";
```

Then remove after confirming fix.

## Status

✅ Code is correct - all links are `/about`
✅ Revalidation added to prevent future cache issues
⚠️ **Action Required**: Redeploy production without cache in Vercel

