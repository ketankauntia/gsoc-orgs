import Link from "next/link";
import { GitHubIcon, XIcon, PinterestIcon, QuoraIcon, LinkedInIcon, FacebookIcon } from "@/components/icons";
import { SOCIAL_LINKS } from "@/components/footer-common";

interface SocialLinksProps {
  /**
   * Show text labels next to icons
   * @default false
   */
  showLabels?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Custom className for links
   */
  linkClassName?: string;
  /**
   * Custom text color style (for dark backgrounds)
   */
  textColor?: string;
}

/**
 * Reusable Social Links Component
 * Displays GitHub and Twitter/X links with icons
 */
export const SocialLinks = ({
  showLabels = false,
  className = "flex items-center gap-4",
  linkClassName = "hover:text-background transition-colors",
  textColor,
}: SocialLinksProps) => {
  const linkStyle = textColor ? { color: textColor } : undefined;

  const itemStyle = linkStyle
    ? { ...linkStyle, display: "flex", alignItems: "center", gap: "0.5rem" }
    : undefined;


  return (
    <div className={className}>
      <Link
        href={SOCIAL_LINKS.github.href}
        target="_blank"
        rel="noopener"
        className={linkClassName}
        aria-label={SOCIAL_LINKS.github.label}
        style={itemStyle}
      >
        <GitHubIcon />
        {showLabels && <span>GitHub</span>}
      </Link>
      <Link
        href={SOCIAL_LINKS.twitter.href}
        target="_blank"
        rel="noopener"
        className={linkClassName}
        aria-label={SOCIAL_LINKS.twitter.label}
        style={itemStyle}
      >
      <XIcon />
        {showLabels && <span>Twitter (X)</span>}
      </Link>

        <Link
        href={SOCIAL_LINKS.twitter2.href}
        target="_blank"
        rel="noopener"
        className={linkClassName}
        aria-label={SOCIAL_LINKS.twitter2.label}
        style={itemStyle}
      >
      <XIcon />
        {showLabels && <span>Twitter (X)</span>}
      </Link>

      <Link
        href={SOCIAL_LINKS.linkedin.href}
        target="_blank"
        rel="noopener"
        aria-label={SOCIAL_LINKS.linkedin.label}
        className={linkClassName}
        style={itemStyle}
      >
        <LinkedInIcon />
        {showLabels && <span>LinkedIn</span>}
      </Link>

      <Link
        href={SOCIAL_LINKS.facebook.href}
        target="_blank"
        rel="noopener"
        aria-label={SOCIAL_LINKS.facebook.label}
        className={linkClassName}
        style={itemStyle}
      >
        <FacebookIcon />
        {showLabels && <span>Facebook</span>}
      </Link>

      <Link
        href={SOCIAL_LINKS.pinterest.href}
        target="_blank"
        rel="noopener"
        aria-label={SOCIAL_LINKS.pinterest.label}
        className={linkClassName}
        style={itemStyle}
      >
        <PinterestIcon />
        {showLabels && <span>Pinterest</span>}
      </Link>

      <Link
        href={SOCIAL_LINKS.quora.href}
        target="_blank"
        rel="noopener"
        aria-label={SOCIAL_LINKS.quora.label}
        className={linkClassName}
        style={itemStyle}
      >
        <QuoraIcon />
        {showLabels && <span>Quora</span>}
      </Link>
    </div>
  );
};
