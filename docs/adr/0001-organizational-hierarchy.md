# Organizational Hierarchy Mirrors SDA Polity

The system's data model uses the full SDA organizational hierarchy: Local Church → District → Mission → Conference → Union → General Conference. Each level has distinct financial authority, reporting obligations, and tithe ownership rules.

**Key principle:** Local Churches never own tithe. They are custodians; ownership transfers to the Conference/Mission at the moment of collection. This is non-negotiable SDA Working Policy.

**Consequences:**
- Permissions and data visibility are hierarchical (a Mission treasurer sees all churches in the Mission, but a church treasurer sees only their own church)
- Remittance flows are unidirectional (upward for tithe, split for offerings)
- Reports must support multiple recipients at different hierarchy levels
- Multi-tenant isolation aligns with organizational boundaries (each Mission/Conference is a tenant)
