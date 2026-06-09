export interface ChangelogEntry {
  date: string,
  timeStamp: number,
  version: string,
  title: string,
  summary: string,
  prLinks: { link: string, number: string }[],
  changes: {
    type: 'feat' | 'fix' | 'docs' | 'style' | 'refactor' | 'perf' | 'test' | 'chore',
    text: string
  }[],

}
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: "Jan 29, 2026",
    timeStamp: 20260129,
    version: "v1.1.0",
    title: "Dark Mode & UI Stabilization",
    summary: "Refined the dashboard's visual hierarchy by introducing a refined color system and fixing high-contrast issues in dark mode.",
    prLinks: [
      { link: "https://github.com/...", number: "#1" },
      { link: "https://github.com/...", number: "#2" },
      { link: "https://github.com/...", number: "#3" },
    ],

    changes: [
      { type: 'fix', text: 'Sidebar background now correctly renders black in dark mode' },
      { type: 'feat', text: 'Added new [filtering system](https://github.com/...) for better organization discovery.' },
      { type: 'refactor', text: 'Standardized border variables across all card components' }
    ]
  },
  {
    date: "Feb 15, 2026",
    timeStamp: 20260215,
    version: "v1.1.0",
    title: "Dark Mode & UI Stabilization",
    summary: "Refined the dashboard's visual hierarchy by introducing a refined color system and fixing high-contrast issues in dark mode.",
    prLinks: [
      { link: "https://github.com/...", number: "#3" },
      { link: "https://github.com/...", number: "#4" },
      { link: "https://github.com/...", number: "#5" },
      { link: "https://github.com/...", number: "#6" },
    ],
    changes: [
      { type: 'fix', text: 'Sidebar background now correctly renders black in dark mode' },
      { type: 'feat', text: ' Added new [filtering system](https://github.com/...) for better organization discovery.' },
      { type: 'refactor', text: 'Standardized border variables across all card components' }
    ]
  }
];