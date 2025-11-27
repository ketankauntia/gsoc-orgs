"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  Section,
  Heading,
} from "@/components/ui";

export const TrendingOrgs = () => {
const [api, setApi] = useState<CarouselApi>();
const [current, setCurrent] = useState(0);

useEffect(() => {
    if (!api) {
    return;
    }

    setTimeout(() => {
    if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0);
        api.scrollTo(0);
    } else {
        api.scrollNext();
        setCurrent(current + 1);
    }
    }, 1000);
}, [api, current]);

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
              {Array.from({ length: 25 }).map((_, index) => (
                <CarouselItem className="basis-1/4 lg:basis-1/6" key={index}>
                  <div className="flex rounded-md aspect-square bg-muted items-center justify-center p-2">
                    <span className="text-sm">Logo {index + 1}</span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </Section>
);
};