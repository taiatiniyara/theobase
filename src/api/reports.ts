import { Hono, Context, Next } from 'hono';
import type { Env, AuthPayload } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';

type Variables = { auth: AuthPayload; tenantId: string };

export const reportRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

reportRoutes.use('*', authMiddleware);
reportRoutes.use('*', tenantMiddleware);

reportRoutes.get('/receipts/:memberId', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const memberId = c.req.param('memberId');
  const year = c.req.query('year') || String(new Date().getFullYear());

  const member = await c.env.DB.prepare(
    'SELECT id, first_name, last_name, organization_id FROM members WHERE id = ? AND tenant_id = ?'
  )
    .bind(memberId, tenantId)
    .first<{ id: string; first_name: string; last_name: string; organization_id: string }>();

  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }

  const org = await c.env.DB.prepare(
    'SELECT name FROM organizations WHERE id = ? AND tenant_id = ?'
  )
    .bind(member.organization_id, tenantId)
    .first<{ name: string }>();

  const transactions = await c.env.DB.prepare(
    `SELECT fund_type, amount, transaction_date, offering_sub_category
     FROM transactions
     WHERE tenant_id = ? AND member_id = ?
     AND transaction_date >= ? AND transaction_date < ?
     ORDER BY transaction_date DESC`
  )
    .bind(tenantId, memberId, `${year}-01-01`, `${parseInt(year) + 1}-01-01`)
    .all<{ fund_type: string; amount: number; transaction_date: string; offering_sub_category: string | null }>();

  const totals: Record<string, number> = {};
  for (const txn of transactions.results) {
    const key = txn.offering_sub_category ? `${txn.fund_type}:${txn.offering_sub_category}` : txn.fund_type;
    totals[key] = (totals[key] || 0) + txn.amount;
  }

  return c.json({
    church_name: org?.name || 'Unknown',
    member_name: [member.first_name, member.last_name].filter(Boolean).join(' '),
    year,
    transactions: transactions.results,
    totals_by_fund: totals,
    generated_at: new Date().toISOString(),
  });
});

async function requireMissionLevel(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
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

      const restrictedResult = await c.env.DB.prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE tenant_id = ? AND organization_id = ? AND fund_type = 'restricted'
         AND transaction_date >= ? AND transaction_date < ?`
      )
        .bind(tenantId, church.id, monthStart, monthEnd)
        .first<{ total: number }>();

      return {
        church_id: church.id,
        church_name: church.name,
        tithe: titheResult?.total || 0,
        offering: offeringResult?.total || 0,
        restricted: restrictedResult?.total || 0,
        total: (titheResult?.total || 0) + (offeringResult?.total || 0) + (restrictedResult?.total || 0),
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
        restricted: acc.restricted + r.restricted,
        total: acc.total + r.total,
      }),
      { tithe: 0, offering: 0, restricted: 0, total: 0 }
    ),
  };

  if (format === 'csv') {
    const header = 'Church Name,Tithe,Offering,Restricted,Total\n';
    const body = rows
      .map((r) => `${r.church_name},${r.tithe},${r.offering},${r.restricted},${r.total}`)
      .join('\n');
    const footer = `Total,${report.totals.tithe},${report.totals.offering},${report.totals.restricted},${report.totals.total}`;
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

  if (format === 'pdf') {
    const pdf = buildPdfData(rows, report.totals, report.mission, report.month);
    return c.newResponse(pdf, 200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="remittance-${year}-${month}.pdf"`,
    });
  }

  return c.json(report);
});

function buildPdfData(
  rows: { church_name: string; tithe: number; offering: number; restricted: number; total: number }[],
  totals: { tithe: number; offering: number; restricted: number; total: number },
  mission: string,
  month: string
): string {
  const headerRow = ['Church Name', 'Tithe', 'Offering', 'Restricted', 'Total'];
  const dataRows = rows.map(r => [r.church_name, String(r.tithe), String(r.offering), String(r.restricted), String(r.total)]);
  const totalRow = ['Total', String(totals.tithe), String(totals.offering), String(totals.restricted), String(totals.total)];

  const allRows = [headerRow, ...dataRows, totalRow];
  const colWidths = [140, 70, 70, 70, 70];
  const rowHeight = 20;
  const startX = 50;
  let startY = 700;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);

  const escapePdf = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  let contentStream = 'BT\n';
  contentStream += '/F1 10 Tf\n';

  for (let r = 0; r < allRows.length; r++) {
    const y = startY - (r * rowHeight);
    let x = startX;
    for (let c = 0; c < allRows[r].length; c++) {
      contentStream += `1 0 0 1 ${x} ${y} Tm (${escapePdf(allRows[r][c])}) Tj\n`;
      x += colWidths[c];
    }
  }

  // Draw table borders
  const tableBottom = startY - (allRows.length * rowHeight);
  contentStream += 'ET\n';
  contentStream += '0.5 w\n';
  contentStream += `${startX} ${tableBottom} ${tableWidth} ${allRows.length * rowHeight} re S\n`;

  // Header line
  contentStream += `${startX} ${startY - rowHeight} m ${startX + tableWidth} ${startY - rowHeight} l S\n`;

  // Title
  contentStream += 'BT\n';
  contentStream += '/F1 16 Tf\n';
  contentStream += `1 0 0 1 ${startX} 770 Tm (Remittance Report) Tj\n`;
  contentStream += '/F1 12 Tf\n';
  contentStream += `1 0 0 1 ${startX} 750 Tm (${escapePdf(mission)} - ${escapePdf(month)}) Tj\n`;
  contentStream += 'ET\n';

  const contentStreamEncoded = contentStream;

  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Length ${contentStreamEncoded.length} >>\nstream\n${contentStreamEncoded}\nendstream\nendobj\n`;

  const objects = obj1 + obj2 + obj3 + obj4;
  const byteOffsets: number[] = [];
  let offset = 0;
  for (const obj of [obj1, obj2, obj3, obj4]) {
    byteOffsets.push(offset);
    offset += obj.length;
  }

  let xref = `xref\n0 5\n0000000000 65535 f \n`;
  for (const bo of byteOffsets) {
    xref += `${String(bo).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;

  return `%PDF-1.4\n${objects}${xref}${trailer}`;
}

function buildXlsxXml(
  rows: { church_name: string; tithe: number; offering: number; restricted: number; total: number }[],
  totals: { tithe: number; offering: number; restricted: number; total: number },
  mission: string,
  month: string
): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const rowsXml = rows
    .map(
      (r) =>
        `    <Row>\n      <Cell><Data ss:Type="String">${esc(r.church_name)}</Data></Cell>\n      <Cell><Data ss:Type="Number">${r.tithe}</Data></Cell>\n      <Cell><Data ss:Type="Number">${r.offering}</Data></Cell>\n      <Cell><Data ss:Type="Number">${r.restricted}</Data></Cell>\n      <Cell><Data ss:Type="Number">${r.total}</Data></Cell>\n    </Row>`
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
    <Cell><Data ss:Type="String">Restricted</Data></Cell>
    <Cell><Data ss:Type="String">Total</Data></Cell>
   </Row>
${rowsXml}
   <Row>
    <Cell><Data ss:Type="String">Total</Data></Cell>
    <Cell><Data ss:Type="Number">${totals.tithe}</Data></Cell>
    <Cell><Data ss:Type="Number">${totals.offering}</Data></Cell>
    <Cell><Data ss:Type="Number">${totals.restricted}</Data></Cell>
    <Cell><Data ss:Type="Number">${totals.total}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;
}
