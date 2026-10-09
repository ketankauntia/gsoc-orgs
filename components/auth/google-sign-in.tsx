"use client";

import { useState } from "react";
import { authClient } from "@/lib/neon-auth/client";
import { safeRelativePath } from "@/lib/security";

/** Starts Google sign-in. Google returns to /auth/complete, which forwards to `next`. */
export function GoogleSignIn({ next = "/account" }: { next?: string }) {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    setError(undefined);
    const complete = new URL("/auth/complete", window.location.origin);
    complete.searchParams.set("next", safeRelativePath(next));
    const failed = new URL("/login", window.location.origin);
    failed.searchParams.set("error", "oauth");
    failed.searchParams.set("next", safeRelativePath(next));
    const { error: authError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: complete.toString(),
      errorCallbackURL: failed.toString(),
    });
    if (authError) {
      setError(authError.message ?? "Google sign-in could not start. Try again.");
      setLoading(false);
    }
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
