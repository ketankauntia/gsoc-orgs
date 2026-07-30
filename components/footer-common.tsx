/** Shared navigation and social destinations for public footer surfaces. */
export const FOOTER_COPYRIGHT = {
  text: "Built for the open-source contributor community",
  year: "2026",
  organization: "GSoC Atlas",
  organizationUrl: "/",
};

export const SOCIAL_LINKS = {
  github: {
    href: "https://github.com/ketankauntia/gsoc-orgs/",
    label: "GSoC Atlas on GitHub",
  },
  twitter: {
    href: "https://www.x.com/gsoc_orgs_guide",
    label: "GSoC Atlas on X",
  },
  twitter2: {
    href: "https://www.x.com/kauntiaketan",
    label: "Ketan Kauntia on X",
  },
  linkedin: {
    href: "https://www.linkedin.com/company/gsoc-organizations-guide/",
    label: "GSoC Atlas on LinkedIn",
  },
  facebook: {
    href: "https://www.facebook.com/people/Gsoc-Organizations-Guide/61586071196146/",
    label: "GSoC Atlas on Facebook",
  },
  pinterest: {
    href: "https://www.pinterest.com/gsocorganizationsguide/",
    label: "GSoC Atlas on Pinterest",
  },
  quora: {
    href: "https://www.quora.com/profile/GSoC-Organizations-Guide",
    label: "GSoC Atlas on Quora",
  },
};

export const FOOTER_NAVIGATION_ITEMS = [
  {
    title: "Explore",
    description: "Browse the dataset",
    items: [
      { title: "Organizations", href: "/organizations" },
      { title: "Projects", href: "/projects" },
      { title: "Technologies", href: "/tech-stack" },
      { title: "Topics", href: "/topics" },
    ],
  },
  {
    title: "Understand",
    description: "Read the evidence",
    items: [
      { title: "Yearly insights", href: "/yearly" },
      { title: "Guides & articles", href: "/blog" },
      { title: "Public API", href: "/api/v1" },
      { title: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Project",
    description: "About this guide",
    items: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
      { title: "GitHub", href: SOCIAL_LINKS.github.href },
      { title: "RSS feed", href: "/rss.xml" },
    ],
  },
];

