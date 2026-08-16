# Sync Protocol

Offline-first sync (ADR-0002); DO-as-authority (ADR-0019).

## Model

- Sync unit = **events**; the device pushes its local write-ahead log to the DO.
- **Bidirectional**: push local events, pull committed state + remote events since last sync.
- **Backfill allowed**: `occurredAt` may be older than the latest seen; `recordedAt` is capture time.

## Attestation

Every event carries the authoring officer's **attestation** — a WebAuthn assertion over the event hash, produced offline by their Passkey (`CONTEXT.md`). The DO verifies the signature against the credential's public key it holds from provisioning; a mismatched or absent attestation rejects the event. The attestation proves attribution, not authorization — the authorizing act rides on the event as evidence (ADR-0014).

## Idempotency & partial sync

- Client-generated event id; the DO dedupes on it.
- Partial sync **resumes** (never restarts), because ids are idempotent.

## Concurrency

- Concurrent `cash-count confirm`s (two offline counters): additive events keyed to the same cash count; dispute when tallies differ, independent of sync order.
- Concurrent field edits (e.g. two name changes): additive; projection = latest `recordedAt`; no merge UI in v1.

## Evidence blobs

The event records immediately with a local ref; the blob uploads on sync; the ref finalises after upload.

## Lease & version

- Sync renews the lease (default 90 days). A lapsed device is blocked device-side (countdown → block) and DO-side (reject writes). ADR-0016.
- A major DO version bump forces a stale PWA to reload.
