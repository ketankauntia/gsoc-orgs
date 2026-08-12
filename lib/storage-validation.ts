const GOOGLE_AVATAR_HOSTS = ["googleusercontent.com", "ggpht.com"];

export function isAllowedGoogleAvatarUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return GOOGLE_AVATAR_HOSTS.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

export function matchesImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  if (mimeType === "image/webp") {
    return bytes.length >= 12
      && new TextDecoder("ascii").decode(bytes.slice(0, 4)) === "RIFF"
      && new TextDecoder("ascii").decode(bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}
