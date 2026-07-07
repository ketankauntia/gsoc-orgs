import { BlogSiteFooter } from "@/components/blog-site-footer";
import { BlogSiteHeader } from "@/components/blog-site-header";
import { notFound } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <BlogSiteHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <BlogSiteFooter />
    </div>
  );
}
