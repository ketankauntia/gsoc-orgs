# Editorial Image System

This directory defines how editorial images are planned, generated, reviewed, stored, and wired into the GSoC blog. Read the [image SEO playbook](image-seo-playbook.md) before generating or publishing an asset.

Last research review: **2026-08-12**

## Current scope

The first production batch contains exactly **15 tailored article covers**: one useful, distinctive cover for each Batch 01 post. The batch does not authorize generic filler images throughout every article.

- Give each cover one clear article-specific concept and focal point.
- Keep the series visually related through a restrained teal, slate, off-white, cyan, and sparing amber palette.
- Use original editorial illustration without official Google, GSoC, or mentoring-organization logos.
- Do not bake article titles, keyword lists, code paragraphs, statistics, or tiny UI labels into the artwork.
- Add a supporting in-body visual only when it teaches something the prose cannot show as clearly. Prefer accessible HTML, a table, or a repository-native SVG for timelines, decision trees, and data graphics.

The batch-level prompt, accessibility decision, asset paths, review status, and provenance belong in [`batch-01-image-manifest.md`](batch-01-image-manifest.md).

## File contract

Every approved Batch 01 article uses its canonical post slug in this structure:

```text
public/blog/<slug>/<slug>-cover.webp   1600 x 900   visible 16:9 cover
public/blog/<slug>/<slug>-social.jpg   1200 x 630   Open Graph/social card
```

For example:

```text
public/blog/gsoc-eligibility/gsoc-eligibility-cover.webp
public/blog/gsoc-eligibility/gsoc-eligibility-social.jpg
```

`public/blogs/` is a legacy directory and must not receive this batch. The social image is an art-directed crop of the approved cover composition, never a stretched image or unrelated second concept.

## Required workflow

```text
read the article and brief
  -> define one visual teaching idea
  -> run the trademark and rights gate
  -> record the prompt and planned alt decision
  -> generate a text-free landscape composition
  -> inspect at full size
  -> prepare the 1600 x 900 cover
  -> art-direct the 1200 x 630 social crop
  -> optimize and record byte sizes
  -> wire visible image and metadata
  -> run accessibility, responsive, metadata, and performance QA
  -> approve in the manifest
```

Do not publish a generated file merely because it is technically valid. Regenerate or reject imagery with accidental logos, nonsensical interfaces or text, visual clutter, deceptive scenes, rendering artifacts, or a concept that could apply to any article.

## Release gate

An image is ready only when all answers are **yes**:

- Does it represent this article rather than a generic “person coding” scene?
- Is it free of Google, GSoC, and third-party organization logos or imitations?
- Does it remain clear when cropped on mobile and in the 1200 × 630 social frame?
- Is the DOM alt decision based on the image's purpose rather than SEO keywords?
- Are filenames, dimensions, formats, metadata, and provenance recorded?
- Does the post use a crawlable image element with reserved dimensions?
- Is the above-fold hero loaded without lazy loading while offscreen images remain lazy?
- Have the post, listing card, social preview, light theme, dark theme, and narrow viewport been checked?

See the [image SEO playbook](image-seo-playbook.md) for the source-backed rules and QA details.
