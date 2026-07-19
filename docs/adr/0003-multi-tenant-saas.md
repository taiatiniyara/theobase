# Multi-Tenant SaaS Deployment Model

The platform is a single multi-tenant SaaS instance serving all Conferences and Missions, not a single-tenant deployment for Fiji alone. Each Conference/Mission is a tenant with isolated data.

**Rationale:** The SDA organizational structure is hierarchical and replicated worldwide. A multi-tenant model allows reuse across Missions, simplifies maintenance, and creates a reusable asset for the global church.

**Consequences:**
- Tenant isolation is critical (data leakage between Conferences is unacceptable)
- Onboarding workflow needed for new Conferences/Missions
- Configuration must support per-tenant customization (offering plan splits, fiscal year, currency)
- Billing model (if any) is per-tenant, not per-user
