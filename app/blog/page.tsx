import { Header } from "@/components/header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MoveLeft, Bell } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Blog - Coming Soon | GSoC Organizations Guide",
  description:
    "Stay tuned for GSoC guides, tips, and insights. Our blog is launching soon with articles on proposals, organizations, and success strategies.",
  openGraph: {
    title: "Blog - Coming Soon | GSoC Organizations Guide",
    description:
      "Stay tuned for GSoC guides, tips, and insights. Our blog is launching soon with articles on proposals, organizations, and success strategies.",
    url: `${SITE_URL}/blog`,
    type: "website",
    siteName: "GSoC Organizations Guide",
  },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
};

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] flex items-center justify-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center text-center gap-8 py-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
              <Bell className="size-4" />
              <span>Coming Soon</span>
            </div>
            
            <div className="flex flex-col gap-4 max-w-2xl">
              <h1 className="text-4xl md:text-6xl tracking-tighter font-regular">
                Blog launching soon
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                We&apos;re working on comprehensive guides, tips, and insights to help you 
                crack GSoC. From proposal writing to organization selection, we&apos;ve got you covered.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="outline" className="gap-2">
                <Link href="/">
                  <MoveLeft className="size-4" />
                  Back to Home
                </Link>
              </Button>
              <Button asChild className="gap-2">
                <Link href="/organizations">
                  Explore Organizations
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
