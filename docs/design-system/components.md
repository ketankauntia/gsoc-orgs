# Component Contracts

Every component documents content limits, interaction states, keyboard behavior,
and responsive recomposition. The initial implementation set follows.

## Layout and navigation

### `Header`

- Persistent product identity and six top-level destinations at desktop.
- Current route receives text, marker, and `aria-current` state.
- Mobile menu traps scroll, focuses its first link, closes on `Escape`, and
  returns focus to the trigger.
- The header does not shrink or change width on scroll.

### `PageRail`

- Provides the 1280px shell, horizontal gutters, and optional boundary lines.
- Landmark sections may break out visually but keep content on the same grid.

### `SectionHeader`

- Optional mono kicker, one heading, up to 160 characters of supporting copy,
  and at most one primary plus one text action.

## Actions and inputs

### `Button`

- Variants: brand, dark, outline, soft, ghost, link, destructive.
- Default and large buttons meet the 44px touch target.
- Brand buttons use dark text on orange.
- Hover, focus, disabled, busy, and press states are required.

### `Search`

- Label remains available to assistive technology.
- `Enter` submits; clear is a named button; `Escape` clears only when focus is
  inside the field.
- Global search routes to `/organizations?q=<query>`.
- Suggestions, when added, group organizations, technologies, topics, and guides.

### `FilterChip`

- Selected state uses icon/label plus color.
- Removal is a real button.
- Advanced AND/OR logic stays inside an “Advanced matching” disclosure.

## Data modules

### `MetricCell`

- One value, one label, and optional source/freshness note.
- Numbers use tabular figures.
- Never animates from zero on initial render.

### `OrganizationCard`

Priority order:

1. identity and latest recorded year;
2. short description;
3. project count and participation span;
4. up to three technology labels;
5. one clear detail action.

Cards do not list every year or every technology. Missing logos use a deterministic
initial fallback. External image failure must not collapse the layout.

### `ChartFrame`

- Heading, plain-language takeaway, visualization, source/freshness, and table or
  text equivalent.
- Tooltip values include units and denominator where applicable.
- Color is not the only series distinction.

### `FreshnessBadge`

States: current, snapshot, stale, partial. The badge always includes a readable
date or an adjacent source note.

## Feedback states

Every route family needs:

- skeleton with stable dimensions;
- no-results state that preserves active filters and offers reset;
- partial-data state that names what is missing;
- error state with a retry or safe next route;
- offline behavior for static data where available.

## Future components

These may be styled and documented but must remain feature-flagged until their
data and safety contracts exist:

- `ShortlistTray`
- `CompareGrid`
- `AIInsightPanel`
- `ProposalUploadDropzone`
- `ProposalReviewWorkspace`

`AIInsightPanel` requires citations, generated/sourced labels, freshness,
confidence, and a feedback mechanism. Proposal upload requires the privacy,
consent, moderation, retention, abuse, and takedown gates in work packet 08.

