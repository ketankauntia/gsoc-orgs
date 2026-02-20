"use client";

import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer, staggerItem, defaultViewport } from "@/lib/animations";

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
    <section className="w-full py-12 lg:py-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col gap-14">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="flex w-full flex-col sm:flex-row sm:justify-between sm:items-center gap-8"
          >
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
              Latest articles
            </h2>
            <Button asChild className="gap-4 w-fit">
              <Link href="/blog">
                View all articles <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={defaultViewport}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {COMING_SOON_ARTICLES.map((article) => (
              <motion.div key={article.id} variants={staggerItem}>
                <Link
                  href="/blog"
                  className="flex flex-col gap-2 hover:opacity-75 cursor-pointer transition-opacity"
                >
                <div className="bg-muted rounded-md aspect-video mb-4 overflow-hidden">
                  <Image
                    src={ARTICLE_IMAGES[article.id]}
                    alt={article.title}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="text-xl tracking-tight">{article.title}</h3>
                <p className="text-muted-foreground text-base">
                  {article.description}
                </p>
              </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
