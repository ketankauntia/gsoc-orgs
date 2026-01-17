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
  title: "Terms and Conditions | GSoC Organizations Guide",
  description:
    "Read our terms and conditions to understand the rules and guidelines for using GSoC Organizations Guide website and services.",
  keywords: [
    "terms and conditions",
    "terms of service",
    "user agreement",
    "GSoC terms",
    "website terms",
  ],
  openGraph: {
    title: "Terms and Conditions | GSoC Organizations Guide",
    description: "Read our terms and conditions for using our platform.",
    url: getFullUrl("/terms-and-conditions"),
    images: ["/og.webp"],
  },
  alternates: {
    canonical: getFullUrl("/terms-and-conditions"),
  },
};

const sections = [
  {
    title: "Acceptance of Terms",
    content: [
      "By accessing and using GSoC Organizations Guide, you accept and agree to be bound by these Terms and Conditions.",
      "If you do not agree with any part of these terms, you must not use our website.",
      "We reserve the right to update these terms at any time, and your continued use constitutes acceptance of the updated terms.",
    ],
  },
  {
    title: "Use of the Website",
    content: [
      "You may use our website for personal, non-commercial purposes to explore GSoC organizations and opportunities.",
      "You agree not to use the website for any unlawful purpose or in any way that could damage, disable, or impair the website.",
      "You must not attempt to gain unauthorized access to any part of the website or its related systems.",
    ],
  },
  {
    title: "Intellectual Property",
    content: [
      "All content on this website, including text, graphics, logos, and software, is the property of GSoC Organizations Guide or its content suppliers.",
      "You may not reproduce, distribute, or create derivative works from our content without explicit permission.",
      "GSoC and Google Summer of Code are trademarks of Google LLC. We are not affiliated with or endorsed by Google.",
    ],
  },
  {
    title: "User Content",
    content: [
      "If you submit any content to us (such as feedback or suggestions), you grant us a non-exclusive, royalty-free license to use, modify, and display that content.",
      "You represent that you have the right to submit such content and that it does not violate any third-party rights.",
      "We reserve the right to remove any user content that violates these terms or is otherwise objectionable.",
    ],
  },
  {
    title: "Accuracy of Information",
    content: [
      "We strive to provide accurate and up-to-date information about GSoC organizations, but we cannot guarantee the completeness or accuracy of all information.",
      "Information is provided 'as is' without warranties of any kind, either express or implied.",
      "You should verify important information directly with the organizations or official GSoC sources.",
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      "GSoC Organizations Guide shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the website.",
      "We are not responsible for any decisions made based on information provided on our website.",
      "Our total liability shall not exceed the amount you paid to use our services (which is currently $0 as our service is free).",
    ],
  },
  {
    title: "Third-Party Links",
    content: [
      "Our website may contain links to third-party websites that are not owned or controlled by us.",
      "We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites.",
      "You acknowledge and agree that we shall not be responsible for any damages resulting from your use of third-party websites.",
    ],
  },
  {
    title: "Prohibited Activities",
    content: [
      "You may not use automated systems (bots, scrapers) to access or collect data from our website without permission.",
      "You may not attempt to interfere with the proper working of the website or engage in any activity that disrupts the service.",
      "You may not use the website to transmit any viruses, malware, or harmful code.",
    ],
  },
  {
    title: "Termination",
    content: [
      "We reserve the right to terminate or suspend your access to the website at any time, without notice, for any reason.",
      "Upon termination, your right to use the website will immediately cease.",
      "All provisions of these terms that by their nature should survive termination shall survive.",
    ],
  },
  {
    title: "Governing Law",
    content: [
      "These terms shall be governed by and construed in accordance with applicable laws.",
      "Any disputes arising from these terms or your use of the website shall be resolved through appropriate legal channels.",
      "If any provision of these terms is found to be unenforceable, the remaining provisions shall remain in full effect.",
    ],
  },
  {
    title: "Contact Information",
    content: [
      "If you have any questions about these Terms and Conditions, please contact us:",
      "Email: gsocorganizationsguide@gmail.com",
      "We will respond to your inquiry as soon as possible.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 lg:pt-24">
        <Container size="default" className="py-8 lg:py-16">
          <div className="space-y-8">
            {/* Header Section */}
            <SectionHeader
              badge="Legal"
              title="Terms and Conditions"
              titleAs="h1"
              description="Last updated: December 2024. Please read these terms carefully before using GSoC Organizations Guide."
              align="center"
              className="max-w-3xl mx-auto"
            />

            {/* Introduction */}
            <CardWrapper className="p-6 lg:p-8">
              <Text className="text-muted-foreground">
                Welcome to GSoC Organizations Guide. These Terms and Conditions govern your access
                to and use of our website. By using our website, you agree to comply with and be
                bound by these terms. If you disagree with any part of these terms, please do not
                use our website.
              </Text>
            </CardWrapper>

            {/* Terms Sections */}
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
                These terms and conditions are effective as of December 2024. By using our website,
                you acknowledge that you have read, understood, and agree to be bound by these
                terms.
              </Text>
            </CardWrapper>
          </div>
        </Container>
      </main>
      <FooterSmall />
    </div>
  );
}

