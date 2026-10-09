"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Browser client. It talks to this site's /api/auth/* route, which proxies to Neon Auth.
export const authClient = createAuthClient();
