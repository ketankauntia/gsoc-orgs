import { describe, expect, it } from "vitest";

import { runSeoChecks } from "../lib/editor/seo-checks";

function faqCheck(faqs: { q: string; a: string }[]) {
  return runSeoChecks({
    title: "A focused GSoC guide for contributors",
    description:
      "A focused Google Summer of Code guide with evidence, practical checks, current sources and clear next steps for contributors.",
    slug: "focused-gsoc-guide",
    keyphrase: "",
    tldr:
      "This guide gives contributors a direct answer, shows the evidence behind it and turns the result into a practical next step.",
    keyTakeaways: ["One", "Two", "Three"],
    faqs,
    tags: ["gsoc", "gsoc applications"],
    body: "## First section\n\nA direct answer with 10 years of evidence.\n\n## Second section\n\nA practical next step with [a source](https://developers.google.com/open-source/gsoc).",
  }).find((check) => check.id === "faqs");
}

const completeFaq = { q: "What should a contributor verify?", a: "Verify the current official source." };

describe("FAQ SEO guidance", () => {
  it("passes six to ten complete article-specific FAQs", () => {
    expect(faqCheck(Array.from({ length: 8 }, () => completeFaq))?.status).toBe("pass");
  });

  it("warns when a post has only the former four-question default", () => {
    expect(faqCheck(Array.from({ length: 4 }, () => completeFaq))?.status).toBe("warn");
  });

  it("does not count a blank question or answer as complete", () => {
    expect(
      faqCheck([
        ...Array.from({ length: 5 }, () => completeFaq),
        { q: "", a: "Unpaired answer" },
        { q: "Unpaired question", a: "" },
      ])?.status,
    ).toBe("warn");
  });
});
