"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/neon-auth/client";
import { safeRelativePath } from "@/lib/security";

/** Asks Neon Auth for Google's sign-in page. On success the browser is already on its way there. */
async function startGoogleSignIn(next: string) {
  try {
    const complete = new URL("/auth/complete", window.location.origin);
    complete.searchParams.set("next", safeRelativePath(next));
    const failed = new URL("/login", window.location.origin);
    failed.searchParams.set("error", "oauth");
    failed.searchParams.set("next", safeRelativePath(next));
    const { data, error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: complete.toString(),
      errorCallbackURL: failed.toString(),
    });
    return !error && Boolean(data?.url);
  } catch {
    return false;
  }
}

/** Starts Google sign-in. Google returns to /auth/complete, which forwards to `next`. */
export function GoogleSignIn({ next = "/account" }: { next?: string }) {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  // Coming back from Google with the Back button can restore this page with the button still busy.
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) setLoading(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function signIn() {
    setLoading(true);
    setError(undefined);
    if (await startGoogleSignIn(next)) return;
    setError("Google sign-in could not start. Try again.");
    setLoading(false);
  }

  return (
    <div>
      <button type="button" onClick={signIn} disabled={loading}>
        {loading ? "Opening Google…" : "Continue with Google"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
