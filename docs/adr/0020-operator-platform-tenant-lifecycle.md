# The operator platform and tenant lifecycle are a separate online surface

Beyond the offline grassroots device, Theobase has a second surface: the online operator platform. It has two kinds of user — the **tenant** (a Conference or Mission office, per ADR-0008) and the **operator** (Taia Tiniyara staff running the operated service, ADR-0012). This surface owns the tenant lifecycle: a conference files a placement request, the operator places it, billing activates it, and the conference provisions its first churches. It is always online (desktop, ADR-0005), so it has none of the offline-lease constraints of the grassroots device.

The tenant side uses the same office/appointment authority model as the grassroots app (ADR-0014, ADR-0017): a conference officer holds an office via an appointment and acts through the office → action mapping, on an always-online device whose sync-lease always renews. The operator side is *not* a church office — it is our own staff provisioning platform administration (placement queue, demo seeding, purge, cost and health dashboards), provisioned out-of-band with an operator flag. That flag is an operator-internal concern, not a church authority model; it does not resurrect accounts or a role matrix for anyone in the church hierarchy.

We chose to split this out because ADR-0008 already made the conference/mission the tenant, and the operated service (ADR-0012) implies someone runs it. That someone needs an identity, but giving it one must not reintroduce the accounts-and-roles model ADR-0017 removed from the church.

## Consequences

- Tenant lifecycle — claim-first placement, operator confirmation, billing activation, church provisioning — lives on this surface, in D1 (ADR-0019), not in per-church DOs.
- The operator flag is provisioned by Taia Tiniyara, out-of-band, and is the only "role-like" thing in the system; it is not part of the denominational office vocabulary.
- Church officers and conference officers are governed by the same office/appointment/action rules regardless of which surface they use.
