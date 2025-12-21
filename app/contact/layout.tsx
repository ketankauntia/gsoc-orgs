import { ReactNode } from "react";
import type { Metadata } from "next";
import { getFullUrl } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us | GSoC Organizations Guide",
  description:
    "Get in touch with GSoC Organizations Guide. Have questions, suggestions, or feedback? We'd love to hear from you!",
  keywords: [
    "contact GSoC",
    "GSoC support",
    "GSoC help",
    "GSoC feedback",
    "GSoC questions",
  ],
  openGraph: {
    title: "Contact Us | GSoC Organizations Guide",
    description: "Get in touch with us. We'd love to hear from you!",
    url: getFullUrl("/contact"),
    images: ["/og.webp"],
  },
  alternates: {
    canonical: getFullUrl("/contact"),
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

