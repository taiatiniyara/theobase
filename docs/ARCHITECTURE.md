# Architecture

## Stack

| Concern            | Choice          | Rationale                                                    |
| ------------------ | --------------- | ------------------------------------------------------------ |
| Language           | TypeScript      | Type safety, shared types between frontend/backend           |
| Backend Framework  | Hono            | Lightweight, fast, Cloudflare Workers native                 |
| Frontend Framework | React + Vite    | Modern, fast dev experience, PWA support                     |
| Routing            | TanStack Router | Type-safe routing, nested layouts                            |
| Data Fetching      | TanStack Query  | Caching, background refetch, optimistic updates              |
| Data Store         | Cloudflare D1   | SQLite at edge, global replication, low latency              |
| File Storage       | Cloudflare R2   | S3-compatible, global CDN, low cost                          |
| Auth               | Custom + SSO    | Email/password, magic links, SSO (LDAP/Azure AD/Google), MFA |
| Hosting            | Cloudflare      | Global edge, Workers, D1, R2                                 |

## System Topology

**Edge-first architecture** on Cloudflare:

- **Frontend**: Vite + React SPA deployed to Cloudflare Pages (global CDN)
- **Backend**: Hono Workers at edge (global, low latency)
- **Database**: Cloudflare D1 (SQLite, global read replicas, write to primary)
- **File Storage**: Cloudflare R2 (S3-compatible, global CDN)
- **Caching**: Cloudflare CDN cache for static assets, TanStack Query for client-side caching

**Data flow**:

1. User interacts with React SPA (Cloudflare Pages)
2. SPA makes API calls to Hono Workers (edge)
3. Workers query D1 (SQLite) with row-level security filters
4. Workers return JSON responses
5. TanStack Query caches responses client-side

**No event-driven architecture** for initial version — synchronous request/response is sufficient for this use case. Event-driven patterns (queues, webhooks) can be added later for async processing (e.g., report generation, email notifications).

## API / IPC Contracts

**RESTful API** following `references/api-design.md`:

**Endpoints** (hierarchical, filtered by user's organizational scope):

**Core:**

- `/api/persons` — CRUD for members (filtered by Church)
- `/api/churches` — CRUD for churches (filtered by Conference)
- `/api/conferences` — CRUD for conferences (filtered by Union)
- `/api/unions` — CRUD for unions (filtered by Division)
- `/api/divisions` — CRUD for divisions
- `/api/general-conference` — General Conference (read-only, manages worldwide config)
- `/api/users` — manage SystemUser records, role assignments, church/organizational-unit assignments
- `/api/roles` — list available roles and their permissions
- `/api/ministries` — CRUD for ministries within a Church
- `/api/offices` — CRUD for church offices and assignments

**Membership Lifecycle:**

- `/api/baptism-classes` — CRUD for baptism preparation classes
- `/api/baptism-classes/:id/participants` — manage participants, attendance
- `/api/baptism-events` — CRUD for baptism services
- `/api/professions-of-faith` — record professions of faith
- `/api/transfer-requests` — CRUD for transfer requests with approval workflow
- `/api/removals` — record disfellowship, resignation, death
- `/api/restorations` — track restoration process

**Governance:**

- `/api/elections` — CRUD for officer elections, nominating committee
- `/api/meetings` — CRUD for meetings (business, board, ministry, committee)
- `/api/meetings/:id/decisions` — track decisions made
- `/api/meetings/:id/minutes` — upload/retrieve minutes

**Youth Ministries:**

- `/api/youth-clubs` — CRUD for Pathfinder/Adventurer clubs
- `/api/youth-clubs/:id/members` — manage club members
- `/api/youth-clubs/:id/class-completions` — track class progression
- `/api/camporees` — CRUD for regional gatherings

**Finance:**

- `/api/giving` — member self-reports (photo upload, category breakdown)
- `/api/giving/:id/photo` — get/upload envelope photo (stored in R2)
- `/api/envelope-counts` — treasurer's physical count verification
- `/api/anonymous-offerings` — record unnamed envelope or loose cash
- `/api/weekly-summaries` — treasurer's weekly verification, deposit confirmation
- `/api/weekly-summaries/:id/deposit-slip` — upload deposit slip (stored in R2)
- `/api/reports/financial` — auto-generated financial report
- `/api/reports/financial/cop-distribution` — COP distribution calculation

**Sabbath School:**

- `/api/sabbath-school/classes` — CRUD for Sabbath School classes
- `/api/sabbath-school/classes/:id/attendance` — record weekly attendance
- `/api/reports/sabbath-school` — quarterly Sabbath School report

**Census & Compliance:**

- `/api/census/sessions` — CRUD for annual census sessions
- `/api/census/sessions/:id/confirmations` — member self-confirmations
- `/api/census/sessions/:id/status` — get census progress
- `/api/audits` — record audit findings and follow-up

**Communication & Outreach:**

- `/api/announcements` — CRUD for church announcements
- `/api/prayer-requests` — member-submitted prayer needs
- `/api/pastoral-visits` — record pastoral visits
- `/api/guests` — visitor/guest tracking with follow-up pipeline

**Reports & Directives:**

- `/api/reports/membership` — auto-generated quarterly membership report
- `/api/reports/ministry` — quarterly ministry activity report
- `/api/directives` — top-down directives (filtered by recipient)
- `/api/notifications` — user's notification history, preferences

**Auth:**

- `/api/auth/login` — email/password login
- `/api/auth/magic-link` — passwordless login
- `/api/auth/sso` — SSO integration
- `/api/auth/mfa` — MFA setup/verification

**Response shape**:

```json
{
  "data": { ... },
  "meta": { "page": 1, "total": 100 }
}
```

**Error shape**:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Person not found"
  }
}
```

**Pagination**: cursor-based for large datasets, offset-based for admin UIs
**Rate limiting**: 100 requests/minute per user (configurable per role)
**Idempotency**: `Idempotency-Key` header required for mutations (POST, PUT, DELETE)

## Multi-Tenancy Strategy

**Logical multi-tenancy** with row-level security:

- All data in one database (D1)
- Queries automatically filtered by organizational hierarchy
- Row-level security enforced at database level (not just application level)
- Each Church sees only its data, Conference sees its Churches, Union sees its Conferences
- Data inheritance: higher levels automatically see subordinate data

**Implementation**:

- Every table has `organization_path` column (e.g., `/gc/division/union/conference/church`)
- Queries include `WHERE organization_path LIKE '/gc/division/union/conference/%'`
- Database views or RLS policies enforce filtering automatically
- Cross-conference transfers require temporary dual-access (both source and target Church can see the Person during transition)

## Key Workflows

### Photo-Based Giving

**Member self-reports tithe/offering by photographing their envelope:**

1. Member fills out envelope with cash/check and fills in breakdown (tithe, offering categories)
2. Member photographs the envelope contents using the PWA camera or uploads from gallery
3. System stores photo in R2, creates MemberGiving record with status "submitted"
4. Member places envelope in offering bucket
5. Treasurer (or dual-control counters) opens envelopes, counts physical contents
6. Treasurer creates EnvelopeCount with actual amounts
7. System matches EnvelopeCount to MemberGiving by envelope identifier
8. If amounts match → status "verified"
9. If amounts differ → status "discrepancy" with difference noted
10. Unnamed envelopes and loose cash → recorded as AnonymousOffering
11. At week end, Treasurer reviews WeeklyFinancialSummary, uploads deposit slip, marks verified

**Data model:**

- `MemberGiving`: person_id, church_id, date, photo_url (R2), amount_breakdown JSON, status
- `EnvelopeCount`: church_id, date, envelope_id, counted_amount JSON, counted_by_id
- `AnonymousOffering`: church_id, date, amount JSON, source (unnamed/loose)
- `WeeklyFinancialSummary`: church_id, week_ending, total_verified, total_anonymous, discrepancies JSON, deposit_slip_url (R2), verified_by_id

### Census Self-Confirmation

**Annual membership audit with member self-service:**

1. Church Clerk initiates CensusSession for the year
2. System sends notifications to all members (email/in-app): "Please confirm your details"
3. Members log in, see their record, and confirm or update with one tap
4. System tracks confirmations: confirmed, updated, unconfirmed (no response)
5. After X days, system sends reminders to unconfirmed members
6. Church Clerk reviews dashboard: "85 of 120 confirmed, 35 unconfirmed"
7. Clerk follows up on unconfirmed members (phone, visit)
8. Church Board reviews unconfirmed for potential removal
9. Census report auto-generates with: confirmed count, unconfirmed count, net change
10. Report submitted to Conference for approval

**Data model:**

- `CensusSession`: church_id, year, start_date, end_date, total_members, status
- `CensusConfirmation`: census_session_id, person_id, confirmation_date, status (confirmed/updated/unconfirmed/removed), changes JSON

### Combined Offering Plan (COP) Distribution

**Auto-calculated offering distribution:**

1. WeeklyFinancialSummary records total offerings by category
2. System applies COP formula:
   - Local church: 50-60% (stays at church for operations and local ministry)
   - General Conference world mission: 20%
   - Conference, Union, Division: remainder per division's voted formula
3. Church Treasurer sees distribution breakdown before submitting to Conference
4. Conference receives aggregated distribution from all churches

### Notification System

**Automated notifications tied to domain events:**

| Trigger                             | Recipient                  | Message                                                                   |
| ----------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| Census session started              | All church members         | "Please confirm your details for the 2025 census"                         |
| Census reminder (after 7 days)      | Unconfirmed members        | "Reminder: please confirm your census details"                            |
| Report due (3 days before deadline) | Church Clerk               | "Quarterly membership report due in 3 days"                               |
| Transfer request received           | Source church clerk        | "Transfer request from John Smith — please approve"                       |
| Transfer request received           | Target church clerk        | "Transfer request for John Smith — pending confirmation"                  |
| Discrepancy detected                | Treasurer                  | "John Smith reported $100, envelope counted $80"                          |
| Baptism class completed             | Person                     | "Congratulations on completing baptism class — your baptism is scheduled" |
| Guest follow-up due                 | Personal Ministries leader | "Follow up with guest John Smith (visited 2 days ago)"                    |

## File Storage (R2)

**File types stored in Cloudflare R2:**

| File Type       | Entity                 | Retention              |
| --------------- | ---------------------- | ---------------------- |
| Envelope photo  | MemberGiving           | 7 years (tax record)   |
| Deposit slip    | WeeklyFinancialSummary | 7 years                |
| Meeting minutes | Meeting                | Indefinite             |
| Audit report    | Audit                  | Indefinite             |
| Census report   | CensusSession          | Indefinite             |
| Profile photo   | Person                 | While member is active |

**Upload flow:**

1. PWA captures photo or uploads file
2. Client sends presigned URL request to Worker
3. Worker generates presigned R2 upload URL
4. Client uploads directly to R2
5. Worker stores file metadata in D1

## Internationalization (i18n) Posture

**Language is a user setting, not a church setting.** Each user selects their language at login or in settings.

**Phase 1**: English only (primary language for initial development)
**Phase 2**: Spanish, French, Portuguese (largest SDA language groups)
**Phase 3**: Community-contributed via translation platform, RTL support (Arabic, Hebrew)

**Implementation**:

- All user-facing strings externalized to i18n files, enforced at build time
- Date/time formatting locale-aware
- Number and currency formatting locale-aware
- RTL layout engine from day one (avoids rebuild for Arabic/Hebrew later)
- Reports in user's language, even when viewing data from a church with a different primary language

## Compliance Posture

**GDPR** (for EU users):

- Right to access: users can export their data
- Right to deletion: users can request account deletion
- Consent tracking: explicit consent for data processing
- Data minimization: only collect what's necessary

**Data retention**:

- Membership records: indefinite (historical record)
- Reports: 10 years, then archive
- Audit logs: 7 years (or as required by church policy)
- Session data: 30 days

**PII protection**:

- No PII in logs or error messages
- Encryption at rest (D1 provides this)
- Encryption in transit (HTTPS everywhere)
- Access logging for sensitive operations

## Cost Model

**Cloudflare pricing** (as of 2024):

- **Workers**: Free tier (100k requests/day), Paid ($5/month for 10M requests)
- **D1**: Free tier (5GB storage, 5M reads/day), Paid ($0.75/GB/month storage, $0.01/1M reads)
- **R2**: Free tier (10GB storage), Paid ($0.015/GB/month storage, $0.01/1M reads)
- **Pages**: Free tier (unlimited bandwidth), Paid ($20/month for custom domains)

**Expected costs** (linear scaling):

- **1 church** (~120 members): ~$0.50/month (free tier covers most usage)
- **1 Conference** (~100 churches): ~$25/month
- **1 Division** (~10,000 churches): ~$250/month
- **Worldwide** (~100,000 churches): ~$2,500/month

**Cost optimization**:

- Use CDN caching aggressively (reduce D1 reads)
- Batch API calls where possible (reduce Workers invocations)
- Archive old data to R2 (reduce D1 storage)
- Monitor usage and set budget alerts

## Documentation Posture

**Agent-facing documentation** (machine-readable):

- `docs/agents/contracts/` — OpenAPI specs for API endpoints
- `docs/agents/schemas/` — JSON Schema for data models
- `graphify-out/` — knowledge graph of codebase structure
- `CONTEXT.md` — domain glossary
- `docs/adr/` — architectural decision records

**Human-facing documentation**:

- `README.md` — project overview, setup instructions
- `CHANGELOG.md` — versioned change log
- `docs/ARCHITECTURE.md` — technical architecture (this file)
- `docs/SESSION.md` — current session state
- `docs/DEPLOYMENT.md` — deployment guide
- `docs/runbooks/` — operational runbooks for alerts

**Documentation standards**:

- Every public API endpoint has an OpenAPI spec
- Every data model has a JSON Schema
- Every ADR follows the template (status, context, decision, alternatives, consequences)
- README setup instructions work on a clean clone (verified in CI)
- CHANGELOG follows keepachangelog.com format

## UI / UX

Design decisions driven by `references/ui-ux.md` heuristics and UI/UX grill session (§1–§4).

**Primary user**: Church clerks and administrators, ages 30–70, mixed technical ability (from "can barely use email" to "power user"), mobile-first PWA (grassroots users often don't have computers), moderate connection speeds, often stressed or rushed (quarterly deadlines, membership changes).

**Core value**: Enter raw data effortlessly, reports generate themselves. First session goal: Add first member.

**Personality**: Trustworthy, Simple, Authoritative — but warm and approachable for grassroots volunteers, not corporate.

**Visual signature**: Warm, approachable simplicity (like Notion, Basecamp, Airtable) — friendly, accessible, not intimidating. Hierarchy is visible but not overwhelming.

### Design Tokens

**Colors**: Trustworthy and warm — soft blues and warm neutrals, mobile-optimized (less saturated to reduce eye strain on small screens).

- Primary: #3b82f6 (blue-500) — buttons, links, active states
- Secondary: #64748b (slate-500) — secondary text, borders
- Success: #10b981 (emerald-500) — success messages, confirmations
- Warning: #f59e0b (amber-500) — warnings, pending states
- Error: #ef4444 (red-500) — errors, destructive actions
- Background: #ffffff (white) — main background
- Surface: #f8fafc (slate-50) — cards, modals
- Text: #1e293b (slate-800) — primary text
- Text-muted: #64748b (slate-500) — secondary text

**Dark mode**: Designed from start (not auto-inverted) — high priority for grassroots users who may use phones outdoors, in low light, or need to conserve battery.

**Spacing**: 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
**Typography**:

- Font family: Inter (designed for screens, highly legible at small sizes, neutral but friendly)
- Font scale: 1.25 ratio (major third) — 16px base, 20px, 25px, 31px
- Font weights: 400 (regular), 500 (medium), 600 (semibold) — 3 weights only
- Line height: 1.5 for body, 1.25 for headings
- Measure: 60-70 characters per line for body text

**Radii**: 4px (sm), 8px (md), 12px (lg), 9999px (full)
**Shadows**: sm (0 1px 2px rgba(0,0,0,0.05)), md (0 4px 6px rgba(0,0,0,0.1)), lg (0 10px 15px rgba(0,0,0,0.1))

### Component Library

| Component | States Covered                                   | Accessibility Notes                                                           |
| --------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Button    | default, hover, focus, active, disabled, loading | aria-label for icon-only buttons, visible focus ring, >= 44x44px touch target |
| Input     | default, focus, error, disabled, readonly        | aria-invalid for errors, aria-describedby for help text                       |
| Select    | default, open, disabled                          | aria-expanded, keyboard navigation                                            |
| Checkbox  | unchecked, checked, indeterminate, disabled      | aria-checked, visible focus ring                                              |
| Radio     | unselected, selected, disabled                   | aria-checked, keyboard navigation                                             |
| Modal     | closed, open, closing                            | focus trap, aria-modal, escape to close                                       |
| Toast     | info, success, warning, error                    | aria-live="polite", auto-dismiss with pause on hover                          |
| Table     | default, loading, empty, error                   | aria-label, sortable columns with aria-sort                                   |
| Card      | default, hover, selected                         | semantic HTML, keyboard navigable                                             |
| Tabs      | default, active, disabled                        | aria-selected, keyboard navigation (arrow keys)                               |
| Accordion | collapsed, expanded, disabled                    | aria-expanded, aria-controls, keyboard navigation                             |

### Layout

- **Max content width:** 480px on mobile (single column, full width with 16px padding), 1280px on desktop
- **Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **Navigation pattern:** Bottom navigation (mobile, thumb zone), sidebar navigation (desktop), breadcrumbs for hierarchy
- **Responsive strategy:** Mobile-first, progressive enhancement for larger screens, spacious density (breathing room, large touch targets, clear visual hierarchy)

### UX Patterns

- **Forms:** Inline validation on blur, submit validation on all fields, clear error messages (no jargon, no status codes), loading state on submit, success/error toast
- **Data display:** Tables for lists, cards for detail views, charts for trends, pagination for large datasets, infinite scroll for feeds
- **Feedback:** Toast notifications for actions, loading spinners for async operations, progress bars for long-running tasks, skeleton screens instead of spinners (perceived performance on slow networks)
- **Empty states:** Illustration + message + call-to-action (e.g., "No members yet. Add your first member.") — never a dead end
- **Error states:** Inline errors for form fields, banner errors for page-level errors, full-page error for critical failures (with retry button). Error messages are helpful, not technical: "We couldn't find that member. Check the name and try again." not "404 Not Found"
- **Optimistic UI:** Actions complete instantly in UI before server confirms (checkbox toggle, drag-and-drop reorder) — every mutation is an opportunity to feel instant
- **Progressive disclosure:** Limit to 5 primary actions visible on complex screens. Everything else in tabs or expandable sections
- **Contextual next steps:** Every long page ends with a contextual action — not a dead end. Always guide to the logical next action
- **Onboarding:** Zero-config start — guided first task (add member) in under 2 minutes. Smart defaults. Learn as you go, never configure first
- **Offline safety:** Queue actions locally when network drops. "Saved (will sync when connected)" not raw network errors. Background sync with TanStack Query

### Error-Proof Design (ADR 0011)

**What grassroots users must NEVER see:**

- Stack traces, error codes, "500 Internal Server Error"
- Technical terms: "idempotency," "foreign key constraint," "409 Conflict"
- Blank screens with no explanation
- Spinners with no progress indication

**Key guarantees:**

- **Duplicates:** Auto-detect and offer merge, never "Duplicate key error"
- **Validation:** Inline as-you-type, friendly language, never raw error messages
- **Destructive actions:** Confirmation with deliberate second step, never accidental
- **Membership formula:** Auto-generated from raw data, never a manual formula to get wrong
- **Transfer integrity:** Single atomic action, member cannot be double-counted
- **Report deadlines:** Data is live — no "submit" workflow, conference sees current state anytime
- **Smart defaults:** Baptism date empty (not today), reports default to current quarter

### Information Architecture

- **Top-level navigation**: Home, Members, Reports (Settings moved to profile menu)
- **Navigation grouping**: Task-oriented (each item represents a user goal), not engineering structure
- **Search**: Global search in header — searches across Members, Reports, and Settings. Empty state shows recent searches, quick actions, helpful suggestions
- **Sitemap depth**: 3 levels max (Home → Members → Member Detail)
- **Dashboard**: User needs first — pending reports (urgent), recent members (active), quick actions (Add Member, Submit Report)
- **Language**: User language, not database language. "Add a member" not "Create Person". "Our church" not "Church ID: 123". No jargon visible to users

### Accessibility Baseline

- **Standard:** WCAG 2.1 AA
- **Color contrast:** 4.5:1 minimum verified
- **Keyboard:** full navigation, visible focus ring
- **Screen reader:** semantic HTML, alt text, aria labels
- **Motion:** `prefers-reduced-motion` respected
- **Touch targets:** >= 44x44px (Apple HIG) for thumb-friendly interaction on mobile

## User Personas & Dashboards

| Persona                 | Needs                                      | Dashboard                                                                                 |
| ----------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Church Clerk            | Data entry, membership, reports            | Quick actions (add member, submit report), pending items, recent activity                 |
| Treasurer               | Offering verification, COP distribution    | Unverified giving records, weekly summary, deposit slip upload                            |
| Pastor                  | Multi-church oversight, visits, trends     | All churches at a glance, attendance trends, upcoming needs, transfer approvals           |
| Conference Admin        | Oversight, compliance, resource allocation | Health heatmap (green/yellow/red churches), compliance status, auto-generated reports     |
| Union/Division/GC Admin | Global strategy, trends                    | Larger-scope heatmaps, growth trends, auto-generated GC session reports                   |
| Member                  | Self-service, giving, census               | Personal profile, giving history with tax receipts, census confirmation, church directory |
| Guest                   | Visitor pipeline                           | Contact info capture, follow-up tracking, progression to membership                       |

## Quality Standards (ADR 0012)

### Performance

- PWA initial load under 500KB (code-split by route)
- Page transitions under 100ms (feel instant)
- API responses under 10KB, works on 2G/3G
- Photo compression client-side before upload

### Reliability

- Auto-save always — "Saved" indicator, never a Save button
- Offline queue with auto-sync on reconnect
- Undo instead of confirm for non-destructive changes
- Immutable audit log for every change
- Feature-level isolation — one failure doesn't cascade

### Consistency

- Every list, form, detail page follows the same pattern
- Never mix terms (Member vs Person, Submit vs Save)
- Domain glossary governs all UI labels

### Discoverability

- Empty states teach the next action
- Success states guide to next logical step
- Search finds everything (members, reports, actions)
- Fuzzy matching for typos

### Localization (i18n)

- Language is a user setting, not a church setting
- Every string externalized, enforced at build time
- Dates, numbers, currencies locale-aware
- RTL layout engine from day one (Arabic/Hebrew in Phase 3)

### Data Portability

- One-click full export: all data + attachments, open formats
- Member-level export for GDPR compliance
- No lock-in — export is immediate and free

## Email Strategy (ADR 0013)

| Email Type               | Trigger                   | Recipient   | Content                                                      |
| ------------------------ | ------------------------- | ----------- | ------------------------------------------------------------ |
| Weekly Church Digest     | Every Monday              | All members | Attendance, events, prayer requests, new members             |
| Giving Receipt           | Treasurer verifies giving | Member      | "Your offering recorded: $100 tithe, $50 offering"           |
| Monthly Giving Statement | First week of month       | Member      | Monthly breakdown, year-to-date total, tax-ready PDF         |
| Annual Tax Statement     | January                   | Member      | Full year summary, downloadable PDF with treasurer signature |
| Census Campaign          | Census started            | All members | Day 1/7/14/21 escalating sequence                            |
| New Member Onboarding    | Person added with email   | New member  | Day 1/3/7 guided introduction                                |
| Re-engagement            | 90+ days inactive         | Member      | Church activity summary since last login                     |

All emails: one CTA, PWA deep-link, plain text fallback, unsubscribe link, no third-party content.

## Support & Feedback (ADR 0014)

- In-app "Tell us what happened" — text field + auto-attached screenshot + system context
- Feature requests through same channel
- No chatbot, no knowledge base — real person reads feedback
- Public changelog in user language
- Transparent known issues via in-app banner

## Release Process (ADR 0014)

- Continuous delivery — small, frequent changes, no big release events
- Backwards-compatible API changes with deprecation windows
- Feature flags for risky changes: dark ship → 1% → 10% → 50% → 100%
- One-click rollback, under 1 minute
- No deploys Friday sunset to Saturday sunset (Sabbath)
- No deploys during quarterly report deadlines
- PWA updates in background — user never sees "please refresh"
- Public status page: status.theobase.org

## Scalability (ADR 0014)

**Architecture:** Cloudflare Workers/D1/R2 scale to zero and scale automatically.
**Cost model:** linear — 1 church ~$0.50/month, 1 Division ~$250/month, 100,000 churches ~$2,500/month.
**Performance:** sub-100ms at church scale, sub-300ms at worldwide scale.
**Data growth:** active data in D1, historical archived to R2 after 2 years.
**No multi-tenant degradation:** one church doesn't slow another.
