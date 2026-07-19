import { Hono } from 'hono';
import type { Env, AuthPayload } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';

type Variables = { auth: AuthPayload; tenantId: string };

export const reportRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

reportRoutes.use('*', authMiddleware);
reportRoutes.use('*', tenantMiddleware);

async function requireMissionLevel(c: any, next: any) {
  const auth = c.get('auth');
  const userOrg = await c.env.DB.prepare(
    'SELECT type FROM organizations WHERE id = ? AND tenant_id = ?'
  )
    .bind(auth.organizationId, auth.tenantId)
    .first<{ type: string }>();

  if (!userOrg) {
    return c.json({ error: 'Organization not found' }, 404);
  }

  const allowedLevels = ['mission', 'conference', 'union', 'general_conference'];
  if (!allowedLevels.includes(userOrg.type)) {
    return c.json({ error: 'Access denied: Mission-level or higher required' }, 403);
  }

  await next();
}

reportRoutes.use('*', requireMissionLevel);

// Monthly remittance report: totals by church and fund type
reportRoutes.get('/remittance', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const now = new Date();
  const year = c.req.query('year') || String(now.getFullYear());
  const month = c.req.query('month') || String(now.getMonth() + 1).padStart(2, '0');
  const format = c.req.query('format') || 'json';
  const monthStart = `${year}-${month}-01`;
  const nextMonth = parseInt(month) === 12 ? `1` : String(parseInt(month) + 1).padStart(2, '0');
  const nextYear = parseInt(month) === 12 ? String(parseInt(year) + 1) : year;
  const monthEnd = `${nextYear}-${nextMonth}-01`;

  const userOrg = await c.env.DB.prepare(
    'SELECT type, id, name FROM organizations WHERE id = ? AND tenant_id = ?'
  )
    .bind(auth.organizationId, tenantId)
    .first<{ type: string; id: string; name: string }>();

  if (!userOrg) {
    return c.json({ error: 'Organization not found' }, 404);
  }

  let churches;
  if (userOrg.type === 'mission') {
    churches = await c.env.DB.prepare(
      `SELECT id, name FROM organizations WHERE tenant_id = ? AND type = 'local_church' AND parent_id = ?`
    )
      .bind(tenantId, userOrg.id)
      .all<{ id: string; name: string }>();
  } else {
    churches = await c.env.DB.prepare(
      `SELECT id, name FROM organizations WHERE tenant_id = ? AND type = 'local_church'`
    )
      .bind(tenantId)
      .all<{ id: string; name: string }>();
  }

  const rows = await Promise.all(
    churches.results.map(async (church) => {
      const titheResult = await c.env.DB.prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE tenant_id = ? AND organization_id = ? AND fund_type = 'tithe'
         AND transaction_date >= ? AND transaction_date < ?`
      )
        .bind(tenantId, church.id, monthStart, monthEnd)
        .first<{ total: number }>();

      const offeringResult = await c.env.DB.prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE tenant_id = ? AND organization_id = ? AND fund_type = 'offering'
         AND transaction_date >= ? AND transaction_date < ?`
      )
        .bind(tenantId, church.id, monthStart, monthEnd)
        .first<{ total: number }>();

      return {
        church_id: church.id,
        church_name: church.name,
        tithe: titheResult?.total || 0,
        offering: offeringResult?.total || 0,
        total: (titheResult?.total || 0) + (offeringResult?.total || 0),
      };
    })
  );

  const report = {
    generated_at: new Date().toISOString(),
    mission: userOrg.name,
    month: `${year}-${month}`,
    rows,
    totals: rows.reduce(
      (acc, r) => ({
        tithe: acc.tithe + r.tithe,
        offering: acc.offering + r.offering,
        total: acc.total + r.total,
      }),
      { tithe: 0, offering: 0, total: 0 }
    ),
  };

  if (format === 'csv') {
    const header = 'Church Name,Tithe,Offering,Total\n';
    const body = rows
      .map((r) => `${r.church_name},${r.tithe},${r.offering},${r.total}`)
      .join('\n');
    const footer = `Total,${report.totals.tithe},${report.totals.offering},${report.totals.total}`;
    const csv = `\uFEFF${header}${body}\n${footer}\n`;

    return c.newResponse(csv, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="remittance-${year}-${month}.csv"`,
    });
  }

  if (format === 'xlsx') {
    const xml = buildXlsxXml(rows, report.totals, report.mission, report.month);
    return c.newResponse(xml, 200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="remittance-${year}-${month}.xlsx"`,
    });
  }

  return c.json(report);
});

function buildXlsxXml(
  rows: { church_name: string; tithe: number; offering: number; total: number }[],
  totals: { tithe: number; offering: number; total: number },
  mission: string,
  month: string
): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const rowsXml = rows
    .map(
      (r) =>
        `    <Row>\n      <Cell><Data ss:Type="String">${esc(r.church_name)}</Data></Cell>\n      <Cell><Data ss:Type="Number">${r.tithe}</Data></Cell>\n      <Cell><Data ss:Type="Number">${r.offering}</Data></Cell>\n      <Cell><Data ss:Type="Number">${r.total}</Data></Cell>\n    </Row>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Remittance Report - ${esc(mission)} - ${esc(month)}</Title>
 </DocumentProperties>
 <Worksheet ss:Name="Remittance">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Church Name</Data></Cell>
    <Cell><Data ss:Type="String">Tithe</Data></Cell>
    <Cell><Data ss:Type="String">Offering</Data></Cell>
    <Cell><Data ss:Type="String">Total</Data></Cell>
   </Row>
${rowsXml}
   <Row>
    <Cell><Data ss:Type="String">Total</Data></Cell>
    <Cell><Data ss:Type="Number">${totals.tithe}</Data></Cell>
    <Cell><Data ss:Type="Number">${totals.offering}</Data></Cell>
    <Cell><Data ss:Type="Number">${totals.total}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;
}
