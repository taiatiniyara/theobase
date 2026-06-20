# Passwordless email authentication

## Status: Accepted (partial — 2FA escalation not yet implemented)

Users log in with a magic link or one-time code sent to their email address. No
passwords are stored. The platform issues a short-lived JWT in an httpOnly
cookie for session management.

**Why:** Theobase's primary volunteers are elderly church members in developing
regions. Password management is a known barrier — forgotten passwords generate
support tickets and lock volunteers out on Sabbath morning. Email-based auth
leverages the one digital tool virtually every church officer already has and
checks. No password database eliminates an entire class of security
vulnerabilities.

**Future:** A second email code escalation for roles handling financial or
confidential data (treasurers, clerks, nominating committee members) is planned
but not yet implemented. Currently, all roles receive immediate session issuance
upon magic-link verification.

**Rejected:** Username/password (accessibility and security burden).
Federated/Google sign-in (not universal; many volunteers don't have Google
accounts). Phone/SMS OTP (costs money per message and does not reach every
volunteer; email is more universal).
