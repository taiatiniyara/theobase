import { authenticate, authorize } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { json } from "../lib/response";
import { createDb } from "../lib/db";
import {
  ReconciliationRepo,
  type ConferenceTitheRow,
  type TitheReportRow,
} from "../repos/reconciliation";

function toTitheEntry(r: ConferenceTitheRow) {
  return {
    churchId: r.churchId,
    churchName: r.churchName,
    forwardedAmount: r.forwardedTithe,
    status: r.titheStatus,
    receivedAmount: r.receivedTithe,
    note: r.note,
  };
}

function toTitheReportEntry(r: TitheReportRow) {
  return {
    churchId: r.churchId,
    churchName: r.churchName,
    forwarded: r.forwardedTithe,
    received: r.receivedTithe,
    difference: r.titheDiscrepancy,
    status: r.titheStatus,
  };
}

export async function handleGetConferenceTithe(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  if (!year || !month) return json({ error: "year and month are required" }, 400);

  const repo = new ReconciliationRepo(createDb(env));
  const rows = await repo.getConferenceTithe(auth.conferenceId!, Number(year), Number(month));

  return json({ tithe: rows.map(toTitheEntry) });
}

export async function handleReceiveTithe(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    churchId: number;
    year: number;
    month: number;
    receivedAmount?: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.year || !body.month) {
    return json({ error: "churchId, year, and month are required" }, 400);
  }

  const repo = new ReconciliationRepo(createDb(env));
  const result = (await repo.receiveTithe({
    churchId: Number(body.churchId),
    year: Number(body.year),
    month: Number(body.month),
    receivedAmount: body.receivedAmount,
    note: body.note,
    reconciledBy: Number(auth.userId),
  })) as Record<string, unknown>;

  return json({
    reconciliation: {
      churchId: Number(body.churchId),
      year: Number(body.year),
      month: Number(body.month),
      forwardedTithe: result.forwarded_tithe,
      receivedTithe: result.received_tithe,
      titheDiscrepancy: result.tithe_discrepancy,
      titheStatus: result.tithe_status,
    },
  });
}

export async function handleChurchBalance(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const repo = new ReconciliationRepo(createDb(env));

  if (request.method === "GET") {
    const churchId = url.searchParams.get("church_id");
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    if (!churchId || !year || !month) {
      return json({ error: "church_id, year, and month are required" }, 400);
    }

    const rec = await repo.getChurchBalance(Number(churchId), Number(year), Number(month));

    if (!rec) return json({ reconciliation: null });

    return json({ reconciliation: rec });
  }

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    churchId: number;
    year: number;
    month: number;
    bankBalance: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.year || !body.month || body.bankBalance === undefined) {
    return json({ error: "churchId, year, month, and bankBalance are required" }, 400);
  }

  const result = (await repo.setChurchBalance({
    churchId: Number(body.churchId),
    year: Number(body.year),
    month: Number(body.month),
    bankBalance: body.bankBalance,
    note: body.note,
  })) as Record<string, unknown>;

  return json({
    reconciliation: {
      churchId: Number(body.churchId),
      year: Number(body.year),
      month: Number(body.month),
      bankBalance: body.bankBalance,
      systemBalance: result.system_balance,
      bankDiscrepancy: result.bank_discrepancy,
    },
  });
}

export async function handleTitheReport(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  if (!year || !month) return json({ error: "year and month are required" }, 400);

  const repo = new ReconciliationRepo(createDb(env));
  const rows = await repo.getTitheReport(auth.conferenceId!, Number(year), Number(month));

  return json({ report: rows.map(toTitheReportEntry) });
}
