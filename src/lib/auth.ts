export const SESSION_COOKIE = "subfeed_session";

/**
 * Computes a deterministic SHA-256 session token from the site password.
 * Uses the Web Crypto API (available in Cloudflare Workers and Node.js 18+).
 */
export async function createSessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`subfeed:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
