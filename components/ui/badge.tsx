import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center border font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Semantic variants for domain-specific badges
        tech: "border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        year: "border-transparent bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
        topic: "border-transparent bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
        category: "border-transparent bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
        neutral: "border-gray-200 bg-white text-gray-600 dark:bg-gray-800 dark:text-gray-300",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px] rounded gap-0.5 [&>svg]:size-2.5",
        sm: "px-2 py-0.5 text-xs rounded-md gap-1 [&>svg]:size-3",
        md: "px-2.5 py-1 text-sm rounded-lg gap-1.5 [&>svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
