"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconLogout } from "@tabler/icons-react";
import { authClient } from "@/lib/neon-auth/client";

/** Works from any page, including for suspended accounts: it needs only the session cookie. */
export function SignOutButton({ className = "cb-button cb-button-outline cb-button-sm" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function signOut() {
    setBusy(true);
    setFailed(false);
    const signedOut = await authClient.signOut().then(({ error }) => !error, () => false);
    if (!signedOut) {
      // Stay put: moving on would suggest the session ended when it did not.
      setFailed(true);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }
  return (
    <button type="button" className={className} onClick={signOut} disabled={busy} aria-live="polite">
      <IconLogout size={15} stroke={1.9} aria-hidden />
      {busy ? "Signing out…" : failed ? "Sign-out failed. Retry" : "Sign out"}
    </button>
  );
}
