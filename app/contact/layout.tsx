import { ReactNode } from "react";
import type { Metadata } from "next";
import { getFullUrl } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Send feedback, corrections, or questions to the independent GSoC Atlas project.",
  keywords: [
    "contact GSoC",
    "GSoC support",
    "GSoC help",
    "GSoC feedback",
    "GSoC questions",
  ],
  openGraph: {
    title: "Contact GSoC Atlas",
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
