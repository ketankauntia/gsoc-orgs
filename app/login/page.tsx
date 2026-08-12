import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { Header } from "@/components/header";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUser } from "@/lib/auth";
import { safeRelativePath } from "@/lib/security";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  if (isSupabaseConfigured() && (await getUser())) redirect(safeRelativePath(params.next));
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-28">
        <div className="w-full rounded-3xl border bg-card p-7 shadow-sm">
          <p className="text-sm font-medium text-primary">Contributor access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Share an accepted GSoC proposal</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in with the Google account you want attached to your submission. Your email is used privately for authentication and is never published.</p>
          <div className="mt-7">
            {isSupabaseConfigured() ? <GoogleSignIn next={safeRelativePath(params.next)} /> : <p className="rounded-xl bg-muted p-4 text-sm">Authentication is not configured in this environment yet.</p>}
          </div>
          {params.error ? <p role="alert" className="mt-3 text-sm text-destructive">Google sign-in could not be completed. Please try again.</p> : null}
          <p className="mt-6 text-xs leading-5 text-muted-foreground">By continuing, you agree to the <Link className="underline" href="/terms-and-conditions">terms</Link> and acknowledge the <Link className="underline" href="/privacy-policy">privacy policy</Link>.</p>
        </div>
      </main>
    </>
  );
}
