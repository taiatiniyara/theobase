export interface AuditEntry {
  actor_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  prev_state: string | null;
  new_state: string;
  module: string;
  device_info: string | null;
}

export async function logAudit(env: Env, entry: AuditEntry): Promise<void> {
  try {
    await env.DB.prepare(
      `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, prev_state, new_state, module, device_info)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        entry.actor_id,
        entry.action,
        entry.entity_type,
        entry.entity_id,
        entry.prev_state ?? null,
        entry.new_state,
        entry.module,
        entry.device_info ?? null
      )
      .run();
  } catch {
    // Audit logging should never break the primary operation
  }
}

export function getDeviceInfo(request: Request): string | null {
  const ua = request.headers.get("User-Agent");
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For");
  if (ua && ip) return `${ua} | ${ip}`;
  return ua || ip || null;
}
