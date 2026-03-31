import { Badge } from "@/components/ui/badge";
import { Building2, History, Code2, BarChart3, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Heading, Text } from "@/components/ui";

const features = [
  {
    icon: Building2,
    badge: "Organizations",
    title: "Explore 200+ GSoC Organizations",
    description: "Browse through all participating GSoC organizations with detailed profiles, tech stacks, project ideas, and historical performance data. Filter by language, category, or beginner-friendliness to find your perfect match.",
    image: "/gsoc-organizations-data.webp",
    linkText: "View Organizations",
    linkHref: "/organizations",
  },
  {
    icon: History,
    badge: "Previous Editions",
    title: "Learn from Past GSoC Years",
    description: "Access comprehensive data from GSoC 2016 to 2025. Study past projects, understand what worked, see mentor patterns, and identify organizations with consistent participation and high success rates.",
    image: "/gsoc-previous-year-insights.webp",
    linkText: "Explore Archives",
    linkHref: "/archives",
  },
  {
    icon: Code2,
    badge: "Tech Stack",
    title: "Find Orgs by Technology",
    description: "Python, JavaScript, Rust, Go, or any other language — filter organizations by your preferred tech stack. See which technologies are trending in GSoC and match your skills with the right opportunities.",
    image: "/gsoc-organizations-ai-filter.webp",
    linkText: "Filter by Tech",
    linkHref: "/technologies",
  },
  {
    icon: BarChart3,
    badge: "Analytics",
    title: "Data-Driven Insights",
    description: "Make informed decisions with visual analytics. Track organization trends, compare acceptance rates, analyze project difficulty distributions, and discover patterns that increase your selection chances.",
    image: "/google-summer-of-code-insights-trends.webp",
    linkText: "View Analytics",
    linkHref: "/analytics",
  }
];

export function ValueBlocks() {
  return (
    <section id="features" className="w-full py-24 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Heading as="h2" className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Everything You Need for GSoC Success
          </Heading>
          <Text className="text-lg text-zinc-600 dark:text-zinc-400">
            A complete suite of tools and insights designed to give you a competitive edge in your Google Summer of Code application process.
          </Text>
        </div>

        <div className="flex flex-col gap-24 lg:gap-32">
          {features.map((feature, index) => {
            const isEven = index % 2 === 0;
            const Icon = feature.icon;

            return (
              <div 
                key={index}
                className={`flex flex-col lg:flex-row gap-12 lg:gap-20 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}
              >
                {/* Content Side */}
                <div className="flex-1 space-y-6 lg:space-y-8">
                  <div>
                    <Badge variant="outline" className="gap-2 px-3 py-1.5 rounded-full border-blue-200 bg-blue-50/50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400">
                      <Icon className="w-4 h-4" />
                      {feature.badge}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <Heading as="h3" className="text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {feature.title}
                    </Heading>
                    <Text className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-xl">
                      {feature.description}
                    </Text>
                  </div>

                  {/* Optional: We can keep the link if desired, or skip it. Retaining for a premium look. */}
                  <div>
                     <Link href={feature.linkHref} className="inline-flex items-center text-blue-600 dark:text-blue-500 font-medium hover:text-blue-700 dark:hover:text-blue-400 hover:underline transition-all">
                       {feature.linkText}
                       <ArrowRight className="w-4 h-4 ml-2" />
                     </Link>
                  </div>
                </div>

                {/* Image Side */}
                <div className="flex-1 w-full max-w-xl lg:max-w-none relative group">
                  {/* Decorative backdrop */}
                  <div className="absolute -inset-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl shadow-zinc-200/20 dark:shadow-black/40 aspect-[4/3] bg-zinc-50 dark:bg-zinc-900">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
