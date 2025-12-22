import { ReactNode } from "react";
import { Container } from "@/components/ui";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";

interface TechStackLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for all /tech-stack routes
 * This wraps:
 * - /tech-stack (index)
 * - /tech-stack/[stack] (detail pages)
 */
export default function TechStackLayout({ children }: TechStackLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - same across all pages */}
      <Header />
      {/* Main content area with consistent max-width */}
      {/* pt-20 accounts for fixed header height */}
      <main className="flex-1 pt-20 lg:pt-24">
        <Container size="default" className="py-8 lg:py-16">
          {children}
        </Container>
      </main>
      
      {/* Smaller footer */}
      <FooterSmall />
    </div>
  );
}

