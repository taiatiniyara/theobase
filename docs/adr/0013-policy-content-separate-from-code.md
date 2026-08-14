# Policy content is distributed separately from code

The denomination's policy content — fund charts, offering calendars, and remittance percentages (ADR-0004) — is the denomination's intellectual property and is not open-sourced. It ships as a separate versioned data package, distributed and updated through the operated SaaS or a feed, distinct from the AGPL-licensed code that interprets it. This keeps third-party IP out of the open repository while preserving the compliance-by-construction guarantee (ADR-0003) that every unit operates under the correct policy.

Consequences: a policy change is a distribution operation, not a code release; the policy-data feed is the one component only the operated SaaS keeps current.
