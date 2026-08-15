/** Shared footer content used across the site. */

export const FOOTER_COPYRIGHT = {
  text: "Built for the Google Summer of Code open source community",
  year: "2026",
  organization: "GSoC Organizations Guide",
  organizationUrl: "/",
};

export const SOCIAL_LINKS = {
  github: { href: "https://github.com/ketankauntia/gsoc-orgs/", label: "GSoC Organizations Guide GitHub" },
  twitter: { href: "https://www.x.com/gsoc_orgs_guide", label: "GSoC Organizations Guide on X" },
  twitter2: { href: "https://www.x.com/kauntiaketan", label: "Maintainer on X" },
  linkedin: { href: "https://www.linkedin.com/company/gsoc-organizations-guide/", label: "GSoC Organizations Guide on LinkedIn" },
  facebook: { href: "https://www.facebook.com/people/Gsoc-Organizations-Guide/61586071196146/", label: "GSoC Organizations Guide on Facebook" },
  pinterest: { href: "https://www.pinterest.com/gsocorganizationsguide/", label: "GSoC Organizations Guide on Pinterest" },
  quora: { href: "https://www.quora.com/profile/GSoC-Organizations-Guide", label: "GSoC Organizations Guide on Quora" },
};

export const FOOTER_NAVIGATION_ITEMS = [
  {
    title: "Explore",
    description: "Browse current GSoC data",
    items: [
      { title: "GSoC 2026", href: "/yearly/google-summer-of-code-2026" },
      { title: "Organizations", href: "/organizations" },
      { title: "Projects", href: "/projects" },
      { title: "Technologies", href: "/tech-stack" },
      { title: "Topics", href: "/topics" },
    ],
  },
  {
    title: "Learn & share",
    description: "Prepare and participate",
    items: [
      { title: "Proposals", href: "/proposals" },
      { title: "Blog", href: "/blog" },
      { title: "Past editions", href: "/yearly" },
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Project",
    description: "About this open source guide",
    items: [
      { title: "Changelog", href: "/changelog" },
      { title: "Privacy policy", href: "/privacy-policy" },
      { title: "Terms", href: "/terms-and-conditions" },
      { title: "GitHub", href: "https://github.com/ketankauntia/gsoc-orgs/", external: true },
      { title: "Official GSoC archive", href: "https://summerofcode.withgoogle.com/archive", external: true },
    ],
  },
];
