import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import { Container, SectionHeader, Heading, Text, CardWrapper, Grid } from "@/components/ui";
import type { Metadata } from "next";
import { getFullUrl } from "@/lib/constants";
import { Users, Target, Heart, Code, Globe } from "lucide-react";

// Force revalidation to ensure footer links stay updated
export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: "About Us | GSoC Organizations Guide",
  description:
    "Learn about GSoC Organizations Guide - your comprehensive platform to discover, explore, and prepare for Google Summer of Code opportunities. Our mission is to help students find the perfect open-source organization.",
  keywords: [
    "about GSoC",
    "Google Summer of Code guide",
    "GSoC platform",
    "open source education",
    "student developer resources",
  ],
  openGraph: {
    title: "About Us | GSoC Organizations Guide",
    description:
      "Learn about our mission to help students discover and prepare for Google Summer of Code opportunities.",
    url: getFullUrl("/about"),
    type: "website",
    siteName: "GSoC Organizations Guide",
    images: [
      {
        url: getFullUrl("/og/gsoc-organizations-guide.jpg"),
        width: 1200,
        height: 630,
        alt: "GSoC Organizations Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | GSoC Organizations Guide",
    description:
      "Learn about our mission to help students discover and prepare for Google Summer of Code opportunities.",
    images: [getFullUrl("/og/gsoc-organizations-guide.jpg")],
  },
  alternates: {
    canonical: getFullUrl("/about"),
  },
};

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "To empower students worldwide by providing comprehensive resources and tools to discover, explore, and prepare for Google Summer of Code opportunities.",
  },
  {
    icon: Heart,
    title: "Our Vision",
    description:
      "To become the go-to platform for students seeking open-source opportunities, making GSoC more accessible and approachable for everyone.",
  },
  {
    icon: Code,
    title: "What We Do",
    description:
      "We curate and organize information about GSoC organizations, helping students find projects that match their skills, interests, and experience level.",
  },
  {
    icon: Globe,
    title: "Community Focus",
    description:
      "We believe in the power of open-source communities and work to bridge the gap between students and organizations.",
  },
];

const stats = [
  { label: "Organizations", value: "200+", description: "Curated GSoC organizations" },
  { label: "Technologies", value: "50+", description: "Programming languages & frameworks" },
  { label: "Projects", value: "1000+", description: "Open source projects listed" },
  { label: "Students Helped", value: "10K+", description: "Students using our platform" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 lg:pt-24">
        <Container size="default" className="py-8 lg:py-16">
          <div className="space-y-16">
            {/* Hero Section */}
            <SectionHeader
              badge="About Us"
              title="Empowering Students in Open Source"
              titleAs="h1"
              description="GSoC Organizations Guide is dedicated to helping students discover and prepare for Google Summer of Code opportunities. We provide comprehensive resources, detailed organization profiles, and tools to help you find your perfect match."
              align="center"
              className="max-w-3xl mx-auto"
            />

            {/* Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <CardWrapper key={index} className="text-center p-6">
                  <Text className="text-3xl font-bold text-primary mb-2">{stat.value}</Text>
                  <Heading variant="small" className="mb-1">
                    {stat.label}
                  </Heading>
                  <Text variant="small" className="text-muted-foreground">
                    {stat.description}
                  </Text>
                </CardWrapper>
              ))}
            </div>

            {/* Values Section */}
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <Heading variant="section">Our Values</Heading>
                <Text className="text-muted-foreground max-w-2xl mx-auto">
                  The principles that guide everything we do
                </Text>
              </div>
              <Grid cols={{ default: 1, md: 2 }} gap="lg">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <CardWrapper key={index} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <Heading variant="small" className="mb-2">
                            {value.title}
                          </Heading>
                          <Text className="text-muted-foreground">{value.description}</Text>
                        </div>
                      </div>
                    </CardWrapper>
                  );
                })}
              </Grid>
            </div>

            {/* Story Section */}
            <CardWrapper className="p-8 lg:p-12">
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="text-center space-y-2">
                  <Heading variant="section">Our Story</Heading>
                </div>
                <div className="space-y-4 text-center">
                  <Text>
                    Google Summer of Code is an incredible opportunity for students to contribute to
                    open-source projects, learn from experienced mentors, and build their portfolio.
                    However, finding the right organization and project can be overwhelming with
                    hundreds of options available.
                  </Text>
                  <Text>
                    That&apos;s where we come in. GSoC Organizations Guide was created to simplify this
                    process. We&apos;ve curated comprehensive information about participating
                    organizations, their technologies, project difficulty levels, and more. Our goal
                    is to help you make informed decisions and find opportunities that align with
                    your skills and interests.
                  </Text>
                  <Text>
                    Whether you&apos;re a beginner looking for your first open-source contribution or an
                    experienced developer seeking challenging projects, we&apos;re here to support your
                    GSoC journey.
                  </Text>
                </div>
              </div>
            </CardWrapper>

            {/* Team Section */}
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <Heading variant="section">Built by the Community, for the Community</Heading>
                <Text className="text-muted-foreground max-w-2xl mx-auto">
                  GSoC Organizations Guide is an open-source project maintained by passionate
                  developers who believe in making open-source opportunities more accessible.
                </Text>
              </div>
              <CardWrapper className="p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-primary" />
                  <Heading variant="subsection">Open Source Contributors</Heading>
                </div>
                <Text className="text-muted-foreground max-w-2xl mx-auto">
                  We welcome contributions from the community! If you&apos;d like to help improve the
                  platform, add new features, or update organization information, check out our
                  repository on GitHub.
                </Text>
              </CardWrapper>
            </div>
          </div>
        </Container>
      </main>
      <FooterSmall />
    </div>
  );
}

