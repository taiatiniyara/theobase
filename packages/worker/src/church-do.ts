import { DurableObject } from 'cloudflare:workers';
import type { ChurchEvent, ChurchOperation, Role } from '@theobase/shared';
import { verify } from './auth/jwt';

const LAST_HASH_KEY = 'lastHash';

const ROLE_PERMISSIONS: Record<string, ChurchOperation[]> = {
  clerk: [
    'member:create',
    'member:update',
    'member:delete',
    'household:create',
    'household:update',
    'household:delete',
    'church:create',
    'church:update',
    'role:assign',
    'role:revoke',
  ],
  treasurer: [
    'giving_record:create',
    'giving_record:delete',
    'giving_batch:create',
    'giving_batch:update',
    'giving_batch:commit',
  ],
  counter: ['giving_record:create'],
  pastor: [],
  'department-head': [],
  'board-member': [],
  member: [],
  interest: [],
  visitor: [],
  'conference-treasurer': [],
  'conference-secretary': [],
  'conference-president': [],
  auditor: [],
  operator: [],
};

function canOperate(role: Role, operation: string): boolean {
  if (role === 'operator') return true;
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.includes(operation as ChurchOperation);
}

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function now(): number {
  return Date.now();
}

type EntityMap = Record<string, unknown>;

function upsertEntity(
  state: Record<string, unknown>,
  key: string,
  id: string,
  value: unknown,
): void {
  const map = (state[key] as EntityMap) ?? {};
  map[id] = value;
  state[key] = map;
}

function deleteEntity(state: Record<string, unknown>, key: string, id: string): void {
  const map = state[key] as EntityMap | undefined;
  if (map) {
    delete map[id];
    state[key] = map;
  }
}

const STATE_HANDLERS: Record<
  string,
  (payload: Record<string, unknown>, state: Record<string, unknown>) => void
> = {
  'member:create': (p, s) => upsertEntity(s, 'members', p.id as string, p),
  'member:update': (p, s) => upsertEntity(s, 'members', p.id as string, p),
  'member:delete': (p, s) => deleteEntity(s, 'members', p.id as string),
  'household:create': (p, s) => upsertEntity(s, 'households', p.id as string, p),
  'household:update': (p, s) => upsertEntity(s, 'households', p.id as string, p),
  'household:delete': (p, s) => deleteEntity(s, 'households', p.id as string),
  'giving_batch:create': (p, s) => upsertEntity(s, 'givingBatches', p.id as string, p),
  'giving_batch:update': (p, s) => upsertEntity(s, 'givingBatches', p.id as string, p),
  'giving_batch:commit': (p, s) => upsertEntity(s, 'givingBatches', p.id as string, p),
  'giving_record:create': (p, s) => upsertEntity(s, 'givingRecords', p.id as string, p),
  'giving_record:delete': (p, s) => deleteEntity(s, 'givingRecords', p.id as string),
  'church:update': (p, s) => {
    s.church = p;
  },
  'church:create': (p, s) => {
    s.church = p;
  },
};

export class ChurchDO extends DurableObject {
  private events: ChurchEvent[] = [];
  private lastHash = '';
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const stored = await this.ctx.storage.get<string>(LAST_HASH_KEY);
    this.lastHash = stored ?? '';

    const eventsList = await this.ctx.storage.list<ChurchEvent>({ prefix: 'event:' });
    this.events = [...eventsList.values()].sort((a, b) => a.timestamp - b.timestamp);

    this.initialized = true;
  }

  async appendEvent(
    operation: ChurchOperation,
    payload: unknown,
    actor: string,
  ): Promise<ChurchEvent> {
    await this.initialize();

    const timestamp = now();
    const id = crypto.randomUUID();
    const prevHash = this.lastHash;

    const hashInput = `${prevHash}:${operation}:${JSON.stringify(payload)}:${actor}:${timestamp}`;
    const hash = await sha256(hashInput);

    const event: ChurchEvent = {
      id,
      operation,
      payload,
      actor,
      timestamp,
      prevHash,
      hash,
    };

    this.events.push(event);
    this.lastHash = hash;

    await this.ctx.storage.put(`event:${id}`, event);
    await this.ctx.storage.put(LAST_HASH_KEY, this.lastHash);

    return event;
  }

  async getEvents(): Promise<ChurchEvent[]> {
    await this.initialize();
    return [...this.events];
  }

  async getLastHash(): Promise<string> {
    await this.initialize();
    return this.lastHash;
  }

  async verifyHashChain(): Promise<{ valid: boolean; invalidAt?: number }> {
    await this.initialize();

    let previousHash = '';
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i]!;
      const expectedHashInput = `${previousHash}:${event.operation}:${JSON.stringify(event.payload)}:${event.actor}:${event.timestamp}`;
      const computedHash = await sha256(expectedHashInput);

      if (computedHash !== event.hash) {
        return { valid: false, invalidAt: i };
      }

      if (event.prevHash !== previousHash) {
        return { valid: false, invalidAt: i };
      }

      previousHash = event.hash;
    }

    return { valid: true };
  }

  async reconstructState(): Promise<Record<string, unknown>> {
    await this.initialize();

    const state: Record<string, unknown> = {};
    for (const event of this.events) {
      applyEventToState(event, state);
    }

    return state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === 'GET' && path === '/events') {
        const events = await this.getEvents();
        return new Response(JSON.stringify(events), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'GET' && path === '/verify') {
        const result = await this.verifyHashChain();
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'GET' && path === '/state') {
        const state = await this.reconstructState();
        return new Response(JSON.stringify(state), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'POST' && path === '/mutate') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        const { payload: user } = await verify(authHeader.slice(7));

        const body = (await request.json()) as {
          operation: ChurchOperation;
          payload: unknown;
        };
        if (!canOperate(user.role, body.operation)) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const event = await this.appendEvent(body.operation, body.payload, user.sub);
        return new Response(JSON.stringify(event), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }
}

function applyEventToState(event: ChurchEvent, state: Record<string, unknown>): void {
  const handler = STATE_HANDLERS[event.operation];
  if (handler) {
    handler(event.payload as Record<string, unknown>, state);
  }
}
