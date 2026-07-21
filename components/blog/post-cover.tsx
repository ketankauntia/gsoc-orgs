import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/blog/types";

const tones: Record<Post["coverTone"], string> = {
  primary: "from-primary/90 to-primary/40",
  "chart-2": "from-chart-2/90 to-chart-2/40",
  "chart-3": "from-chart-3/90 to-chart-3/40",
  "chart-5": "from-chart-5/90 to-chart-5/40",
};

/** Uses approved post art when available and falls back to the branded gradient. */
export function PostCover({
  post,
  className,
}: {
  post: Pick<Post, "coverTone" | "category" | "ogImage">;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex items-end overflow-hidden rounded-lg bg-linear-to-br",
        tones[post.coverTone],
        className,
      )}
    >
      {post.ogImage ? (
        <Image
          src={post.ogImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 768px, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,white_0%,transparent_45%)] opacity-20" />
      )}
      <span className="relative m-4 rounded-md bg-background/85 px-2 py-1 text-xs font-medium text-foreground">
        {post.category}
      </span>
    </div>
  );
}
