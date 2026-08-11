import { DurableObject } from 'cloudflare:workers';
import type { ChurchEvent, ChurchOperation, Role } from '@theobase/shared';
import { isValidTransition, suggestHouseholds, type MembershipState } from '@theobase/shared';
import { verify } from './auth/jwt';

const LAST_HASH_KEY = 'lastHash';

const ROLE_PERMISSIONS: Record<string, ChurchOperation[]> = {
  clerk: [
    'member:create',
    'member:update',
    'member:delete',
    'member:state-change',
    'household:create',
    'household:update',
    'household:delete',
    'church:create',
    'church:update',
    'role:assign',
    'role:revoke',
    'transfer:initiate',
    'transfer:accept',
    'transfer:reject',
    'contact:approve',
    'contact:reject',
    'contact:update-request',
    'visitor:follow-up',
    'giving_batch:commit',
  ],
  treasurer: [
    'giving_record:create',
    'giving_record:delete',
    'giving_batch:create',
    'giving_batch:update',
    'giving_batch:commit',
  ],
  counter: [
    'giving_record:create',
    'giving_batch:create',
    'giving_batch:counter2-confirm',
    'giving_batch:reconcile',
  ],
  pastor: [],
  'department-head': [],
  'board-member': [],
  member: [
    'contact:update-request',
    'visitor:follow-up',
  ],
  interest: [],
  visitor: [],
  'conference-treasurer': [],
  'conference-secretary': ['transfer:accept'],
  'conference-president': [],
  auditor: ['transfer:accept'],
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
  'member:state-change': (p, s) => {
    upsertEntity(s, 'members', p.memberId as string, {
      ...(p.updatedMember as Record<string, unknown> ?? {}),
    });
    const auditLog = (s.auditLog as Array<Record<string, unknown>>) ?? [];
    auditLog.push({
      memberId: p.memberId,
      prevState: p.prevState,
      newState: p.newState,
      actor: p.actor,
      timestamp: p.timestamp,
      reason: p.reason ?? null,
      operation: 'member:state-change',
    });
    s.auditLog = auditLog;
  },
  'transfer:initiate': (p, s) => {
    upsertEntity(s, 'members', p.memberId as string, {
      ...(p.updatedMember as Record<string, unknown> ?? {}),
    });
    const transferLog = (s.transferLog as Array<Record<string, unknown>>) ?? [];
    transferLog.push({
      memberId: p.memberId,
      fromChurchId: p.fromChurchId,
      toChurchId: p.toChurchId,
      status: 'pending-accept',
      initiatedAt: p.timestamp,
      actor: p.actor,
      reason: p.reason ?? null,
    });
    s.transferLog = transferLog;
    const auditLog = (s.auditLog as Array<Record<string, unknown>>) ?? [];
    auditLog.push({
      memberId: p.memberId,
      prevState: p.prevState,
      newState: p.newState,
      actor: p.actor,
      timestamp: p.timestamp,
      reason: p.reason ?? null,
      operation: 'transfer:initiate',
    });
    s.auditLog = auditLog;
  },
  'transfer:accept': (p, s) => {
    upsertEntity(s, 'members', p.memberId as string, {
      ...(p.updatedMember as Record<string, unknown> ?? {}),
    });
    const transferLog = (s.transferLog as Array<Record<string, unknown>>) ?? [];
    transferLog.push({
      memberId: p.memberId,
      fromChurchId: p.fromChurchId,
      toChurchId: p.toChurchId,
      status: 'accepted',
      acceptedAt: p.timestamp,
      actor: p.actor,
      reason: p.reason ?? null,
    });
    s.transferLog = transferLog;
    const auditLog = (s.auditLog as Array<Record<string, unknown>>) ?? [];
    auditLog.push({
      memberId: p.memberId,
      prevState: p.prevState,
      newState: p.newState,
      actor: p.actor,
      timestamp: p.timestamp,
      reason: p.reason ?? null,
      operation: 'transfer:accept',
    });
    s.auditLog = auditLog;
  },
  'transfer:reject': (p, s) => {
    const transferLog = (s.transferLog as Array<Record<string, unknown>>) ?? [];
    transferLog.push({
      memberId: p.memberId,
      fromChurchId: p.fromChurchId,
      toChurchId: p.toChurchId,
      status: 'rejected',
      rejectedAt: p.timestamp,
      actor: p.actor,
      reason: p.reason ?? null,
    });
    s.transferLog = transferLog;
    const auditLog = (s.auditLog as Array<Record<string, unknown>>) ?? [];
    auditLog.push({
      memberId: p.memberId,
      prevState: p.prevState,
      newState: p.newState,
      actor: p.actor,
      timestamp: p.timestamp,
      reason: p.reason ?? null,
      operation: 'transfer:reject',
    });
    s.auditLog = auditLog;
  },
  'household:create': (p, s) => upsertEntity(s, 'households', p.id as string, p),
  'household:update': (p, s) => upsertEntity(s, 'households', p.id as string, p),
  'household:delete': (p, s) => deleteEntity(s, 'households', p.id as string),
  'giving_batch:create': (p, s) => {
    upsertEntity(s, 'givingBatches', p.id as string, {
      ...p,
      counter1Id: p.counter1Id,
      counter1Records: p.records,
      counter1ConfirmedAt: p.timestamp,
      status: 'counter1-confirmed',
    });
    const givingRecords = (s.givingRecords as Record<string, Record<string, unknown>>) ?? {};
    const records = (p.records as Array<Record<string, unknown>>) ?? [];
    for (const r of records) {
      givingRecords[r.id as string] = r;
    }
    s.givingRecords = givingRecords;
  },
  'giving_batch:update': (p, s) => upsertEntity(s, 'givingBatches', p.id as string, p),
  'giving_batch:commit': (p, s) => {
    const givingBatches = (s.givingBatches as Record<string, Record<string, unknown>>) ?? {};
    const batch = givingBatches[p.batchId as string] ?? {};
    givingBatches[p.batchId as string] = { ...batch, ...p, status: 'committed' };
    s.givingBatches = givingBatches;
    const givingRecords = (s.givingRecords as Record<string, Record<string, unknown>>) ?? {};
    const records = (p.records as Array<Record<string, unknown>>) ?? [];
    for (const r of records) {
      givingRecords[r.id as string] = r;
    }
    s.givingRecords = givingRecords;
  },
  'giving_batch:counter2-confirm': (p, s) => {
    const batches = (s.givingBatches as Record<string, Record<string, unknown>>) ?? {};
    const batch = batches[p.batchId as string] ?? {};
    batches[p.batchId as string] = {
      ...batch,
      counter2Id: p.counter2Id,
      counter2Records: p.records,
      counter2ConfirmedAt: p.timestamp,
      status: 'counter2-confirmed',
    };
    s.givingBatches = batches;
  },
  'giving_batch:reconcile': (p, s) => {
    const batches = (s.givingBatches as Record<string, Record<string, unknown>>) ?? {};
    const batch = batches[p.batchId as string] ?? {};
    batches[p.batchId as string] = {
      ...batch,
      reconciledRecords: p.records,
      status: 'reconciled',
      reconciledAt: p.timestamp,
    };
    s.givingBatches = batches;
  },
  'giving_record:create': (p, s) => upsertEntity(s, 'givingRecords', p.id as string, p),
  'giving_record:delete': (p, s) => deleteEntity(s, 'givingRecords', p.id as string),
  'church:update': (p, s) => {
    s.church = p;
  },
  'church:create': (p, s) => {
    s.church = p;
  },
  'contact:update-request': (p, s) => {
    const pending = (s.pendingContactUpdates as Array<Record<string, unknown>>) ?? [];
    pending.push({
      memberId: p.memberId,
      updates: p.updates,
      requestedAt: p.timestamp,
      actor: p.actor,
      status: 'pending',
    });
    s.pendingContactUpdates = pending;
    const auditLog = (s.auditLog as Array<Record<string, unknown>>) ?? [];
    auditLog.push({
      memberId: p.memberId,
      prevState: 'submitted',
      newState: 'pending-approval',
      actor: p.actor,
      timestamp: p.timestamp,
      reason: 'Contact update requested',
      operation: 'contact:update-request',
    });
    s.auditLog = auditLog;
  },
  'contact:approve': (p, s) => {
    const member = (p.updatedMember as Record<string, unknown>) ?? {};
    upsertEntity(s, 'members', p.memberId as string, member);
    const pending = (s.pendingContactUpdates as Array<Record<string, unknown>>) ?? [];
    s.pendingContactUpdates = pending.filter(u => u.memberId !== p.memberId);
    const auditLog = (s.auditLog as Array<Record<string, unknown>>) ?? [];
    auditLog.push({
      memberId: p.memberId,
      prevState: 'pending-approval',
      newState: 'approved',
      actor: p.actor,
      timestamp: p.timestamp,
      reason: 'Contact update approved',
      operation: 'contact:approve',
    });
    s.auditLog = auditLog;
  },
  'contact:reject': (p, s) => {
    const pending = (s.pendingContactUpdates as Array<Record<string, unknown>>) ?? [];
    s.pendingContactUpdates = pending.filter(u => u.memberId !== p.memberId);
    const auditLog = (s.auditLog as Array<Record<string, unknown>>) ?? [];
    auditLog.push({
      memberId: p.memberId,
      prevState: 'pending-approval',
      newState: 'rejected',
      actor: p.actor,
      timestamp: p.timestamp,
      reason: p.reason ?? 'Contact update rejected',
      operation: 'contact:reject',
    });
    s.auditLog = auditLog;
  },
  'visitor:follow-up': (p, s) => {
    const interests = (s.interests as Array<Record<string, unknown>>) ?? [];
    interests.push({
      id: crypto.randomUUID(),
      churchId: p.churchId,
      name: p.name,
      email: p.email ?? null,
      phone: p.phone ?? null,
      message: p.message ?? null,
      createdAt: p.timestamp,
      status: 'new',
    });
    s.interests = interests;
  },
  'household:suggestions': (p, s) => {
    const suggestions = (s.householdSuggestions as Array<Record<string, unknown>>) ?? [];
    suggestions.push({
      memberIds: p.memberIds,
      suggestedName: p.suggestedName,
      reason: p.reason,
      generatedAt: p.timestamp,
      confirmed: false,
    });
    s.householdSuggestions = suggestions;
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
      if (request.method === 'GET' && path.startsWith('/batch-compare/')) {
        const batchId = path.split('/')[2];
        const state = await this.reconstructState();
        const batches = (state.givingBatches as Record<string, Record<string, unknown>>) ?? {};
        const batch = batches[batchId!];
        if (!batch) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

        const c1Records = (batch.counter1Records as Array<Record<string, unknown>>) ?? [];
        const c2Records = (batch.counter2Records as Array<Record<string, unknown>>) ?? [];
        const match = batch.status === 'counter2-confirmed';
        const total1 = c1Records.reduce((s: number, r) => s + (r.amount as number ?? 0), 0);
        const total2 = c2Records.reduce((s: number, r) => s + (r.amount as number ?? 0), 0);

        return new Response(JSON.stringify({
          batchId,
          status: batch.status,
          counter1: { records: c1Records, total: total1 },
          counter2: { records: c2Records, total: total2 },
          totalsMatch: total1 === total2,
          match,
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      if (request.method === 'GET' && path === '/household-suggestions') {
        const state = await this.reconstructState();
        const members = Object.values((state.members as Record<string, Record<string, unknown>>) ?? {});
        const suggestions = suggestHouseholds(members as Parameters<typeof suggestHouseholds>[0]);
        return new Response(JSON.stringify(suggestions), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'GET' && path === '/pending-updates') {
        const state = await this.reconstructState();
        return new Response(JSON.stringify(state.pendingContactUpdates ?? []), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'GET' && path === '/interests') {
        const state = await this.reconstructState();
        return new Response(JSON.stringify(state.interests ?? []), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (request.method === 'GET' && path === '/qr') {
        const state = await this.reconstructState();
        const church = state.church as Record<string, unknown> | undefined;
        return new Response(JSON.stringify({
          churchId: church?.id,
          churchName: church?.name,
          welcomeMessage: `Welcome to ${church?.name ?? 'our church'}!`,
        }), { headers: { 'Content-Type': 'application/json' } });
      }

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

      if (request.method === 'GET' && path.startsWith('/audit/')) {
        const memberId = path.slice('/audit/'.length);
        const events = await this.getEvents();
        const filtered = events.filter((event) => {
          const p = event.payload as Record<string, unknown>;
          return p?.memberId === memberId;
        });
        return new Response(JSON.stringify(filtered), {
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

        if (body.operation === 'member:state-change') {
          const p = body.payload as { memberId: string; prevState: string; newState: string };
          if (!isValidTransition(p.prevState as MembershipState, p.newState as MembershipState)) {
            return new Response(
              JSON.stringify({ error: `Invalid transition: ${p.prevState} -> ${p.newState}` }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
          }
          const state = await this.reconstructState();
          const members = (state.members as Record<string, Record<string, unknown>>) ?? {};
          const existing = members[p.memberId] ?? {};
          const updatedMember = { ...existing, status: p.newState };
          body.payload = {
            ...(body.payload as Record<string, unknown>),
            actor: user.sub,
            timestamp: now(),
            updatedMember,
          };
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
