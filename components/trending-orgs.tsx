"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import { Section, Heading } from "@/components/ui";

interface Organization {
  id: string;
  name: string;
  slug: string;
  img_r2_url: string;
}

export const TrendingOrgs = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch trending organizations
  useEffect(() => {
    async function fetchOrgs() {
      try {
        const response = await fetch('/api/organizations?limit=25&page=1');
        if (response.ok) {
          const data = await response.json();
          setOrgs(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch trending orgs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrgs();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (!api || loading || orgs.length === 0) {
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
  }, [api, current, loading, orgs.length]);

  if (loading) {
    return (
      <Section noPadding className="py-20 lg:py-20">
        <div className="grid grid-cols-5 gap-10 items-center">
          <Heading variant="small" className="lg:max-w-xl">
            Trending GSoC Organizations
          </Heading>
          <div className="col-span-4 animate-pulse">
            <div className="h-24 bg-muted rounded-md" />
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section noPadding className="py-20 lg:py-20">
      <div className="grid grid-cols-5 gap-10 items-center">
        <Heading variant="small" className="lg:max-w-xl">
          Trending GSoC Organizations
        </Heading>
        <div className="relative w-full col-span-4">
          <div className="bg-linear-to-r from-background via-white/0 to-background z-10 absolute left-0 top-0 right-0 bottom-0 w-full h-full"></div>
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {orgs.map((org) => (
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
      </div>
    </Section>
  );
};