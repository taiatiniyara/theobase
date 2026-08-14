# Compliance by construction

Theobase encodes the denomination's official policies — the Working Policy, Church Manual, and Accounting Manual — directly into the system, so that compliance is enforced by the software rather than by human diligence, and as much clerical work as possible is automated away from the human user. A church treasurer should not be able to invent a fund category, misapply a remittance split, or miss a reporting deadline, because the system will not let them.

Trade-off: the system is deliberately less flexible than a general ledger. It cannot represent arbitrary workflows, because that flexibility is exactly where non-compliance crept in.

Consequence: policy is not static — fund charts, offering calendars, remittance percentages, and reporting schedules change over time. These must be represented as versioned, updatable data rather than hard-coded, or every policy change becomes a software release.
