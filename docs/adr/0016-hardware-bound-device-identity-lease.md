# Device identity is hardware-bound; authority decays on its own

The provisioned device identity is not a copyable blob: it is a hardware-backed key (a Passkey in the device's secure enclave), so officer identity cannot be cloned to a second phone. Authority on a device is a policy-scoped sync-lease (default 90 days) that renews on every sync and lapses — a warning first, then a block on writing — if the device stays offline too long.

We chose this because offline-first (ADR-0002) means the server cannot verify a device at capture time, so the device itself must be unforgeable; and a device that never syncs must not retain stale authority forever (ADR-0014).

## Consequences

- PIN recovery is clear-not-set: a second appointed officer clears the PIN (an audited event); the owner sets their own fresh one. The solo-officer church falls back to the mission office.
- The mission office owns device lifecycle — revoking a lost or stolen device's key and provisioning replacements — not identity.
- A Passkey (WebAuthn platform authenticator) is the mechanism, because a PWA cannot reach the secure chip any other way.
