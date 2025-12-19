/**
 * Shared footer constants and data
 * Used by both Footer and FooterSmall components
 */

export const FOOTER_COPYRIGHT = {
  text: "Built with ❤️ for the Google Summer of Code (GSoC) open source community",
  year: "2026",
  organization: "GSoCOrganizationsGuide",
  organizationUrl: "/",
};

export const SOCIAL_LINKS = {
  github: {
    href: "https://github.com/ketankauntia/gsoc-orgs/",
    label: "GSoC Organizations Guide GitHub",
  },
  twitter: {
    href: "https://www.x.com/kauntiaketan",
    label: "GSoC Organizations Guide Twitter @kauntiaketan",
  },
};

export const FOOTER_NAVIGATION_ITEMS = [
  {
    title: "Quick Links",
    description: "GSoC Related Quick Links",
    items: [
      {
        title: "GSoC Organizations",
        href: "/gsoc-organizations",
      },
      {
        title: "GSoC Tech Stack",
        href: "/gsoc-tech-stack",
      },
      {
        title: "GSoC Topics",
        href: "/gsoc-topics",
      },
      // { // will add when projects route is done
      //   title: "GSoC Projects",
      //   href: "/gsoc-projects",
      // },
      // {
      //   title: "GSoC Yearly Stats",
      //   href: "/gsoc-previous-years",
      // },
    ],
  },
  { // this will later be shifted to a proper yearly page
    title: "GSoC Yearly",
    description: "Yearly GSoC Organizations",
    items: [
      {
        title: "GSoC 2025",
        href: "/gsoc-2025-organizations",
      },
      {
        title: "GSoC 2024",
        href: "/gsoc-2024-organizations",
      },
      {
        title: "GSoC 2023",
        href: "/gsoc-2023-organizations",
      },
      {
        title: "GSoC 2022",
        href: "/gsoc-2022-organizations",
      },
      {
        title: "GSoC 2021",
        href: "/gsoc-2021-organizations",
      },
      {
        title: "GSoC 2020",
        href: "/gsoc-2020-organizations",
      },
      {
        title: "GSoC 2019",
        href: "/gsoc-2019-organizations",
      },
      {
        title: "GSoC 2018",
        href: "/gsoc-2018-organizations",
      },
      {
        title: "GSoC 2017",
        href: "/gsoc-2017-organizations",
      },
      {
        title: "GSoC 2016",
        href: "/gsoc-2016-organizations",
      },
    ],
  },
  {
    title: "Community",
    description: "GSoC Organizations Guide Community Links",
    items: [
      {
        title: "About Us",
        href: "/about-us",
      },
      {
        title: "Contact Us",
        href: "/contact-us",
      },
      {
        title: "Privacy Policy",
        href: "/privacy-policy",
      },
      {
        title: "Terms of Service",
        href: "/terms-of-service",
      },
      // {
      //   title: "Blog",
      //   href: "/blog",
      // },        
    ],
  },
];

