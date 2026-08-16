# Device-local identity: a per-person PIN bound to a provisioned key

The grassroots app has no accounts, usernames, or passwords. An officer's identity is a Passkey in their device's secure enclave (ADR-0016). Provisioning binds that key to the officer's appointment(s) at a unit — via a code or QR — and the officer sets a device-local PIN (or biometric) on first use; the PIN unlocks the key and doubles as the offline signature.

A "device" is just where keys live. A shared church phone holds several officers' keys on one enclave; a personal phone holds one. Both are the same mechanism at a different count — the binding is between an officer and their appointment, not between a unit and a device.

We chose this because offline-first (ADR-0002) makes server-side authentication impossible at capture time, the no-user-entity model (ADR-0014) has nothing to log into, and attributing every act (ADR-0009) requires knowing who is acting — which a shared device PIN cannot give.

## Consequences

- Authority is device-local: revocation propagates on sync, with a sync-lease so a long-offline device lapses on its own (ADR-0014).
- The officer list on a device is derived from appointments, not from a separate user database. On a shared device it is every officer of the unit; on a personal device it is that officer alone.
- The mission office owns key lifecycle — revoking a Passkey, not a phone — for both shared and personal devices.
- A future reader must not "fix" the absence of login by adding accounts — that would break ADR-0002, ADR-0009, and ADR-0014 at once.
