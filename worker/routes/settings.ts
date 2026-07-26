import { authorize, type AuthContext } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { createDb } from "../lib/db";
import { SettingsRepo } from "../repos/settings";
import { json } from "../lib/response";

function stripMeta(record: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!record) return null;
  const { created_at: _, updated_at: __, ...rest } = record;
  return rest;
}

export async function handleGetChurchSettings(
  _request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["org:read"]!);
  if (forbidden) return forbidden;

  const repo = new SettingsRepo(createDb(env));
  const settings = await repo.getChurchSettings(Number(auth.churchId));
  return json(stripMeta(settings) ?? {});
}

export async function handleUpdateChurchSettings(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["org:write"]!);
  if (forbidden) return forbidden;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const repo = new SettingsRepo(createDb(env));
  await repo.upsertChurchSettings(Number(auth.churchId), body);
  const settings = await repo.getChurchSettings(Number(auth.churchId));
  return json(stripMeta(settings) ?? {});
}

export async function handleGetUserSettings(
  _request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const repo = new SettingsRepo(createDb(env));
  const settings = await repo.getUserSettings(Number(auth.userId));
  return json(stripMeta(settings) ?? {});
}

export async function handleUpdateUserSettings(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const repo = new SettingsRepo(createDb(env));
  await repo.upsertUserSettings(Number(auth.userId), body);
  const settings = await repo.getUserSettings(Number(auth.userId));
  return json(stripMeta(settings) ?? {});
}

export async function handleGetConferenceSettings(
  _request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["org:read"]!);
  if (forbidden) return forbidden;

  const repo = new SettingsRepo(createDb(env));
  const settings = await repo.getConferenceSettings(Number(auth.conferenceId));
  return json(stripMeta(settings) ?? {});
}

export async function handleUpdateConferenceSettings(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["org:write"]!);
  if (forbidden) return forbidden;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const repo = new SettingsRepo(createDb(env));
  await repo.upsertConferenceSettings(Number(auth.conferenceId), body);
  const settings = await repo.getConferenceSettings(Number(auth.conferenceId));
  return json(stripMeta(settings) ?? {});
}
