# Blog Content Format

Posts are markdown files in `content/posts/<slug>.md`. The filename becomes the URL slug. The parser lives in `lib/blog/parse.ts`, and the dashboard editor previews the same format.

## Frontmatter

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Post title and H1. |
| `description` | yes | Meta description and card excerpt. |
| `category` | yes | Free text; category pages derive from it. |
| `tags` | no | YAML array, for example `[gsoc, organizations]`. |
| `publishedAt` | yes | Use `YYYY-MM-DD`. Future dates stay hidden in production until that date. |
| `updatedAt` | no | Used for byline and feed metadata. |
| `author` | no | Author slug from `lib/blog/authors.ts`; default is `gsoc-orgs-team`. |
| `featured` | no | `true` puts the post in the blog index hero slot. |
| `draft` | no | `true` is visible in development and excluded from production listings, sitemap, RSS, and llms.txt. |
| `cornerstone` | no | Marks pillar content and applies stricter editor scoring. |
| `noindex` | no | Excludes from sitemap and emits robots noindex. |
| `canonical` | no | Override the self-canonical URL. |
| `coverTone` | no | `primary`, `chart-2`, `chart-3`, or `chart-5`. |
| `ogImage` | no | Per-post OG image path; falls back to the site default. |
| `tldr` | yes | Answer-first summary shown near the top of the article. |
| `keyphrase` | no | Focus keyphrase for editor checks; not rendered. |
| `keyTakeaways` | no | List of bullets. |
| `faqs` | no | List of `{q, a}` entries. |

Reading time is computed automatically.

## Editing

The dashboard editor is available only in development at `/dashboard/editor`. It writes the same markdown files in `content/posts/`.

## Body Syntax

- `## Heading` starts a section and feeds the table of contents.
- `#`, `###`, `####`, `#####`, and `######` render as heading blocks inside the current section.
- Paragraphs are separated by blank lines.
- Inline formatting supports `**bold**`, `*italic*`, `~~strike~~`, `==highlight==`, inline code, and links.
- Lists use `- item` or `1. item`.
- Task lists use `- [ ] item` and `- [x] item`.
- Tables use GitHub-flavored markdown table syntax.
- Blockquotes use `> quote`; a final `> - Name` line becomes attribution.
- Images use `![alt text](/blog/<post-slug>/image.svg "Caption")`.
- Code blocks use fenced markdown syntax.
- `---` or `***` on its own line renders a divider.
- `:::stat VALUE | label text` renders a stat block.
- `:::callout Title` through `:::` renders a callout box.

Uploaded images are stored under `public/blog/<post-slug>/`.
