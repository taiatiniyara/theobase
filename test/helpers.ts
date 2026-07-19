import { Env, Member, MemberRole, Organization, OrganizationType } from '../src/types';
import { hashPassword } from '../src/lib/crypto';

export function createMockEnv(): Env {
  const tables = new Map<string, any[]>();
  
  return {
    DB: {
      prepare: (query: string) => {
        return {
          bind: (...params: any[]) => ({
            first: async <T = any>(): Promise<T | null> => {
              if (query.includes('SELECT') && query.includes('FROM members')) {
                const members = tables.get('members') || [];
                const member = members.find(m => m.email === params[0] || m.id === params[0]);
                return (member as T) || null;
              }
              if (query.includes('SELECT') && query.includes('FROM organizations')) {
                const orgs = tables.get('organizations') || [];
                const org = orgs.find(o => o.id === params[0]);
                return (org as T) || null;
              }
              if (query.includes('SELECT') && query.includes('FROM transactions')) {
                const transactions = tables.get('transactions') || [];
                const transaction = transactions.find(t => t.id === params[0]);
                return (transaction as T) || null;
              }
              return null;
            },
            all: async <T = any>(): Promise<{ results: T[] }> => {
              if (query.includes('SELECT') && query.includes('FROM transactions')) {
                const transactions = tables.get('transactions') || [];
                return { results: transactions as T[] };
              }
              return { results: [] };
            },
            run: async () => {
              if (query.includes('INSERT INTO members')) {
                const members = tables.get('members') || [];
                members.push({
                  id: params[0],
                  tenant_id: params[1],
                  email: params[2],
                  password_hash: params[3],
                  role: params[4],
                  organization_id: params[5],
                });
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
              return { success: true };
            },
          }),
          run: async () => ({ success: true }),
        };
      },
      exec: async (query: string) => ({ success: true }),
      dump: async () => new ArrayBuffer(0),
      batch: async () => [],
    } as any,
    JWT_SECRET: 'test-secret',
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
  // Ensure tenant exists
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
  // Ensure tenant exists
  await env.DB.prepare('INSERT INTO tenants (id, name) VALUES (?, ?)')
    .bind(data.tenantId, 'Test Tenant')
    .run();

  await env.DB.prepare(
    'INSERT INTO organizations (id, tenant_id, name, type, parent_id) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(data.organizationId, data.tenantId, data.name, data.type, data.parentId || null)
    .run();
}
