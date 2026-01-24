import Link from "next/link";
import { Calendar, ArrowRight, TrendingUp, Building2, Users } from "lucide-react";
import {
  Container,
  SectionHeader,
  Button,
  Badge,
  Grid,
  CardWrapper,
  Heading,
  Text,
} from "@/components/ui";
import { Header } from "@/components/header";
import { Footer } from "@/components/Footer";

// Static Generation - cache forever
export const revalidate = false;

export const metadata = {
  title: "GSoC Yearly Stats & Trends",
  description: "Explore Google Summer of Code statistics, trends, and insights by year. Historical data from 2016 to 2025.",
};

// Available years with their slugs
const yearlyPages = [
  { year: 2025, slug: "google-summer-of-code-2025" },
  { year: 2024, slug: "google-summer-of-code-2024" },
  { year: 2023, slug: "google-summer-of-code-2023" },
  { year: 2022, slug: "google-summer-of-code-2022" },
  { year: 2021, slug: "google-summer-of-code-2021" },
  { year: 2020, slug: "google-summer-of-code-2020" },
  { year: 2019, slug: "google-summer-of-code-2019" },
  { year: 2018, slug: "google-summer-of-code-2018" },
  { year: 2017, slug: "google-summer-of-code-2017" },
  { year: 2016, slug: "google-summer-of-code-2016" },
];

export default function YearlyIndexPage() {
  return (
    <>
      <Header />
      <div className="w-full pt-16">
        <Container size="default" className="py-8 lg:py-16">
          <div className="space-y-12 lg:space-y-16">

            {/* Hero Section */}
            <div className="space-y-6">
              <SectionHeader
                badge="GSoC Yearly"
                title="Google Summer of Code by Year"
                description="Explore comprehensive statistics, trends, and insights for each year of Google Summer of Code. Browse organization participation, project counts, and technology trends."
                align="center"
              />

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <StatCard
                  icon={<Calendar className="w-5 h-5 text-primary" />}
                  label="Years Covered"
                  value="10"
                />
                <StatCard
                  icon={<Building2 className="w-5 h-5 text-primary" />}
                  label="Organizations"
                  value="700+"
                />
                <StatCard
                  icon={<Users className="w-5 h-5 text-primary" />}
                  label="Projects"
                  value="10,000+"
                />
                <StatCard
                  icon={<TrendingUp className="w-5 h-5 text-primary" />}
                  label="Latest Year"
                  value="2025"
                />
              </div>
            </div>

            {/* Years Grid */}
            <div className="space-y-6">
              <Heading variant="subsection" className="text-center">
                Browse by Year
              </Heading>

              <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="md">
                {yearlyPages.map((item) => (
                  <Link key={item.year} href={`/yearly/${item.slug}`}>
                    <CardWrapper className="p-6 h-full hover:border-primary transition-colors cursor-pointer group">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                            GSoC {item.year}
                          </Badge>
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        
                        <Text variant="small" className="text-muted-foreground">
                          View detailed statistics, participating organizations, projects, and technology trends for Google Summer of Code {item.year}.
                        </Text>
                      </div>
                    </CardWrapper>
                  </Link>
                ))}
              </Grid>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-4 py-10 border-t">
              <Heading variant="subsection">
                Looking for specific data?
              </Heading>
              <Text className="max-w-2xl mx-auto text-muted-foreground">
                Choose a year above to explore detailed statistics, or browse by projects, organizations, or technologies.
              </Text>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <Button asChild size="lg">
                  <Link href="/yearly/google-summer-of-code-2025">
                    <Calendar className="w-4 h-4 mr-2" />
                    View 2025 Stats
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/projects">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Browse Projects
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </Container>
      </div>
      <Footer />
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card text-center">
      <div className="flex justify-center mb-2">
        {icon}
      </div>
      <Text className="text-2xl font-bold">{value}</Text>
      <Text variant="small" className="text-muted-foreground">
        {label}
      </Text>
    </div>
  );
}
