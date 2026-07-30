import Link from "next/link";
import { AtlasMark } from "@/components/brand/atlas-mark";
import { FOOTER_COPYRIGHT } from "@/components/footer-common";

/** Compact footer for dense explorer and detail routes. */
export function FooterSmall() {
  return (
    <footer className="border-t border-border bg-ink px-4 py-7 text-[#aaa29d]">
      <div className="mx-auto flex max-w-shell flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#f5eee9]"
        >
          <AtlasMark className="size-5 text-primary" />
          GSoC Atlas
        </Link>
        <p className="font-data text-[10px] uppercase tracking-[0.12em]">
          © {FOOTER_COPYRIGHT.year} · Independent guide · Not affiliated with
          Google
        </p>
        <div className="flex gap-4 text-xs">
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
          <Link href="/privacy-policy" className="hover:text-white">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

