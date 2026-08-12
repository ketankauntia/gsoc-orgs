import "server-only";

import { timingSafeEqual } from "node:crypto";

export function isAdminKeyAuthorized(request: Request) {
  const supplied = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_KEY;
  if (!supplied || !expected) return false;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}
