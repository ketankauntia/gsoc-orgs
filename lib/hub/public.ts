import "server-only";

import { cache } from "react";
import { db, isDatabaseConfigured } from "@/lib/db";
import type { Story } from "@/lib/hub/types";

export type PublicHistoryItem = {
  person_id: string; role: "contributor" | "mentor"; year: number; project_external_id: string; project_title: string;
  organization_slug: string; organization_name: string; story: Story | null;
};
export type PublicProfile = {
  handle: string; display_name: string; bio: string | null; avatar_key: string | null; website_url: string | null;
  github_username: string | null; x_username: string | null; medium_url: string | null; created_at: string; history: PublicHistoryItem[];
};

export const getPublicProfile = cache(async (handle: string): Promise<PublicProfile | null> => {
  if (!isDatabaseConfigured() || !/^[a-z0-9-]{3,30}$/.test(handle)) return null;
  const rows = await db()`select to_jsonb(p) as profile from public.public_profiles p where p.handle = ${handle}`;
  return (rows[0]?.profile as PublicProfile | undefined) ?? null;
});
