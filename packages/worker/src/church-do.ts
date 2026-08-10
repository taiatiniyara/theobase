import { DurableObject } from 'cloudflare:workers';
import type { ChurchEvent } from '@theobase/shared';

const STATE_KEY = 'state';
const LAST_HASH_KEY = 'lastHash';

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function now(): number {
  return Date.now();
}

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
    operation: string,
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
      this.applyEventToState(event, state);
    }

    await this.ctx.storage.put(STATE_KEY, state);
    return state;
  }

  private applyEventToState(event: ChurchEvent, state: Record<string, unknown>): void {
    const payload = event.payload as Record<string, unknown>;
    switch (event.operation) {
      case 'member:create':
      case 'member:update': {
        const members = (state.members as Record<string, unknown>) ?? {};
        members[payload.id as string] = payload;
        state.members = members;
        break;
      }
      case 'member:delete': {
        const members = (state.members as Record<string, unknown>) ?? {};
        delete members[payload.id as string];
        state.members = members;
        break;
      }
      case 'household:create':
      case 'household:update': {
        const households = (state.households as Record<string, unknown>) ?? {};
        households[payload.id as string] = payload;
        state.households = households;
        break;
      }
      case 'household:delete': {
        const households = (state.households as Record<string, unknown>) ?? {};
        delete households[payload.id as string];
        state.households = households;
        break;
      }
      case 'giving_batch:create':
      case 'giving_batch:update':
      case 'giving_batch:commit': {
        const batches = (state.givingBatches as Record<string, unknown>) ?? {};
        batches[payload.id as string] = payload;
        state.givingBatches = batches;
        break;
      }
      case 'giving_record:create': {
        const records = (state.givingRecords as Record<string, unknown>) ?? {};
        records[payload.id as string] = payload;
        state.givingRecords = records;
        break;
      }
      case 'giving_record:delete': {
        const records = (state.givingRecords as Record<string, unknown>) ?? {};
        delete records[payload.id as string];
        state.givingRecords = records;
        break;
      }
      case 'church:update': {
        state.church = payload;
        break;
      }
      default:
        break;
    }
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
        const body = (await request.json()) as {
          operation: string;
          payload: unknown;
          actor: string;
        };
        const event = await this.appendEvent(body.operation, body.payload, body.actor);
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
