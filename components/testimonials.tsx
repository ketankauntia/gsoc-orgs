"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heading, Text } from "@/components/ui";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  title: string;
  content: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Priya Sharma",
    role: "GSoC 2025 Contributor",
    title: "Finally found the right org!",
    content: "I spent weeks randomly browsing GSoC orgs last year and got rejected. This platform helped me filter by tech stack and see past project success rates. Got selected on my first attempt this year!",
  },
  {
    id: "2",
    name: "Alex Chen",
    role: "GSoC 2024 Contributor",
    title: "Game changer for GSoC prep",
    content: "The historical data on organizations was incredibly helpful. I could see which orgs consistently accept beginners and what technologies they actually use. Saved me so much research time.",
  },
  {
    id: "3",
    name: "Rahul Verma",
    role: "GSoC 2025 Contributor",
    title: "Best GSoC resource out there",
    content: "As a first-time applicant, I was overwhelmed by 200+ organizations. The filters and insights helped me narrow down to 5 perfect matches. The org comparison feature is brilliant!",
  },
  {
    id: "4",
    name: "Sarah Johnson",
    role: "GSoC 2024 Contributor",
    title: "Made org selection easy",
    content: "I always wanted to contribute to open source but didn't know where to start. This platform showed me beginner-friendly orgs with good mentorship history. Now I'm a GSoC alum!",
  },
  {
    id: "5",
    name: "Arjun Patel",
    role: "GSoC 2025 Contributor",
    title: "Data-driven decisions",
    content: "The analytics on acceptance rates and project difficulties were eye-opening. I could finally make informed decisions instead of guessing. Highly recommend for serious GSoC aspirants.",
  },
  {
    id: "6",
    name: "Emma Wilson",
    role: "GSoC 2024 Contributor",
    title: "Exactly what I needed",
    content: "Filtering organizations by programming language and seeing their GSoC track record helped me find the perfect match. The UI is clean and the data is comprehensive.",
  },
];

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    const timer = setInterval(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        api.scrollTo(0);
        setCurrent(0);
      } else {
        api.scrollNext();
        setCurrent(current + 1);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [api, current]);

  return (
    <section className="w-full py-24 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col items-center text-center gap-6 mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mb-2">
            <Quote className="w-6 h-6 fill-current" />
          </div>
          <Heading as="h2" className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Trusted by GSoC aspirants
          </Heading>
          <Text className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            See how our platform has helped students worldwide navigate the Google Summer of Code application process successfully.
          </Text>
        </div>

        <div className="relative">
          <Carousel setApi={setApi} className="w-full" opts={{ align: "start", loop: true }}>
            <CarouselContent className="-ml-4 sm:-ml-6">
              {TESTIMONIALS.map((testimonial) => (
                <CarouselItem className="pl-4 sm:pl-6 md:basis-1/2 lg:basis-1/3" key={testimonial.id}>
                  <div className="bg-white dark:bg-zinc-950 rounded-2xl p-8 h-full flex flex-col justify-between border border-zinc-200/60 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    
                    {/* Top Accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex flex-col gap-6">
                      <div className="flex text-yellow-500 gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>

                      <div className="space-y-3">
                        <Heading as="h3" className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                          {testimonial.title}
                        </Heading>
                        <Text className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed h-[120px] line-clamp-4">
                          &quot;{testimonial.content}&quot;
                        </Text>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                      <Avatar className="h-12 w-12 border border-zinc-200 dark:border-zinc-700">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback className="bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium">
                          {testimonial.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{testimonial.name}</div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{testimonial.role}</div>
                      </div>
                    </div>

                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          
          {/* Gradient Edges */}
          <div className="absolute top-0 left-0 w-8 md:w-24 h-full bg-gradient-to-r from-zinc-50 dark:from-zinc-900 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 md:w-24 h-full bg-gradient-to-l from-zinc-50 dark:from-zinc-900 to-transparent pointer-events-none" />
        </div>

      </div>
    </section>
  );
}
