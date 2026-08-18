import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("external link data", () => {
  it("does not reintroduce URLs confirmed dead by the external audit", () => {
    const inventory = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "docs", "external-link-audit-broken-2026-08-18.json"), "utf8"),
    ) as { links: Array<{ url: string }> };
    const broken = new Set(
      inventory.links.map((link) => link.url.replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replace(/\/$/, "")),
    );
    const matches: string[] = [];

    function visit(value: unknown, file: string) {
      if (typeof value === "string") {
        const comparable = value.replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replace(/\/$/, "");
        if (broken.has(comparable)) matches.push(`${file}: ${value}`);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => visit(item, file));
        return;
      }
      if (value && typeof value === "object") {
        Object.values(value).forEach((item) => visit(item, file));
      }
    }

    function walk(directory: string) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(fullPath);
        if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
        visit(JSON.parse(fs.readFileSync(fullPath, "utf8")), path.relative(process.cwd(), fullPath));
      }
    }

    walk(path.join(process.cwd(), "new-api-details"));
    expect(matches).toEqual([]);
  });
});
