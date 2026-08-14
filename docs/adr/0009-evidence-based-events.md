# Evidence-based events

Every event in theobase carries verifiable evidence before it is accepted: a cash count carries its dual signatures, a deposit carries its bank-slip photo, a disbursement carries its invoice or receipt photo, and a membership event carries its authorizing act (vote date or letter). No event is recorded without evidence. We chose this as the fraud defence: because offline-first means the server cannot verify the physical reality of an event, evidence — captured at the source by the person who performed the act — is the primary deterrent and the audit's primary proof.

Consequence: evidence capture must be near-zero-effort (one tap to photograph, nothing typed) or it will be skipped, undermining both the anti-fraud goal and the radical-simplicity principle (ADR-0005). Evidence is stored immutably with its event and cannot be edited after the fact.
