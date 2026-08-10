const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32ToBytes(base32: string): Uint8Array {
  let bits = '';
  for (const char of base32.toUpperCase().replace(/=+$/, '')) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < bytes.length; i += 5) {
    const group = bytes.slice(i, i + 5);
    result +=
      BASE32_ALPHABET[group[0]! >> 3]! +
      BASE32_ALPHABET[((group[0]! & 7) << 2) | (group[1]! >> 6)]! +
      BASE32_ALPHABET[(group[1]! >> 1) & 31]! +
      BASE32_ALPHABET[((group[1]! & 1) << 4) | (group[2]! >> 4)]! +
      BASE32_ALPHABET[((group[2]! & 15) << 1) | (group[3]! >> 7)]! +
      BASE32_ALPHABET[(group[3]! >> 2) & 31]! +
      BASE32_ALPHABET[((group[3]! & 3) << 3) | (group[4]! >> 5)]! +
      BASE32_ALPHABET[group[4]! & 31]!;
  }
  return result.slice(0, 32);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, message);
}

export async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const key = base32ToBytes(secret);
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / 30);

  for (let offset = -1; offset <= 1; offset++) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(4, counter + offset, false);
    const hmacResult = await hmacSha1(key, new Uint8Array(buffer));
    const hmacBytes = new Uint8Array(hmacResult);
    const offset_byte = hmacBytes[hmacBytes.length - 1]! & 0xf;
    const code =
      ((hmacBytes[offset_byte]! & 0x7f) << 24) |
      ((hmacBytes[offset_byte + 1]! & 0xff) << 16) |
      ((hmacBytes[offset_byte + 2]! & 0xff) << 8) |
      (hmacBytes[offset_byte + 3]! & 0xff);
    const otp = String(code % 1000000).padStart(6, '0');
    if (otp === token) return true;
  }

  return false;
}

export function getTotpUri(secret: string, email: string): string {
  const encoded = encodeURIComponent(`Theobase:${email}`);
  return `otpauth://totp/${encoded}?secret=${secret}&issuer=Theobase&algorithm=SHA1&digits=6&period=30`;
}
