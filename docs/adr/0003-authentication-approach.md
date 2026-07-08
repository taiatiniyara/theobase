# ADR 0003: Authentication Approach

## Status

Accepted

## Context

The system needs to authenticate users across multiple organizational levels (Church, Conference, Union, Division, General Conference). Users range from tech-savvy admins to volunteer church clerks who may forget passwords frequently.

## Decision

Implement a multi-method authentication system:

- **Email/password** for initial login and users who prefer traditional auth
- **Magic links** (passwordless) for users who forget passwords or prefer simpler auth
- **SSO integration** (LDAP, Azure AD, Google Workspace) for Conferences/Unions with existing directories
- **Multi-factor authentication (MFA)** required for admins, optional for regular users
- **Session management** with remember-device and auto-logout after inactivity

## Alternatives Considered

### Password-only authentication

- Pros: Simple to implement, familiar to all users
- Cons: Password fatigue for volunteer users, higher support burden for password resets, less secure

### Magic links only (fully passwordless)

- Pros: No passwords to forget, more secure (no password storage), simpler user experience
- Cons: Requires email access, may not work for all users (e.g., shared computers), less familiar

### SSO only

- Pros: Centralized identity management, no separate credentials to manage
- Cons: Requires each Conference/Union to have a directory, not feasible for all users, complex to implement

## Consequences

### Positive

- Flexible authentication methods to suit different user preferences
- Reduced password reset burden for volunteer users
- Integration with existing corporate directories where available
- MFA for admins provides additional security for privileged access
- Familiar email/password option for users who prefer it

### Negative

- More complex authentication system to implement and maintain
- Need to support multiple auth flows (password, magic link, SSO)
- Session management adds complexity
- MFA implementation requires additional infrastructure (SMS, authenticator app)

## Related Decisions

- ADR 0004: RBAC with Row-Level Security
- ADR 0001: Hierarchical Organizational Model
