import { MoveRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui";

interface Article {
  id: string;
  title: string;
  description: string;
  slug: string;
}

const COMING_SOON_ARTICLES: Article[] = [
  {
    id: "1",
    title: "How to Write a Winning GSoC Proposal",
    description: "Learn the key elements that make a GSoC proposal stand out and increase your chances of selection.",
    slug: "how-to-write-winning-gsoc-proposal",
  },
  {
    id: "2",
    title: "Top 10 Beginner-Friendly GSoC Organizations",
    description: "Discover organizations that welcome first-time contributors and offer great mentorship.",
    slug: "top-beginner-friendly-gsoc-organizations",
  },
  {
    id: "3",
    title: "GSoC Timeline 2026: Key Dates",
    description: "Stay on track with important deadlines and milestones for Google Summer of Code 2026.",
    slug: "gsoc-timeline-2026-key-dates",
  },
  {
    id: "4",
    title: "Choosing the Right Tech Stack for GSoC",
    description: "How to match your skills with the right organizations and project ideas.",
    slug: "choosing-right-tech-stack-gsoc",
  },
];

// Map articles to their corresponding images
const ARTICLE_IMAGES: Record<string, string> = {
  "1": "/blogs/google-summer-of-code-insights-trends.webp",
  "2": "/blogs/gsoc-organizations-data.webp",
  "3": "/blogs/gsoc-previous-year-insights.webp",
  "4": "/blogs/gsoc-organizations-ai-filter.webp",
};

export function LatestArticles() {
  return (
    <section className="w-full py-24 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-12 lg:gap-16">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8">
            <div className="max-w-2xl space-y-4">
              <Heading as="h2" className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Latest Articles
              </Heading>
              <Text className="text-lg text-zinc-600 dark:text-zinc-400">
                Expert insights, guides, and strategies to help you ace your Google Summer of Code application.
              </Text>
            </div>
            <Link href="/blog" className="shrink-0">
              <Button variant="outline" className="gap-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-900 border-zinc-200 h-11 px-6 dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10">
                View All Articles <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {COMING_SOON_ARTICLES.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={ARTICLE_IMAGES[article.id]}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  {/* Subtle overlay */}
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                </div>
                
                <div className="flex flex-col flex-grow p-6">
                  <div className="mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-500">
                      Guide
                    </span>
                  </div>
                  <Heading as="h3" className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {article.title}
                  </Heading>
                  <Text className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                    {article.description}
                  </Text>
                  
                  <div className="mt-auto flex items-center text-sm font-medium text-blue-600 dark:text-blue-500">
                    Read Article 
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
