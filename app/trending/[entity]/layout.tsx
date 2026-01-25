import { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/Footer";

interface TrendingLayoutProps {
  children: ReactNode;
}

/**
 * Layout wrapper for all /trending/* routes
 * Includes header and footer with proper spacing
 */
export default function TrendingLayout({
  children,
}: TrendingLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 lg:pt-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}
