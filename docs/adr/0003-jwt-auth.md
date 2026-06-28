# Email/password JWT auth for Phase 1

Phase 1 authentication uses email + password with JWT tokens, not SSO. The Worker authenticates credentials and issues a long-lived JWT. Offline, the PWA validates the JWT signature locally. SSO (Google, Adventist Account, OIDC) is deferred to P2 and will layer on top by also issuing JWTs from those providers.
