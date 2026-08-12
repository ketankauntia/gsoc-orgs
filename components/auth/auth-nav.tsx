"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AuthNav() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));
    return () => data.subscription.unsubscribe();
  }, []);
  return <Button variant="outline" size="sm" asChild><Link href={signedIn ? "/account" : "/login"}><CircleUserRound className="size-4" /><span className="hidden xl:inline">{signedIn ? "Account" : "Sign in"}</span></Link></Button>;
}
