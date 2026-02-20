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
    href: "https://www.x.com/gsoc_orgs_guide",
    label: "X - GSoC",
  },
  twitter2:{
    href: "https://www.x.com/kauntiaketan", 
    label: "X - kauntiaketan",    
  },
  linkedin: {
    href: "https://www.linkedin.com/company/gsoc-organizations-guide/",
    label: "LinkedIn",
  },
  facebook: {
    href: "https://www.facebook.com/people/Gsoc-Organizations-Guide/61586071196146/",
    label: "Facebook",
  },
  pinterest: {
    href: "https://www.pinterest.com/gsocorganizationsguide/",
    label: "Pinterest",
  },
  quora: {
    href: "https://www.quora.com/profile/GSoC-Organizations-Guide",
    label: "Quora",
  },
};

export const FOOTER_NAVIGATION_ITEMS = [
  {
    title: "Quick Links",
    description: "GSoC Related Quick Links",
    items: [
      {
        title: "GSoC Organizations",
        href: "/organizations",
      },
      {
        title: "GSoC Tech Stack",
        href: "/tech-stack",
      },
      {
        title: "GSoC Topics",
        href: "/topics",
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
  {
    title: "GSoC Yearly",
    description: "Yearly GSoC Organizations",
    items: [
      {
        title: "GSoC 2025",
        href: "/yearly/google-summer-of-code-2025",
      },
      {
        title: "GSoC 2024",
        href: "/yearly/google-summer-of-code-2024",
      },
      {
        title: "GSoC 2023",
        href: "/yearly/google-summer-of-code-2023",
      },
      {
        title: "GSoC 2022",
        href: "/yearly/google-summer-of-code-2022",
      },
      {
        title: "GSoC 2021",
        href: "/yearly/google-summer-of-code-2021",
      },
      {
        title: "GSoC 2020",
        href: "/yearly/google-summer-of-code-2020",
      },
      {
        title: "GSoC 2019",
        href: "/yearly/google-summer-of-code-2019",
      },
      {
        title: "GSoC 2018",
        href: "/yearly/google-summer-of-code-2018",
      },
      {
        title: "GSoC 2017",
        href: "/yearly/google-summer-of-code-2017",
      },
      {
        title: "GSoC 2016",
        href: "/yearly/google-summer-of-code-2016",
      },
    ],
  },
  {
    title: "Community",
    description: "GSoC Organizations Guide Community Links",
    items: [
      {
        title: "About Us",
        href: "/about",
      },
      {
        title: "Contact Us",
        href: "/contact",
      },
      {
        title: "Privacy Policy",
        href: "/privacy-policy",
      },
      {
        title: "Terms and Conditions",
        href: "/terms-and-conditions",
      },
      {
        title: "Changelog",
        href: "/changelog",
      },
      // {
      //   title: "Blog",
      //   href: "/blog",
      // },        
    ],
  },
];

