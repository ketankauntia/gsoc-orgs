import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";

export function PostBreadcrumbs({
  trail,
  includeJsonLd = true,
}: {
  trail: { label: string; href?: string }[];
  includeJsonLd?: boolean;
}) {
  return <SiteBreadcrumbs items={trail} includeJsonLd={includeJsonLd} />;
}
