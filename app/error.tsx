"use client";

import { useEffect } from "react";
import { ErrorView } from "@/components/cobalt/views/community-client";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorView digest={error.digest} reset={reset} />;
}
