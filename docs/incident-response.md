# Incident Response

## Severity Levels

| Level | Definition                                                                          | Response                                                                                         |
| ----- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| P1    | Platform down — no user can access any church DO                                    | All hands. Cloudflare dashboard check, Worker logs, DO error rates. Target resolution: < 1 hour. |
| P2    | Single church DO down or degraded                                                   | Investigate that DO's event log and error rate. Target resolution: < 4 hours.                    |
| P3    | Feature degradation — a specific flow broken (e.g. counting room entry not syncing) | Bug report → triage → fix in next deployment.                                                    |

## Response Procedure

1. **Detect** — Cloudflare Analytics alert fires (DO error rate spike, sync queue backlog > 10 min, auth failure rate spike).
2. **Triage** — determine severity. Is it one church or all churches?
3. **Contain** — if a specific DO is corrupted, isolate it (stop routing to it). The remaining churches operate normally.
4. **Resolve** — fix the root cause. For DO issues: replay event log into a fresh DO instance. For Worker issues: redeploy.
5. **Postmortem** — document what happened, why, and what prevents recurrence. Filed in `docs/postmortems/`.

## Recovery

- **DO state loss**: replay event log. The log is the backup. RTO < 1 hour.
- **D1 data loss**: restore from Cloudflare's point-in-time recovery (5-min RPO).
- **R2 data loss**: cross-region replication provides automatic failover.
