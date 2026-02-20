"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { Section, Heading } from "@/components/ui";
import type { FeaturedOrg } from "@/lib/homepage-types";
import { fadeInUp, scaleOnHover, defaultViewport } from "@/lib/animations";

interface TrendingOrgsProps {
  organizations: FeaturedOrg[];
}

/**
 * TrendingOrgs Client Component
 * 
 * This component receives pre-loaded data from the server.
 * NO API calls - data is passed as props from static JSON.
 */
export function TrendingOrgsClient({ organizations }: TrendingOrgsProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Auto-scroll carousel
  useEffect(() => {
    if (!api || organizations.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0);
        api.scrollTo(0);
      } else {
        api.scrollNext();
        setCurrent(current + 1);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [api, current, organizations.length]);

  if (organizations.length === 0) {
    return null;
  }

  return (
    <Section noPadding className="py-12 lg:py-16">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={defaultViewport}
        className="grid grid-cols-5 gap-10 items-center"
      >
        <Heading variant="small" className="lg:max-w-xl">
          Trending GSoC Organizations
        </Heading>
        <div className="relative w-full col-span-4">
          <div className="bg-linear-to-r from-background via-white/0 to-background z-10 absolute left-0 top-0 right-0 bottom-0 w-full h-full"></div>
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {organizations.map((org) => (
                <CarouselItem className="basis-1/4 lg:basis-1/6" key={org.id}>
                  <a href={`/organizations/${org.slug}`}>
                    <div className="flex rounded-md aspect-square bg-muted items-center justify-center p-2 hover:bg-accent transition-colors overflow-hidden">
                      {org.img_r2_url ? (
                        <Image
                          src={org.img_r2_url}
                          alt={org.name}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover rounded-md"
                          unoptimized={true}
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xl font-bold text-muted-foreground">
                          {org.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  </a>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </motion.div>
    </Section>
  );
}
