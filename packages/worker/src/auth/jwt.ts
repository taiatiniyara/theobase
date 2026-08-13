import { SignJWT, jwtVerify, importPKCS8, importSPKI, generateKeyPair, exportPKCS8, exportSPKI } from 'jose';
import type { JwtPayload } from '@theobase/shared';
import { MAGIC_LINK_EXPIRY_MS, SESSION_EXPIRY_MS } from '@theobase/shared';

let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

export async function initKeys(): Promise<void> {
  if (privateKey && publicKey) return;

  const { privateKey: priv, publicKey: pub } = await generateKeyPair('RS256', {
    modulusLength: 2048,
    extractable: true,
  });
  privateKey = priv;
  publicKey = pub;
}

export async function signMagicLink(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  if (!privateKey) await initKeys();

  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'RS256' })
    .setSubject(payload.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + MAGIC_LINK_EXPIRY_MS / 1000)
    .sign(privateKey!);
}

export async function signSession(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  if (!privateKey) await initKeys();

  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ ...payload } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'RS256' })
    .setSubject(payload.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_EXPIRY_MS / 1000)
    .sign(privateKey!);
}

export async function verify(token: string): Promise<{ payload: JwtPayload }> {
  if (!publicKey) await initKeys();
  if (!publicKey) throw new Error('JWT keys not initialized');

  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ['RS256'],
  });

  return { payload: payload as unknown as JwtPayload };
}

export function shouldRefresh(payload: JwtPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now < 86400;
}

export async function importKeysFromEnv(env: {
  JWT_PRIVATE_KEY?: string;
  JWT_PUBLIC_KEY?: string;
  theobase_auth?: KVNamespace;
}): Promise<void> {
  if (env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY) {
    privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, 'RS256');
    publicKey = await importSPKI(env.JWT_PUBLIC_KEY, 'RS256');
    return;
  }

  if (env.theobase_auth) {
    const [storedPriv, storedPub] = await Promise.all([
      env.theobase_auth.get('jwt:privateKey'),
      env.theobase_auth.get('jwt:publicKey'),
    ]);
    if (storedPriv && storedPub) {
      privateKey = await importPKCS8(storedPriv, 'RS256');
      publicKey = await importSPKI(storedPub, 'RS256');
      return;
    }
  }

  await initKeys();

  if (env.theobase_auth && privateKey && publicKey) {
    const [privPem, pubPem] = await Promise.all([
      exportPKCS8(privateKey),
      exportSPKI(publicKey),
    ]);
    await Promise.all([
      env.theobase_auth.put('jwt:privateKey', privPem),
      env.theobase_auth.put('jwt:publicKey', pubPem),
    ]);

    const [storedPriv, storedPub] = await Promise.all([
      env.theobase_auth.get('jwt:privateKey'),
      env.theobase_auth.get('jwt:publicKey'),
    ]);
    if (storedPriv && storedPub) {
      privateKey = await importPKCS8(storedPriv, 'RS256');
      publicKey = await importSPKI(storedPub, 'RS256');
    }
  }
}
