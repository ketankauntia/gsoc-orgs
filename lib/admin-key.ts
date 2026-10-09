import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value).digest();

export function isAdminKeyAuthorized(request: Request) {
  const supplied = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_KEY;
  if (!supplied || !expected) return false;
  return timingSafeEqual(digest(supplied), digest(expected));
}
