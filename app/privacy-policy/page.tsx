import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import { Container, SectionHeader, Heading, Text, CardWrapper } from "@/components/ui";
import type { Metadata } from "next";
import { getFullUrl } from "@/lib/constants";

// Force revalidation to ensure footer links stay updated
/**
 * ISR Configuration for Legal Pages
 * Cache for 30 days - only changes when legal content updates.
 */
export const revalidate = 2592000; // 30 days

export const metadata: Metadata = {
  title: "Privacy Policy | GSoC Organizations Guide",
  description:
    "Read our privacy policy to understand how GSoC Organizations Guide collects, uses, and protects your personal information.",
  keywords: [
    "privacy policy",
    "data protection",
    "GSoC privacy",
    "user privacy",
    "data security",
  ],
  openGraph: {
    title: "Privacy Policy | GSoC Organizations Guide",
    description: "Learn how we protect your privacy and handle your data.",
    url: getFullUrl("/privacy-policy"),
    images: ["/og.webp"],
  },
  alternates: {
    canonical: getFullUrl("/privacy-policy"),
  },
};

const sections = [
  {
    title: "Information We Collect",
    content: [
      "We collect information that you provide directly to us, such as when you use our search functionality, filter organizations, or contact us through our contact form.",
      "We automatically collect certain information about your device and how you interact with our website, including your IP address, browser type, and pages you visit.",
      "We use cookies and similar tracking technologies to enhance your experience and analyze website usage.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "To provide, maintain, and improve our services and website functionality.",
      "To respond to your inquiries and provide customer support.",
      "To analyze usage patterns and understand how visitors use our website.",
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
      "We use cookies to enhance your browsing experience and analyze website traffic.",
      "You can control cookies through your browser settings.",
      "Some features may not function properly if cookies are disabled.",
    ],
  },
  {
    title: "Third-Party Services",
    content: [
      "We use third-party services like Vercel Analytics for website analytics.",
      "These services may collect information about your use of our website.",
      "We encourage you to review their privacy policies.",
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
              description="Last updated: December 2024. This privacy policy explains how we collect, use, and protect your information when you use GSoC Organizations Guide."
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
                This privacy policy is effective as of December 2024 and will remain in effect
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

