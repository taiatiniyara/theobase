import { Env, Member, MemberRole, Organization, OrganizationType, OfferingPlan } from '../src/types';
import { hashPassword } from '../src/lib/crypto';

export function createMockEnv(): Env {
  const tables = new Map<string, any[]>();
  
  return {
    DB: {
      prepare: (query: string) => {
        return {
          bind: (...params: any[]) => ({
            first: async <T = any>(): Promise<T | null> => {
              // Handle COUNT(*) queries (must come before other FROM handlers)
              if (query.includes('COUNT(*)')) {
                const match = query.match(/FROM\s+(\w+)/);
                const tableName = match ? match[1] : '';
                const rows = tables.get(tableName) || [];
                let filtered = [...rows];
                const whereClause = query.split('WHERE')[1]?.split('ORDER BY')[0]?.split('GROUP BY')[0]?.trim();
                if (whereClause && params.length > 0) {
                  let paramIndex = 0;
                  const conditions = whereClause.split('AND').map((c: string) => c.trim());
                  for (const cond of conditions) {
                    if (cond.includes('tenant_id = ?')) {
                      filtered = filtered.filter((r: any) => r.tenant_id === params[paramIndex]);
                      paramIndex++;
                    } else if (cond.includes('organization_id = ?')) {
                      filtered = filtered.filter((r: any) => r.organization_id === params[paramIndex]);
                      paramIndex++;
                    } else if (cond.includes('user_id = ?') && query.includes('DISTINCT')) {
                      filtered = filtered.filter((r: any) => r.user_id === params[paramIndex]);
                      paramIndex++;
                    } else if (cond.includes('action = ?')) {
                      filtered = filtered.filter((r: any) => r.action === params[paramIndex]);
                      paramIndex++;
                    } else if (cond.includes("type = 'local_church'")) {
                      filtered = filtered.filter((r: any) => r.type === 'local_church');
                    } else if (cond.includes('parent_id = ?')) {
                      filtered = filtered.filter((r: any) => r.parent_id === params[paramIndex]);
                      paramIndex++;
                    }
                  }
                }
                if (query.includes('DISTINCT')) {
                  return { count: new Set(filtered.map((r: any) => r.user_id)).size } as T;
                }
                return { count: filtered.length } as T;
              }
              if (query.includes('SELECT') && query.includes('FROM expenses')) {
                const expenses = tables.get('expenses') || [];
                const expense = expenses.find(e => e.id === params[0]);
                return (expense as T) || null;
              }
              if (query.includes('SELECT') && query.includes('FROM member_transfers')) {
                const transfers = tables.get('member_transfers') || [];
                const transfer = transfers.find(t => t.id === params[0]);
                return (transfer as T) || null;
              }
              if (query.includes('SELECT') && query.includes('FROM households')) {
                const households = tables.get('households') || [];
                const household = households.find(h => h.id === params[0]);
                return (household as T) || null;
              }
              if (query.includes('SELECT') && query.includes('FROM organizations')) {
                const orgs = tables.get('organizations') || [];
                const org = orgs.find(o => {
                  if (params.length >= 2) {
                    return o.id === params[0] && o.tenant_id === params[1];
                  }
                  return o.id === params[0];
                });
                return (org as T) || null;
              }
              // Handle aggregate queries (SUM, COALESCE) for transactions
              if ((query.includes('COALESCE(SUM') || query.includes('SUM(')) && query.includes('FROM transactions')) {
                const transactions = tables.get('transactions') || [];
                let filtered = [...transactions];
                const parts = query.split('WHERE')[1]?.split('ORDER BY')[0]?.trim() || '';
                let paramIndex = 0;
                const conditions = parts.split('AND').map(c => c.trim());
                for (const cond of conditions) {
                  if (cond.includes('tenant_id = ?')) {
                    filtered = filtered.filter((t: any) => t.tenant_id === params[paramIndex]);
                    paramIndex++;
                  } else if (cond.includes('organization_id = ?')) {
                    filtered = filtered.filter((t: any) => t.organization_id === params[paramIndex]);
                    paramIndex++;
                  } else if (cond.includes("fund_type = 'tithe'")) {
                    filtered = filtered.filter((t: any) => t.fund_type === 'tithe');
                  } else if (cond.includes("fund_type = 'offering'")) {
                    filtered = filtered.filter((t: any) => t.fund_type === 'offering');
                  } else if (cond.includes("fund_type = 'restricted'")) {
                    filtered = filtered.filter((t: any) => t.fund_type === 'restricted');
                  } else if (cond.includes('transaction_date >= ?')) {
                    const startDate = params[paramIndex];
                    filtered = filtered.filter((t: any) => t.transaction_date >= startDate);
                    paramIndex++;
                  } else if (cond.includes('transaction_date < ?')) {
                    const endDate = params[paramIndex];
                    filtered = filtered.filter((t: any) => t.transaction_date < endDate);
                    paramIndex++;
                  } else if (cond.includes('transaction_date = ?')) {
                    filtered = filtered.filter((t: any) => t.transaction_date === params[paramIndex]);
                    paramIndex++;
                  }
                }
                const sum = filtered.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
                return { total: sum } as T;
              }
              // Handle ORDER BY ... LIMIT 1 for transactions 
              if (query.includes('FROM transactions') && query.includes('ORDER BY') && query.includes('LIMIT 1')) {
                const transactions = tables.get('transactions') || [];
                let filtered = [...transactions];
                const whereClause = query.split('ORDER BY')[0];
                const parts = whereClause.split('WHERE')[1]?.trim() || '';
                let paramIndex = 0;
                const conditions = parts.split('AND').map(c => c.trim());
                for (const cond of conditions) {
                  if (cond.includes('tenant_id = ?')) {
                    filtered = filtered.filter((t: any) => t.tenant_id === params[paramIndex]);
                    paramIndex++;
                  } else if (cond.includes('organization_id = ?')) {
                    filtered = filtered.filter((t: any) => t.organization_id === params[paramIndex]);
                    paramIndex++;
                  }
                }
                if (filtered.length > 0) {
                  filtered.sort((a: any, b: any) => {
                    if (query.includes('DESC')) return b.transaction_date?.localeCompare(a.transaction_date);
                    return a.transaction_date?.localeCompare(b.transaction_date);
                  });
                  return filtered[0] as T;
                }
              }
              if (query.includes('SELECT') && query.includes('FROM transactions')) {
                const transactions = tables.get('transactions') || [];
                const transaction = transactions.find(t => t.id === params[0]);
                return (transaction as T) || null;
              }
              if (query.includes('SELECT') && query.includes('FROM members')) {
                const members = tables.get('members') || [];
                const member = members.find(m => {
                  const matches = m.email === params[0] || m.id === params[0];
                  if (params.length >= 2) {
                    return matches && m.tenant_id === params[1];
                  }
                  return matches;
                });
                return (member as T) || null;
              }
              if (query.includes('SELECT') && query.includes('FROM offering_plans')) {
                const plans = tables.get('offering_plans') || [];
                const plan = plans.find(p => p.tenant_id === params[0]);
                return (plan as T) || null;
              }
              if (query.includes('SELECT') && query.includes('FROM remittances')) {
                const remittances = tables.get('remittances') || [];
                const remittance = remittances.find(r => r.id === params[0]);
                return (remittance as T) || null;
              }
              if (query.includes('SELECT') && query.includes('FROM balances')) {
                const balances = tables.get('balances') || [];
                const balance = balances.find(b => 
                  b.organization_id === params[0] && 
                  b.fund_type === params[1] &&
                  b.tenant_id === params[2]
                );
                return (balance as T) || null;
              }
              return null;
            },
            all: async <T = any>(): Promise<{ results: T[] }> => {
              // Handle org+member JOIN queries (for reminders)
              if (query.includes('FROM organizations') && query.includes('JOIN members')) {
                const orgs = tables.get('organizations') || [];
                const members = tables.get('members') || [];
                let results = orgs.map(o => {
                  const member = members.find(m => m.organization_id === o.id && m.tenant_id === o.tenant_id);
                  return member ? { id: o.id, name: o.name, tenant_id: o.tenant_id, email: member.email, member_id: member.id } : null;
                }).filter(Boolean);

                if (query.includes("o.type = 'local_church'")) {
                  results = results.filter((r: any) => {
                    const org = orgs.find(o => o.id === r.id);
                    return org && org.type === 'local_church';
                  });
                }
                if (query.includes("m.role = 'treasurer'")) {
                  results = results.filter((r: any) => {
                    const member = members.find(m => m.id === r.member_id);
                    return member && member.role === 'treasurer';
                  });
                }
                if (query.includes('o.tenant_id = ?')) {
                  results = results.filter((r: any) => r.tenant_id === params[0]);
                }
                return { results: results as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM transactions')) {
                const transactions = tables.get('transactions') || [];
                return { results: transactions as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM expenses')) {
                const expenses = tables.get('expenses') || [];
                return { results: expenses as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM expense_categories')) {
                const categories = tables.get('expense_categories') || [];
                return { results: categories as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM member_transfers')) {
                const transfers = tables.get('member_transfers') || [];
                let filtered = transfers as any[];
                if (query.includes('WHERE') && params.length > 0) {
                  if (query.includes('sending_org_id') && query.includes('receiving_org_id')) {
                    filtered = filtered.filter(t => t.tenant_id === params[0] && (t.sending_org_id === params[1] || t.receiving_org_id === params[2]));
                  } else if (query.includes('tenant_id')) {
                    filtered = filtered.filter(t => t.tenant_id === params[0]);
                  }
                }
                return { results: filtered as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM households')) {
                const households = tables.get('households') || [];
                let filtered = households as any[];
                if (query.includes('WHERE') && params.length > 0) {
                  filtered = filtered.filter(h => h.tenant_id === params[0] && h.organization_id === params[1]);
                }
                return { results: filtered as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM fund_allocations')) {
                const allocations = tables.get('fund_allocations') || [];
                let filtered = [...allocations];
                if (query.includes('WHERE') && params.length > 0) {
                  let paramIndex = 0;
                  const whereClause = query.split('WHERE')[1]?.split('ORDER BY')[0]?.trim() || '';
                  const conditions = whereClause.split('AND').map(c => c.trim());
                  for (const cond of conditions) {
                    if (cond.includes('fa.transaction_id = ?') || cond.includes('transaction_id = ?')) {
                      filtered = filtered.filter((a: any) => a.transaction_id === params[paramIndex]);
                      paramIndex++;
                    } else if (cond.includes('t.tenant_id = ?') || cond.includes('tenant_id = ?')) {
                      filtered = filtered.filter((a: any) => {
                        const txns = tables.get('transactions') || [];
                        const txn = txns.find((t: any) => t.id === a.transaction_id);
                        return txn && txn.tenant_id === params[paramIndex];
                      });
                      paramIndex++;
                    }
                  }
                }
                return { results: filtered as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM balances')) {
                const balances = tables.get('balances') || [];
                return { results: balances as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM remittances')) {
                const remittances = tables.get('remittances') || [];
                return { results: remittances as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM members')) {
                const members = tables.get('members') || [];
                let filtered = members as any[];
                if (query.includes('WHERE') && params.length > 0) {
                  if (query.includes('tenant_id') && query.includes('organization_id')) {
                    filtered = filtered.filter(m => m.tenant_id === params[0] && m.organization_id === params[1]);
                  } else if (query.includes('tenant_id')) {
                    filtered = filtered.filter(m => m.tenant_id === params[0]);
                  }
                }
                return { results: filtered as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM audit_log')) {
                const logs = tables.get('audit_log') || [];
                return { results: logs as T[] };
              }
              if (query.includes('SELECT') && query.includes('FROM organizations')) {
                const orgs = tables.get('organizations') || [];
                let filtered = orgs as any[];
                // Handle simple WHERE filters
                if (query.includes('WHERE') && params.length > 0) {
                  filtered = filtered.filter(o => o.tenant_id === params[0]);
                }
                if (query.includes("type = 'local_church'")) {
                  filtered = filtered.filter(o => o.type === 'local_church');
                }
                if (query.includes('parent_id = ?') && params.length > 1) {
                  filtered = filtered.filter(o => o.parent_id === params[1]);
                }
                return { results: filtered as T[] };
              }
              return { results: [] };
            },
            run: async () => {
              if (query.includes('INSERT INTO members')) {
                const members = tables.get('members') || [];
                if (query.includes('first_name') && query.includes('last_name')) {
                  members.push({
                    id: params[0],
                    tenant_id: params[1],
                    organization_id: params[2],
                    first_name: params[3],
                    last_name: params[4],
                    date_of_birth: params[5] || null,
                    gender: params[6] || null,
                    phone: params[7] || null,
                    address: params[8] || null,
                    email: params[9] || null,
                    membership_status: 'active',
                    baptism_date: params[11] || null,
                    profession_of_faith_date: params[12] || null,
                    original_join_date: params[13] || null,
                    password_hash: null,
                    role: null,
                    email_verified: false,
                    verification_token: null,
                    reset_token: null,
                    reset_token_expires: null,
                    guardian_id: null,
                    household_id: null,
                    created_at: params[14],
                    updated_at: params[15],
                  });
                } else {
                  members.push({
                    id: params[0],
                    tenant_id: params[1],
                    email: params[2],
                    password_hash: params[3],
                    role: params[4],
                    organization_id: params[5],
                    email_verified: true,
                    first_name: '',
                    last_name: '',
                    membership_status: 'active',
                    date_of_birth: null,
                    gender: null,
                    phone: null,
                    address: null,
                    baptism_date: null,
                    profession_of_faith_date: null,
                    original_join_date: null,
                    verification_token: null,
                    reset_token: null,
                    reset_token_expires: null,
                    guardian_id: null,
                    household_id: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                }
                tables.set('members', members);
              }
              if (query.includes('INSERT INTO tenants')) {
                const tenants = tables.get('tenants') || [];
                const exists = tenants.find(t => t.id === params[0]);
                if (!exists) {
                  tenants.push({
                    id: params[0],
                    name: params[1],
                  });
                  tables.set('tenants', tenants);
                }
              }
              if (query.includes('INSERT INTO organizations')) {
                const orgs = tables.get('organizations') || [];
                orgs.push({
                  id: params[0],
                  tenant_id: params[1],
                  name: params[2],
                  type: params[3],
                  parent_id: params[4] || null,
                });
                tables.set('organizations', orgs);
              }
              if (query.includes('INSERT INTO transactions')) {
                const transactions = tables.get('transactions') || [];
                transactions.push({
                  id: params[0],
                  tenant_id: params[1],
                  organization_id: params[2],
                  member_id: params[3] || null,
                  fund_type: params[4],
                  amount: params[5],
                  transaction_date: params[6],
                  notes: params[7] || null,
                  created_at: params[8],
                  updated_at: params[9],
                });
                tables.set('transactions', transactions);
              }
              if (query.includes('INSERT INTO offering_plans')) {
                const plans = tables.get('offering_plans') || [];
                plans.push({
                  id: params[0],
                  tenant_id: params[1],
                  name: params[2],
                  local_percent: params[3],
                  conference_percent: params[4],
                  union_percent: params[5],
                  gc_percent: params[6],
                });
                tables.set('offering_plans', plans);
              }
              if (query.includes('INSERT INTO fund_allocations')) {
                const allocations = tables.get('fund_allocations') || [];
                allocations.push({
                  id: params[0],
                  transaction_id: params[1],
                  fund_type: params[2],
                  amount: params[3],
                  destination_org_id: params[4],
                  created_at: params[5],
                });
                tables.set('fund_allocations', allocations);
              }
              if (query.includes('INSERT INTO balances')) {
                const balances = tables.get('balances') || [];
                balances.push({
                  id: params[0],
                  tenant_id: params[1],
                  organization_id: params[2],
                  fund_type: params[3],
                  amount: params[4],
                  updated_at: params[5],
                });
                tables.set('balances', balances);
              }
              if (query.includes('INSERT INTO remittances')) {
                const remittances = tables.get('remittances') || [];
                remittances.push({
                  id: params[0],
                  tenant_id: params[1],
                  source_org_id: params[2],
                  destination_org_id: params[3],
                  fund_type: params[4],
                  amount: params[5],
                  user_id: params[6],
                  remittance_date: params[7],
                  notes: params[8] || null,
                  created_at: params[9],
                });
                tables.set('remittances', remittances);
              }
              if (query.includes('INSERT INTO audit_log')) {
                const logs = tables.get('audit_log') || [];
                logs.push({
                  id: params[0],
                  tenant_id: params[1],
                  entity_type: params[2],
                  entity_id: params[3],
                  action: params[4],
                  user_id: params[5],
                  before_values: params[6] || null,
                  after_values: params[7] || null,
                  created_at: params[8],
                });
                tables.set('audit_log', logs);
              }
              if (query.includes('UPDATE balances')) {
                const balances = tables.get('balances') || [];
                const balance = balances.find(b => b.id === params[1]);
                if (balance) {
                  balance.amount = params[0];
                  balance.updated_at = params[2];
                }
              }
              if (query.includes('UPDATE members')) {
                const members = tables.get('members') || [];
                if (query.includes('email_verified')) {
                  const member = members.find(m => m.id === params[3]);
                  if (member) { member.email_verified = params[0]; member.verification_token = params[1]; }
                } else if (query.includes('reset_token') && !query.includes('password_hash')) {
                  const member = members.find(m => m.id === params[3]);
                  if (member) { member.reset_token = params[0]; member.reset_token_expires = params[1]; }
                } else if (query.includes('password_hash')) {
                  const member = members.find(m => m.id === params[3]);
                  if (member) { member.password_hash = params[0]; member.reset_token = params[1]; member.reset_token_expires = params[2]; }
                } else if (query.includes('membership_status')) {
                  const member = members.find(m => m.id === params[2]);
                  if (member) { member.membership_status = params[0]; }
                } else {
                  const setClause = query.split('SET')[1]?.split('WHERE')[0] || '';
                  const fieldPairs = setClause.split(',').map(s => s.trim());
                  const member = members.find(m => m.id === params[params.length - 2] && m.tenant_id === params[params.length - 1]);
                  if (member) {
                    for (let i = 0; i < fieldPairs.length - 1; i++) {
                      const fieldName = fieldPairs[i].split('=')[0].trim();
                      if (fieldName !== 'updated_at') {
                        member[fieldName] = params[i];
                      }
                    }
                  }
                }
              }
              if (query.includes('INSERT INTO tenant_signups')) {
                const signups = tables.get('tenant_signups') || [];
                signups.push({
                  id: params[0],
                  church_name: params[1],
                  church_type: params[2],
                  parent_mission_id: params[3],
                  clerk_name: params[4],
                  clerk_email: params[5],
                  status: 'pending',
                  decline_reason: null,
                  created_at: params[7],
                  updated_at: params[8],
                });
                tables.set('tenant_signups', signups);
              }
              if (query.includes('UPDATE tenant_signups')) {
                const signups = tables.get('tenant_signups') || [];
                if (query.includes("status = 'approved'")) {
                  const su = signups.find(s => s.id === params[1]);
                  if (su) su.status = 'approved';
                } else if (query.includes("status = 'declined'")) {
                  const su = signups.find(s => s.id === params[2]);
                  if (su) { su.status = 'declined'; su.decline_reason = params[0] || null; }
                }
              }
              if (query.includes('INSERT INTO expenses')) {
                const expenses = tables.get('expenses') || [];
                expenses.push({
                  id: params[0],
                  tenant_id: params[1],
                  organization_id: params[2],
                  category_id: params[3] || null,
                  amount: params[4],
                  payee: params[5],
                  expense_date: params[6],
                  notes: params[7] || null,
                  created_by: params[8] || null,
                  created_at: params[9],
                  updated_at: params[10],
                });
                tables.set('expenses', expenses);
              }
              if (query.includes('INSERT INTO households')) {
                const households = tables.get('households') || [];
                households.push({
                  id: params[0],
                  tenant_id: params[1],
                  organization_id: params[2],
                  name: params[3],
                  head_of_household_id: params[4] || null,
                  created_at: params[5],
                  updated_at: params[6],
                });
                tables.set('households', households);
              }
              if (query.includes('INSERT INTO member_transfers')) {
                const transfers = tables.get('member_transfers') || [];
                transfers.push({
                  id: params[0],
                  tenant_id: params[1],
                  member_id: params[2],
                  sending_org_id: params[3],
                  receiving_org_id: params[4],
                  status: params[5],
                  initiated_by: params[6],
                  created_at: params[7],
                  updated_at: params[8],
                  sending_board_vote_date: null,
                  receiving_board_vote_date: null,
                  rejection_reason: null,
                });
                tables.set('member_transfers', transfers);
              }
              if (query.includes('UPDATE member_transfers')) {
                const transfers = tables.get('member_transfers') || [];
                const transfer = transfers.find(t => t.id === params[3]);
                if (transfer) {
                  if (query.includes('pending_receiving_approval')) {
                    transfer.status = 'pending_receiving_approval';
                  } else if (query.includes("status = 'accepted'")) {
                    transfer.status = 'accepted';
                    transfer.receiving_board_vote_date = params[1];
                  } else if (query.includes("status = 'rejected'")) {
                    transfer.status = 'rejected';
                    transfer.rejection_reason = params[0] || null;
                  }
                }
              }
              return { success: true };
            },
          }),
          run: async () => ({ success: true }),
        };
      },
      exec: async (query: string) => ({ success: true }),
      dump: async () => new ArrayBuffer(0),
      batch: async (statements: any[]) => {
        // Execute each statement in the batch sequentially
        const results = [];
        for (const stmt of statements) {
          if (stmt && typeof stmt.run === 'function') {
            const result = await stmt.run();
            results.push(result);
          }
        }
        return results;
      },
    } as any,
    JWT_SECRET: 'test-secret',
    EMAIL_FROM_NAME: 'Test Theobase',
    EMAIL_FROM_ADDRESS: 'noreply@test.theobase.org',
    EMAIL: {
      sentEmails: [] as Array<{ to: string; subject: string }>,
      async send(payload: any) {
        (this as any).sentEmails.push({ to: Array.isArray(payload.to) ? payload.to[0] : payload.to, subject: payload.subject });
        return { messageId: 'mock-msg-' + Date.now() };
      },
    } as any,
  };
}

export async function seedTestMember(
  env: Env,
  data: {
    tenantId: string;
    memberId: string;
    email: string;
    password: string;
    role: MemberRole;
    organizationId: string;
  }
) {
  await env.DB.prepare('INSERT INTO tenants (id, name) VALUES (?, ?)')
    .bind(data.tenantId, 'Test Tenant')
    .run();

  const passwordHash = await hashPassword(data.password);

  await env.DB.prepare(
    'INSERT INTO members (id, tenant_id, email, password_hash, role, organization_id) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(data.memberId, data.tenantId, data.email, passwordHash, data.role, data.organizationId)
    .run();
}

export async function seedTestOrganization(
  env: Env,
  data: {
    tenantId: string;
    organizationId: string;
    name: string;
    type: OrganizationType;
    parentId?: string;
  }
) {
  await env.DB.prepare('INSERT INTO tenants (id, name) VALUES (?, ?)')
    .bind(data.tenantId, 'Test Tenant')
    .run();

  await env.DB.prepare(
    'INSERT INTO organizations (id, tenant_id, name, type, parent_id) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(data.organizationId, data.tenantId, data.name, data.type, data.parentId || null)
    .run();
}

export async function seedTestOfferingPlan(
  env: Env,
  data: {
    tenantId: string;
    offeringPlanId: string;
    name: string;
    localPercent: number;
    conferencePercent: number;
    unionPercent: number;
    gcPercent: number;
  }
) {
  await env.DB.prepare('INSERT INTO tenants (id, name) VALUES (?, ?)')
    .bind(data.tenantId, 'Test Tenant')
    .run();

  await env.DB.prepare(
    'INSERT INTO offering_plans (id, tenant_id, name, local_percent, conference_percent, union_percent, gc_percent) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(
      data.offeringPlanId,
      data.tenantId,
      data.name,
      data.localPercent,
      data.conferencePercent,
      data.unionPercent,
      data.gcPercent
    )
    .run();
}
