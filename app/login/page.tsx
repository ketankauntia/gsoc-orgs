import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { LoginView } from "@/components/cobalt/views/login";
import { getViewer } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/neon-auth/server";
import { firstParam, safeRelativePath } from "@/lib/security";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeRelativePath(params.next);
  // If the account can't be loaded, still offer sign-in instead of an error page.
  const viewer = await getViewer().catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });
  if (viewer?.profile.status === "active") redirect(next);
  // "suspended" is shown only to the suspended account itself, which can sign out from here.
  const errorParam = firstParam(params.error);
  const error = viewer?.profile.status === "suspended" ? "suspended" : errorParam && errorParam !== "suspended" ? "oauth" : null;
  return <LoginView configured={isAuthConfigured()} next={next} error={error} />;
}
