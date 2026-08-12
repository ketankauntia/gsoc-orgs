import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/blog/types";

const tones: Record<Post["coverTone"], string> = {
  primary: "from-primary/90 to-primary/40",
  "chart-2": "from-chart-2/90 to-chart-2/40",
  "chart-3": "from-chart-3/90 to-chart-3/40",
  "chart-5": "from-chart-5/90 to-chart-5/40",
};

/** Responsive post art with a gradient fallback. Reused by cards and article heroes. */
export function PostCover({
  post,
  className,
  decorative = false,
  preload = false,
  sizes = "100vw",
  showCategory,
}: {
  post: Pick<Post, "coverTone" | "category" | "title" | "coverImage" | "coverAlt" | "ogImage">;
  className?: string;
  /** Linked cards already have a text heading, so their repeated cover image should have empty alt text. */
  decorative?: boolean;
  /** Preload only the above-the-fold article or featured cover that can become the LCP image. */
  preload?: boolean;
  /** Responsive source-size hint passed to next/image. */
  sizes?: string;
  /** Defaults to visible on gradient fallbacks and hidden on real images. */
  showCategory?: boolean;
}) {
  const imageSrc = post.coverImage ?? post.ogImage;
  const displayCategory = imageSrc ? showCategory === true : showCategory !== false;

  return (
    <div
      className={cn(
        "relative flex items-end overflow-hidden rounded-lg bg-card",
        !imageSrc && "bg-linear-to-br",
        !imageSrc && tones[post.coverTone],
        className,
      )}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={decorative ? "" : post.coverAlt?.trim() || post.title}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,white_0%,transparent_45%)] opacity-20" />
      )}
      {displayCategory && (
        <span className="relative z-10 m-4 rounded-md bg-background/85 px-2 py-1 text-xs font-medium text-foreground">
          {post.category}
        </span>
      )}
    </div>
  );
}
