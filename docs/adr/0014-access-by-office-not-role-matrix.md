# Access is granted by office, authorized by act — not a role matrix

Theobase has no role/permission system. What a person may *do* is granted by the fixed denominational offices they hold (clerk, treasurer, …), each mapped by policy to a set of actions; who may *authorize* an action is a separate axis — a board vote, session vote, or dual signature recorded as evidence on the event. A "user" is just a Person who currently holds an appointment; there is no User or Account entity.

We chose this because the denomination's offices are policy, not admin taste (ADR-0003), and because bodies like the Church in session cannot be represented as an office a single person holds. The anti-fraud guarantee is evidence and auditability, not impossibility: a solo clerk-treasurer can still defraud, and a revoked clerk can keep acting until sync — both accepted because the offline-first grassroots reality (ADR-0002) makes live enforcement impossible, and every act leaves attributed evidence (ADR-0009).

## Consequences

- **Offices, actions, and the office → action mapping are all policy data** — versioned and tree-scoped (ADR-0004), shipped in the policy feed (ADR-0013). Adding an office or changing its powers is a data change, not a release.
- **Offices are level-scoped** — Church Treasurer and Conference Treasurer are different offices, keyed to the unit kind where they can be held.
- **Appointments are events** with an authorizing act and an effective period; authority flows only from a current appointment. The mission office bootstraps a new church's first officers.
- **Read scope is the unit subtree by default**, independent of office, with narrow per-office drill-down exceptions for reporting.
- **Dual signature requires two distinct people not in the same Family**, enforced at signing time.
- **Authority is eventually consistent**: revocation propagates on sync, with a sync-lease so a long-offline device lapses on its own.
