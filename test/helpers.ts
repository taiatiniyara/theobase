import { Env, Member, MemberRole } from '../src/types';
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
                const member = members.find(m => m.email === params[0]);
                return member as T || null;
              }
              return null;
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
                tenants.push({
                  id: params[0],
                  name: params[1],
                });
                tables.set('tenants', tenants);
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
