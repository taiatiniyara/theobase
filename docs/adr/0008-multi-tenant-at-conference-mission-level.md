# Multi-tenant at the conference/mission level

The tenant boundary is the Conference/Mission. Each conference or mission is an isolated tenant with its own data, policy, users, and org subtree. Levels above — union, division, and the General Conference — are not tenants themselves but see read-only, aggregated views across the conferences and missions beneath them. The pilot is a single tenant: Fiji Mission.

We chose this boundary because it matches the denomination's real data-ownership reality: a conference or mission owns its churches' data, while higher levels consume aggregates.

Consequence: data isolation, authentication, and policy are scoped per tenant. Upper-level reporting (union/division/GC) is cross-tenant aggregation and read-only.
