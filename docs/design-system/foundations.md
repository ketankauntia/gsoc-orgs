# Foundations

## Color

The system uses semantic roles. Components must not invent route-specific grays,
teals, or orange values.

| Role | Light value | Purpose |
| --- | --- | --- |
| `brand` / `primary` | `#ff5e1f` | Landmark surfaces, primary actions, active filters |
| `brand-hover` | `#e94f12` | Primary-action hover |
| `ink` | `#171615` | Dark editorial surface and high-emphasis text |
| `ink-soft` | `#242220` | Raised modules on dark surfaces |
| `canvas` / `background` | `#faf9f7` | Warm application background |
| `paper` / `card` | `#ffffff` | Explorer cards, tables, reading surfaces |
| `muted` | `#f1efeb` | Quiet grouped controls and secondary panels |
| `border` | `#dedbd5` | Structure, rails, dividers, and table boundaries |
| `text` | `#1d1d1f` | Primary text |
| `text-muted` | `#68645f` | Supporting copy and metadata |
| `success` | `#16845b` | Verified positive status |
| `warning` | `#b86200` | Caution and partial-data status |
| `danger` | `#c7352b` | Errors and destructive actions |

Normal-size text on orange uses `ink`; white is reserved for large display text or
decorative marks. Status meaning always includes a label or icon.

Chart order:

1. orange `#ff5e1f`
2. blue `#2f6fed`
3. teal `#0d9488`
4. violet `#7c5ce7`
5. lime `#84a414`

## Typography

- UI and display: Geist Sans
- Metadata and data labels: Geist Mono
- Body default: 16px / 1.6
- Small metadata: 12px / 1.4, uppercase only for short labels
- Hero: fluid `clamp(3rem, 8vw, 7.5rem)`, tight leading, maximum 10–12 words
- Page title: fluid `clamp(2.5rem, 5vw, 5rem)`
- Section title: fluid `clamp(2rem, 4vw, 3.75rem)`

Headings use compact tracking and medium weight. Body copy stays regular. Avoid
centered paragraphs longer than three lines.

## Layout

- 4px base spacing unit
- Common spacing: 8, 12, 16, 24, 32, 48, 64, 80, 120px
- Public shell: 1280px maximum
- Reading shell: 720px maximum
- Explorer shell: 1440px maximum where filter rail and result grid coexist
- Desktop: 12-column grid
- Tablet: 8-column grid
- Mobile: 4-column grid with 16px gutters

`PageRail` is the default large-section container: a maximum-width shell with
subtle left and right boundaries. It helps long pages retain structure without
wrapping every section in a floating card.

## Radius and elevation

- Data modules and controls: 6–8px
- Standard cards: 12px
- Landmark hero panels: 20–24px
- Pills: only badges, segmented controls, and primary CTA buttons

Nested radii must be concentric:

`outer radius = inner radius + padding`

Use borders for structure and layered transparent shadows for elevation. Avoid
blanket card shadows and hover zoom.

## Motion

| Token | Duration | Use |
| --- | --- | --- |
| instant | 120ms | color and opacity feedback |
| interaction | 180ms | hover, focus, menu state |
| layout | 260ms | drawers and disclosure |
| story | 700ms | rare hero storytelling only |

- Interactive transitions must name their properties.
- Press feedback is `scale(0.96)`.
- No auto-rotating content without pause controls.
- Page load must not depend on motion to reveal meaningful content.
- `prefers-reduced-motion` removes nonessential transforms and animation.

## Accessibility

- Minimum touch target: 44 × 44px
- Focus ring: 2px brand ring with 3px offset
- Minimum text contrast: WCAG AA
- Every icon-only action requires an accessible name
- Result-count changes use a polite live region and do not steal focus
- Charts include a plain-language takeaway and a table or text equivalent
- Filter state is reflected in the URL and removable chips are buttons
- Decorative atlas graphics are hidden from assistive technology

## Content

- Use “organization,” not “company,” for GSoC participants.
- Use “contributor,” not “student,” where the GSoC program language requires it.
- Never say “acceptance rate,” “selection chance,” or “beginner friendly” unless
  the exact definition and evidence are available.
- Use “first recorded participation” for first-time data unless the source proves
  the organization itself is new.
- AI output must distinguish sourced facts from generated interpretation and
  expose citations, freshness, and confidence.

