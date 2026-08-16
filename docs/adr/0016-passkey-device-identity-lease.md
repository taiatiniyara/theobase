# Device identity is a Passkey; authority decays on its own

The provisioned device identity is a Passkey — a WebAuthn platform-authenticator credential in the device's secure enclave. Authority on a device is a policy-scoped sync-lease (default 90 days) that renews on every sync and lapses — a warning first, then a block on writing — if the device stays offline too long.

We chose this because offline-first (ADR-0002) means the server cannot verify a device at capture time, so identity must be unforgeable at the device; and a device that never syncs must not retain stale authority forever (ADR-0014). A Passkey is the mechanism because a PWA cannot reach the secure chip any other way.

## What "unforgeable" does and does not mean here

On Android (and iOS) the default Passkey is a **synced** passkey: it is backed up to the OS's credential manager (Google Password Manager / iCloud) and can be restored to another device under the same account. Truly device-bound passkeys exist only on physical security keys, which a rural church will not have.

So officer identity is **not** "impossible to clone to a second phone." The honest guarantee is: a key cannot be cloned *without the owning account* (the Google/iCloud account the device is signed into). On a shared church phone that is one account — so a stolen account password is the real attack, not a stolen phone. This is accepted: it is strictly stronger than a shared PIN and strong enough for the grassroots threat model (ADR-0005, ADR-0009).

## Consequences

- PIN recovery is clear-not-set: a second appointed officer clears the PIN (an audited event); the owner sets their own fresh one. The solo-officer church falls back to the mission office.
- User verification is the device PIN (or biometric where present) — the same PIN that doubles as the offline signature (ADR-0015). A device with no PIN/pattern configured has no platform Passkey.
- Minimum device: Android 9+ with the OS credential manager (Google services). Below that there is no platform Passkey and the device is out of scope.
- The mission office owns device lifecycle — revoking a lost or stolen device's key and provisioning replacements — not identity.
