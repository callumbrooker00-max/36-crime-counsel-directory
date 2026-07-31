// Signed, stateless client-portal session cookie. A valid access code mints one
// of these (lib/client/access-actions.ts); the gate verifies its signature on
// every gated request and re-checks the DB row for revocation (client-gate.ts).
//
// No next/headers here on purpose: this module is imported by proxy.ts (Edge
// middleware) as well as Node server code, so it must stay runtime-agnostic —
// sign/verify are pure and use Web Crypto (available in both). Cookie I/O lives
// in the callers.

export const CLIENT_COOKIE = "cc_session";
export const CLIENT_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface ClientSession {
  gid: string; // client_access row id this session was granted for
  iat: number; // issued-at (ms)
}

// Missing/short secret → fail closed (verify returns null, sign throws). Never
// fall back to an empty key.
function secretBytes(): Uint8Array | null {
  const s = process.env.CLIENT_SESSION_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(payload: string, key: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", key as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload) as BufferSource);
  return new Uint8Array(sig);
}

// Constant-time string compare (equal-length hex/b64 strings).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(gid: string): Promise<string> {
  const key = secretBytes();
  if (!key) throw new Error("CLIENT_SESSION_SECRET is not set");
  const payload = bytesToB64url(new TextEncoder().encode(JSON.stringify({ gid, iat: Date.now() })));
  const sig = bytesToB64url(await hmac(payload, key));
  return `${payload}.${sig}`;
}

export async function verifySession(token: string | undefined): Promise<ClientSession | null> {
  if (!token) return null;
  const key = secretBytes();
  if (!key) return null; // misconfigured → deny
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = bytesToB64url(await hmac(payload, key));
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const obj = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload)));
    if (obj && typeof obj.gid === "string" && typeof obj.iat === "number") return obj as ClientSession;
    return null;
  } catch {
    return null;
  }
}
