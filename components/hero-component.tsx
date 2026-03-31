"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button, Section, Heading, Text } from "@/components/ui";

export const HeroComponent = () => {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["Easier", "Smarter","Better","Cooler"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <Section className="relative overflow-hidden pt-24 md:pt-32 pb-16 md:pb-24">
      {/* Background Gradients (Light mode style) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top left light blue blob */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-[100px] opacity-70"></div>
        {/* Top right pale yellow/green blob */}
        <div className="absolute top-[-5%] right-[-10%] w-[600px] h-[600px] rounded-full bg-yellow-50/80 dark:bg-yellow-900/10 blur-[100px] opacity-70"></div>
      </div>

      <div className="container relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto px-4 mt-12 md:mt-20">
        
        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/50 px-4 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
            <span>Read our launch article</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>
        
        <div className="flex gap-4 flex-col w-full items-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-[80px] font-extrabold tracking-tight text-[#111827] dark:text-gray-50 leading-[1.1] mb-6 flex flex-col items-center justify-center gap-2"
          >
            <span>Making GSoC</span>
            <span className="text-[#3b82f6] dark:text-blue-500 relative inline-flex w-full justify-center overflow-hidden text-center pb-4 pt-1 px-8">
              {/* Force spacing correctly using transparent dummy */}
              <span className="opacity-0">Smarter</span>
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute font-semibold w-full"
                  initial={{ opacity: 0, y: "-100%" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? { y: 0, opacity: 1 }
                      : { y: titleNumber > index ? "-150%" : "150%", opacity: 0 }
                  }
                >
                  {title}
                </motion.span>
              ))}
              {/* Dynamic width underline based on parent block */}
              {/* <div className="absolute bottom-1 left-0 right-0 h-1.5 bg-[#3b82f6] dark:bg-blue-500" /> */}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="mt-2 text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-3xl leading-relaxed mx-auto text-center"
          >
            Find the right GSoC organizations, understand what they expect, explore project ideas, and prepare smarter with curated resources, timelines, and guides — all in one place.
          </motion.p>
        </div>

        {/* Action Buttons */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
           className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Link href="/organizations" prefetch={true} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base px-8 h-12 rounded-lg">
              View All GSoC Orgs
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="#features" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base px-8 h-12 rounded-lg bg-gray-50/50 hover:bg-gray-100 border-gray-200 text-gray-900 dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
            >
              Explore Features
            </Button>
          </Link>
        </motion.div>
      </div>
    </Section>
  );
};
