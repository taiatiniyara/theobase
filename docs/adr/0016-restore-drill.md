# ADR-0016: Backup Verification — Restore Drill

## Status

Accepted (2026-08-10)

## Context

The DO event log is the backup — every mutation emits an append-only event with a hash chain. If a DO's state is lost, we replay the log to reconstruct it. But an untested backup isn't a backup.

## Decision

A monthly automated restore drill:

- Worker Cron trigger runs on the 1st of every month.
- Replays the seeded demo church's event log into a fresh DO instance. (Picking a random church is planned; the drill currently targets the demo church.)
- Compares the reconstructed state to the production DO's state (state-hash match).
- Writes the result to D1 `restore_drill` table: `id, churchId, success (bool), durationMs, stateHashMatch (bool), timestamp`.
- If `success = false` or `stateHashMatch = false` → P1 alert in observability.

A successful drill every month proves the event log is a reliable backup.

## Consequences

- The drill proves we can recover from DO failure in production. An untested backup is trust, a tested backup is fact.
- The state hash comparison catches subtle bugs: the log replays correctly but the materialized state differs (e.g. a non-deterministic operation). These bugs would otherwise surface silently after a real failure.
- At scale (10,000+ churches), picking one random church per month means each church is tested roughly every 800 years — not sufficient for per-church confidence, but sufficient for system-level confidence. If the log format works for one church, it works for all.
