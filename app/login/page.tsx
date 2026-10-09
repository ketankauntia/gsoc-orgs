import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginView } from "@/components/cobalt/views/community";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/auth";
import { safeRelativePath } from "@/lib/security";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  if (isSupabaseConfigured() && (await getUser())) redirect(safeRelativePath(params.next));
  return <LoginView configured={isSupabaseConfigured()} next={safeRelativePath(params.next)} error={Boolean(params.error)} />;
}
