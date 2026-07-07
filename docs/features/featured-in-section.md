# Feature: Featured-In Section

## Summary
Added a minimal "Featured in" section to highlight external recognition (GDG Cloud Nagpur feature). Uses the BrandsGrid UI component for consistency with design system.

## Files Created / Modified
- `components/ui/brands.tsx` - New reusable BrandsGrid component
- `components/ui/index.ts` - Added BrandsGrid export
- `app/page.tsx` - Added BrandsGrid component below hero
- `public/gdg-cloud-nagpur.webp` - Logo asset

## Design Decisions

### Why No Video Embed
- Video embeds (iframe/YouTube) add significant page weight
- Third-party scripts affect Core Web Vitals
- Not SEO-friendly for static content
- Violates OSS safety (tracking, external scripts)
- A simple logo + link achieves the same recognition goal

### SEO & Performance
- Fully server-rendered (no "use client")
- Image uses Next.js Image component with lazy loading
- Grayscale filter reduces visual weight, hover reveals color
- No layout shift (explicit width/height)
- Uses rel="nofollow noopener noreferrer" for external links

### Reusability
- Component accepts `items` array as props
- Each item has: name, logoSrc, logoAlt, href
- Easy to add more featured mentions in the future

## Component Props
```typescript
interface FeaturedItem {
  name: string;
  logoSrc: string;
  logoAlt: string;
  href: string;
}

interface FeaturedInProps {
  items: FeaturedItem[];
  className?: string;
}
```

## Notes for Reviewers
- No new colors or fonts introduced
- Follows existing Section spacing patterns (reduced for minimal presence)
- No tracking, analytics, or third-party embeds
