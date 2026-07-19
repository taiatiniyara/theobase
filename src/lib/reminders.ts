import type { Env } from '../types';
import { buildReminderEmail, sendEmail } from './email';

export interface ReminderResult {
  totalChurches: number;
  remindersSent: number;
  skippedSubmitted: number;
  errors: { church: string; error: string }[];
}

export async function sendMonthlyReminders(
  db: D1Database,
  emailBind: Env['EMAIL'],
  env: Env,
  tenantId?: string
): Promise<ReminderResult> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthStart = `${year}-${month}-01`;
  const nextMonth = parseInt(month) === 12 ? '1' : String(parseInt(month) + 1).padStart(2, '0');
  const nextYear = parseInt(month) === 12 ? String(year + 1) : String(year);
  const monthEnd = `${nextYear}-${nextMonth}-01`;

  // Find all local churches with treasurers
  let query = `SELECT o.id, o.name, o.tenant_id, m.email, m.id as member_id
     FROM organizations o
     JOIN members m ON m.organization_id = o.id AND m.tenant_id = o.tenant_id
     WHERE o.type = 'local_church'
       AND m.role = 'treasurer'`;
  const params: string[] = [];

  if (tenantId) {
    query += ' AND o.tenant_id = ?';
    params.push(tenantId);
  }

  const churches = await db.prepare(query)
    .bind(...params)
    .all<{ id: string; name: string; tenant_id: string; email: string; member_id: string }>();

  const result: ReminderResult = {
    totalChurches: churches.results.length,
    remindersSent: 0,
    skippedSubmitted: 0,
    errors: [],
  };

  const fromName = env.EMAIL_FROM_NAME || 'Theobase Reminders';
  const fromAddress = env.EMAIL_FROM_ADDRESS || 'noreply@theobase.org';

  for (const church of churches.results) {
    // Check if this church has any transactions this month
    const hasSubmitted = await db.prepare(
      `SELECT COUNT(*) as count FROM transactions
       WHERE organization_id = ? AND tenant_id = ?
       AND transaction_date >= ? AND transaction_date < ?`
    )
      .bind(church.id, church.tenant_id, monthStart, monthEnd)
      .first<{ count: number }>();

    if (hasSubmitted && hasSubmitted.count > 0) {
      result.skippedSubmitted++;
      continue;
    }

    const { html, text, subject } = buildReminderEmail(church.name, monthLabel);

    try {
      await sendEmail(emailBind, church.email, fromName, fromAddress, subject, html, text);
      result.remindersSent++;
    } catch (err) {
      result.errors.push({ church: church.name, error: (err as Error).message });
    }
  }

  return result;
}
