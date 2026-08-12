import { afterEach, describe, expect, it, vi } from "vitest";
import { isTrustedMutationRequest, readJsonBody, safeRelativePath, trustedRedirectOrigin } from "../lib/security";
import { isAllowedGoogleAvatarUrl, matchesImageSignature } from "../lib/storage-validation";

afterEach(() => vi.unstubAllEnvs());

describe("request security helpers", () => {
  it("allows only same-site relative post-auth redirects", () => {
    expect(safeRelativePath("/account?submitted=1")).toBe("/account?submitted=1");
    for (const unsafe of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "\u0000/account"]) {
      expect(safeRelativePath(unsafe)).toBe("/account");
    }
  });

  it("uses the configured canonical origin outside development", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.gsocorganizationsguide.com/path");
    const request = new Request("https://attacker-controlled-preview.example/auth/callback", { headers: { "x-forwarded-host": "evil.example" } });
    expect(trustedRedirectOrigin(request)).toBe("https://www.gsocorganizationsguide.com");
  });

  it("rejects cross-site mutation origins", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.gsocorganizationsguide.com");
    expect(isTrustedMutationRequest(new Request("https://www.gsocorganizationsguide.com/api/v2/me/profile", { headers: { origin: "https://www.gsocorganizationsguide.com" } }))).toBe(true);
    expect(isTrustedMutationRequest(new Request("https://preview.example/api/v2/me/profile", { headers: { origin: "https://preview.example" } }))).toBe(true);
    expect(isTrustedMutationRequest(new Request("https://www.gsocorganizationsguide.com/api/v2/me/profile", { headers: { origin: "https://evil.example" } }))).toBe(false);
    expect(isTrustedMutationRequest(new Request("https://www.gsocorganizationsguide.com/api/v2/me/profile", { headers: { "sec-fetch-site": "cross-site" } }))).toBe(false);
  });

  it("accepts bounded JSON and rejects oversized or non-JSON bodies", async () => {
    await expect(readJsonBody(new Request("https://example.test", { method: "POST", headers: { "content-type": "application/json" }, body: '{"ok":true}' }))).resolves.toEqual({ ok: true });
    await expect(readJsonBody(new Request("https://example.test", { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" }))).rejects.toThrow("UNSUPPORTED_CONTENT_TYPE");
    await expect(readJsonBody(new Request("https://example.test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value: "x".repeat(128) }) }), 32)).rejects.toThrow("BODY_TOO_LARGE");
  });
});

describe("Google avatar validation", () => {
  it("allows HTTPS Google image hosts and rejects SSRF targets", () => {
    expect(isAllowedGoogleAvatarUrl("https://lh3.googleusercontent.com/a/photo=s96-c")).toBe(true);
    expect(isAllowedGoogleAvatarUrl("https://lh3.googleusercontent.com.evil.example/photo")).toBe(false);
    expect(isAllowedGoogleAvatarUrl("http://lh3.googleusercontent.com/photo")).toBe(false);
    expect(isAllowedGoogleAvatarUrl("https://127.0.0.1/internal")).toBe(false);
    expect(isAllowedGoogleAvatarUrl("https://user:pass@lh3.googleusercontent.com/photo")).toBe(false);
  });

  it("matches supported image MIME types to magic bytes", () => {
    expect(matchesImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toBe(true);
    expect(matchesImageSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(matchesImageSignature(new TextEncoder().encode("RIFF0000WEBP"), "image/webp")).toBe(true);
    expect(matchesImageSignature(new TextEncoder().encode("<script>"), "image/png")).toBe(false);
  });
});
