import { buildPageMetadata } from "@/lib/seo";
import { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Us",
  description:
    "Get in touch with GSoC Organizations Guide. Send questions, corrections to organization data, feature suggestions, or feedback about the site.",
  path: "/contact",
  keywords: ["contact GSoC", "GSoC support", "GSoC help", "GSoC feedback", "GSoC questions"],
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

