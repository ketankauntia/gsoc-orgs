"use client";

import type { ComponentType } from "react";
import {
  SiClaude,
  SiGoogle,
  SiMistralai,
  SiPerplexity,
  SiX,
} from "@icons-pack/react-simple-icons";
import { IconBrandOpenai, IconChevronDown, IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/blog-ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/blog-ui/dropdown-menu";

/** "Ask AI about this page" prompt — the page URL is appended at open time. */
const SUMMARY_PROMPT =
  "Read this article and summarize its key points in a short, skimmable format. Then stay ready to answer my follow-up questions about it: ";

/** Providers that accept a prefilled query via URL param. Grok uses the X mark (xAI has no published logo in icon sets). */
const AI_PROVIDERS: {
  name: string;
  Icon: ComponentType<{ className?: string }>;
  buildUrl: (prompt: string) => string;
}[] = [
  { name: "ChatGPT", Icon: IconBrandOpenai, buildUrl: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}` },
  { name: "Claude", Icon: SiClaude, buildUrl: (p) => `https://claude.ai/new?q=${encodeURIComponent(p)}` },
  { name: "Perplexity", Icon: SiPerplexity, buildUrl: (p) => `https://www.perplexity.ai/search?q=${encodeURIComponent(p)}` },
  { name: "Grok", Icon: SiX, buildUrl: (p) => `https://grok.com/?q=${encodeURIComponent(p)}` },
  { name: "Mistral", Icon: SiMistralai, buildUrl: (p) => `https://chat.mistral.ai/chat?q=${encodeURIComponent(p)}` },
  { name: "Google AI Mode", Icon: SiGoogle, buildUrl: (p) => `https://www.google.com/search?udm=50&q=${encodeURIComponent(p)}` },
];

export function AiPageActions() {
  function openIn(buildUrl: (prompt: string) => string) {
    const url = buildUrl(SUMMARY_PROMPT + window.location.href.replace(/#.*$/, ""));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconSparkles className="size-4" />
          Ask AI
          <IconChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5">
        <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">
          Summarize &amp; ask questions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {AI_PROVIDERS.map(({ name, Icon, buildUrl }) => (
          <DropdownMenuItem
            key={name}
            onClick={() => openIn(buildUrl)}
            className="gap-2.5 rounded-md px-2 py-2 text-sm"
          >
            <Icon className="size-4 shrink-0" />
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
