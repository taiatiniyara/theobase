import type { Env } from './env';

export async function runRestoreDrill(env: Env): Promise<{
  success: boolean;
  churchId?: string;
  stateHashMatch?: boolean;
  durationMs?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const churchId = 'demo-church';

    const sourceDoId = env.CHURCH_DO.idFromName(churchId);
    const sourceStub = env.CHURCH_DO.get(sourceDoId);

    const eventsResponse = await sourceStub.fetch('http://localhost/events');
    const events = (await eventsResponse.json()) as Array<Record<string, unknown>>;

    const verifyResponse = await sourceStub.fetch('http://localhost/verify');
    const verifyResult = (await verifyResponse.json()) as { valid: boolean };

    const drillDoId = env.CHURCH_DO.idFromName(`drill-${churchId}`);
    const drillStub = env.CHURCH_DO.get(drillDoId);

    const seedToken = env.SEED_TOKEN || '';

    for (const event of events) {
      await drillStub.fetch('http://localhost/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${seedToken}` },
        body: JSON.stringify({ operation: event.operation, payload: event.payload }),
      });
    }

    const sourceStateResponse = await sourceStub.fetch('http://localhost/state');
    const sourceState = await sourceStateResponse.json();

    const drillStateResponse = await drillStub.fetch('http://localhost/state');
    const drillState = await drillStateResponse.json();

    const stateHashMatch = JSON.stringify(sourceState) === JSON.stringify(drillState);
    const durationMs = Date.now() - startTime;
    const success = verifyResult.valid && stateHashMatch;

    if (env.DB) {
      await env.DB
        .prepare(
          'INSERT INTO restore_drill (id, churchId, success, durationMs, stateHashMatch, timestamp) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
        )
        .bind(
          crypto.randomUUID(),
          churchId,
          success ? 1 : 0,
          durationMs,
          stateHashMatch ? 1 : 0,
          startTime,
        )
        .run();
    }

    return { success, churchId, stateHashMatch, durationMs };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      durationMs: Date.now() - startTime,
    };
  }
}
