"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconLogout } from "@tabler/icons-react";
import { authClient } from "@/lib/neon-auth/client";

export function SignOutButton({ className = "cb-button cb-button-outline cb-button-sm" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await authClient.signOut().catch(() => undefined);
    router.push("/");
    router.refresh();
  }
  return (
    <button type="button" className={className} onClick={signOut} disabled={busy}>
      <IconLogout size={15} stroke={1.9} aria-hidden />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
