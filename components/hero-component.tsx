"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight } from "lucide-react";
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
    <Section>
      <div className="flex gap-8 items-center justify-center flex-col">
        <div>
          <Button variant="secondary" size="sm" className="gap-4">
            Read our launch article <MoveRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-4 flex-col">
          <Heading as="h1" variant="hero" className="max-w-2xl text-center">
            <span className="text-spektr-cyan-50">Making GSOC</span>
            <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
              &nbsp;
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute font-semibold"
                  initial={{ opacity: 0, y: "-100" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? {
                          y: 0,
                          opacity: 1,
                        }
                      : {
                          y: titleNumber > index ? -150 : 150,
                          opacity: 0,
                        }
                  }
                >
                  {title}
                </motion.span>
              ))}
            </span>
          </Heading>

          <Text variant="lead" className="max-w-2xl text-center">
            Find the right GSoC organizations, understand what they expect, explore project ideas, study previous GSoC projects, and prepare smarter with curated resources, timelines, and guides all in one place.
          </Text>
        </div>
        <div className="flex flex-row gap-3">
          <Button size="lg" className="gap-4">
            View All GSoC Orgs <MoveRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Section>
  );
};
