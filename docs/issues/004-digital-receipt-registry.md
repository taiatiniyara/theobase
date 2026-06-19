# 004 — Digital Receipt Registry

## What to build

A member uploads a screenshot of their bank transfer, specifies the fund split (tithe, church budget, Pathfinders, etc.), and the app validates the split matches the receipt total. The treasurer sees a verification queue and approves or rejects each submission with one click. Receipt images are stored in R2.

## Acceptance criteria

- [ ] Drizzle schema: `receipt` table (amount, image_key, fund_split JSON, status enum, member_id, congregation_id, verified_by, verified_at)
- [ ] Hono endpoint `POST /receipts` — multipart upload, accepts image + fund split JSON, validates total matches split sum, stores image in R2, records in D1
- [ ] Hono endpoint `GET /receipts` — returns paginated list of receipts for the congregation (member sees own, treasurer sees all)
- [ ] Hono endpoint `GET /receipts/:id` — returns single receipt with image URL (R2 pre-signed)
- [ ] Hono endpoint `POST /receipts/:id/verify` — treasurer approves or rejects with optional note
- [ ] Fund split validation: split total must equal receipt amount; allowed categories: tithe, church_budget, pathfinders, sabbath_school, adra, dorcas, health, other
- [ ] R2 upload: resize image client-side before upload (max 2MB), generate unique key `{congregation_id}/{year}/{receipt_id}.jpg`
- [ ] Test: member uploads receipt → treasurer sees it in queue → treasurer approves → member sees verified status
- [ ] Test: fund split mismatch returns validation error
- [ ] Test: member from different congregation cannot access receipt

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
