"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { safeRelativePath } from "@/lib/security";

export function GoogleSignIn({ next = "/account" }: { next?: string }) {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    setError(undefined);
    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", safeRelativePath(next));
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString(), scopes: "openid email profile" },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={signIn} disabled={loading}>
        {loading ? "Opening Google…" : "Continue with Google"}
      </Button>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
