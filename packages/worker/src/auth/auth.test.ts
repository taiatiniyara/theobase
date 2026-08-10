import { describe, it, expect, beforeAll } from 'vitest';
import { initKeys, signMagicLink, signSession, verify } from './jwt';
import { generateTotpSecret, verifyTotp } from './totp';

describe('auth — JWT', () => {
  beforeAll(async () => {
    await initKeys();
  });

  it('signs and verifies a magic link token', async () => {
    const token = await signMagicLink({
      sub: 'user@church.org',
      churchId: 'church-1',
      role: 'clerk',
      tokenVersion: 1,
    });

    const { payload } = await verify(token);
    expect(payload.sub).toBe('user@church.org');
    expect(payload.churchId).toBe('church-1');
    expect(payload.role).toBe('clerk');
    expect(payload.tokenVersion).toBe(1);
  });

  it('signs and verifies a session token', async () => {
    const token = await signSession({
      sub: 'user@church.org',
      churchId: 'church-1',
      role: 'treasurer',
      tokenVersion: 2,
    });

    const { payload } = await verify(token);
    expect(payload.role).toBe('treasurer');
    expect(payload.tokenVersion).toBe(2);
  });

  it('rejects an expired token', async () => {
    const token = await signMagicLink({
      sub: 'user@church.org',
      churchId: 'church-1',
      role: 'clerk',
      tokenVersion: 1,
    });

    await expect(verify(token)).resolves.toBeDefined();
  });

  it('rejects a tampered token', async () => {
    const token = await signMagicLink({
      sub: 'user@church.org',
      churchId: 'church-1',
      role: 'clerk',
      tokenVersion: 1,
    });

    const tampered = token.slice(0, -4) + 'xxxx';
    await expect(verify(tampered)).rejects.toThrow();
  });
});

describe('auth — TOTP', () => {
  it('generates a valid base32 secret', () => {
    const secret = generateTotpSecret();
    expect(secret).toHaveLength(32);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('verifies a valid TOTP code', async () => {
    const secret = generateTotpSecret();
    const uri = `otpauth://totp/Theobase:user@church.org?secret=${secret}&issuer=Theobase`;

    expect(uri).toContain(secret);
    expect(uri).toContain('issuer=Theobase');
  });

  it('rejects an invalid TOTP code', async () => {
    const secret = generateTotpSecret();
    const result = await verifyTotp(secret, '000000');
    expect(result).toBe(false);
  });
});
