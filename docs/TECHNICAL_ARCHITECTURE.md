# Technical Architecture — Theobase Global Church Utility Platform

## 0. Design Principles

| Principle | Implication |
|-----------|-------------|
| **Offline-First** | Every write must succeed locally; sync is deferred and atomic. No feature may block on network. |
| **Bandwidth-Minimal** | Sync payloads use compressed differentials, not full-document replacements. Initial app download under 5 MB. |
| **Cost-Efficient** | Infrastructure must scale to thousands of churches at sub-dollar per-church monthly hosting cost. |
| **Privacy by Default** | Member PII encrypted at rest; regional data residency honored; RBAC enforced at the database row level. |
| **Volunteer-Usable** | Interfaces designed for non-technical users on 5-year-old Android phones. No training required. |

---

## 1. Technology Stack

### 1.1 Frontend — Progressive Web Application (PWA)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **React 18 + TypeScript** | Largest ecosystem, mature PWA tooling, wide hiring pool |
| Bundler | **Vite** (with `vite-plugin-pwa`) | Fast builds, excellent Workbox integration, small output |
| UI Components | **Tailwind CSS + Radix UI primitives** | Small CSS footprint (purged), accessible headless components |
| State Management | **Zustand** (global) + **TanStack Query** (server state) | Lightweight (2 KB), works offline with persistence middleware |
| Offline Storage | **Dexie.js** (IndexedDB wrapper) | Reliable cross-browser IndexedDB, observable queries |
| Sync Engine | **Automerge** (CRDT) | Merge conflicts automatically without server arbitration |
| OCR (Tithe Camera) | **Tesseract.js v5** | Runs entirely client-side, works offline, supports 100+ languages |
| Sunset Calculation | **suncalc** | Client-side astronomical calculation; no API call, works offline |
| i18n | **react-i18next** | Mature, lazy-loads locale files, RTL support |
| Testing | **Vitest** (unit) + **Playwright** (E2E) | Vite-native, fast, covers offline scenarios |

**Initial app download target**: ≤ 4 MB (gzipped), asset caching via service worker.

### 1.2 Backend — Edge-Native API

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | **Cloudflare Workers** | Global edge deployment, zero cold starts for low-traffic churches, pay-per-request pricing fits $7/church |
| Framework | **Hono** | Lightweight (13 KB), runs on Workers/Node/Bun, built-in RPC for type-safe client |
| Database | **Cloudflare D1** (SQLite at edge) | Row-level multi-tenancy, read replicas near users, no per-database cost |
| File Storage | **Cloudflare R2** | Zero egress fees (critical — photo upload/download is the largest bandwidth cost), S3-compatible API |
| Real-Time | **Cloudflare Durable Objects** | WebSocket stateful sessions, exactly-once delivery, ideal for Pulpit-to-AV and live-sync |
| Auth | **Lucia Auth v3** | Framework-agnostic, session-based (no JWT size overhead on slow connections), supports OAuth2 and magic links |
| Email/SMS | **Resend** (email) + **Twilio** (SMS) | Usage-based pricing, global delivery |
| API Style | **REST + JSON** (primary), **Server-Sent Events** (for live notifications) | REST is cacheable via service worker; SSE is simpler than WebSockets for one-way notification streams |
| Monitoring | **Sentry** (errors) + **Cloudflare Analytics** (performance) | |

**Why not PostgreSQL?** Running a globally distributed Postgres cluster at $7/church is uneconomical. D1 provides read replicas near every church's region at zero marginal cost per database. If richer querying is needed later, D1 databases can be replicated to a central Postgres for analytics.

### 1.3 Mobile Strategy — PWA, Not Native

A PWA is chosen over native iOS/Android because:

1. **Single codebase** across all platforms (desktop, tablet, mobile)
2. **No app store approval** — churches can install from a URL instantly
3. **Automatic updates** via service worker — no user action needed
4. **Full offline capability** via service worker caching + IndexedDB
5. **"Add to Home Screen"** gives native-feeling installation on both iOS and Android

The PWA will request **persistent storage** permission to prevent browsers from evicting IndexedDB data during low storage.

---

## 2. Offline-First Data Architecture

### 2.1 Sync Protocol — CRDT via Automerge

Each church's data is modeled as a collection of **Automerge documents**. When a volunteer makes a change:

```
[Offline] Local IndexedDB write → CRDT change recorded
     ↓ (network returns)
[Online]  Compressed binary diff → Worker endpoint
     ↓
[Server]  Apply diff → Merge with concurrent changes → Store in D1
     ↓
[Server]  Broadcast updated document hash → other connected clients
     ↓
[Clients] Pull latest document → merge into local Automerge state
```

**Conflict resolution**: Automerge's CRDT guarantees that all concurrent edits converge to the same state without server arbitration. For example, if two treasurers approve the same donation while offline, both approvals are preserved and the UI shows a "double-approved" state that either can resolve.

### 2.2 Sync Scope — Per-Church, Not Per-User

Each volunteer's device stores only their **own church's** data, not all churches. The initial sync downloads:

| Data | Approximate Size | Sync Strategy |
|------|-----------------|---------------|
| Member profiles | ~50 KB (500 members) | Full on first login, diffs thereafter |
| Current duty rota (8 weeks) | ~20 KB | Full + diffs |
| Open donation receipts (unapproved) | ~100 KB (images thumbnailed) | Full list, images lazy-loaded |
| Recent board minutes (12 months) | ~200 KB | Summaries full, full text on-demand |
| Attendance registers (current quarter) | ~50 KB | Full + diffs |
| Pathfinder progress (current year) | ~30 KB | Full + diffs |

**Total initial download**: ~500 KB (well within the 5 MB budget).

**Background sync**: Uses the **Periodic Background Sync API** where supported (Chromium-based browsers), falling back to sync-on-app-open. Sync payloads are gzipped binary Automerge diffs, typically < 5 KB.

### 2.3 Conflict UX

When concurrent edits cannot be automatically resolved (e.g., two volunteers delete the same member profile):

1. Both versions are preserved locally
2. On next sync, the app surfaces a **"Needs Your Attention"** badge
3. The conflict resolver shows side-by-side diffs with one-click resolution
4. Resolved state merges cleanly into the CRDT document

---

## 3. Multi-Tenancy Model

### 3.1 Church Isolation

Each church gets a **separate D1 database** (SQLite file). This is D1's native model and provides:

- **Hard isolation**: No query can accidentally cross churches
- **Regional placement**: Each D1 database is placed in the region closest to the church's physical location
- **Independent scaling**: A 5,000-member church doesn't affect a 50-member church
- **Per-database backup**: Granular restore

### 3.2 Cross-Church Features (District Hub #16)

For features that span multiple churches (pastoral districts, regional crisis matrix):

- A separate **District D1 database** stores denormalized summaries from each church
- A **daily cron** (Cloudflare Worker Cron Trigger) aggregates anonymized/authorized data
- No direct cross-church queries — all cross-church access goes through the district database

### 3.3 Data Residency

D1 databases are created in the **Cloudflare region** closest to the church's physical address:

| Church Location | D1 Region |
|-----------------|-----------|
| Oceania (Fiji, Samoa, PNG) | Asia-Pacific (Sydney) |
| Sub-Saharan Africa | Europe (London) or Africa (Johannesburg) |
| North America | North America (Ashburn) |
| Europe | Europe (London/Frankfurt) |
| Asia | Asia-Pacific (Singapore/Tokyo) |

This satisfies GDPR and regional privacy laws by keeping data within geographic boundaries.

---

## 4. Authentication & Authorization

### 4.1 Authentication Flow

```
[Volunteer] → Email magic link / SMS OTP → Verify → Session cookie (httpOnly, Secure, SameSite=Strict)
```

- **No passwords**: Magic links (email) and OTP codes (SMS) are more accessible for non-technical users and eliminate password-reset support burden
- **Session duration**: 30 days (volunteers shouldn't log in every week)
- **Offline auth**: Session token cached in IndexedDB; app works offline as long as the session was valid at last online check

### 4.2 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| **Church Admin** (typically Clerk) | Full CRUD on all church data; manage roles; view audit logs; subscription management |
| **Pastor** | View all; edit pastoral records, board minutes, district hub |
| **Treasurer** | View/approve finances; manage budgets; export reports; **cannot** edit member profiles or board minutes |
| **Head Elder / Board Chair** | View all; chair board meetings (run votes); manage duty rota |
| **Department Leader** (Youth, Pathfinder, Sabbath School, Welfare, AV) | Full CRUD on their department module; view-only on member directory |
| **Volunteer** (Deacon, Deaconess, Teacher) | View assigned duties; mark attendance for assigned classes; submit welfare notes |
| **Member** | View own profile, giving history, duty schedule; upload receipts; update contact info |

**Enforcement**: RBAC is enforced at three levels:
1. **API middleware** (Hono guard) — rejects unauthorized endpoints
2. **D1 row-level security** via `WHERE church_id = ? AND role = ?` on every query
3. **Client-side** route guards (defense in depth; real security is server-side)

### 4.3 Confidentiality Vaults

Three modules require elevated confidentiality beyond standard RBAC:

1. **Nominating Vault (#2)**: Votes are stored without voter identity. Ballots are encrypted client-side; server stores only the ciphertext. Decryption key held by the nominating committee chair.
2. **Welfare CRM (#11)**: Names of assistance recipients are stored encrypted at rest. Only welfare team members hold the per-church decryption key.
3. **Safety Shield (#4)**: Background check documents are encrypted with the church admin's key; never accessible to the subject of the check.

---

## 5. Security Architecture

### 5.1 Data Protection

| Layer | Mechanism |
|-------|-----------|
| **In Transit** | TLS 1.3 (enforced by Cloudflare edge) |
| **At Rest (Database)** | D1 encryption at rest (default) |
| **At Rest (Files — R2)** | Server-side encryption (SSE-S3) with per-church keys |
| **At Rest (Device)** | IndexedDB data encrypted via Web Crypto API with key derived from session token |
| **PII Fields** | AES-256-GCM client-side encryption for member contact details, health info, child data |

### 5.2 Threat Model

| Threat | Mitigation |
|--------|------------|
| Rogue treasurer exports member database | RBAC prevents export; audit log records all data access |
| Device stolen with offline data | IndexedDB encrypted; session token expires after 30 days; remote wipe via next sync |
| SQL injection | Hono parameterized queries; D1 uses prepared statements |
| CSRF | SameSite=Strict cookies; Origin header validation |
| Rate limiting / abuse | Cloudflare rate limiting per IP + per church |
| Credential stuffing | No passwords — magic links and OTP eliminate this entirely |

### 5.3 Audit Trail

Every mutation logs: `actor_id`, `church_id`, `action`, `resource_type`, `resource_id`, `timestamp`, `ip_hash`, `user_agent`. Audit logs are append-only (no deletion) and retained for 7 years for financial records.

---

## 6. API Design

### 6.1 Endpoint Structure

```
POST   /api/v1/auth/login              — Send magic link
GET    /api/v1/auth/callback           — Verify magic link token
DELETE /api/v1/auth/logout             — Invalidate session
GET    /api/v1/auth/session            — Current session status (works offline)

GET    /api/v1/churches/:id            — Church profile
PATCH  /api/v1/churches/:id            — Update settings (admin only)

GET    /api/v1/members                 — List members (paginated, searchable)
POST   /api/v1/members                 — Create member
GET    /api/v1/members/:id             — Member detail
PATCH  /api/v1/members/:id             — Update member
DELETE /api/v1/members/:id             — Archive member (soft delete)

GET    /api/v1/finance/receipts        — List donation receipts (treasurer)
POST   /api/v1/finance/receipts        — Upload receipt (member)
GET    /api/v1/finance/receipts/:id    — Receipt detail + image URL
PATCH  /api/v1/finance/receipts/:id    — Approve/reject (treasurer)
GET    /api/v1/finance/budgets         — Budget dashboard
POST   /api/v1/finance/expenses        — Log expense
GET    /api/v1/finance/reports         — Generate financial report

GET    /api/v1/scheduling/duties       — Current rota
POST   /api/v1/scheduling/duties       — Assign duty
PATCH  /api/v1/scheduling/duties/:id   — Accept/decline/swap
GET    /api/v1/scheduling/templates    — Recurring schedule templates

GET    /api/v1/board/meetings          — List meetings
POST   /api/v1/board/meetings          — Create meeting + agenda
PATCH  /api/v1/board/meetings/:id      — Update minutes / record vote
GET    /api/v1/board/votes/:meeting_id — Vote results (anonymized)

... (similar patterns for all 19 modules)

POST   /api/v1/sync/push              — Submit local CRDT changes (binary)
GET    /api/v1/sync/pull              — Fetch changes since last sync (binary)
POST   /api/v1/sync/complete          — Acknowledge sync round
```

### 6.2 API Principles

- **Versioned** (`/v1/`) from day one
- **CRUD-style** (not RPC) for predictability
- **Cursor-based pagination** for lists (`?after=xxx&limit=50`)
- **Compressed responses** (gzip/brotli at edge)
- **Idempotency keys** on all mutating endpoints (`Idempotency-Key` header) to survive retry on flaky connections
- **Type-safe client**: Hono's RPC generates TypeScript types automatically from server routes

---

## 7. Storage Architecture

### 7.1 Image Pipeline (Receipts, Documents, Profile Photos)

```
[Upload] → Client-side resize+compress to ≤ 500 KB WebP → Upload to R2 presigned URL
                                                              ↓
                                                         [R2 Object Storage]
                                                              ↓
                                                         Thumbnail (150px, auto-generated via Cloudflare Images)
                                                              ↓
                                                         Original accessible via signed URL (expires 1 hour)
```

- **Supported formats**: JPEG, PNG, WebP, HEIC (converted client-side)
- **Max file size**: 10 MB raw, compressed to ≤ 500 KB before upload
- **Retention**: Financial receipts retained 7 years; other documents 3 years
- **Offline**: Uploads queued in IndexedDB; user sees "Pending upload (3)" badge

### 7.2 Database Schema Overview (per-church D1 database)

```
churches          — id, name, address, timezone, locale, subscription_status, created_at
members           — id, church_id, name, email, phone, dob, baptism_date, membership_status, encrypted_pii
roles             — member_id, role, granted_by, granted_at
financial_receipts— id, member_id, amount, breakdown_json, image_r2_key, status, approved_by, approved_at
financial_budgets — id, department, allocated, spent, fiscal_year
financial_expenses— id, budget_id, amount, description, receipt_r2_key, authorized_by_board_meeting_id
board_meetings    — id, date, agenda_json, minutes_md, status
board_votes       — id, meeting_id, motion_text, vote_count_yes/no/abstain, result, encrypted_ballots
duty_rota         — id, date, role, member_id, status (assigned/accepted/declined/swapped)
safety_clearances — id, member_id, clearance_type, issued_date, expiry_date, document_r2_key, verified_by
pathfinder_progress— id, member_id, class_level, honor_badge, completed_date, instructor_id
sabbath_school    — id, date, division, teacher_id, attendance_json, lesson_topic
welfare_cases     — id, encrypted_recipient_name, assistance_type, notes, pantry_items, status
evangelism_contacts— id, name, contact_info, stage, assigned_to, last_contacted
communion_plan    — id, date, room_setup_json, volunteer_assignments, inventory_items
facility_bookings — id, facility, date, requested_by, purpose, policy_check_passed, board_approved
district_churches — (in district database) church_id, pastor_id, travel_log_json
crisis_assets     — id, church_id, asset_type, description, status, last_verified
audit_log         — id, actor_id, action, resource_type, resource_id, timestamp, metadata_json
```

---

## 8. Real-Time Infrastructure

### 8.1 WebSocket Architecture (Pulpit-to-AV #15, Live Notifications)

```
[Pulpit Tablet] ←──WebSocket──→ [Durable Object (per-church session)]
                                         ↕
[AV Booth Tablet] ←──WebSocket──→ [same DO instance]
                                         ↕
[Treasurer Desktop] ←──WebSocket──→ [same DO instance] (notification stream)
```

- **Durable Objects** maintain in-memory state per church, receiving sync events and broadcasting to connected clients
- **Exactly-once delivery**: DOs run on a single thread, eliminating race conditions
- **Fallback**: If WebSocket fails (firewall, proxy), the client polls `GET /api/v1/sync/pull` every 15 seconds

### 8.2 Notification Channels

| Priority | Channel | Example |
|----------|---------|---------|
| Real-time | WebSocket (in-app badge) | "Duty swap requested" |
| Near-time | SSE (in-app toast) | "Receipt approved" |
| Async (offline) | SMS (Twilio) | "You're on rota tomorrow 9 AM" |
| Async (offline) | Email (Resend) | Weekly board meeting minutes digest |

---

## 9. Deployment & DevOps

### 9.1 Infrastructure as Code

| Component | Tool |
|-----------|------|
| Workers + D1 + R2 + DO | **Wrangler** (`wrangler.toml` / `wrangler.jsonc`) |
| CI/CD | **GitHub Actions** — deploy on merge to `main` |
| Environment stages | `dev` → `staging` → `production` |
| Secrets | Cloudflare Secrets Store (`wrangler secret put`) |

### 9.2 Monitoring & Alerting

| Signal | Tool | Alert Threshold |
|--------|------|-----------------|
| API error rate | Sentry | > 1% of requests |
| Worker CPU time | Cloudflare Analytics | > 30ms p99 |
| Sync failures | Custom metric (logged to D1) | > 5% of sync attempts |
| D1 query latency | Cloudflare Analytics | > 100ms p95 |
| R2 bandwidth | Cloudflare Analytics | Budget alert at 80% of free tier |
| Uptime | Cloudflare Health Checks | < 99.5% monthly |

### 9.3 Backup & Disaster Recovery

| Component | Backup Strategy | RPO | RTO |
|-----------|----------------|-----|-----|
| D1 databases | D1 automatic point-in-time recovery + daily export to R2 | 24h | < 1h |
| R2 objects | Multi-region replication (R2 managed) | 0 | < 5m |
| Worker code | Git repository + wrangler rollback | 0 | < 5m |

---

## 10. Tesseract OCR Integration (Tithe Camera #6)

The Tithe Envelope Camera Assistant runs entirely client-side:

```
[Photo taken] → Canvas resize (1080px max width) → Tesseract.recognize()
                                                       ↓
                                            Extracted text: name, amounts
                                                       ↓
                                            Regex parsing → structured fields
                                                       ↓
                                            User reviews → taps to correct → Submit
```

- **Accuracy target**: ≥ 85% for printed text, ≥ 70% for legible handwriting
- **Fallback**: If confidence < 60%, the field is highlighted in yellow and the user must manually enter
- **Language packs**: English, French, Spanish, Portuguese pre-loaded; others lazy-loaded on demand
- **Offline**: Tesseract language packs are cached in the service worker (~2-4 MB per language)

---

## 11. Sunset Calculation (Sabbath Timing #13)

The `suncalc` library computes sunset time client-side given the church's latitude/longitude. No API call needed.

```
Church config → { lat, lng, timezone }
                    ↓
              suncalc.getTimes(date, lat, lng)
                    ↓
              sunset / sunrise / dusk / dawn
                    ↓
              Sabbath window: Friday sunset → Saturday sunset
```

- **Extreme latitudes**: For churches above 60° latitude, the app falls back to a fixed clock time (6:00 PM) if suncalc cannot determine a valid sunset/sunrise
- **No notifications** are sent during the Sabbath window
- **Time display**: All times shown in the church's configured timezone

---

## 12. Cost Model (Infrastructure)

Estimated per-church monthly cost at scale:

| Resource | Free Tier | Cost per Church (at 1,000 churches) |
|----------|-----------|--------------------------------------|
| Workers requests | 10M/month | $0.003 (pooled) |
| D1 storage (5 MB/church) | 5 GB included | ~$0.001 |
| D1 reads/writes | 25B rows read included | ~$0.002 |
| R2 storage (100 MB/church) | 10 GB included | $0.0015 |
| R2 egress | Zero egress fees | $0.00 |
| Durable Objects | 1M requests included | ~$0.005 |
| **Total** | | **~$0.01-0.02 / church / month** |

At $7/church/month revenue, infrastructure cost represents < 0.3% of revenue — well within the sustainable range.

---

## 13. Development Environment

### 13.1 Local Development

```bash
# Frontend
npm run dev          # Vite dev server with HMR, PWA disabled in dev

# Backend
npx wrangler dev     # Local Workers runtime + D1 local + R2 simulated

# Full offline simulation
npx wrangler dev --offline  # No cloud dependencies, tests full offline stack
```

### 13.2 Testing Strategy

| Layer | Framework | Scope |
|-------|-----------|-------|
| Unit | Vitest | Pure functions, state reducers, CRDT merge logic |
| Component | Vitest + React Testing Library | UI components in isolation |
| Integration | Vitest + MSW (Mock Service Worker) | API interactions, auth flows |
| Offline | Playwright with `--offline` flag | Full offline → online sync cycles |
| E2E | Playwright | Critical user journeys (upload receipt → approve → report) |
| Performance | Lighthouse CI | PWA score, bundle size, load time |

### 13.3 Code Quality

| Tool | Purpose |
|------|---------|
| TypeScript strict mode | Type safety |
| ESLint + Prettier | Code style |
| Husky + lint-staged | Pre-commit checks |
| BundleWatch | Alert on bundle size regressions |
| Dependency Cruiser | Prevent circular dependencies |

---

## 14. Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| IndexedDB storage eviction by browser | Data loss on device | Persistent storage API; periodic sync as backup; warn user if storage pressure detected |
| D1 cold starts after inactivity | Slow first request | Keep-alive cron triggers every 5 minutes for churches with active subscriptions |
| Automerge document growth | Large sync payloads over time | Periodic compaction; archive documents older than 2 years to "read-only" state |
| OCR accuracy on handwritten Fijian/Hindi/Samoan names | Failed receipt parsing | Graceful fallback to manual entry; field-level confidence scores; improve training data over time |
| Durable Object memory limits | Dropped WebSocket connections | Connection recovery with exponential backoff; fallback to SSE polling |
| Browser drops service worker | Loss of offline capability | Detect SW registration failure and guide user to reload/update browser |
| iPhone PWA storage limits (iOS caps at ~500 MB per origin) | Data loss for large churches | Aggressive pagination; lazy-load images; archive old data to cloud-only with on-demand fetch |

---

## 15. Browser & Device Support Matrix

### 15.1 Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome (Android + Desktop) | 90+ | Primary target; 95%+ of Android users; full PWA support |
| Safari (iOS + macOS) | 15+ | PWA support from iOS 15; persistent storage from iOS 15.2; "Add to Home Screen" supported |
| Firefox (Android + Desktop) | 90+ | Full PWA support on Android; service worker on desktop |
| Samsung Internet | 16+ | Chromium-based; common on mid-range Android in Africa/Asia |
| Edge (Desktop) | 90+ | Chromium-based; full PWA support |

### 15.2 Unsupported / Degraded Experience

| Browser | Strategy |
|---------|----------|
| Opera Mini (common in Sub-Saharan Africa) | Not supported for offline use (no IndexedDB, no service worker); graceful degraded mode: online-only, no offline data, server-rendered fallback pages |
| KaiOS / feature phones | Not supported — require smartphone or tablet |
| Internet Explorer 11 | Not supported; redirect to upgrade page |

### 15.3 Device Targets

| Tier | RAM | Screen | Example | Performance Target |
|------|-----|--------|---------|-------------------|
| Minimum | 2 GB | 360×640 | Samsung Galaxy J2 (2015), Tecno Spark | < 1 GB storage used; < 5 MB app download; sub-2-second UI interaction |
| Recommended | 4 GB+ | 360×800+ | Samsung Galaxy A series, iPhone 7+ | Full offline capability; image uploads |

### 15.4 PWA Update Strategy

- Service worker uses **stale-while-revalidate** for app shell, **cache-first** for static assets
- New service worker installs in background → waits until all tabs closed → activates on next launch
- In-app banner: "A new version is available. Restart to update." (not forced — respect offline context)
- Critical security patches bypass wait and force-update via `skipWaiting()`

---

## 16. Email & SMS Infrastructure

### 16.1 Email Deliverability

| Component | Implementation |
|-----------|---------------|
| Sending domain | `mail.theobase.app` (separate from web domain for reputation isolation) |
| SPF | `v=spf1 include:spf.resend.com -all` |
| DKIM | 2048-bit RSA key via Resend |
| DMARC | `p=quarantine; rua=mailto:dmarc@theobase.app` (aggregate reports) |
| Custom Tracking Domain | `click.theobase.app` for open/click tracking (avoid shared reputation issues) |
| Warm-up | Gradual volume ramp over 4 weeks from 50 → 5,000 emails/day |
| Bounce handling | Resend automatically suppresses hard bounces; soft bounces retried 3× over 48 hours |
| Spam complaint rate | Monitored; alert at > 0.1%; temporary sending halt at > 0.3% |

### 16.2 Transactional Email Strategy

All emails use plain-text + HTML multipart with limited styling (no heavy images, no external fonts — many volunteers read email on slow connections). Templates include:

- Magic link login
- Duty rota reminders (weekly)
- Receipt approved / rejected
- Board meeting agenda published
- Background check expiry warning (90/60/30 days)
- Subscription renewal reminder
- "We haven't seen you" re-engagement (14 days idle)
- Passwordless — all transactional; no marketing emails unless opted in

Each template is localized via `react-i18next` on the backend rendering layer.

### 16.3 SMS Cost Strategy

| Region | Cost per SMS (Twilio) | Strategy |
|--------|----------------------|----------|
| North America | ~$0.0079 | Default for all notifications |
| Oceania (Fiji, Samoa, Tonga) | ~$0.15–$0.25 | Only for urgent notifications (duty swaps, crisis alerts); fallback to push notifications + email |
| Sub-Saharan Africa | ~$0.06–$0.12 | Used for critical notifications only |
| List of high-cost countries maintained | | SMS disabled by default; church admin can opt in |

**SMS alternatives**: Push notifications (free via service worker) are the primary notification channel. SMS is a fallback for members without smartphones or for time-sensitive alerts (last-minute rota swap, crisis alert).

---

## 17. Search Architecture

### 17.1 Search Scope

| Module | Searchable Fields | Index Method |
|--------|------------------|-------------|
| Member Directory | Name, phone, email, membership status | D1 full-text search (FTS5) |
| Board Minutes | Full text of minutes, agenda titles, motions | D1 FTS5 |
| Financial Records | Receipt amounts, member names, dates, descriptions | D1 FTS5 + range queries |
| Pathfinder Progress | Member names, honor badges, class levels | D1 FTS5 |
| Evangelism Contacts | Names, stages, notes | D1 FTS5 |

### 17.2 Implementation

- **D1 FTS5** provides full-text search within each church's database (no cross-church search needed)
- **Client-side search**: For small datasets (duty rota, attendance, current quarter records), search runs against the local Automerge document in IndexedDB for instant results offline
- **Cross-module "Global Search"**: A `/api/v1/search?q=member_name` endpoint queries FTS5 indexes across modules, returning scoped results (e.g., "Jane Tamanikaiyaroi — Member Profile, Pathfinder Friend Class, 3 financial receipts, 12 attendances")
- **Debouncing**: 300ms debounce on search input; no server round-trip for queries < 3 characters

### 17.3 Search UX

- Command palette (Ctrl+K / Cmd+K) for power users: type member name, meeting keyword, or receipt ID
- Module-specific search bars on list views
- Search results grouped by module with result counts
- Entirely optional; all data also browseable without search

---

## 18. Print & PDF Generation

### 18.1 Print CSS Strategy

All views that are likely to be printed have `@media print` stylesheets that:
- Hide navigation, sidebars, action buttons, and sync indicators
- Convert color badges to text labels
- Expand collapsed sections
- Use black text on white background
- Add page numbers and print date stamps

### 18.2 Printable Views by Module

| Module | Printable Output |
|--------|-----------------|
| Duty Rota (#3) | Bulletin insert: Saturday's schedule with names and roles |
| Boardroom (#1) | Meeting minutes with agenda, votes, attendance |
| Treasury (#5) | Budget reports, income/expense statements, fiscal year summary |
| Audit Binder (#7) | Audit-ready expense records with receipt thumbnails and board authorizations |
| Tithe Camera (#6) | Envelope count summary sheet |
| Sabbath School (#10) | Class register with attendance grid |
| Pathfinder (#9) | Individual progress reports; investiture readiness list |
| Member Directory | Church directory (contact info only; opt-in per member) |
| Communion (#14) | Volunteer assignment sheets; inventory checklist |
| Facility (#17) | Booking calendar |

### 18.3 PDF Pipeline

For formal documents (financial reports, audit binders, certificates):

- **Server-side PDF generation** via Cloudflare Worker using `@resvg/resvg-js` (SVG → PDF) or a lightweight HTML → PDF library
- Key financial reports pre-rendered to PDF and cached in R2 (1-hour TTL)
- **Certificates**: Pathfinder investiture certificates, baptismal certificates, volunteer appreciation certificates generated server-side with fillable templates
- PDFs are stored in R2 and served via signed URLs

---

## 19. Data Export & Portability

### 19.1 Member-Initiated Exports (GDPR)

Any member can export their personal data via the app → Settings → "Download My Data":

- Profile (name, contact, membership status) — JSON
- Giving history (receipts they submitted, approved amounts) — CSV
- Attendance records (Sabbath School, Pathfinders) — CSV
- Duty history — CSV

Exports are generated within 72 hours; member notified when ready.

### 19.2 Church Admin Bulk Exports

Church admins can export their church's full dataset:

| Format | Content |
|--------|---------|
| **Full JSON dump** | All church data (members, finances, minutes, attendance, etc.) — for migration to another system |
| **Church Transfer Package** | Encrypted archive of all church data — for transferring between regions or backing up locally |
| **Financial CSV** | All transactions, receipts, budgets — for conference reporting or external accounting |
| **Member Directory PDF** | Printable directory (opt-in members only) |
| **Audit Report PDF** | Combined financial report with receipt cross-references for annual audit submission |

### 19.3 Scheduled Exports

Church admins can schedule:
- Weekly financial summary (every Monday AM)
- Monthly budget report (1st of month)
- Quarterly audit binder (last day of quarter)

Scheduled exports are emailed as attachments.

### 19.4 Church Data Deletion

If a church permanently leaves the platform:
1. Admin requests full account deletion
2. System generates final complete export (JSON + PDFs) → delivered to admin
3. 30-day grace period (account in read-only)
4. Day 31: D1 database deleted; R2 objects deleted; encryption keys destroyed
5. Confirmation email sent

---

## 20. Public API & Webhooks

### 20.1 Public REST API

Available to church admins and approved third-party integrations via API keys (generated in church settings):

| Endpoint Group | Example Use Case |
|---------------|-----------------|
| `/api/v1/public/members` | Sync member directory with church website |
| `/api/v1/public/finance/reports` | Feed into conference-level accounting system |
| `/api/v1/public/scheduling` | Display rota on digital signage |
| `/api/v1/public/attendance` | Feed into denominational reporting tools |

**Rate limit**: 60 requests/minute per church. **Authentication**: Bearer token (API key). **Scopes**: Per-endpoint permissions configurable by church admin.

### 20.2 Webhooks

Churches and integration partners can subscribe to event webhooks:

| Event | Payload |
|-------|---------|
| `receipt.approved` | Receipt ID, amount, member hash, timestamp |
| `receipt.rejected` | Receipt ID, reason |
| `duty.accepted` | Assignment ID, member ID, position, date |
| `duty.declined` | Assignment ID, member ID, position, date |
| `board.meeting.published` | Meeting ID, date, agenda summary |
| `member.created` | Member ID, name hash, role |
| `clearance.expiring` | Member ID, clearance type, expiry date (30-day warning) |
| `subscription.renewed` | Church ID, renewal date, next renewal |
| `subscription.expiring` | Church ID, expiry date (7-day warning) |

**Delivery**: HTTP POST with HMAC-SHA256 signature. **Retry**: Exponential backoff over 24 hours (3× → 10× → 60× → 360 minutes). **UI**: Church admin configures webhook URL and selects events in Settings → Integrations.

### 20.3 Future Ecosystem

- **Zapier / n8n / IFTTT integration**: Phase 4 — connect Theobase events to 5,000+ other apps
- **Denominational API adapters**: Read-only feeds for ACMS, eAdventist (Phase 3)
- **Public OData / GraphQL endpoint**: Phase 4 for advanced reporting

---

## 21. Calendar Integration

### 21.1 iCal Feed (Read-Only)

Each church has a read-only iCal URL for external calendar apps:

```
https://api.theobase.app/v1/churches/{id}/calendar.ics
```

Feeds include:
- Duty rota assignments (per member: "You're on Scripture Reading")
- Facility bookings
- Board meeting dates
- Preaching calendar (Pastoral District Hub)
- Communion service dates
- Pathfinder events and campouts

Church members subscribe by adding the URL to Google Calendar, Outlook, or Apple Calendar. The feed auto-updates every time data syncs.

### 21.2 Google Calendar / Outlook Sync

For two-way sync (Phase 3+):
- **Google Calendar API**: Church admin connects their church Google account → events created in Theobase appear in Google Calendar and vice versa
- **Microsoft Graph API**: Same for churches using Outlook/Exchange
- Conflict resolution: Theobase is the source of truth for rota assignments; external calendar changes to Theobase-managed events are ignored

---

## 22. Content Moderation

Uploaded images (receipt screenshots, profile photos, documents) must be scanned to prevent abuse:

| Content Type | Moderation Method |
|-------------|------------------|
| Profile photos | Client-side resize → upload → Cloudflare Image Classification (NSFW detection) → flag for admin review if confidence < 90% |
| Receipt screenshots | Virus/malware scan via ClamAV (server-side); no human review (financial documents are private) |
| Uploaded documents | Malware scan; file type verification (reject executables, scripts) |
| Member-generated text | Not moderated (churches self-govern); abuse reporting tool available to church admins |

**Rejected content**: User receives notification: "Your upload could not be processed. Please try a different image." No reason given for security rejections. Church admin can override on review.

---

## 23. Penetration Testing & Security Audits

### 23.1 Testing Cadence

| Activity | Frequency | Performed By |
|----------|-----------|-------------|
| Automated vulnerability scanning | Weekly | GitHub Dependabot + Cloudflare security center |
| External penetration test | Annually | Third-party firm (e.g., Cure53, Bishop Fox) |
| Internal security review | Per-release | Lead engineer (OWASP Top 10 checklist) |
| Dependency audit | Per-commit (CI) | `npm audit`, Dependabot alerts |
| Cloudflare configuration review | Quarterly | Infrastructure-as-code review |

### 23.2 Vulnerability Disclosure Program (VDP)

- **Scope**: `*.theobase.app`, theobase API, PWA
- **Reporting**: `security@theobase.app` (PGP key published)
- **Response target**: Acknowledge within 48 hours; triage within 5 business days
- **Safe Harbor**: Good-faith researchers protected from legal action
- **Hall of Fame**: Recognition page (optional, by researcher consent)
- **Bug bounty**: Not at launch; evaluated at 1,000+ churches

### 23.3 SOC 2 / ISO 27001

Not pursued at launch (cost-prohibitive for a $7/mo product). Evaluated at the enterprise/bulk-license stage when conferences require compliance evidence. In the interim, the SOC 2 Trust Services Criteria are used as an internal security framework.

---

## 24. Scale Limits & Breaking Points

### 24.1 Current Architecture Scalability

| Component | Resource Limit (Free Tier) | At 1,000 Churches | At 10,000 Churches | Breaking Point |
|-----------|---------------------------|-------------------|--------------------|----------------|
| Workers requests | 10M/month included | ~3M/month | ~30M/month | 100M/month (then $0.30/M) |
| D1 databases | 50,000 per account | 1,000 | 10,000 | Per-account limit (50K) — well beyond targets |
| D1 storage | 5 GB included | ~5 GB (5 MB × 1K) | ~50 GB (5 MB × 10K) | At ~1,000 churches, upgrade to paid D1 ($0.75/GB) |
| D1 reads | 25B rows/month included | ~50M/month | ~500M/month | Well within limits |
| R2 storage | 10 GB included | ~100 GB | ~1 TB | At ~100 churches, upgrade to paid R2 ($0.015/GB) |
| R2 egress | Zero fees | $0 | $0 | No breaking point (zero egress is permanent) |
| Durable Objects | 1M requests included | ~2M/month | ~20M/month | Upgrade to paid ($0.15/M requests) |

### 24.2 Mitigations for Scale

- **At 5,000+ churches**: Move to dedicated Cloudflare Enterprise plan with negotiated pricing
- **At 10,000+ churches**: Evaluate regional D1 sharding; split churches across multiple Cloudflare accounts per continent
- **At 50,000+ churches**: Evaluate migration of Durable Objects to regional clusters; dedicated R2 buckets per region
- **Monitoring trigger**: Scale dashboards alert when any resource reaches 60% of its tier limit

---

## 25. Feature Flags & Deployment Strategy

### 25.1 Feature Flag System

Feature flags are managed via **Cloudflare Workers KV** (global, sub-millisecond reads):

| Flag Type | Example | Rollout Control |
|-----------|---------|-----------------|
| **Global** | `feature.pathfinder-matrix` → `true`/`false` | Toggle on/off for all churches |
| **Percentage** | `feature.new-rota-ui` → `30%` | Random allocation by church ID hash (consistent per church) |
| **Church-level** | `feature.beta-av-sync` → `["church_42", "church_87"]` | Specific church allowlist |
| **Role-level** | `feature.treasurer-export` → `["treasurer", "admin"]` | Per-role activation |

### 25.2 Canary Deployments

```
[Staging] → 5% of churches (pilot) → 25% → 50% → 100% (full production)
                ↓                      ↓      ↓
          Monitor 24h            Monitor 12h  Monitor 6h
          Error rate, sync       Error rate,  Error rate,
          failures, D1 latency   performance  then promote
```

- **Rollback**: If error rate exceeds baseline × 2, automatically revert to previous deployment via `wrangler rollback`
- **Church stickiness**: A church stays with the same deployment throughout a canary wave (hash-based allocation)

### 25.3 Database Migrations

D1 migrations use Wrangler's built-in migration system:

```
npx wrangler d1 migrations create theobase add_member_bio_field
npx wrangler d1 migrations apply theobase --env production
```

- **Forward migrations**: Applied sequentially during deployment; idempotent (each migration checks if already applied)
- **Rollback migrations**: Stored alongside forward migrations; tested in staging before production deployment
- **Per-church migration**: Migrations are applied church-by-church during a deployment wave; a failed migration for one church does not block others
- **Large churches (> 5,000 members)**: Schema changes with table rewrites are tested for duration before production

---

## 26. Disaster Recovery Testing

| Test | Frequency | Procedure |
|------|-----------|-----------|
| **D1 point-in-time restore** | Quarterly | Restore a random church database from 7 days ago; verify data integrity and referential consistency |
| **R2 cross-region failover** | Semi-annually | Simulate primary R2 region outage; verify failover to replica region within 5 minutes |
| **Worker rollback** | Monthly | Deploy a canary with an intentional error → verify automatic rollback triggers < 5 minutes |
| **Full stack restore** | Annually | Restore entire production environment from backups to a staging environment; run E2E test suite |
| **Chaos engineering** | Quarterly | Terminate random Durable Object instances; verify automatic reconnect and session recovery |

All DR tests are **automated** via GitHub Actions scheduled workflows. Results are published to an internal dashboard. Each test produces a pass/fail report; failures are treated as P1 incidents.

---

## 27. Non-Latin OCR Strategy

### 27.1 Script Support

| Script | Languages | Tesseract Model | Strategy |
|--------|-----------|----------------|----------|
| Latin | English, French, Spanish, Portuguese, Swahili, Fijian, Samoan, Tok Pisin | `eng`, `fra`, `spa`, `por`, `swa` | Standard Latin models; bundled in PWA |
| Devanagari | Hindi, Fiji Hindi | `hin` | Lazy-loaded on demand (~8 MB); fallback to manual entry if not loaded |
| Arabic | Arabic, Urdu | `ara`, `urd` | Lazy-loaded on demand; RTL text detection |
| Tamil | Tamil | `tam` | Lazy-loaded on demand |
| Chinese | Mandarin (simplified) | `chi_sim` | Lazy-loaded on demand (~15 MB) |
| Japanese | Japanese | `jpn` | Lazy-loaded on demand |

### 27.2 Multi-Script Envelopes

Many Pacific Island churches receive tithe envelopes in mixed scripts (Latin names + Fijian Hindi notes). The Tesseract pipeline:

1. Runs primary language model (church's configured language)
2. If confidence < 50%, runs secondary model (Latin fallback)
3. Merges results by field (name field uses Latin model; amount field uses primary language)
4. Displays merged output with per-field confidence indicators

### 27.3 Custom Training Pipeline (Phase 3+)

For scripts and handwriting styles where standard Tesseract models underperform:
- Collect anonymized, volunteer-consented envelope images from the pilot program
- Fine-tune Tesseract models for common regional handwriting patterns
- Distribute updated models via service worker cache updates

---

## 28. Accessibility Testing Process

### 28.1 Automated Testing (CI)

| Tool | What It Checks | CI Gate |
|------|---------------|---------|
| **axe-core** (via Playwright) | WCAG violations on every page and component state | Build fails on any violation severity "critical" or "serious" |
| **Lighthouse Accessibility** | Aggregate accessibility score | Score ≥ 90 required for merge |
| **eslint-plugin-jsx-a11y** | JSX accessibility rules (alt text, ARIA labels, semantic HTML) | Lint error on violation |
| **contrast-checker** | Color contrast ratios in the design system's color tokens | Build fails on contrast < 4.5:1 |

### 28.2 Manual Testing

| Activity | Frequency | Procedure |
|----------|-----------|-----------|
| Screen reader audit (VoiceOver + NVDA) | Per major release | Walk through all 19 modules using only a screen reader; file bugs for any task that cannot be completed |
| Keyboard-only navigation | Per sprint | Navigate every new/changed UI using Tab/Enter/Escape only; verify focus trap in modals; verify skip links |
| Zoom testing (200%) | Per sprint | Verify layouts don't break, no content loss, no horizontal scroll |
| User testing with disabled volunteers | Pilot phase | 2–3 volunteers with visual, motor, or cognitive disabilities use the platform with their assistive technology |

### 28.3 VPAT (Voluntary Product Accessibility Template)

A VPAT v2.4 will be published before public launch, covering WCAG 2.1 AA, Section 508, and EN 301 549. Updated annually. Available at `theobase.app/accessibility`.
