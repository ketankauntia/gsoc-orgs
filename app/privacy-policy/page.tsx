import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { LegalView, type LegalSection } from "@/components/cobalt/views/community";

/** Legal pages change rarely: cache for 30 days. */
export const revalidate = 2592000; // 30 days

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Read the GSoC Organizations Guide privacy policy to understand what information the site collects, how it is used, and how your personal data is protected.",
  path: "/privacy-policy",
  keywords: ["privacy policy", "data protection", "GSoC privacy", "user privacy", "data security"],
});

const sections: LegalSection[] = [
  {
    title: "Information We Collect",
    content: [
      "We collect information that you provide directly to us, such as when you use our search functionality, filter organizations, or contact us through our contact form.",
      "We automatically collect limited information about your device and how you interact with our website, such as browser type, approximate technical location, pages visited, and referring page.",
      "When enabled, Google Analytics 4 and Vercel Analytics process pseudonymous website-usage events such as page views and basic performance signals. They are not used to inspect proposal contents, private evidence, or contributor moderation activity.",
      "If you sign in to claim a project, Google and Neon Auth provide an account identifier, email address, display name, and profile image. Email is retained for private authentication and administration and is never included in public data.",
      "Proposal PDFs and the text extracted from them, project claims, private verification notes, evidence links, progress-post links, the record of administrative actions, and profile visibility choices are stored only as needed to operate these features.",
    ],
  },
  {
    title: "Proposal Library and Public Choices",
    content: [
      "Claim evidence and notes are always private. A proposal becomes public only when its verified author publishes it, or when we publish it with the author's recorded permission. Progress-post links appear publicly once the claim is verified. Text extracted from a proposal is never published; it is used to check for personal details and, later, for aggregate statistics only.",
      "A published proposal always includes the attribution name and archived GSoC project. Your name, avatar, bio and links appear beside your verified projects only if you make your profile public.",
      "Cloudflare R2 stores uploaded PDFs and imported Google profile images. Neon stores authentication, profile, catalog, claim, proposal, post and administrative records. Vercel hosts the application.",
      "We do not send proposal PDFs or private evidence to a third-party malware scanning service. Files receive format and structural validation and are delivered using restricted URLs.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "To provide, maintain, and improve our services and website functionality.",
      "To respond to your inquiries and provide customer support.",
      "To understand aggregated usage patterns, diagnose performance, and improve the public website.",
      "To send you updates and communications (only if you've opted in).",
    ],
  },
  {
    title: "Data Sharing and Disclosure",
    content: [
      "We do not sell, trade, or rent your personal information to third parties.",
      "We may share aggregated, anonymized data for analytical purposes.",
      "We may disclose information if required by law or to protect our rights and safety.",
    ],
  },
  {
    title: "Data Security",
    content: [
      "We implement appropriate technical and organizational measures to protect your personal information.",
      "However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
      "We use HTTPS encryption to protect data in transit.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "You have the right to access, update, or delete your personal information.",
      "You can opt-out of certain data collection by adjusting your browser settings.",
      "You can contact us at any time to exercise your privacy rights.",
    ],
  },
  {
    title: "Cookies and Tracking",
    content: [
      "When you sign in, Neon Auth sets session cookies (named __Secure-neon-auth.*) that keep you signed in. They are strictly necessary for the account features and are set only when you sign in; visitors who do not sign in do not get them.",
      "Google Analytics may use cookies or similar identifiers to measure website traffic. Vercel Analytics and Speed Insights use their own measurement mechanisms.",
      "You can control cookies through your browser settings or use browser privacy controls and opt-out extensions.",
      "Signing in does not work if cookies are disabled, and some other features may not work properly either.",
    ],
  },
  {
    title: "Third-Party Services",
    content: [
      "We use Google Analytics 4, Vercel Analytics, Vercel Speed Insights, Neon, Cloudflare R2, and Google Sign-In to operate the site and its optional contributor features.",
      "These providers may process technical request, usage, authentication, or storage metadata according to their own privacy policies.",
      "We do not send proposal PDFs, private evidence, or moderation notes to Google Analytics.",
      "Review the providers' privacy policies if you need more detail about their processing.",
    ],
  },
  {
    title: "Children's Privacy",
    content: [
      "Our website is not intended for children under 13 years of age.",
      "We do not knowingly collect personal information from children under 13.",
      "If you believe we have collected information from a child, please contact us immediately.",
    ],
  },
  {
    title: "Changes to This Policy",
    content: [
      "We may update this privacy policy from time to time.",
      "We will notify you of any material changes by posting the new policy on this page.",
      "Your continued use of our website after changes constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "Contact Us",
    content: [
      "If you have questions about this privacy policy, please contact us at:",
      "Email: gsocorganizationsguide@gmail.com",
      "We will respond to your inquiry within a reasonable timeframe.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalView
      title="Privacy Policy"
      updated="October 9, 2026"
      intro="GSoC Organizations Guide is committed to protecting your privacy. This policy explains how we collect, use, disclose and safeguard your information when you visit the website. Please read it carefully to understand how we handle your personal data."
      sections={sections}
      closing="This privacy policy is effective as of October 9, 2026 and will remain in effect except with respect to any changes in its provisions in the future."
    />
  );
}
