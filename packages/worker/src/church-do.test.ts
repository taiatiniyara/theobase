import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { ChurchDO } from './church-do';
import { initKeys, signSession } from './auth/jwt';
import type { Env } from './env';
import type { ChurchEvent } from '@theobase/shared';

const testEnv = env as unknown as Env;

let stub: DurableObjectStub<ChurchDO>;
let authToken: string;

beforeAll(async () => {
  await initKeys();
  authToken = await signSession({
    sub: 'test-user',
    churchId: 'test-church',
    role: 'clerk',
    tokenVersion: 1,
  });

  const id = testEnv.CHURCH_DO.newUniqueId();
  stub = testEnv.CHURCH_DO.get(id);
});

async function mutate(operation: string, payload: unknown): Promise<ChurchEvent> {
  const response = await stub.fetch(
    new Request('http://localhost/mutate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ operation, payload }),
    }),
  );
  expect(response.status).toBe(201);
  return response.json() as Promise<ChurchEvent>;
}

async function getEvents(): Promise<ChurchEvent[]> {
  const response = await stub.fetch('http://localhost/events');
  expect(response.status).toBe(200);
  return response.json() as Promise<ChurchEvent[]>;
}

async function verifyChain(): Promise<{ valid: boolean; invalidAt?: number }> {
  const response = await stub.fetch('http://localhost/verify');
  expect(response.status).toBe(200);
  return response.json();
}

async function getState(): Promise<Record<string, unknown>> {
  const response = await stub.fetch('http://localhost/state');
  expect(response.status).toBe(200);
  return response.json();
}

describe('ChurchDO', () => {
  it('appends an event to the log', async () => {
    const event = await mutate('member:create', {
      id: 'member-1',
      firstName: 'John',
      lastName: 'Wesley',
    });
    expect(event.id).toBeDefined();
    expect(event.operation).toBe('member:create');
    expect(event.hash.length).toBe(64);
    expect(event.prevHash).toBe('');
  });

  it('rejects unauthorized mutations', async () => {
    const response = await stub.fetch(
      new Request('http://localhost/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'member:create', payload: { id: 'bad' } }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it('rejects mutations for unpermitted role', async () => {
    const memberToken = await signSession({
      sub: 'member-user',
      churchId: 'test-church',
      role: 'member',
      tokenVersion: 1,
    });

    const response = await stub.fetch(
      new Request('http://localhost/mutate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ operation: 'member:create', payload: { id: 'bad' } }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it('maintains SHA-256 hash chain across events', async () => {
    await mutate('member:create', { id: 'member-2', firstName: 'Charles', lastName: 'Spurgeon' });
    await mutate('member:create', { id: 'member-3', firstName: 'George', lastName: 'Whitfield' });

    const result = await verifyChain();
    expect(result.valid).toBe(true);
  });

  it('each event hash links to previous hash', async () => {
    const events = await getEvents();
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.prevHash).toBe(events[i - 1]!.hash);
    }
  });

  it('detects tampered hash chain', async () => {
    const event = await mutate('member:create', {
      id: 'tamper',
      firstName: 'Tamper',
      lastName: 'Test',
    });

    const tamperedPayload = { id: 'tamper', firstName: 'Hacked', lastName: 'Test' };
    const hashInput = `:member:create:${JSON.stringify(tamperedPayload)}:test-user:${event.timestamp}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashInput));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    expect(event.hash).not.toBe(computedHash);
  });

  it('reconstructs state from event log', async () => {
    await mutate('member:create', { id: 'state-m1', firstName: 'Alice', lastName: 'Smith' });
    await mutate('member:create', { id: 'state-m2', firstName: 'Bob', lastName: 'Jones' });
    await mutate('household:create', {
      id: 'state-h1',
      name: 'Smith Family',
      address: '123 Main St',
    });

    const state = await getState();
    const members = state.members as Record<string, unknown>;
    expect(members['state-m1']).toEqual({
      id: 'state-m1',
      firstName: 'Alice',
      lastName: 'Smith',
    });

    const households = state.households as Record<string, unknown>;
    expect(households['state-h1']).toEqual({
      id: 'state-h1',
      name: 'Smith Family',
      address: '123 Main St',
    });
  });

  it('member:delete removes from state', async () => {
    await mutate('member:create', { id: 'del-m1', firstName: 'Delete', lastName: 'Me' });
    await mutate('member:delete', { id: 'del-m1' });

    const state = await getState();
    const members = state.members as Record<string, unknown>;
    expect(members['del-m1']).toBeUndefined();
  });
});
