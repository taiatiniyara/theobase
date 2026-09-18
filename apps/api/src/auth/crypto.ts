// PBKDF2 via Web Crypto (crypto.subtle) — no native bcrypt/scrypt
// binding is available in the Workers runtime, and PBKDF2-SHA256 is
// Cloudflare's own documented recommendation for password hashing on
// Workers. Iteration count is a deliberate middle ground: high enough
// to matter, low enough to stay well inside Workers CPU-time limits.
const ITERATIONS = 100_000
const HASH_BITS = 256
const SALT_BYTES = 16

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function deriveBits(secret: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_BITS,
  )
}

// Stored as "<salt-hex>:<hash-hex>" — self-contained, no separate
// salt column needed.
export async function hashSecret(secret: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await deriveBits(secret, salt)
  return `${toHex(salt)}:${toHex(hash)}`
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

// A fixed dummy hash, verified against whenever no account was found,
// so an unknown phone/email takes roughly as long to reject as a
// known one with a wrong secret — otherwise the PBKDF2 cost itself
// becomes a timing side-channel for enumerating registered
// phones/emails.
const DUMMY_HASH = '00'.repeat(SALT_BYTES) + ':' + '00'.repeat(HASH_BITS / 8)

export async function verifySecret(secret: string, stored: string | null): Promise<boolean> {
  const [saltHex, hashHex] = (stored ?? DUMMY_HASH).split(':')
  if (!saltHex || !hashHex) return false
  const hash = await deriveBits(secret, fromHex(saltHex))
  const ok = timingSafeEqual(toHex(hash), hashHex)
  return stored !== null && ok
}

export function generateToken(bytes = 32): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)))
}
