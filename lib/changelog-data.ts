export interface ChangelogPRLink {
  number: string;
  link: string;
}

export interface ChangelogChange {
  text: string;
}

export interface ChangelogEntry {
  timeStamp: number;
  date: string;
  version: string;
  title: string;
  summary: string;
  changes: ChangelogChange[];
  prLinks: ChangelogPRLink[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    timeStamp: Date.parse("2026-02-25"),
    date: "Feb 25, 2026",
    version: "v2.0.0",
    title: "GSoC 2026 Data Integration",
    summary: "Complete integration of Google Summer of Code 2026 organization data with new data pipeline scripts and UI updates.",
    changes: [
      { text: "Added 4 new data pipeline scripts for fetching and transforming GSoC year data" },
      { text: "Integrated 185 active organizations for GSoC 2026 (156 returning + 29 new)" },
      { text: "Updated tech-stack and topics data to include 2026 statistics" },
      { text: "Added 2026 to year filter in organizations page" },
      { text: "Updated homepage metrics: 533 total orgs, 185 active orgs" },
      { text: "Added new npm scripts for GSoC data management" },
    ],
    prLinks: [],
  },
];
