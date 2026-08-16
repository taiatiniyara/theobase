# V1 identity is device-local: no accounts, no roles, no member login

The v1.0 PRD (#221) proposed magic-link email sign-in, a 14-role permission matrix, and `User`/`RoleAssignment` entities — all of which contradict ADR-0014, ADR-0015, and ADR-0016. This ADR resolves the conflict: the device-local identity model wins. There are no accounts, no roles, and no member self-service login in v1. Authority flows from offices held via appointments, mapped to actions by policy; identity is a per-person PIN (or biometric) on a provisioned device, signed by a Passkey (ADR-0016).

The grassroots capture device cannot use magic links at all: offline-first (ADR-0002) means there is no server at capture time to send email, mint a JWT, or validate a session. A role matrix re-introduces the admin taste ADR-0014 removed; a `User`/`RoleAssignment` entity re-introduces the account model ADR-0015 forbids. #221's auth proposal was written against the earlier roleGrant-era code that the clean-slate removed — it describes that code, not the architecture the ADRs settled on.

## The one surface that is genuinely different

The mission office is online (desktop, ADR-0005) and is the tenant boundary (ADR-0008). It needs no separate magic-link system: a mission-office officer holds an office (Conference Treasurer, etc.) via an appointment and acts through the same office → action mapping, on a device that always syncs so its lease always renews. The authority model is identical everywhere; only the offline-lease mechanics differ between the church device and the mission device.

## Member self-service is deferred

Stories in #221 that give a *member* a login — viewing giving history, tax receipts, updating contact info, requesting erasure — are out of v1. A member is not an officer and holds no appointment, so the office/action model has nothing to grant them. Reintroducing member self-service will need its own ADR: it is a read-only public surface that the "no accounts" rule does not yet cover, and it must not be solved by sneaking accounts back in.

## Consequences

- #221's "Authentication and Onboarding" and member self-service stories, its `User`/`RoleAssignment` data model, and its "14 roles" text are superseded and must be rewritten.
- Offices, actions, and the office → action mapping are policy data (ADR-0014), not a permission matrix.
- Tickets referencing ADR-0018/0019 (auth/roleGrant from the removed codebase) are stale and must be re-pointed at ADR-0014/15/16 and this ADR.
