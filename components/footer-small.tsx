import Link from "next/link";
import { Section } from "@/components/ui";
import { SocialLinks } from "@/components/social-links";
import { FOOTER_COPYRIGHT } from "@/components/footer-common";

/**
 * Minimal footer component for organizations pages
 * Single line with copyright and social links
 */
export const FooterSmall = () => {
  return (
    <Section
      noPadding
      className="py-8 bg-gray-100 text-black border-t"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Copyright */}
        <p className="text-sm text-center sm:text-left">
          {FOOTER_COPYRIGHT.text} | © {FOOTER_COPYRIGHT.year} <Link href={FOOTER_COPYRIGHT.organizationUrl} className="hover:underline">{FOOTER_COPYRIGHT.organization}</Link>
        </p>
        {/* Social Links */}
        <SocialLinks className="flex items-center gap-4 text-black" />
      </div>
    </Section>
  );
};

