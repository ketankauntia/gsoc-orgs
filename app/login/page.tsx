import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginView } from "@/components/cobalt/views/community";
import { getViewer } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/neon-auth/server";
import { safeRelativePath } from "@/lib/security";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = safeRelativePath(params.next);
  const viewer = await getViewer();
  if (viewer?.profile.status === "active") redirect(next);
  const error = viewer?.profile.status === "suspended" || params.error === "suspended" ? "suspended" : params.error ? "oauth" : null;
  return <LoginView configured={isAuthConfigured()} next={next} error={error} />;
}
