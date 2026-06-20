# 005 — Boardroom Management Ledger

**Status: Implemented** (API endpoints + page exist; acceptance criteria need review)

## What to build

A clerk builds a board meeting agenda from templates, records attendance and quorum, takes minutes collaboratively in real time via the Durable Object, records numbered board decisions with mover/seconder/vote outcome, and searches the archive of all past decisions. The minute editor supports two offline editors producing revision forks that reconcile online.

## Acceptance criteria

- [ ] Drizzle schema: `board_meeting` (date, agenda, status, congregation_id), `board_minute` (meeting_id, content, revision_number, author_id), `board_decision` (meeting_id, number, title, description, mover_id, seconder_id, vote_outcome)
- [ ] BoardroomDO: one DO per congregation, multiplexes WebSocket channel `board`
- [ ] DO RPC `createMeeting(agenda)` → returns meeting_id
- [ ] DO RPC `startMinute(meetingId)` → creates initial empty minute
- [ ] DO RPC `editMinute(meetingId, operations)` → applies edit, broadcasts to all connected clients
- [ ] DO RPC `recordDecision(meetingId, decision)` → records numbered decision
- [ ] Revision-based merge: concurrent offline edits produce competing revisions; next online editor sees conflict UI and resolves
- [ ] Hono endpoint `GET /board/meetings` — list past meetings
- [ ] Hono endpoint `GET /board/meetings/:id` — full meeting with minutes and decisions
- [ ] Hono endpoint `GET /board/decisions/search?q=...` — full-text search across decisions
- [ ] WebSocket auto-reconnect with exponential backoff in PWA
- [ ] Test: clerk creates meeting → adds agenda items → takes minutes → records decisions → search finds decision
- [ ] Test: two clerks edit same minute offline → sync → conflict appears → resolution works
- [ ] Test: DO hibernates → wakes → reloads state from D1 → WebSocket reconnects

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
- 003 — Congregation Setup & Officer Management
