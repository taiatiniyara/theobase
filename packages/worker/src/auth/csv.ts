export interface CsvRow {
  row: number;
  data: Record<string, string>;
}

export interface CsvParseResult {
  resolved: CsvRow[];
  flagged: { row: number; data: Record<string, string>; errors: string[] }[];
}

const EXPECTED_COLUMNS = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'address',
  'dateofbirth',
  'baptismdate',
  'gender',
];

export function parseCsv(text: string): CsvParseResult {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { resolved: [], flagged: [] };

  const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1);

  const result: CsvParseResult = { resolved: [], flagged: [] };

  for (let i = 0; i < rows.length; i++) {
    const values = rows[i]!.split(',').map((v) => v.trim());
    const data: Record<string, string> = {};
    const errors: string[] = [];

    for (let j = 0; j < headers.length; j++) {
      const lower = headers[j]!;
      if (EXPECTED_COLUMNS.includes(lower as (typeof EXPECTED_COLUMNS)[number])) {
        data[lower] = values[j] ?? '';
      }
    }

    if (!data.firstname) errors.push('Missing first name');
    if (!data.lastname) errors.push('Missing last name');

    if (data.dateofbirth && isNaN(Date.parse(data.dateofbirth))) {
      errors.push(`Invalid date of birth: ${data.dateofbirth}`);
    }
    if (data.baptismdate && isNaN(Date.parse(data.baptismdate))) {
      errors.push(`Invalid baptism date: ${data.baptismdate}`);
    }
    if (data.gender && !['male', 'female', 'other'].includes(data.gender.toLowerCase())) {
      errors.push(`Invalid gender: ${data.gender}`);
    }

    const rowData = { row: i + 2, data };

    if (errors.length > 0) {
      result.flagged.push({ ...rowData, errors });
    } else {
      result.resolved.push(rowData);
    }
  }

  return result;
}

export async function handleParseCsv(request: Request): Promise<Response> {
  const contentType = request.headers.get('content-type') ?? '';
  let text: string;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return new Response(JSON.stringify({ error: 'No CSV file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    text = await (file as unknown as { text(): Promise<string> }).text();
  } else {
    const body = (await request.json()) as { csv: string };
    text = body.csv;
  }

  if (!text) {
    return new Response(JSON.stringify({ error: 'No CSV content' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = parseCsv(text);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
}
