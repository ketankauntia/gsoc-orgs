"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    content:
      "I spent weeks randomly browsing GSoC orgs last year and got rejected. This platform helped me filter by tech stack and see past project success rates. Got selected on my first attempt this year!",
  },
  {
    id: "2",
    name: "Alex Chen",
    role: "GSoC 2024 Contributor",
    title: "Game changer for GSoC prep",
    content:
      "The historical data on organizations was incredibly helpful. I could see which orgs consistently accept beginners and what technologies they actually use. Saved me so much research time.",
  },
  {
    id: "3",
    name: "Rahul Verma",
    role: "GSoC 2025 Contributor",
    title: "Best GSoC resource out there",
    content:
      "As a first-time applicant, I was overwhelmed by 200+ organizations. The filters and insights helped me narrow down to 5 perfect matches. The org comparison feature is brilliant!",
  },
  {
    id: "4",
    name: "Sarah Johnson",
    role: "GSoC 2024 Contributor",
    title: "Made org selection easy",
    content:
      "I always wanted to contribute to open source but didn't know where to start. This platform showed me beginner-friendly orgs with good mentorship history. Now I'm a GSoC alum!",
  },
  {
    id: "5",
    name: "Arjun Patel",
    role: "GSoC 2025 Contributor",
    title: "Data-driven decisions",
    content:
      "The analytics on acceptance rates and project difficulties were eye-opening. I could finally make informed decisions instead of guessing. Highly recommend for serious GSoC aspirants.",
  },
  {
    id: "6",
    name: "Emma Wilson",
    role: "GSoC 2024 Contributor",
    title: "Exactly what I needed",
    content:
      "Filtering organizations by programming language and seeing their GSoC track record helped me find the perfect match. The UI is clean and the data is comprehensive.",
  },
];

export function Testimonials() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
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
    }, 4000);

    return () => clearTimeout(timer);
  }, [api, current]);

  return (
    <section className="w-full py-12 lg:py-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col gap-10">
          <h2 className="text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-regular text-left">
            Trusted by GSoC aspirants worldwide
          </h2>
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {TESTIMONIALS.map((testimonial) => (
                <CarouselItem className="lg:basis-1/2" key={testimonial.id}>
                  <div className="bg-muted rounded-md h-full lg:col-span-2 p-6 aspect-video flex justify-between flex-col">
                    <Quote className="w-8 h-8 stroke-1 text-muted-foreground" />
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col">
                        <h3 className="text-xl tracking-tight">
                          {testimonial.title}
                        </h3>
                        <p className="text-muted-foreground max-w-xs text-base">
                          {testimonial.content}
                        </p>
                      </div>
                      <p className="flex flex-row gap-2 text-sm items-center">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={testimonial.avatar} />
                          <AvatarFallback>
                            {testimonial.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span>{testimonial.name}</span>
                        <span className="text-muted-foreground">
                          · {testimonial.role}
                        </span>
                      </p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
