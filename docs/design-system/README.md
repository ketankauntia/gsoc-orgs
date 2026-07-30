# GSoC Atlas Design System

This is the product UI source of truth for the public GSoC Organizations Guide.
The working brand name in the interface is **GSoC Atlas**: an independent map of
organizations, projects, technologies, topics, and program history.

The visual direction takes inspiration from Cloudflare's disciplined use of
landmark color, page rails, compact product modules, and evidence-led storytelling.
It does not reuse Cloudflare or Google assets, fonts, illustrations, copy, logos, or
trademarked graphic compositions.

## Product principles

1. **Help people decide.** Every page should move a visitor toward finding,
   evaluating, comparing, or preparing for an organization.
2. **Evidence before claims.** Use data from the repository and name its date,
   source, definition, and limitations. Never imply a selection probability.
3. **One dominant idea per section.** A section gets one heading, one argument,
   and one obvious next action.
4. **Editorial landmarks, product clarity.** Orange and dark surfaces create
   memorable moments. Dense explorer, table, and reading surfaces stay light.
5. **Progressive disclosure.** Put fit signals and next steps first; place long
   histories, secondary charts, and advanced filter logic later.
6. **Accessible without a special pass.** Keyboard support, focus visibility,
   reduced motion, contrast, target sizes, and chart summaries are component
   requirements.
7. **Original open-source atlas language.** Use organization constellations,
   contribution paths, branches, commits, tags, and file-tree metadata—not a
   network globe or another company's motifs.

## Architecture

- Foundations: [`foundations.md`](./foundations.md)
- Component contracts: [`components.md`](./components.md)
- Product and route blueprint: [`product-blueprint.md`](./product-blueprint.md)
- Implementation decisions and discovered issues:
  [`implementation-log.md`](./implementation-log.md)

## Code ownership

- Global tokens and base behavior: `app/globals.css`
- Shared public primitives: `components/ui/*`
- Global public shell: `components/header.tsx`, `components/Footer.tsx`
- Domain cards: `components/organization-card.tsx`, `components/project-card.tsx`
- Charts and semantic status mappings: `lib/theme.ts`
- Blog primitives: `components/blog-ui/*`

The blog primitive namespace remains separate to avoid breaking editor behavior,
but it must consume the same semantic CSS variables.

## Review checklist

- Does the page have one `h1` and an obvious next action?
- Is every displayed number backed by a named dataset and date?
- Do loading, empty, partial-data, and error states remain understandable?
- Can the primary task be completed at 320px without horizontal scrolling?
- Are controls at least 44px where touch is expected?
- Is the focus ring visible against both light and dark surfaces?
- Does meaning survive without color and without animation?
- Do hover and press states use explicit properties rather than `transition: all`?
- Are future AI and proposal features labeled as future and kept behind flags?
