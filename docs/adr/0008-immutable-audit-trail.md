# Immutable audit trail

Every significant domain event — membership changes, financial transactions, board motions, incident reports — is stored with an append-only audit trail recording who did what, when, and with what approvals. Records are never updated in place; corrections are made by superseding events that reference the original. This is a domain-level constraint flowing from the church's governance and financial compliance requirements, not a technical preference.
