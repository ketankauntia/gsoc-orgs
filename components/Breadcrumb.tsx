"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function BreadcrumbBasic() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);
  if (paths.length === 0) return null;
  return (
    <div className="mx-auto  max-w-4xl px-4">
      <Breadcrumb className="py-2 px-4 bg-background">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>

          {paths.map((segment, index) => {
            const href = "/" + paths.slice(0, index + 1).join("/");

            // Optional: format text (capitalize + replace -)
            const label =
              segment.charAt(0).toUpperCase() +
              segment.slice(1).replace(/-/g, " ");

            return (
              <span key={href} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === paths.length - 1 ? (
                    <BreadcrumbPage >{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
