This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Structure


**Main Pages:**
- `/` - Home page
- `/organizations` - All organizations listing
- `/organizations/[slug]` - Organization details
- `/tech-stack` - All technologies
- `/tech-stack/[stack]` - Technology-specific page
- `/topics` - All topics/categories
- `/topics/[topic]` - Topic-specific page
- `/gsoc-[year]-organizations` - Year-specific organizations (2005 to current+1)

**API Routes (Empty - Need Implementation):**
- `/api/organizations`
- `/api/organizations/[slug]`
- `/api/organizations/trending`
- `/api/years/[year]`


## URL Examples

```
Homepage:
https://yoursite.com/

All Organizations:
https://yoursite.com/organizations

Specific Organization:
https://yoursite.com/organizations/python-software-foundation

All Technologies:
https://yoursite.com/tech-stack

Python Organizations:
https://yoursite.com/tech-stack/python

All Topics:
https://yoursite.com/topics

Web Development Topic:
https://yoursite.com/topics/web-development

2024 Organizations:
https://yoursite.com/gsoc-2024-organizations
```


## Detailed Route Tree

```
gsoc-orgs/
│
├── / (Home)
│   ├── Header
│   │   ├── → /organizations
│   │   ├── → /tech-stack
│   │   └── → /topics
│   │
│   ├── Hero Section
│   ├── Trending Organizations
│   │   └── → /organizations/[slug]
│   ├── FAQ
│   └── Footer
│
├── /organizations
│   ├── Search & Filter UI
│   ├── Organization Cards Grid
│   └── → Each card links to /organizations/[slug]
│
├── /organizations/[slug]
│   ├── Organization Details
│   ├── Projects List
│   ├── Tech Stack → Links to /tech-stack/[stack]
│   └── Topics → Links to /topics/[topic]
│
├── /tech-stack
│   ├── Search Bar
│   ├── Trending Technologies Section
│   ├── All Technologies Grid
│   └── → Each card links to /tech-stack/[stack]
│
├── /tech-stack/[stack]
│   ├── Technology Details
│   ├── Organizations using this tech
│   └── → Links to /organizations/[slug]
│
├── /topics
│   ├── Search Bar
│   ├── Trending Topics Section
│   ├── All Topics Grid
│   └── → Each card links to /topics/[topic]
│
├── /topics/[topic]
│   ├── Topic Details
│   ├── Organizations in this category
│   └── → Links to /organizations/[slug]
│
└── /gsoc-[year]-organizations (Dynamic: 2005 to Current+1)
    ├── Year Statistics Dashboard
    ├── Charts & Visualizations
    ├── New Organizations Section
    ├── Beginner-Friendly Orgs
    ├── Tech Stack Filter
    ├── Topic Tags
    └── All Organizations for that year
        └── → Links to /organizations/[slug]
```

## API Routes Structure (Not Yet Implemented)

```
/api/
│
├── organizations/
│   ├── GET /api/organizations
│   │   └── Returns: All organizations
│   │
│   ├── /[slug]/
│   │   └── GET /api/organizations/[slug]
│   │       └── Returns: Single organization by slug
│   │
│   └── /trending/
│       └── GET /api/organizations/trending
│           └── Returns: Trending organizations
│
└── years/
    └── /[year]/
        └── GET /api/years/[year]
            └── Returns: Year-specific statistics and organizations
```
