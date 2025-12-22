import { ReactNode } from "react";
import { Header } from "@/components/header";

interface OrganizationsLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for all /organizations/* routes
 * Uses a fixed header with full-height content below
 */
export default function OrganizationsLayout({
  children,
}: OrganizationsLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header - Fixed at top */}
      <Header />
      {/* Main content area */}
      {/* pt-20 accounts for fixed header height (80px) */}
      <main className="pt-20 lg:pt-24">
        {children}
      </main>
    </div>
  );
}
