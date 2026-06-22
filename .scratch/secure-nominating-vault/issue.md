# 023 — Secure Nominating Vault

**Status: Implemented** (API endpoints + page exist; acceptance criteria need review)

## What to build

A completely confidential digital ballot box for the annual or biennial nominating committee process. Tracks officer role candidates, invitations sent, acceptance/decline responses, and final ballot results. Operates under strict encryption and access isolation — only nominating committee members can view or interact with the vault.

## Acceptance criteria

- [ ] Drizzle schema: `nominating_session` (congregation_id, year, status, opened_by, closed_at), `nominating_role` (session_id, role_type, status: open → nominated → invited → accepted → declined → confirmed), `nominating_candidate` (role_id, person_id, nominated_by), `nominating_ballot` (candidate_id, voter_id, vote: yes|no|abstain, cast_at)
- [ ] NominatingDO: one DO per nominating session, access strictly scoped to committee member list
- [ ] DO RPC `openSession(roles)` — clerk opens session with list of roles to fill
- [ ] DO RPC `nominate(roleId, personId)` — committee member nominates a candidate
- [ ] DO RPC `invite(candidateId)` — sends confidential email invitation to candidate
- [ ] DO RPC `respond(candidateId, response)` — candidate accepts or declines (via secure link)
- [ ] DO RPC `castBallot(candidateId, vote)` — committee member votes
- [ ] DO RPC `closeSession()` — finalizes results, session becomes read-only
- [ ] Encryption: ballot data encrypted at rest in D1; committee member list validated against JWT claims
- [ ] Access isolation: non-committee members receive 403 on all nominating endpoints
- [ ] Real-time: committee members see nomination status changes live via WebSocket
- [ ] Hono endpoint `GET /nominating/sessions/:id/results` — read-only results (available after session closed)
- [ ] Test: open session → nominate candidates → invite → candidate accepts → ballot → close → results publish
- [ ] Test: non-committee member cannot access any nominating data
- [ ] Test: past session results are read-only

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
