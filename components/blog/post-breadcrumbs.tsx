import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/blog-ui/breadcrumb";

/** Visible breadcrumb trail. Mirrored by BreadcrumbList JSON-LD in the structured-data phase. */
export function PostBreadcrumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {trail.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="line-clamp-1">{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
