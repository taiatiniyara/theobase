export interface CsvParseResult<T> {
  rows: T[];
  errors: { row: number; message: string }[];
}

export function parseCsv(content: string): string[][] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return [];
  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i]!;
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

export function validateCsvHeaders(headers: string[], expected: string[]): string | null {
  const missing = expected.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return `Missing required columns: ${missing.join(", ")}`;
  }
  return null;
}
