# Policy validation — Theobase specs vs. SDA governing documents

What the official governing documents actually say about membership, offices, and finance, checked against Theobase's specs. Every claim is cited to a primary source; anything not verifiable against a primary source is flagged under **Unverified**.

## Documents located (primary sources)

- **Church Manual** — *Seventh-day Adventist Church Manual*, 21st edition, revised 2025, General Conference Secretariat. Official PDF: `gc.adventist.org/wp-content/uploads/2025/10/Seventh-day_Adventist_Church_Manual-2025-10-13.pdf` (248 pp.).
- **Accounting Manual** — *Financial Management in Seventh-day Adventist Church Organizations: A guide for Financial Professionals*, 2025, General Conference Treasury. Official PDF linked from `treasury.adventist.org/accountingmanual` (`hope-documents.fra1.digitaloceanspaces.com/.../Pwe1754927828121.pdf`). It is Volume 2 and "replaces the former Seventh-day Adventist Accounting Manual."
- **Working Policy** — *NOT publicly available.* The GC Secretariat states: "Due to the administrative nature of the Working Policy, it is only distributed through the divisions to the administrative entities of the world Church" (`secretariat.adventist.org/resources`). See **Unverified** below.

The specs under review were written from reasoning, and their own ADRs admit the policy feed does not exist yet ("For v1 we seed a default Fiji-Mission mapping so the system works before the real denomination policy feed arrives" — `offices-actions.md`). So the verdicts below are about whether the *reasoning* happened to land on policy.

---

## 1. Membership events

**Policy says** (Church Manual, ch. "Membership", pp. 51–64; ch. "Discipline", pp. 65–76):

- **Baptism** — "the church should vote on their acceptance into membership subject to baptism" ("Voting Acceptance Subject to Baptism", p. 56). The candidate answers the vow "in the presence of the local congregation or other properly appointed body" (p. 53). **A church vote is required.**
- **Rebaptism** — treated as a special case of baptism (pp. 57–58); no separate vote procedure is defined; readmission after removal is "normally … in connection with rebaptism" (pp. 58, 75–76).
- **Profession of faith** — four listed circumstances (pp. 58–59); the person affirms the Fundamental Beliefs "in the presence of the local congregation or other properly appointed body" (p. 53), i.e. received by church vote like baptism.
- **Death** — "When a member dies, the clerk records the date of death in the membership record, and **no action by the church is necessary**" (p. 62; repeated at p. 90).
- **Removal (disciplinary)** — "only at a properly called business meeting … by a majority vote" (p. 73). "**Church Board Cannot Remove Members** — the board may recommend … but under no circumstance does the board have the right to take final action, except to record removal at death or at the member's request" (p. 73).
- **Removal at member's request (resignation)** — "Letters of resignation shall be presented to the board, where the resignation will be recorded" (p. 75). **This is a board action, not a church vote.**
- **Missing** — a form of removal: members who move without a forwarding address and cannot be located "for at least two years" "may be removed by a vote of the church. The clerk should record … 'Location unknown. Voted to designate as missing'" (pp. 63–64, 74–75). **A church vote, not a board action.**
- **Censure** — "By a vote of censure" (p. 71), a stated 1–12 month period, "Membership may not be transferred during the period of censure" (p. 72). Theobase has no censure event at all.

**Theobase spec** (`event-catalog.md`):

- `baptism`, `re-baptism`, `profession-of-faith` — authorizing act: "a Church-in-Session vote."
- `death`, `removal`, `marked-missing` — "authorizing act required."

**Verdict: DIVERGE (partial match).**

- Baptism / re-baptism / profession-of-faith = Church-in-Session vote — **match.**
- **Death requires no authorizing act.** Policy says the clerk simply records it. The spec's blanket "authorizing act required" is wrong for death; enforcing a vote for death would *block* a legitimate act policy permits without one.
- **Removal is two different authorizing acts the spec collapses into one:** disciplinary removal = church business-meeting vote; resignation = board records it. `offices-actions.md` maps `record-removal` only to Church in Session.
- **`marked-missing` is a church vote, not a board action** — the spec maps `mark-missing` to Church Board (see §3), contradicting the Church Manual, and omits the two-year "unable to locate" prerequisite.
- **Omission:** `censure` is a distinct disciplinary event policy explicitly provides for (with a transfer block), and it is absent from the catalog.

---

## 2. Transfer procedure

**Policy says** (Church Manual, "Transferring Members", pp. 59–62):

- The **member applies to the clerk of the receiving church**; that clerk forwards the request to the granting church's clerk (p. 59).
- The **granting church**: clerk → pastor/elder → board votes to *recommend* → church first reading → church vote one week later ("Final action is taken the following week") (p. 59).
- **Clerk to prepare letter** — when granted, the granting clerk fills the transfer form and forwards it to the receiving clerk. The receiving clerk passes it to pastor/elder → board recommendation → church vote ("usually … one week later"). The receiving clerk adds the name and date, fills and returns the certifying portion to the granting clerk (p. 60).
- **"Church Board Cannot Grant Letters"** — "A board has no authority to vote letters of transfer or to receive members by letter… Action on all transfers … must be taken by the church" (p. 62).
- **Letter valid six months** (p. 60).
- **Membership during transfer** — "Under no circumstances shall the clerk of the granting church remove a member's name … until the return portion of the transfer letter has been received" (pp. 60–61). Until then the member **remains on the granting church's roll**.
- **If not accepted** — "The person's membership then remains with the granting church" (p. 61).
- Letters granted "only to members in regular standing, never to a member under discipline"; "No Letter Without Member's Approval" (pp. 61–62).

**Theobase spec** (`event-catalog.md`, `CONTEXT.md`):

- Transfer is "two-sided" — sending votes + issues letter, receiving votes + accepts; `transfer-in` references `transfer-out`; "the member settles on the new roll only after this."
- "**Cancellable back to Missing** if the member never arrives."

**Verdict: DIVERGE (mostly match, one invented state).**

- Two-sided, vote-at-both-ends, board-recommends-church-votes structure — **match**.
- **"Cancellable back to Missing" is not in policy.** There is no such transition. If the member never arrives, the letter lapses after six months and the membership simply **remains on the granting church's roll**; "Missing" is a separate removal action only reachable after a two-year inability to locate plus a church vote. The spec invents a `transfer → Missing` path that policy does not describe, and in doing so drops the real "still on the granting roll until return cert received" rule.
- **Omission:** the one-week interval and the objection procedure for granting letters; the six-month validity; the under-censure transfer block; the child-abuse qualifying-statement exception (pp. 59–61).

---

## 3. Church offices & office→action mapping

**Policy says** (Church Manual, "Local Church Officers and Organizations", pp. 77–95; "Church Board", pp. 140–143):

- **Officers named:** Elder (with **First Elder** when several, p. 84), **Deacon** (p. 85), **Deaconess** (p. 88), **Clerk** (p. 90), **Treasurer** (p. 91), Interest Coordinator (p. 95), plus department leaders. There is also a **"Leader"** office where no elder is available (p. 85).
- **No "Counter" office exists.** Cash is counted by the treasurer with another officer (see §4).
- **Elders "do not have the authority to receive or remove members. This is done only by vote of the church. Only the board may recommend…"** ("Limitation of Authority", p. 85).
- **Clerk** — "No Names Added or Removed Without Vote" (p. 90): the clerk records but cannot add/remove except on a church vote, at death, or at the member's written request. The clerk handles transfer correspondence and prepares the letter (p. 90).
- **Treasurer** — "custodian of all church funds" (p. 91); disburses "only by authorization of the board or business meeting"; works "under the direction of the board" (pp. 92, 153).
- **Church Board** — "recommend changes in church membership, oversee church finances" (p. 140); chair is the conference-appointed pastor (p. 142); clerk is board secretary.
- **Business meeting** (= "Church in Session") — "the constituency meeting of the local church… The business meeting has authority over the board" (p. 139).
- Conference level (from Working Policy references in the Accounting Manual): president, secretary, treasurer (Model Conference Bylaws, GCWP D 20 05, cited in Accounting Manual §104).

**Theobase spec** (`offices-actions.md`):

- Church level: **Church Clerk, Church Treasurer, Counter, Church Board, Church in Session, Pastor/Elder, Deacon, Head Elder.**
- Seed mapping: Clerk → all membership actions + approve statistical report; Treasurer → all finance actions + approve tithe/offerings report; Counter → `confirm-cash-count`; Church in Session → `record-baptism`, `record-transfer-out`, `record-removal`; Church Board → `mark-missing` + approving disbursements; Conference Secretary/Treasurer → approve reports; Auditor read-only.

**Verdict: DIVERGE.**

- **"Counter" is not a Church Manual office** — an invention. The counting participant in policy is the treasurer plus another officer (preferably deacon/deaconess).
- **"Head Elder" → policy term is "First Elder."** "Leader" is omitted (minor).
- **"Deaconess" is omitted**, yet it is one of the two named counting participants in policy.
- **`mark-missing` → Church Board is wrong** (policy: church vote; board only recommends).
- **`record-transfer-in`, `record-profession-of-faith`, `record-re-baptism` are not mapped to Church in Session**, but policy requires a church vote for each. The seed mapping gives the Clerk "all membership actions" while the actual *authorizing act* is a church vote — the mapping conflates "who records" (clerk) with "who authorizes" (church), which is the exact confusion the CONTEXT.md "Authorizing act" distinction was meant to avoid.
- **Pastor/Elder lumping** hides a real policy distinction: the pastor (conference-appointed) chairs the board and presides over business meetings, whereas an elder has an explicit "Limitation of Authority" and cannot receive/remove members. Theobase's `Pastor/Elder` office erases that line.

---

## 4. Dual signature / cash count

**Policy says** (Church Manual, Treasurer duties, pp. 93–94):

> "All general offerings not in envelopes should be **counted by the treasurer in the presence of another officer, preferably a deacon or deaconess**, and a receipt given to such officer."

That is the only local-church cash-count rule. There is **no requirement of two *unrelated* people, no "dual signature," and no "Counter" office** anywhere in the Church Manual. The Accounting Manual's internal-control chapter (ch. 3) recommends *separation of duties* as a general principle ("One person controls the assets… Another person tracks the asset", §"Separation of Duties") and cites GCWP S 04 25 / S 34 05 for board responsibility over internal controls — but it does not prescribe a two-unrelated-people cash-count rule for the local church.

**Theobase spec** (`finance-module.md`, `CONTEXT.md`):

- "a cash count requires two unrelated counters to sign (dual signature)"; "two distinct, unrelated appointed people… *unrelated* means not members of the same Family."

**Verdict: DIVERGE.**

- Theobase's requirement is **stricter than policy**: it demands two unrelated people, where policy demands the treasurer plus "another officer, preferably a deacon or deaconess." The "unrelated / not same Family" constraint is not in any governing document and would **reject** a perfectly compliant count (e.g., a treasurer and their deacon spouse).
- Theobase omits the two officers policy actually names for counting — the **treasurer** and the **deacon/deaconess** — replacing them with an invented "Counter" office.
- Note the rule applies to "**general offerings not in envelopes**"; enveloped giving is a different path (the envelope itself is the voucher, p. 93). Theobase's counting-room model applies a single dual-signature state machine to everything, which overshoots the actual policy scope.

---

## 5. Funds & remittance

**Policy says:**

- **Tithe** — "Tithe shall not be used in any way by the local church, but held in trust and remitted to the conference treasurer. Thus tithe from all the churches flows into the conference treasury, and percentages are forwarded to the next level in accordance with General Conference and division working policies" (Church Manual, "How Tithe Is Handled", p. 148). The local conference is the "storehouse" (Malachi 3:10); the local church treasurer is its "agent/steward" (Accounting Manual §2001.02).
- **Conference funds remittance** — "At the close of each month, or more often if requested … the treasurer shall send to the conference treasurer the **entire amount** of conference funds received" (Church Manual, p. 91). Tithe + mission funds go up 100%, monthly.
- **Offering plans** — three plans exist, and "Each division executive committee is authorized to determine which plan(s) will be used in its territory" (p. 149): Combined Offering Plan (unassigned offerings distributed "according to a pre-arranged formula"), Calendar of Offerings, and Personal Giving Plan. Under Calendar/Personal Giving, mission offerings "are to be passed on in their entirety to the conference … No mission funds may be retained" (pp. 91–92, 150).
- **Local church funds** — "church expense, building and repair funds, and the fund for the poor and needy… disbursed by the treasurer only by authorization of the board or business meeting" (p. 92). These stay 100% local.
- **Purpose restriction** — "Neither the treasurer nor the board has the authority to divert any funds from the objective for which they were given" (p. 93).
- **Tithe sharing upward** — the conference "sends the union the part belonging to the union, the division, and the GC" (Accounting Manual §2002.02.01, "Tithe Sharing"); the specific percentages live in **GCWP V 14** and division policy (not public).
- **Reporting** — monthly remittance to conference (Church Manual p. 91); "quarterly reports to be presented to the church members" and an annual report on systematic tithe/offering proportions (p. 153); the conference-level **Use of Tithe Report** is annual, per GCWP V 20 (Accounting Manual §2002.01). Glossary: *Remittance* = "a payment from a smaller geographic unit to a larger geographic unit" (Accounting Manual ch. 27).

**Theobase spec** (`finance-module.md`, `CONTEXT.md`):

- "Flat fund chart; each fund: name, type ∈ {tithe, offering}, split `{local%, upward%}`."
- "Multi-level remittance (mission → union → division → GC) is out of v1" (ADR-0008).

**Verdict: DIVERGE.**

- **Tithe has no local component** — policy is 100% upward, held in trust. A fund chart with a `{local%, upward%}` split on tithe would let a church misclassify what policy says must never be touched. The split concept is wrong for tithe.
- **Splits are not a universal per-fund property.** They depend on the **offering plan** (Combined = division-voted formula; Calendar/Personal Giving = 100% up for mission funds) and on **division policy**. Theobase's single global `{local%, upward%}` on each fund is a simplification that does not match how policy actually allocates.
- **The v1 scope (conference = storehouse; above-conference read-only) is defensible** — it matches "local church → conference → 100%," and deferring conference→union→division→GC percentages (which live in the non-public Working Policy) is honest. But it should be framed as "local church remits 100% to conference," not as a per-fund split.
- **Omission:** the purpose-restriction rule ("no diversion from the objective for which given") and the monthly-remittance cadence are policy obligations the spec does not name. Quarterly/annual reports to the *church members* (p. 153) are omitted alongside the monthly conference report.

---

## Sources

1. **Seventh-day Adventist Church Manual**, 21st ed., revised 2025, General Conference Secretariat. PDF: `https://gc.adventist.org/wp-content/uploads/2025/10/Seventh-day_Adventist_Church_Manual-2025-10-13.pdf`. Pages cited inline (Membership 51–64; Discipline 65–76; Officers 77–95; Business Meetings 139; Church Board 140–143; Finance 146–153).
2. **Accounting Manual 2025** — *Financial Management in Seventh-day Adventist Church Organizations*, General Conference Treasury, July 2025. PDF from `https://treasury.adventist.org/accountingmanual` (download: `https://hope-documents.fra1.digitaloceanspaces.com/683eefc43a6d554a2303947d/Pwe1754927828121.pdf`). Sections cited: §103 (governing committee), §104 (CFO/treasurer; GCWP D 20 05 Model Bylaws), ch. 3 (internal control / separation of duties; GCWP S 04 25, S 34 05, E 85), ch. 20 (§2001.01 Tithe, §2001.02 Storehouse, §2002.01 Use of Tithe Report / GCWP V 20, §2002.02.01 Tithe Sharing), ch. 27 (Glossary).
3. **General Conference Secretariat — Resources** (`https://secretariat.adventist.org/resources`) — confirms the Working Policy is *not* distributed publicly ("only distributed through the divisions to the administrative entities").

## Unverified

- **General Conference Working Policy** — not publicly available (see §Sources 3). The exact **tithe-sharing percentages** between conference → union → division → GC (GCWP **V 14**, "Tithe Sharing") and the **Use of Tithe Report** categories (GCWP **V 20**) could not be read from a primary source. Unofficial mirrors exist (e.g. a 2019–2020 GCWP PDF on third-party sites) but were deliberately not used for authoritative claims.
- **Division / union working policies** (e.g. Trans-Pacific Union Mission / South Pacific Division; the "Fiji-Mission" seed the specs reference) — not public; they determine which **offering plan** applies and the Combined Offering formula. This is exactly the policy feed the specs admit doesn't exist yet (ADR-0013).
- **Conference statistical report form** (the "F49" statistical form referenced in Accounting Manual §805) — its field list was not retrieved; the quarterly/annual clerk reporting cadence is confirmed by the Church Manual (pp. 90, 153) but the form itself was not.

## Gaps to fix (summary)

1. **`marked-missing` is a church vote, not a board action** — move it off Church Board and add the two-year "unable to locate" precondition; the board may only recommend.
2. **Death needs no authorizing act** — the clerk records it; requiring a vote would block a policy-permitted act.
3. **Removal splits into two paths** — disciplinary removal (church business-meeting vote, majority, two-week notice) vs. resignation (board records it). Collapsing them is wrong.
4. **Transfer: remove "cancellable back to Missing."** Replace with policy's real model — member stays on the granting roll until the return cert arrives; letter lapses at six months; unaccepted letters leave membership with the granting church.
5. **Cash count: the "two unrelated counters" rule is invented and stricter than policy.** Policy is treasurer + another officer (preferably deacon/deaconess). Either relax to policy's floor or explicitly brand the "unrelated" constraint as a Theobase hardening, not compliance.
6. **Offices: drop or rename "Counter"; rename "Head Elder" → "First Elder"; add "Deaconess"** (a named counting participant) and distinguish pastor vs. elder.
7. **Funds: tithe has no local split (100% upward).** Re-model remittance as "local church → conference = 100%; above-conference splits from GCWP V 14" rather than a per-fund `{local%, upward%}` property.
8. **Omissions:** censure event (with its transfer block), purpose-restriction ("no diversion") rule, monthly-remittance cadence, and the quarterly/annual reports to church members.
