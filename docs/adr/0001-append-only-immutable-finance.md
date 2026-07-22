# Append-only immutable finance

Finance data in Theobase is append-only: every transaction (tithe receipt, offering, expense, forwarding) is a separately recorded immutable entry. No transaction is ever edited or deleted — corrections are new entries that reference the original.

**Why:** The SDA Church Manual requires dual-custody on all funds and annual audit of church records. An editable financial ledger would undermine the audit trail because a bad actor could silently modify past entries. Append-only guarantees that every action leaves a permanent, verifiable record.

**Considered alternative:** Standard mutable transactions with soft-delete — entries could be edited with an audit log recording the change. Rejected because (a) the audit log too could be tampered with if it lived in the same mutable system, (b) the Church Manual's dual-custody requirement implies that once two people confirm a batch, it is final and should not be revisable, and (c) append-only is simpler — no "edit" or "delete" logic means fewer code paths to secure.
