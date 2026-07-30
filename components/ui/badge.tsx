import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap border font-medium transition-[background-color,color,border-color,box-shadow] [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-brand-hover",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/88",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border bg-card text-foreground [a&]:hover:border-foreground/30 [a&]:hover:bg-muted",
        // Semantic variants for domain-specific badges
        tech: "border-[#cbd8fb] bg-[#edf2ff] text-[#244d9d] dark:border-[#36549a] dark:bg-[#1e2a47] dark:text-[#b9ccff]",
        year: "border-[#bfe3da] bg-[#eaf7f3] text-[#12644d] dark:border-[#276b5a] dark:bg-[#1b3730] dark:text-[#a9e4d4]",
        topic: "border-[#d8cff5] bg-[#f3efff] text-[#5d45a7] dark:border-[#59498f] dark:bg-[#2d2742] dark:text-[#d3c7ff]",
        category: "border-[#ffd2bf] bg-accent text-accent-foreground dark:border-[#74402c] dark:bg-[#3a251d] dark:text-[#ffd8c6]",
        neutral: "border-border bg-muted text-muted-foreground",
      },
      size: {
        xs: "rounded-md px-1.5 py-0.5 text-[10px] gap-0.5 [&>svg]:size-2.5",
        sm: "rounded-md px-2 py-1 text-xs gap-1 [&>svg]:size-3",
        md: "rounded-lg px-2.5 py-1.5 text-sm gap-1.5 [&>svg]:size-3.5",
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
