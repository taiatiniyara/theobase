import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { useSync } from '../../lib/sync-provider';
import { RequireAuth } from '../../lib/auth-guard';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface CsvRow {
  row: number;
  data: Record<string, string>;
}

interface FlaggedRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
}

export const Route = createFileRoute('/church/import')({
  component: ChurchImportPage,
});

function ChurchImportPage() {
  const [resolved, setResolved] = useState<CsvRow[]>([]);
  const [flagged, setFlagged] = useState<FlaggedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const { enqueue } = useSync();

  const handleFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/church/parse-csv', {
      method: 'POST',
      body: formData,
    });
    const result = (await res.json()) as { resolved: CsvRow[]; flagged: FlaggedRow[] };
    setResolved(result.resolved);
    setFlagged(result.flagged);
  }, []);

  function updateFlagged(index: number, field: string, value: string) {
    setFlagged((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, data: { ...next[index]!.data, [field]: value } };
      return next;
    });
  }

  async function handleImport() {
    setImporting(true);
    for (const row of resolved) {
      await enqueue('member:create', {
        id: crypto.randomUUID(),
        firstName: row.data.firstname,
        lastName: row.data.lastname,
        email: row.data.email || null,
        phone: row.data.phone || null,
        address: row.data.address || null,
        dateOfBirth: row.data.dateofbirth || null,
        baptismDate: row.data.baptismdate || null,
        gender: row.data.gender || null,
        membershipStatus: 'baptised',
      });
    }
    setResolved([]);
    setImporting(false);
  }

  if (resolved.length === 0 && flagged.length === 0) {
    return (
      <RequireAuth allowedRoles={['clerk']}>
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
        <Card className="w-full max-w-md space-y-4 text-center">
          <CardTitle>Upload Membership CSV</CardTitle>
          <p className="text-sm text-neutral-500">Drop a CSV file here or click to browse</p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
          />
        </Card>
      </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth allowedRoles={['clerk']}>
    <div className="min-h-screen bg-neutral-50 px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-xl font-bold">Import Members</h1>

        {resolved.length > 0 && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{resolved.length} members ready</span>
                <Badge variant="success" className="ml-2">
                  Valid
                </Badge>
              </div>
              <Button size="sm" onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : `Import ${resolved.length}`}
              </Button>
            </div>
          </Card>
        )}

        {flagged.map((row, i) => (
          <Card key={i}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium">Row {row.row}</span>
              <Badge variant="error">{row.errors.join(', ')}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-neutral-500">First Name</span>
                <Input
                  value={row.data.firstname ?? ''}
                  onChange={(e) => updateFlagged(i, 'firstname', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-500">Last Name</span>
                <Input
                  value={row.data.lastname ?? ''}
                  onChange={(e) => updateFlagged(i, 'lastname', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-500">Email</span>
                <Input
                  value={row.data.email ?? ''}
                  onChange={(e) => updateFlagged(i, 'email', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-500">Phone</span>
                <Input
                  value={row.data.phone ?? ''}
                  onChange={(e) => updateFlagged(i, 'phone', e.target.value)}
                />
              </label>
            </div>
          </Card>
        ))}
      </div>
    </div>
    </RequireAuth>
  );
}
