import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import {
  BLOG_TEMPLATES,
  POST_TEMPLATES,
  DEFAULT_SETTINGS,
  type BlogTemplate,
  type PostTemplate,
  type SiteSettings,
} from "./settings-shared";

/**
 * Site settings — persisted in content/settings.json (same repo-is-the-CMS ethos as posts).
 * Edited from /dashboard/settings (dev-only writes); read server-side at render/ISR time.
 * Client components must import from lib/settings-shared.ts instead (this module uses fs).
 */

export * from "./settings-shared";

const SETTINGS_FILE = path.join(process.cwd(), "content", "settings.json");

export const getSettings = cache((): SiteSettings => {
  try {
    const raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")) as Partial<SiteSettings>;
    return {
      blogTemplate: BLOG_TEMPLATES.includes(raw.blogTemplate as BlogTemplate)
        ? (raw.blogTemplate as BlogTemplate)
        : DEFAULT_SETTINGS.blogTemplate,
      postTemplate: POST_TEMPLATES.includes(raw.postTemplate as PostTemplate)
        ? (raw.postTemplate as PostTemplate)
        : DEFAULT_SETTINGS.postTemplate,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
});
