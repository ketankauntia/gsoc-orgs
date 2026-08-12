# Editorial Image SEO and Delivery Playbook

This playbook translates current primary-source guidance into a conservative image policy for an independent GSoC guide. It distinguishes requirements from optimizations and editorial choices; none of these steps guarantees rankings, Google Images inclusion, Discover traffic, or a particular social preview.

Last research review: **2026-08-12**

## Rules at a glance

| Level | Meaning |
|---|---|
| **Release gate** | Do not publish until satisfied. |
| **Platform requirement** | Needed for the named standard or feature. |
| **Recommendation** | Primary-source best practice, not guaranteed eligibility or ranking. |
| **Project convention** | A deliberate local choice for consistency and maintainability. |

## Brand and trademark gate

This is a **release gate**.

Google states that “Summer of Code,” “GSoC,” and the GSoC logo are Google trademarks. The names may be used accurately in plain text to refer to the program, but the marks must not create confusion about affiliation or endorsement, be altered, be combined with other marks outside permitted uses, or be used as part of an unrelated commercial endeavor, product, company, domain, or social profile without permission. Commercial use of the GSoC logo is prohibited without express permission. The Google logo also requires permission. Read the complete [GSoC brand guidelines](https://developers.google.com/open-source/gsoc/resources/brand_guidelines) and [Google Brand Resource Center guidance](https://about.google/brand-resource-center/guidance/).

For this independent, monetization-oriented guide:

- Do not place the official GSoC or Google logo in a cover or social card.
- Do not ask an image model to recreate, reinterpret, distort, or approximate either logo.
- Do not imitate Google's four-color visual identity or make the artwork resemble an official Google announcement.
- Do not place mentoring-organization logos in generated art unless that specific asset's rights and trademark use have been reviewed and recorded.
- Use “GSoC” and “Google Summer of Code” only as accurate editorial references in page text and metadata.
- Keep a visible, accurate non-affiliation disclosure on the site. Artwork must not contradict it.

Official artwork is available from Google's [GSoC marketing resources](https://developers.google.com/open-source/gsoc/resources/marketing), but availability is not permission for this commercial context. Use it only after documented permission from `gsoc-support@google.com`, unmodified and within the approval's scope. Google Images is a discovery service, not a source of reusable licensed assets.

## Visual system for the 15 covers

These are **project conventions**, informed by Google's Material imagery principles: imagery should be relevant, informative, intentional, and organized around a clear focal point rather than generic stock decoration. See [Material Design imagery guidance](https://m1.material.io/style/imagery.html).

- Style: polished editorial illustration with simple geometry, restrained depth, subtle grain, generous negative space, and one immediately legible metaphor.
- Palette: site-owned teal and cyan, deep slate or navy, warm off-white, and sparing amber. Do not use Google's signature red-yellow-green-blue quartet.
- Composition: one dominant focal subject with a calm background. Keep essential detail in the central safe region so 16:9 and 1.91:1 crops survive.
- Subject matter: open collaboration, repository exploration, review, planning, mentorship, evidence, timelines, and community systems. Tailor the metaphor to the article.
- People: prefer stylized, inclusive figures over photorealistic fictional contributors. Never imply a generated person is a real participant, mentor, or testimonial source.
- Text: keep the primary image text-free. Render titles, dates, statistics, and calls to action as accessible HTML.
- Interface imagery: avoid fake GitHub, Google, proposal, payment, or organization screens. If a real screenshot is necessary, capture or license it separately and document its provenance.

Google recommends representative, high-resolution preferred images and advises against generic logos, extreme aspect ratios, and text-heavy preview images in its [Image SEO](https://developers.google.com/search/docs/appearance/google-images) and [Discover](https://developers.google.com/search/docs/appearance/google-discover) guidance.

## Generation and derivative pipeline

The two-file contract is a **project convention**:

| Asset | Path | Purpose |
|---|---|---|
| Cover | `public/blog/<slug>/<slug>-cover.webp` | Visible post hero and listing/card image, 1600 × 900. |
| Social | `public/blog/<slug>/<slug>-social.jpg` | Open Graph and large social card, 1200 × 630. |

Generate the largest useful landscape source available, approve the composition, and then create both outputs from that same source. Crop deliberately; never stretch. Preserve the focal subject, avoid clipping hands or meaningful objects, and inspect the social crop at thumbnail size.

The 1600 × 900 cover exceeds Google's Discover recommendation of at least 1200 pixels wide, more than 300,000 total pixels, and a 16:9 composition. `1200 × 630` is a pragmatic 1.91:1 social convention, not a universal Open Graph requirement. The [Open Graph protocol](https://ogp.me/) defines image URL and optional type, width, height, and alt properties but does not prescribe one universal pixel size.

Google's [Article structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/article) recommends, for best results, representative crawlable images in 16:9, 4:3, and 1:1 ratios, each at least 50,000 pixels. The current two-file batch supplies the 16:9 and social needs. Missing 4:3 and 1:1 derivatives do not block publication; add them later only when the schema and asset pipeline support them consistently.

## Accessibility and alt decisions

WCAG requires a text alternative that serves the same purpose as non-text content. The correct text depends on context, not a target keyword. Follow the [W3C Images Tutorial](https://www.w3.org/WAI/tutorials/images/) and [alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/).

Use this decision in the manifest before wiring an image:

1. **Decorative or redundant cover:** use `alt=""`. This is the default when the article title or linked card title already communicates the destination and the illustration adds atmosphere only.
2. **Informative illustration:** write a brief description of the essential idea the reader would otherwise miss.
3. **Functional image:** if an image is the only linked or button content, describe the destination or action, not its appearance.
4. **Complex chart or diagram:** use a short alt summary and provide the full data, sequence, or explanation in adjacent HTML. Alt text is not a substitute for the underlying information.

Good informative example:

> Contributor comparing project scope, mentor availability, and repository activity before choosing an open-source organization.

Avoid “image of,” duplicated headlines, filenames as alt text, invented claims, and keyword strings such as repeated variations of “GSoC organizations.” A caption is optional and should add source, method, or interpretation; it must not merely repeat the alt text.

DOM `alt` and `og:image:alt` serve different contexts. A decorative in-page cover can correctly use `alt=""`, while `og:image:alt` describes what appears in the standalone social preview. The Open Graph specification says `og:image:alt` is a description of the image, not a caption.

## Discoverability and metadata

These are **recommendations** unless a consuming platform makes a property mandatory.

- Render visible covers through a standard HTML image element, normally the framework's image component. Google indexes images referenced by an `img` `src`; it does not index CSS background images.
- Keep a crawlable `src` fallback even when responsive `srcset`, `sizes`, or `picture` sources are present.
- Use stable public URLs, correct file extensions and MIME types, and lowercase descriptive filenames. Google describes filenames as only a light subject clue; do not keyword-stuff them.
- Place an informative image near the relevant explanatory text.
- Set an absolute `og:image` URL to the social asset and provide its width, height, MIME type, and descriptive `og:image:alt` where supported.
- Set the large-card social metadata to the same approved social asset.
- Include a representative absolute image URL in visible-page `BlogPosting.image` data. Structured data must match the article and visible page.
- Enable `max-image-preview:large` for indexable articles if large Google previews are desired. See Google's [robots metadata specification](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
- Do not block the article or image paths with authentication, `robots.txt`, `noindex`, or `noimageindex`.

An [image sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps) is optional and most useful for images Google might not otherwise discover. If used, include the current `image:image` and `image:loc` elements. The older image sitemap caption, title, geo-location, and license tags are deprecated.

## Responsive delivery and performance

These are **release gates** for the visible cover:

- Supply intrinsic width and height, or otherwise reserve the exact aspect ratio, to prevent layout shifts. See [web.dev's CLS guidance](https://web.dev/articles/optimize-cls).
- Let the framework emit responsive `srcset` and `sizes`; do not send the full desktop resource to every narrow viewport. See [responsive-image guidance](https://web.dev/articles/serve-responsive-images).
- Use the optimized WebP cover in the page. The JPEG social derivative belongs in metadata and should not be fetched as a second visible hero.
- Never lazy-load the likely above-fold LCP hero. Make it discoverable in initial markup and use the framework's priority or `fetchpriority="high"` mechanism when measurement confirms it is the LCP candidate. Do not give high priority to every card image.
- Native lazy-load only images outside the initial viewport. See [LCP optimization](https://web.dev/articles/optimize-lcp) and [browser lazy-loading guidance](https://web.dev/articles/browser-level-image-lazy-loading).
- Check decoded sharpness as well as transfer size. A practical starting budget is at most about 250 KB for the WebP cover and 300 KB for the social JPEG, but these are project heuristics, not Google requirements. Prefer the smallest file that still looks polished.

Measure representative mobile and desktop pages. Google's current good-experience targets are LCP within 2.5 seconds and CLS at or below 0.1 at the 75th percentile; see [Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Provenance and AI-assisted imagery

Every image needs a completed entry in [`batch-01-image-manifest.md`](batch-01-image-manifest.md) containing at least:

- article title and canonical slug;
- visual purpose and final concept;
- generation prompt, tool/model, generation date, and human reviewer;
- cover and social paths, dimensions, byte sizes, and file hashes;
- DOM alt decision, social alt, and optional caption;
- original or reference asset sources and license/credit requirements;
- Google/GSoC and third-party trademark review;
- visual, accessibility, technical, and metadata QA status.

Keep the original generated artifact long enough to reproduce or re-crop the approved outputs. Preserve C2PA or other useful provenance metadata when the generation and conversion pipeline supports it, and keep the manifest even when optimization strips embedded metadata. Google recommends considering creation context and image metadata for automated content in its [generative AI guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content); it may surface C2PA details through “About this image,” as described in its [image metadata documentation](https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata).

A concise site-level statement that editorial illustrations are AI-assisted and human-reviewed is a transparency convention, not a ranking technique. Do not put “AI-generated” in DOM alt text unless the generation method is essential to the image's meaning.

## QA checklist

### Visual and rights

- [ ] One article-specific focal concept remains readable at card size.
- [ ] No official, altered, approximate, or accidental Google/GSoC/org logo appears.
- [ ] No gibberish text, malformed code, impossible interface, anatomy artifact, or misleading factual scene remains.
- [ ] Both crops are sharp, balanced, and free of clipped essential details.
- [ ] Any external reference asset has recorded provenance, license, and credit requirements.

### Accessibility and layout

- [ ] The manifest explains why DOM alt is empty or informative.
- [ ] Linked cards do not repeat the same accessible title through the image.
- [ ] Complex visual information has a complete adjacent text or data equivalent.
- [ ] Width and height reserve space; the image reflows without horizontal scrolling.
- [ ] Light mode, dark mode, narrow mobile, keyboard navigation, and high zoom were inspected.

### Search, social, and performance

- [ ] Both public image URLs return `200` with the correct content type and are crawlable.
- [ ] Visible markup contains an image `src`, responsive candidates, and appropriate `sizes`.
- [ ] Above-fold hero is not lazy-loaded; offscreen images are.
- [ ] Open Graph/social metadata uses the absolute 1200 × 630 URL and descriptive social alt.
- [ ] `BlogPosting.image`, canonical URL, title, dates, and visible content agree.
- [ ] No conflicting `noimageindex` or restrictive preview directive is present.
- [ ] Lighthouse or equivalent responsive checks show no image-caused CLS and no obvious LCP regression.
- [ ] After deployment, inspect representative URLs with Google's URL Inspection and Rich Results Test, then use relevant social preview debuggers. Account for cached previews when replacing an image at the same URL.

Record the outcome in the manifest rather than relying on an untracked verbal approval.
