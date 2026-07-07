"use client";

import { useState, type ComponentType } from "react";
import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandReddit,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconBrandX,
  IconCheck,
  IconLink,
} from "@tabler/icons-react";
import { Button } from "@/components/blog-ui/button";
import { features, type SharePlatform } from "@/lib/features";

type Platform = {
  key: SharePlatform;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** Builds the share URL from the page url + title. */
  buildUrl: (url: string, title: string) => string;
};

const PLATFORMS: Platform[] = [
  {
    key: "x",
    label: "Share on X",
    Icon: IconBrandX,
    buildUrl: (url, title) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: "linkedin",
    label: "Share on LinkedIn",
    Icon: IconBrandLinkedin,
    buildUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: "whatsapp",
    label: "Share on WhatsApp",
    Icon: IconBrandWhatsapp,
    buildUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    key: "facebook",
    label: "Share on Facebook",
    Icon: IconBrandFacebook,
    buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "telegram",
    label: "Share on Telegram",
    Icon: IconBrandTelegram,
    buildUrl: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    key: "reddit",
    label: "Share on Reddit",
    Icon: IconBrandReddit,
    buildUrl: (url, title) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
];

/** Social share icon row. Master switch: features.socialShare; per-platform: features.sharePlatforms. */
export function ShareActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function pageUrl() {
    return window.location.href.replace(/#.*$/, "");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(pageUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const enabled = PLATFORMS.filter((p) => features.sharePlatforms[p.key]);

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Share via</p>
      <div className="flex flex-wrap items-center gap-0.5">
        {features.sharePlatforms.copyLink && (
          <Button variant="ghost" size="icon" aria-label="Copy link" title="Copy link" onClick={copyLink}>
            {copied ? <IconCheck className="size-4" /> : <IconLink className="size-4" />}
          </Button>
        )}
        {enabled.map(({ key, label, Icon, buildUrl }) => (
          <Button
            key={key}
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            onClick={() => window.open(buildUrl(pageUrl(), title), "_blank", "noopener,noreferrer")}
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}
