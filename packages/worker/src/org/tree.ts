import { drizzle } from 'drizzle-orm/d1';
import { orgUnit } from '@theobase/shared';
import type { Env } from '../env';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export interface OrgTreeNode {
  id: string;
  name: string;
  kind: string;
}

export interface OrgTreeConference extends OrgTreeNode {
  children: OrgTreeNode[];
}

export interface OrgTreeUnion extends OrgTreeNode {
  conferences: OrgTreeConference[];
}

export interface OrgTreeDivision extends OrgTreeNode {
  unions: OrgTreeUnion[];
}

export interface OrgTreeResponse {
  divisions: OrgTreeDivision[];
}

// ADR-0018: the public registration form walks the tree Division → Union →
// Conference/Mission. Churches sit at level 'church' below a conference, so
// the picker only needs the upper spine. Nested response, one query.
export async function handleOrgTree(_request: Request, env: Env): Promise<Response> {
  if (!env.DB) return json({ error: 'DB binding not configured' }, 500);

  const db = drizzle(env.DB);
  const units = await db
    .select({
      id: orgUnit.id,
      parentId: orgUnit.parentId,
      name: orgUnit.name,
      level: orgUnit.level,
      kind: orgUnit.kind,
    })
    .from(orgUnit)
    .all();

  const byParent = new Map<string | null, typeof units>();
  for (const unit of units) {
    const key = unit.parentId ?? null;
    const siblings = byParent.get(key) ?? [];
    siblings.push(unit);
    byParent.set(key, siblings);
  }

  const toNode = (unit: (typeof units)[number]): OrgTreeNode => ({
    id: unit.id,
    name: unit.name,
    kind: unit.kind,
  });

  const divisions: OrgTreeDivision[] = units
    .filter((u) => u.level === 'division')
    .map((division) => {
      const unionUnits = (byParent.get(division.id) ?? []).filter((u) => u.level === 'union');
      const unions: OrgTreeUnion[] = unionUnits.map((union) => {
        const conferenceUnits = (byParent.get(union.id) ?? []).filter(
          (u) => u.level === 'conference',
        );
        const conferences: OrgTreeConference[] = conferenceUnits.map((conference) => ({
          ...toNode(conference),
          children: (byParent.get(conference.id) ?? []).map(toNode),
        }));
        return { ...toNode(union), conferences };
      });
      return { ...toNode(division), unions };
    });

  return json({ divisions });
}