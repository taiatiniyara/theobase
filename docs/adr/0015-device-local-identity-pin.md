# Device-local identity: a per-person PIN on a provisioned device

The grassroots app has no accounts, usernames, or passwords. A device is provisioned to a unit once (code/QR), loads that unit's appointed officers from their appointments, and each officer sets a device-local PIN (or biometric) on first use; the PIN doubles as the offline signature.

We chose this because offline-first (ADR-0002) makes server-side authentication impossible at capture time, the no-user-entity model (ADR-0014) has nothing to log into, and attributing every act (ADR-0009) requires knowing who is acting — which a shared device PIN cannot give.

## Consequences

- Authority is device-local: revocation propagates on sync, with a sync-lease so a long-offline device lapses on its own (ADR-0014).
- The officer list on a device is derived from appointments, not from a separate user database.
- A future reader must not "fix" the absence of login by adding accounts — that would break ADR-0002, ADR-0009, and ADR-0014 at once.
