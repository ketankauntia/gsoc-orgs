import { buildPageMetadata } from "@/lib/seo";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import { Container, SectionHeader, Heading, Text, CardWrapper } from "@/components/ui";
import type { Metadata } from "next";

// Force revalidation to ensure footer links stay updated
/**
 * ISR Configuration for Legal Pages
 * Cache for 30 days - only changes when legal content updates.
 */
export const revalidate = 2592000; // 30 days

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "Read the GSoC Organizations Guide privacy policy to understand what information the site collects, how it is used, and how your personal data is protected.",
  path: "/privacy-policy",
  keywords: ["privacy policy", "data protection", "GSoC privacy", "user privacy", "data security"],
});

const sections = [
  {
    title: "Information We Collect",
    content: [
      "We collect information that you provide directly to us, such as when you use our search functionality, filter organizations, or contact us through our contact form.",
      "We automatically collect limited information about your device and how you interact with our website, such as browser type, approximate technical location, pages visited, and referring page.",
      "When enabled, Google Analytics 4 and Vercel Analytics process pseudonymous website-usage events such as page views and basic performance signals. They are not used to inspect proposal contents, private evidence, or contributor moderation activity.",
      "If you sign in to share a proposal, Google and Supabase provide an account identifier, email address, display name, and profile image. Email is retained for private authentication and administration and is never included in public proposal data.",
      "Proposal PDFs, contributor claims, private verification notes, evidence links, moderation history, and profile visibility choices are stored only as needed to operate the proposal library.",
    ],
  },
  {
    title: "Proposal Library and Public Choices",
    content: [
      "Proposal PDFs and claim evidence remain private while a submission is in draft or moderation. Only approved proposals are publicly accessible.",
      "An approved proposal always includes the attribution name and archived GSoC selection. You separately control whether your Google avatar, bio, and each profile link are public.",
      "Cloudflare R2 stores uploaded PDFs and imported Google profile images. Supabase stores authentication, profile, catalog, claim, and moderation records. Vercel hosts the application.",
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
      "Google Analytics may use cookies or similar identifiers to measure website traffic. Vercel Analytics and Speed Insights use their own measurement mechanisms.",
      "You can control cookies through your browser settings or use browser privacy controls and opt-out extensions.",
      "Some features may not function properly if cookies are disabled.",
    ],
  },
  {
    title: "Third-Party Services",
    content: [
      "We use Google Analytics 4, Vercel Analytics, Vercel Speed Insights, Supabase, Cloudflare R2, and Google Sign-In to operate the site and its optional proposal-library features.",
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 lg:pt-24">
        <Container size="default" className="py-8 lg:py-16">
          <div className="space-y-8">
            {/* Header Section */}
            <SectionHeader
              badge="Legal"
              title="Privacy Policy"
              titleAs="h1"
                description="Last updated: August 15, 2026. This privacy policy explains how we collect, use, and protect your information when you use GSoC Organizations Guide."
              align="center"
              className="max-w-3xl mx-auto"
            />

            {/* Introduction */}
            <CardWrapper className="p-6 lg:p-8">
              <Text className="text-muted-foreground">
                At GSoC Organizations Guide, we are committed to protecting your privacy. This
                privacy policy explains how we collect, use, disclose, and safeguard your
                information when you visit our website. Please read this policy carefully to
                understand our practices regarding your personal data.
              </Text>
            </CardWrapper>

            {/* Policy Sections */}
            <div className="space-y-6">
              {sections.map((section, index) => (
                <CardWrapper key={index} className="p-6 lg:p-8">
                  <Heading variant="subsection" className="mb-4">
                    {section.title}
                  </Heading>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-3">
                        <span className="text-primary shrink-0">•</span>
                        <Text className="text-muted-foreground">{item}</Text>
                      </li>
                    ))}
                  </ul>
                </CardWrapper>
              ))}
            </div>

            {/* Effective Date */}
            <CardWrapper className="p-6 bg-muted/50">
              <Text variant="small" className="text-muted-foreground text-center">
                This privacy policy is effective as of August 15, 2026 and will remain in effect
                except with respect to any changes in its provisions in the future.
              </Text>
            </CardWrapper>
          </div>
        </Container>
      </main>
      <FooterSmall />
    </div>
  );
}

