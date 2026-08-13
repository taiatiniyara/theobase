import { DurableObject } from 'cloudflare:workers';
import type { ChurchEvent, ChurchOperation, Role } from '@theobase/shared';
import { isValidTransition, suggestHouseholds, type MembershipState, APP_VERSION } from '@theobase/shared';
import type { Env } from './env';
import { verify, importKeysFromEnv } from './auth/jwt';

const LAST_HASH_KEY = 'lastHash';

const ROLE_PERMISSIONS: Record<string, ChurchOperation[]> = {
  clerk: [
    'member:create',
    'member:update',
    'member:delete',
    'member:state-change',
    'member:erasure',
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
    'report:submit',
  ],
  treasurer: [
    'giving_record:create',
    'giving_record:delete',
    'giving_batch:create',
    'giving_batch:update',
    'giving_batch:commit',
    'giving_batch:deposit',
    'remittance:submit',
    'report:submit',
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
    'contact:self-data',
  ],
  interest: [],
  visitor: ['visitor:follow-up'],
  'conference-treasurer': ['remittance:receive', 'report:submit', 'report:view', 'bill:manage'],
  'conference-secretary': ['transfer:accept', 'report:approve', 'report:return', 'church:activate', 'report:view'],
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

function versionedResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-DO-Version': APP_VERSION,
      ...extraHeaders,
    },
  });
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
  'giving_batch:deposit': (p, s) => {
    const batches = (s.givingBatches as Record<string, Record<string, unknown>>) ?? {};
    const batch = batches[p.batchId as string] ?? {};
    batches[p.batchId as string] = { ...batch, status: 'deposited', depositDate: p.depositDate, depositRef: p.depositRef, depositedBy: p.actor, depositedAt: p.timestamp };
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
  'report:submit': (p, s) => {
    const reports = (s.reports as Array<Record<string, unknown>>) ?? [];
    reports.push({
      id: crypto.randomUUID(),
      churchId: p.churchId,
      year: p.year,
      data: p.data,
      status: 'submitted',
      submittedBy: p.actor,
      submittedAt: p.timestamp,
    });
    s.reports = reports;
  },
  'report:approve': (p, s) => {
    const reports = (s.reports as Array<Record<string, unknown>>) ?? [];
    const idx = reports.findIndex(r => r.id === p.reportId);
    if (idx !== -1) {
      reports[idx] = { ...reports[idx], status: 'approved', approvedBy: p.actor, approvedAt: p.timestamp };
    }
    s.reports = reports;
  },
  'report:return': (p, s) => {
    const reports = (s.reports as Array<Record<string, unknown>>) ?? [];
    const idx = reports.findIndex(r => r.id === p.reportId);
    if (idx !== -1) {
      reports[idx] = { ...reports[idx], status: 'returned', returnedBy: p.actor, returnReason: p.reason, returnedAt: p.timestamp };
    }
    s.reports = reports;
  },
  'remittance:submit': (p, s) => {
    const remittances = (s.remittances as Array<Record<string, unknown>>) ?? [];
    remittances.push({
      id: crypto.randomUUID(),
      churchId: p.churchId,
      period: p.period,
      amount: p.amount,
      titheTotal: p.titheTotal,
      status: 'submitted',
      submittedBy: p.actor,
      submittedAt: p.timestamp,
    });
    s.remittances = remittances;
  },
  'remittance:receive': (p, s) => {
    const remittances = (s.remittances as Array<Record<string, unknown>>) ?? [];
    const idx = remittances.findIndex(r => r.id === p.remittanceId);
    if (idx !== -1) {
      remittances[idx] = { ...remittances[idx], status: 'received', receivedBy: p.actor, receivedAt: p.timestamp };
    }
    s.remittances = remittances;
  },
  'member:erasure': (p, s) => {
    const members = (s.members as Record<string, Record<string, unknown>>) ?? {};
    const member = members[p.memberId as string];
    if (member) {
      const redactedId = `redacted-member-${crypto.randomUUID()}`;
      members[p.memberId as string] = {
        id: redactedId,
        churchId: member.churchId,
        firstName: '[Redacted]',
        lastName: '[Redacted]',
        email: null,
        phone: null,
        address: null,
        dateOfBirth: null,
        gender: null,
        baptismDate: null,
        membershipStatus: 'removed',
        householdId: null,
        createdAt: member.createdAt,
        updatedAt: p.timestamp,
        redactedBy: p.actor,
        redactedAt: p.timestamp,
        redactedReason: p.reason ?? 'Member requested erasure',
      };
      s.members = members;
    }
    const auditLog = (s.auditLog as Array<Record<string, unknown>>) ?? [];
    auditLog.push({
      memberId: p.memberId,
      prevState: 'active',
      newState: 'redacted',
      actor: p.actor,
      timestamp: p.timestamp,
      reason: p.reason ?? 'Right to erasure exercised',
      operation: 'member:erasure',
    });
    s.auditLog = auditLog;
  },
  'church:activate': (p, s) => {
    const church = (s.church as Record<string, unknown>) ?? {};
    s.church = { ...church, status: p.status ?? 'active', activatedBy: p.actor, activatedAt: p.timestamp };
  },
  'contact:self-data': (_p, _s) => {
  },
  'report:view': (_p, _s) => {
  },
  'bill:manage': (p, s) => {
    const billing = (s.billingRecords as Array<Record<string, unknown>>) ?? [];
    billing.push({
      id: crypto.randomUUID(),
      churchId: p.churchId,
      action: p.action,
      amount: p.amount,
      period: p.period,
      actor: p.actor,
      timestamp: p.timestamp,
    });
    s.billingRecords = billing;
  },
};

export class ChurchDO extends DurableObject {
  private events: ChurchEvent[] = [];
  private lastHash = '';
  private initialized = false;
  private doEnv: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.doEnv = env;
  }

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

  async handleWebSocket(ws: WebSocket, token: string): Promise<void> {
    ws.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data as string) as {
          operation: ChurchOperation;
          payload: unknown;
          intentId: string;
        };

        const user = token
          ? (await verify(token)).payload
          : { sub: 'anonymous', churchId: '', role: 'member' as const, tokenVersion: 0 };

        if (!canOperate(user.role, data.operation)) {
          ws.send(JSON.stringify({ intentId: data.intentId, success: false, error: 'Forbidden' }));
          return;
        }

        const event = await this.appendEvent(data.operation, data.payload, user.sub);
        ws.send(JSON.stringify({ intentId: data.intentId, success: true, event }));
      } catch (err) {
        ws.send(
          JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          }),
        );
      }
    });

    ws.addEventListener('close', () => {
      ws.removeEventListener('message', () => {});
    });
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

    const env = this.doEnv;
    await importKeysFromEnv(env);

    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader === 'websocket' && path === '/ws') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      if (!client || !server) return new Response('WebSocket pair failed', { status: 500 });
      server.accept();
      const wsUrl = new URL(request.url);
      this.handleWebSocket(server, wsUrl.searchParams.get('token') ?? '');
      return new Response(null, { status: 101, webSocket: client as WebSocket });
    }

    try {
      if (request.method === 'POST' && path === '/purge') {
        const seedToken = this.doEnv.SEED_TOKEN || '';
        const authHeader = request.headers.get('Authorization');
        const isSeed = seedToken && authHeader === `Bearer ${seedToken}`;
        if (!isSeed) {
          try {
            const { payload } = await verify((authHeader ?? '').slice(7));
            if (!payload.isSuperAdmin) return versionedResponse({ error: 'Unauthorized' }, 401);
          } catch {
            return versionedResponse({ error: 'Unauthorized' }, 401);
          }
        }
        await this.ctx.storage.deleteAll();
        this.events = [];
        this.lastHash = '';
        this.initialized = false;
        return versionedResponse({ purged: true });
      }

      if (request.method === 'GET' && path === '/insights') {
        const state = await this.reconstructState();
        const givingRecords = Object.values((state.givingRecords as Record<string, Record<string, unknown>>) ?? {}) as Array<Record<string, unknown>>;
        const members = Object.values((state.members as Record<string, Record<string, unknown>>) ?? {}) as Array<Record<string, unknown>>;
        const reports = (state.reports as Array<Record<string, unknown>>) ?? [];
        const remittances = (state.remittances as Array<Record<string, unknown>>) ?? [];

        const now = new Date();
        const thisQuarter = Math.floor(now.getMonth() / 3);
        const prevQuarter = thisQuarter === 0 ? 3 : thisQuarter - 1;

        function getQuarter(ts: number) { const d = new Date(ts); return Math.floor(d.getMonth() / 3); }

        const thisQtrTithe = givingRecords
          .filter(r => r.type === 'tithe' && getQuarter((r.createdAt as number) * 1000) === thisQuarter)
          .reduce((s, r) => s + ((r.amount as number) ?? 0), 0);

        const prevQtrTithe = givingRecords
          .filter(r => r.type === 'tithe' && getQuarter((r.createdAt as number) * 1000) === prevQuarter)
          .reduce((s, r) => s + ((r.amount as number) ?? 0), 0);

        const givingDecline = prevQtrTithe > 0 && (prevQtrTithe - thisQtrTithe) / prevQtrTithe > 0.1;

        const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;
        const membersWithRecentGiving = new Set(
          givingRecords.filter(r => (r.createdAt as number) * 1000 > fourWeeksAgo).map(r => r.memberId)
        );
        const inactiveMembers = members.filter(m => !membersWithRecentGiving.has(m.id as string)).length;

        const unsubmittedReports = reports.filter(r => r.status !== 'submitted' && r.status !== 'approved').length;

        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const titheRemitted = remittances.some(r => r.period === thisMonth && r.status === 'received');
        const titheCollected = givingRecords.some(r => r.type === 'tithe');
        const titheOverdue = titheCollected && !titheRemitted;

        const insights = [];
        if (givingDecline) insights.push({ type: 'giving-decline', title: 'Giving Decline', description: 'Tithe is down over 10% this quarter.', action: { label: 'View Treasurer', to: '/treasurer' } });
        if (inactiveMembers > 0) insights.push({ type: 'inactive-members', title: 'Inactive Members', description: `${inactiveMembers} member(s) with no giving in 4 weeks.`, action: { label: 'View Members', to: '/members' } });
        if (unsubmittedReports > 0) insights.push({ type: 'report-ready', title: 'Report Ready', description: 'Annual statistical report has data ready for review.', action: { label: 'View Reports', to: '/reports' } });
        if (titheOverdue) insights.push({ type: 'tithe-overdue', title: 'Tithe Remittance Overdue', description: 'Tithe collected but not yet remitted this month.', action: { label: 'Submit Remittance', to: '/remittance' } });

        return versionedResponse({ insights });
      }

      if (request.method === 'GET' && path.startsWith('/remittance-generate/')) {
        const period = path.split('/')[2]!;
        const state = await this.reconstructState();
        const givingRecords = Object.values((state.givingRecords as Record<string, Record<string, unknown>>) ?? {});
        
        const titheTotal = givingRecords
          .filter((r: Record<string, unknown>) => r.type === 'tithe')
          .reduce((s: number, r: Record<string, unknown>) => s + ((r.amount as number) ?? 0), 0);
        
        const offerings = givingRecords
          .filter((r: Record<string, unknown>) => r.type === 'offering')
          .reduce((s: number, r: Record<string, unknown>) => s + ((r.amount as number) ?? 0), 0);
        
        const categories: Record<string, number> = {};
        for (const r of givingRecords as Array<Record<string, unknown>>) {
          const cat = (r.category as string) ?? 'other';
          categories[cat] = (categories[cat] ?? 0) + ((r.amount as number) ?? 0);
        }
        
        return versionedResponse({
          period,
          titheTotal,
          offeringTotal: offerings,
          totalGiving: titheTotal + offerings,
          remitAmount: titheTotal * 0.1,
          categories,
        });
      }

      if (request.method === 'GET' && path.startsWith('/report-generate/')) {
        const year = parseInt(path.split('/')[2]!, 10);
        const state = await this.reconstructState();
        const members = Object.values((state.members as Record<string, Record<string, unknown>>) ?? {});
        const auditLog = (state.auditLog as Array<Record<string, unknown>>) ?? [];

        const q1 = { baptised: 0, profession: 0, transferIn: 0, transferOut: 0, deceased: 0, removed: 0 };
        const q2 = { ...q1 };
        const q3 = { ...q1 };
        const q4 = { ...q1 };

        function getQuarter(ts: number): number {
          const d = new Date(ts);
          return Math.floor(d.getMonth() / 3) + 1;
        }

        for (const event of auditLog) {
          const ts = event.timestamp as number;
          if (!ts) continue;
          const d = new Date(ts);
          if (d.getFullYear() !== year) continue;
          const q = getQuarter(ts);
          const target = q === 1 ? q1 : q === 2 ? q2 : q === 3 ? q3 : q4;
          const newState = event.newState as string;
          if (newState === 'baptised') target.baptised++;
          else if (newState === 'profession') target.profession++;
          else if (newState === 'transfer-in') target.transferIn++;
          else if (newState === 'transfer-out') target.transferOut++;
          else if (newState === 'deceased') target.deceased++;
          else if (newState === 'removed') target.removed++;
        }

        return versionedResponse({
          year,
          totalMembers: members.length,
          quarters: { q1, q2, q3, q4 },
        });
      }

      if (request.method === 'GET' && path.startsWith('/batch-compare/')) {
        const batchId = path.split('/')[2];
        const state = await this.reconstructState();
        const batches = (state.givingBatches as Record<string, Record<string, unknown>>) ?? {};
        const batch = batches[batchId!];
        if (!batch) return versionedResponse({ error: 'Not found' }, 404);

        const c1Records = (batch.counter1Records as Array<Record<string, unknown>>) ?? [];
        const c2Records = (batch.counter2Records as Array<Record<string, unknown>>) ?? [];
        const match = batch.status === 'counter2-confirmed';
        const total1 = c1Records.reduce((s: number, r) => s + (r.amount as number ?? 0), 0);
        const total2 = c2Records.reduce((s: number, r) => s + (r.amount as number ?? 0), 0);

        return versionedResponse({
          batchId,
          status: batch.status,
          counter1: { records: c1Records, total: total1 },
          counter2: { records: c2Records, total: total2 },
          totalsMatch: total1 === total2,
          match,
        });
      }

      if (request.method === 'GET' && path === '/household-suggestions') {
        const state = await this.reconstructState();
        const members = Object.values((state.members as Record<string, Record<string, unknown>>) ?? {});
        const suggestions = suggestHouseholds(members as Parameters<typeof suggestHouseholds>[0]);
        return versionedResponse(suggestions);
      }

      if (request.method === 'GET' && path === '/pending-updates') {
        const state = await this.reconstructState();
        return versionedResponse(state.pendingContactUpdates ?? []);
      }

      if (request.method === 'GET' && path === '/interests') {
        const state = await this.reconstructState();
        return versionedResponse(state.interests ?? []);
      }

      if (request.method === 'GET' && path === '/qr') {
        const state = await this.reconstructState();
        const church = state.church as Record<string, unknown> | undefined;
        return versionedResponse({
          churchId: church?.id,
          churchName: church?.name,
          welcomeMessage: `Welcome to ${church?.name ?? 'our church'}!`,
        });
      }

      if (request.method === 'GET' && path === '/events') {
        const events = await this.getEvents();
        return versionedResponse(events);
      }

      if (request.method === 'GET' && path === '/verify') {
        const result = await this.verifyHashChain();
        return versionedResponse(result);
      }

      if (request.method === 'GET' && path === '/state') {
        const state = await this.reconstructState();
        return versionedResponse(state);
      }

      if (request.method === 'GET' && path === '/smart-defaults') {
        const state = await this.reconstructState();
        const givingBatches = Object.values((state.givingBatches as Record<string, Record<string, unknown>>) ?? {});
        const givingRecords = Object.values((state.givingRecords as Record<string, Record<string, unknown>>) ?? {}) as Array<Record<string, unknown>>;

        const sortedBatches = givingBatches.sort((a, b) => ((b.date as string) ?? '').localeCompare((a.date as string) ?? ''));
        const lastBatch = sortedBatches[0];

        const recentMembers = new Map<string, number>();
        const recentCategories = new Map<string, number>();

        if (lastBatch) {
          const batchRecords = givingRecords.filter(r => r.batchId === lastBatch.id);
          for (const r of batchRecords) {
            const mid = r.memberId as string;
            if (mid) recentMembers.set(mid, (recentMembers.get(mid) ?? 0) + 1);
            const cat = r.category as string;
            if (cat) recentCategories.set(cat, (recentCategories.get(cat) ?? 0) + 1);
          }
        }

        const sortedMembers = [...recentMembers.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([id]) => {
            const members = state.members as Record<string, Record<string, unknown>> ?? {};
            const m = members[id];
            return m ? { id, firstName: m.firstName, lastName: m.lastName } : null;
          })
          .filter(Boolean);

        const sortedCategories = [...recentCategories.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([cat]) => cat);

        return versionedResponse({
          recentMembers: sortedMembers,
          recentCategories: sortedCategories,
        });
      }

      if (request.method === 'GET' && path.startsWith('/audit/')) {
        const memberId = path.slice('/audit/'.length);
        const events = await this.getEvents();
        const filtered = events.filter((event) => {
          const p = event.payload as Record<string, unknown>;
          return p?.memberId === memberId;
        });
        return versionedResponse(filtered);
      }

      if (request.method === 'POST' && path === '/mutate') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return versionedResponse({ error: 'Unauthorized' }, 401);
        }
        const seedToken = this.doEnv.SEED_TOKEN;
        const isDemoSeed = seedToken ? authHeader === `Bearer ${seedToken}` : false;
        const user = isDemoSeed
          ? { sub: 'demo-seed@theobase.dev', churchId: 'demo', role: 'operator' as const, churchName: 'Demo', tokenVersion: 1 }
          : (await verify(authHeader.slice(7))).payload;

        const body = (await request.json()) as {
          operation: ChurchOperation;
          payload: unknown;
        };
        if (!canOperate(user.role, body.operation)) {
          return versionedResponse({ error: 'Forbidden' }, 403);
        }

        if (body.operation === 'giving_batch:commit') {
          const state = await this.reconstructState();
          const batches = (state.givingBatches as Record<string, Record<string, unknown>>) ?? {};
          const p = body.payload as { batchId: string };
          const batch = batches[p.batchId];
          if (!batch) {
            return versionedResponse({ error: 'Batch not found' }, 404);
          }
          if (batch.status === 'counter2-confirmed' || batch.status === 'reconciled') {
          } else {
            return versionedResponse({ error: 'Batch not ready for commit' }, 400);
          }
        }

        if (body.operation === 'giving_record:delete' || body.operation === 'giving_record:create') {
          const state = await this.reconstructState();
          const batches = (state.givingBatches as Record<string, Record<string, unknown>>) ?? {};
          const p = body.payload as { batchId?: string };
          const batch = p.batchId ? batches[p.batchId] : undefined;
          if (batch && (batch.status === 'committed' || batch.status === 'deposited')) {
            return versionedResponse(
              { error: 'Cannot modify records in a committed or deposited batch' },
              403,
            );
          }
        }

        if (body.operation === 'member:state-change') {
          const p = body.payload as { memberId: string; prevState: string; newState: string };
          if (!isValidTransition(p.prevState as MembershipState, p.newState as MembershipState)) {
            return versionedResponse(
              { error: `Invalid transition: ${p.prevState} -> ${p.newState}` },
              400,
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
        return versionedResponse(event, 201);
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return versionedResponse(
        { error: err instanceof Error ? err.message : 'Unknown error' },
        500,
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
