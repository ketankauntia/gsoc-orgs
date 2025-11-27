import { ReactNode } from "react";
import { Container } from "@/components/ui";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";

interface OrganizationsLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for all /organizations/* routes
 * This wraps:
 * - /organizations
 * - /organizations/[slug]
 * - /organizations/[slug]/projects
 * etc.
 */
export default function OrganizationsLayout({
  children,
}: OrganizationsLayoutProps) {
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
      
      {/* Smaller footer for organizations pages */}
      <FooterSmall />
    </div>
  );
}

