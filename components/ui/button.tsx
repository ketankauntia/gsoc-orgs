import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold outline-none transition-[background-color,color,border-color,box-shadow,transform] duration-[180ms] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100 motion-reduce:transform-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_0_rgb(23_22_21/0.16)] hover:bg-brand-hover",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline:
          "border border-border bg-card text-foreground shadow-[0_1px_0_rgb(23_22_21/0.05)] hover:border-foreground/30 hover:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/88",
        soft:
          "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground",
        ghost:
          "text-foreground hover:bg-muted",
        link:
          "h-auto rounded-none p-0 text-foreground underline-offset-4 hover:text-accent-foreground hover:underline active:scale-100",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-3.5 text-xs has-[>svg]:px-3",
        lg: "h-12 px-6 text-base has-[>svg]:px-5",
        xl: "h-14 px-7 text-base has-[>svg]:px-6",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
