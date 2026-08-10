import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

describe('worker', () => {
  it('responds with app name', async () => {
    const response = await SELF.fetch('http://localhost');
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('Theobase');
  });
});
