import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Brand {
  name: string;
  logo: string;
  href?: string;
}

interface BrandsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  brands: Brand[];
}

export const BrandsGrid = React.forwardRef<HTMLDivElement, BrandsGridProps>(
  ({ 
    className,
    title,
    brands,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("py-12 lg:py-16", className)}
        {...props}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          {title && (
            <p className="max-w-md mx-auto text-pretty text-center font-medium mb-8 text-muted-foreground text-base">
              {title}
            </p>
          )}

          <div className="flex items-center justify-center gap-8 flex-wrap">
            {brands.map((brand) => (
              <div key={brand.name} className="flex items-center justify-center">
                {brand.href ? (
                  <a
                    href={brand.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="block"
                  >
                    <Image
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      width={280}
                      height={80}
                      className="h-16 sm:h-20 w-auto grayscale hover:grayscale-0 transition-all opacity-80 hover:opacity-100"
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    width={280}
                    height={80}
                    className="h-16 sm:h-20 w-auto grayscale opacity-80"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

BrandsGrid.displayName = "BrandsGrid";
