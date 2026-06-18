# Feature Specification — Theobase 19 Modules

## 0. Global Patterns

### 0.1 Shared UX Patterns

| Pattern | Description |
|---------|-------------|
| **Offline indicator** | A thin bar at the top: green "Online — changes synced", yellow "Offline — 3 changes pending sync", red "Sync failed — tap to retry" |
| **Conflict badge** | Orange badge on affected module icon: "2 items need review" |
| **Empty states** | Every list view has an illustrated empty state with a single CTA button ("Add your first member", "Create the first meeting") |
| **Skeleton loaders** | All data views show skeleton screens during initial load and sync |
| **Optimistic updates** | Mutations reflect locally immediately; rollback if server rejects |
| **Pull-to-refresh** | On mobile list views, triggers a manual sync |
| **Accessible** | WCAG 2.1 AA minimum; keyboard navigation; screen reader labels; 4.5:1 minimum color contrast |
| **Search** | Command palette (Ctrl+K / Cmd+K) for global member/receipt/meeting search; module-specific search bars on list views; 300ms debounced; offline search against local IndexedDB for small datasets |
| **Print** | Every list and report view has a "Print" action that opens a print-optimized view (no nav, no buttons, black text, page numbers); `@media print` stylesheets on all pages |

### 0.2 Onboarding Flow

1. **Church Registration**: Clerk visits app URL → enters church name, address (auto-geocode for lat/lng/timezone), selects language → receives admin magic link
2. **Subscription**: Enters card details or chooses annual invoice; 14-day free trial starts
3. **First Member Import** (3 options):
   - Manual entry (one at a time)
   - CSV upload (template provided: name, phone, email, membership status)
   - Invite-by-link (share a signup URL in the church WhatsApp group; members self-register)
4. **Quick Setup Wizard**: 5-minute walkthrough — "Who are your volunteers?" (assign roles), "Set up your first Sabbath service rota", "Try a test donation"
5. **Dashboard**: Post-setup, lands on role-appropriate dashboard

### 0.3 Data Migration

| Source | Method |
|--------|--------|
| Excel / Google Sheets | CSV upload with column mapping UI |
| Paper records | Bulk photo upload → OCR → treasurer review queue |
| Another church app | API import adapter (ACMS, eAdventist — Phase 3) |
| Nothing (new church) | Manual entry + member self-registration |

### 0.4 Roles & Permissions (Per-Module Matrix)

| Module | Admin | Pastor | Treasurer | Dept Leader | Volunteer | Member |
|--------|-------|--------|-----------|-------------|-----------|--------|
| Boardroom (#1) | RW | RW | R | R | — | — |
| Nominating (#2) | RW | RW | — | — | — | — |
| Duty Rota (#3) | RW | RW | — | RW | R (own) | R (own) |
| Safety Shield (#4) | RW | RW | — | — | — | — |
| Treasury (#5) | R | R | RW | R (own dept) | — | R (own) |
| Tithe Camera (#6) | — | — | RW scan | — | — | Create |
| Audit Binder (#7) | RW | R | RW | — | — | — |
| Receipt Registry (#8) | R | R | RW (approve) | — | — | Create |
| Pathfinder (#9) | R | R | — | RW | R | R (own child) |
| Sabbath School (#10) | R | R | — | RW | RW (own class) | R |
| Welfare (#11) | RW | R | — | RW | — | — |
| Evangelism (#12) | R | RW | — | — | RW | — |
| Sabbath Timing (#13) | Config | Config | — | — | — | Affected by |
| Communion (#14) | RW | RW | — | — | RW | — |
| AV Sync (#15) | RW | RW | — | RW | — | — |
| District Hub (#16) | R | RW | — | — | — | — |
| Facility (#17) | RW | RW | — | — | — | Request |
| Crisis Matrix (#18) | RW | RW | — | — | — | — |
| Offline Core (#19) | Automatic | Automatic | Automatic | Automatic | Automatic | Automatic |

R = Read, W = Write, — = No access

### 0.5 Search & Print per Module

| Module | Search Scope | Printable Output |
|--------|-------------|-----------------|
| Boardroom (#1) | Full-text minutes, agenda titles, motions | Meeting minutes with votes and attendance |
| Nominating (#2) | Candidate names, positions (restricted) | Results report (chair only) |
| Duty Rota (#3) | Volunteer names, positions, dates | Bulletin insert, full rota sheet |
| Safety Shield (#4) | Volunteer names, clearance types, expiry dates | Clearance summary report |
| Treasury (#5) | Transactions, amounts, descriptions, payee names | Budget reports, income/expense statements, fiscal year summary |
| Tithe Camera (#6) | Member names on scanned envelopes | Envelope count summary sheet |
| Audit Binder (#7) | Expense records, receipt references, meeting links | Audit-ready binder with receipt thumbnails and authorizations |
| Receipt Registry (#8) | Member names, amounts, dates, approval status | Receipt log |
| Pathfinder (#9) | Member names, honor badges, class levels | Individual progress report; investiture readiness list; certificates |
| Sabbath School (#10) | Member names, attendance dates, lessons | Class register grid, attendance summary |
| Welfare (#11) | Case IDs only (not recipient names) | Pantry inventory report (anonymized) |
| Evangelism (#12) | Contact names, stages, assigned members | Contact pipeline report |
| Communion (#14) | Volunteer assignments, inventory items | Assignment sheets; inventory checklist |
| AV Sync (#15) | Hymn titles, scripture references, presenters | Order of service |
| District Hub (#16) | Church names, visit notes, sermon titles | Monthly mileage report, preaching calendar |
| Facility (#17) | Event names, dates, facilities | Booking calendar, policy report |
| Crisis Matrix (#18) | Asset types, church names, statuses | Regional asset report |
| Member Directory | Names, phones, emails, membership status | Church directory (opt-in) |

---

## 1. Boardroom Management Ledger (#1)

**Addresses**: Board meeting paper trail, historical transparency

### Data Model

```
board_meetings: id, church_id, date, type (regular/special/emergency),
                agenda_json, minutes_md, status (draft/published), created_by

agenda_items: id, meeting_id, sort_order, title, description, presenter,
              attachments[], outcome, vote_id (nullable)

board_votes: id, meeting_id, motion_text, proposed_by, seconded_by,
             vote_type (simple/supermajority/secret_ballot),
             result (passed/failed/tabled), quorum_present (boolean)

board_attendance: meeting_id, member_id, role (chair/secretary/member/guest),
                  present (boolean), arrival_time, departure_time
```

### User Flows

1. **Create Meeting**: Pastor/clerk clicks "New Meeting" → sets date, type → auto-populates template from last meeting → drag-and-drop agenda items → publishes agenda (emails attendees)
2. **Run Meeting**: Chair opens "Active Meeting" view → agenda items with timers → "Call for Motion" button opens voting panel → vote recorded with counts → "Move to Next Item" advances
3. **Record Minutes**: Secretary types minutes in rich-text editor synced to each agenda item → "Request Vote" triggers voting panel → outcomes auto-attached
4. **Publish**: After meeting, chair reviews → "Publish" locks the record (immutable) → auto-emails minutes to all board members
5. **Search Archive**: Full-text search across all past minutes; filter by date range, keyword, vote outcome

### Edge Cases

- **Quorum not met**: System prompts chair — "Proceed without quorum? (decisions will be marked advisory)"
- **Proxy voting**: Member marked as "voting by proxy" with proxy holder recorded
- **Confidential session**: Agenda item marked "Executive Session" — minutes stored separately, restricted to board members only
- **Multiple churches in one meeting?**: No; each church runs its own board meeting independently

---

## 2. Secure Nominating Vault (#2)

**Addresses**: Confidential officer elections, candidate tracking

### Data Model

```
nominating_cycle: id, church_id, year, status (setup/open/voting/closed),
                  committee_members[], positions[]

positions: id, cycle_id, title (Head Elder, Clerk, Treasurer, etc.),
           term_years, incumbent_id, candidates[]

candidates: id, position_id, member_id, nominated_by, nomination_date,
            status (nominated/contacted/accepted/declined), declining_reason

ballots: id, position_id, voter_id_hash, candidate_id, timestamp
         (voter identity separated from vote — stored as one-way hash)
```

### User Flows

1. **Setup**: Nominating committee chair creates a cycle → selects positions to fill → sets voting window dates → committee members added from church member list
2. **Nomination Phase**: Committee members nominate candidates per position → system emails/SMSes candidate: "You've been nominated for Head Elder. Accept or decline?" → real-time acceptance tracker
3. **Voting Phase**: Committee members receive notification → open app → cast anonymous vote → see "Vote recorded" (not the tally) → chair alone sees live tally
4. **Close**: Chair closes voting → system generates results report → chair presents to board → results archived

### Edge Cases

- **Tie vote**: System flags for chair to break tie or trigger re-vote
- **Candidate declines after voting starts**: Chair can remove and re-open nominations for that position
- **Committee member leaves**: Chair removes member; any votes already cast remain valid
- **Confidentiality breach prevention**: Ballots stored without voter identity; audit log records *that* a vote was cast but not *who* cast it
- **Candidate eligibility**: Chair configures requirements (baptized, member for 6+ months, etc.); system flags ineligible nominees

---

## 3. Smart-Swap Duty Rota (#3)

**Addresses**: Volunteer scheduling, last-minute replacements, automated reminders

### Data Model

```
duty_templates: id, church_id, title, recurring_rule (weekly/biweekly/monthly),
                positions[], default_start_time

duty_assignments: id, church_id, date, position (scripture_reading, prayer,
                  platform_host, song_service, childrens_story, av_operator, etc.),
                  member_id, status (assigned/accepted/declined/swapped),
                  reminder_sent_at, backup_requested

substitute_pool: id, position_type, member_id, qualified (boolean),
                 ordained (boolean, for pulpit roles), availability_preferences
```

### User Flows

1. **Create Rota Template**: Admin defines recurring roles → assigns default members → sets reminder schedule (e.g., Tuesday before)
2. **Auto-Populate**: Every Monday 9 AM, the system generates next Saturday's rota from template → sends push/SMS: "You're on Scripture Reading this Saturday. Confirm?"
3. **Decline Flow**: Volunteer clicks "I can't make it" → selects reason → system immediately notifies rota coordinator → suggests replacements from substitute pool (sorted by: qualified → least recent duty → proximity)
4. **Emergency Swap (Saturday 7 AM)**: Volunteer clicks "Urgent — find replacement" → system broadcasts to all qualified substitutes → first to accept gets the slot → all parties notified
5. **Rota View**: Church-wide calendar showing each Saturday's assignments, printable as a bulletin insert

### Edge Cases

- **Recurring exceptions**: "No Pathfinders duty on campout weekends" — template supports skip-dates
- **Double-booking prevention**: System blocks assigning same person to overlapping duties
- **Speaker scheduling**: Guest speaker module — invite external speakers by name/contact; tracks honorariums
- **Multiple services**: Support for early morning + main service + afternoon AY program on the same day
- **Substitute declined**: If no substitute accepts within 1 hour, escalates to rota coordinator

---

## 4. Volunteer Safety Shield (#4)

**Addresses**: Background check tracking, expiration alerts, child safety compliance

### Data Model

```
safety_clearances: id, church_id, member_id, clearance_type (police_check,
                   working_with_children, driving_record, first_aid_cert),
                   issuing_authority, document_r2_key,
                   issued_date, expiry_date, verified_by, verified_at

ministry_requirements: id, ministry_type (childrens_ministry, pathfinders,
                       youth_transport, adventurers), required_clearances[]

blocked_assignments: id, member_id, ministry_type, blocked_reason
                    (expired/none/under_review), blocked_until
```

### User Flows

1. **Add Clearance**: Admin uploads background check document → enters issuing authority, dates → system calculates expiry → document stored encrypted in R2
2. **Auto-Check**: When assigning a volunteer to children's ministry (#3 Duty Rota or #9 Pathfinders), system cross-references clearance status → blocks assignment if expired/missing
3. **Expiry Alerts**: 90/60/30 days before expiry, notifies volunteer and admin; after expiry, flags volunteer as "inactive" for child-facing ministries
4. **Renewal**: Volunteer uploads new document → admin reviews and verifies → clearance updated

### Edge Cases

- **Partial clearance**: "Police check valid but first aid expired" → volunteer can serve in non-first-aid roles
- **Under review**: Clearance marked "under review" — temporarily blocks assignments but volunteer remains visible as "pending"
- **Multi-church volunteers**: A volunteer serving at two churches — clearances managed per-church (each church uploads independently)
- **Document verification**: Admin must check the document is genuine before approving; a "Verified by [name] on [date]" audit trail is recorded

---

## 5. Volunteer Treasury Interface (#5)

**Addresses**: Simplified budget tracking for non-accountants

### Data Model

```
budgets: id, church_id, department (local_church, pathfinders, adventurers,
         youth, womens_ministry, mens_ministry, sabbath_school, welfare,
         av_ministry, building, etc.), fiscal_year, allocated_amount

expenses: id, budget_id, amount, description, category, payee, date,
          receipt_r2_key, authorized_by_meeting_id, status
          (pending/approved/rejected/paid), created_by, approved_by

income_entries: id, church_id, source (tithe, local_offering, department_offering,
                donation, fundraiser), amount, receipt_id (nullable), date,
                deposited_to_bank
```

### User Flows

1. **Budget Setup**: Treasurer creates fiscal year budgets per department → enters allocated amounts → board approves (linked to board meeting #1)
2. **Record Expense**: Any department leader logs an expense via mobile: snap receipt, enter amount, select category → treasurer notified
3. **Approve Expense**: Treasurer reviews → matches to receipt image → matches to board authorization → clicks "Approve" → department budget updated in real time
4. **Dashboard**: Visual budget bars per department — green (under budget), yellow (approaching limit), red (over) → "You have $247 left in Pathfinders budget"
5. **Reports**: One-click export — "Local Church Budget Report Q2 2026" → PDF with all income, expenses, remaining balances

### Edge Cases

- **Over-budget expense**: System warns submitter and requires treasurer override with reason
- **Fiscal year rollover**: Treasurer runs "Close Year" → remaining balances roll to new year (or zero out, configurable)
- **Split expense**: One payment covers multiple departments → "Split" UI with percentage or dollar allocation
- **Reimbursement**: "Member paid out-of-pocket" → recorded as expense with member as payee; marked "To be reimbursed"

---

## 6. Tithe Envelope Camera Assistant (#6)

**Addresses**: Manual tithe counting, handwriting digitization

### Data Model

See Section 10 of Technical Architecture for OCR pipeline.

```
scanned_envelopes: id, church_id, date, member_id (detected or manual),
                  raw_image_r2_key, ocr_result_json, confidence_score,
                  amount_total, breakdown_json, status (pending_review/confirmed),
                  scanned_by, reviewed_by
```

### User Flows

1. **Scan**: Treasurer opens Camera mode → snaps photo of paper tithe envelope → Tesseract analyzes → displays detected fields: name (confidence %), amounts (confidence %)
2. **Review & Correct**: Low-confidence fields highlighted yellow → treasurer taps to edit → "Member detected as 'Josua Toganivalu' — is this correct?" (shows top 3 match suggestions from member list)
3. **Assign Breakdown**: System auto-fills tithe/offering split from member's last pattern → treasurer adjusts if needed → "Confirm"
4. **Batch Mode**: Scan 20 envelopes in sequence → review all on one screen → bulk confirm

### Edge Cases

- **Illegible handwriting**: OCR fails → field left blank → treasurer types manually; photo preserved as evidence
- **Wrong member detected**: Treasurer taps "Wrong person" → searches member list → reassigns
- **Multiple envelopes from same member**: Detected and grouped — "3 envelopes for Taniela — consolidate?"
- **Blank envelope detected**: "No text found — please enter manually"
- **Language**: OCR language auto-set to church's configured language; switchable per-envelope

**Accuracy target**: ≥ 85% for printed text, ≥ 70% for legible handwriting.

---

## 7. Audit Binder Cross-Referencer (#7)

**Addresses**: Missing receipts, audit preparation

### Data Model

```
audit_entries: id, church_id, expense_id, receipt_r2_key,
               board_authorization_meeting_id, bank_statement_match,
               status (complete/incomplete_missing_receipt/
                       incomplete_missing_authorization/flagged)

bank_statements: id, church_id, month, statement_r2_key,
                 upload_date, reconciled_by, reconciled_at
```

### User Flows

1. **Link Expense**: When creating expense (#5), treasurer attaches receipt photo → system prompts: "Which board meeting authorized this?" → links to meeting minutes (#1)
2. **Audit View**: Treasurer filters by date range → sees all expenses with "Missing Receipt" (red), "Missing Authorization" (orange), "Complete" (green) badges
3. **Auditor Access**: Treasurer generates a time-limited auditor access link → auditor views read-only audit binder → cannot modify anything
4. **Bank Reconciliation**: Treasurer uploads monthly bank statement → manually matches transactions to system entries → unresolved items flagged

### Edge Cases

- **Pre-digital records**: Auditor examines physical receipt → treasurer marks "Physical receipt verified by [auditor] on [date]"
- **Multiple authorizations**: One expense authorized across two board meetings → links to both
- **Auditor notes**: Auditor can add notes visible to treasurer (not part of official record)

---

## 8. Digital Receipt Verification Registry (#8)

**Addresses**: Member digital deposits, receipt uploads, treasurer approval queue

### Data Model

```
digital_receipts: id, church_id, member_id, date, amount_total,
                  breakdown_json (tithe, local_church, departments),
                  receipt_image_r2_key, bank_reference,
                  status (submitted/matched/approved/rejected/needs_clarification),
                  treasurer_notes, approved_by, approved_at
```

### User Flows

1. **Member Upload**: Member transfers money via bank/mobile app → screenshots confirmation → opens Theobase → "Submit Receipt" → uploads image → enters total amount → fills digital envelope breakdown (tithe, local, Pathfinders, etc.) → "Submit"
2. **Treasurer Queue**: Treasurer opens "Pending Receipts" → sees chronological queue → opens entry → views receipt image side-by-side with church bank statement → "Looks good — Approve" or "Amount doesn't match — Request Clarification"
3. **Member Notification**: Push notification: "Your offering of $50 has been verified. God bless you."
4. **Rejection**: If rejected, member sees treasurer's note and can resubmit

### Edge Cases

- **Duplicate receipt**: System hashes image and flags potential duplicates → "This receipt may have already been submitted"
- **Wrong amount**: Member enters $100 but receipt shows $90 → treasurer flags "Amount mismatch" → member corrects
- **Missing breakdown**: Member forgets to allocate → system defaults to 100% tithe → member can adjust
- **File formats**: JPEG, PNG, HEIC, PDF accepted; compressed client-side before upload (max 500 KB)
- **Member has no smartphone**: Treasurer can upload on member's behalf from desktop

---

## 9. Pathfinder & Adventurer Matrix (#9)

**Addresses**: Youth club progress tracking, merit badges, uniforms, digital permission slips

### Data Model

```
pathfinder_members: id, church_id, member_id, club_role (director/deputy/
                    counselor/guide/friend/companion/explorer/ranger),
                    uniform_size, induction_date, investiture_date

class_progress: id, pathfinder_member_id, class_level
                (friend/companion/explorer/ranger/guide/master_guide
                 for Pathfinders; busy_bee/sunbeam/builder/helping_hand
                 for Adventurers), requirement_id, completed_date,
                 verified_by, notes

honor_badges: id, pathfinder_member_id, honor_name, honor_category
              (adra/arts_crafts/health_science/household_arts/nature/
               outdoor_industries/recreation/vocational),
              completed_date, instructor_id, notes

events: id, church_id, event_type (campout/camporee/fair/investiture/
        social), date, location, permission_slip_required

permission_slips: id, event_id, pathfinder_member_id, parent_approval
                  (pending/approved), emergency_contact, medical_notes,
                  submitted_at
```

### User Flows

1. **Club Setup**: Director adds members → assigns current class level → system pre-loads official curriculum requirements from SDA Pathfinder/Adventurer handbooks
2. **Track Progress**: Director or counselor selects a member → sees class checklist (e.g., "Friend Class: ✓ 15/20 requirements completed") → checks off completed items → dates and verifier recorded
3. **Honor Badges**: Counselor awards badge → selects from full badge catalog → enters completion date → "Completed First Aid Honor under Instructor Dr. Vulakana"
4. **Uniform Tracking**: Records each member's uniform size → generates ordering list for club director
5. **Permission Slips**: Director creates event → marks "Permission slip required" → parents receive notification → parent signs digitally (checkbox + name) → director sees "23/25 slips returned"

### Edge Cases

- **Pre-loaded curriculum data**: System ships with the full official Pathfinder and Adventurer curriculum JSON (static data, updated annually). An admin panel allows regional directors to add custom requirements.
- **Member transfers between clubs**: Export member progress as PDF/JSON → import at new church
- **Multiple children per parent**: Parent dashboard shows all their children's progress
- **Investiture readiness**: System auto-calculates which members have completed all requirements for their class level and are ready for investiture

---

## 10. Sabbath School Division Dashboard (#10)

**Addresses**: Class registers, student attendance tracking, follow-up care

### Data Model

```
sabbath_school_divisions: id, church_id, name (Cradle_Roll, Kindergarten,
                          Primary, Junior, Earliteen, Youth, Young_Adult,
                          Adult_1, Adult_2, etc.), teacher_id, co_teacher_id

sabbath_school_sessions: id, division_id, date, teacher_id, lesson_topic,
                         lesson_quarter, lesson_number, total_attendance

attendance_records: id, session_id, member_id, present (boolean),
                    visitor_name (nullable), notes
```

### User Flows

1. **Mark Attendance**: Teacher opens app → selects their division → sees class roster → taps each student/member → "Present" → optionally adds visitor names → "Submit" (works offline, syncs later)
2. **Substitute Teacher View**: Substitute opens division → sees last week's attendance, current lesson topic, and student notes → no prior knowledge needed
3. **Absence Tracking**: Dashboard shows "Students who missed 3+ weeks" → teacher clicks to send a "We missed you!" message
4. **Lesson Guide**: Teacher can view current quarter's lesson study guide inline (pulled from SDA Sabbath School quarterly, if available digitally)

### Edge Cases

- **Visitor pattern**: "I've visited 3 times from the next town" — system suggests adding as a regular attendee
- **Class splitting/combining**: "Primary + Junior combined today due to low numbers" → teacher selects both divisions
- **Teacher absence**: Co-teacher inherits the class for the day → temporary access granted
- **Curriculum integration**: Links to official SDA quarterly lesson content where digital versions exist; falls back to free-text lesson topic entry

---

## 11. Community Welfare & Dorcas Privacy (#11)

**Addresses**: Confidential case management, food pantry tracking, data privacy

### Data Model

```
welfare_cases: id, church_id, encrypted_recipient_name (AES-256-GCM),
               encrypted_contact_info, case_status (active/on_hold/closed),
               assistance_types[], opened_date, closed_date, case_manager_id

assistance_records: id, case_id, date, assistance_type (food_parcel/
                    utility_help/rental_assistance/medical/counseling_referral/
                    clothing/transport), description, value_estimate,
                    provided_by

pantry_inventory: id, church_id, item_name, quantity, unit, min_threshold,
                  last_restocked, restocked_by
```

### User Flows

1. **Open Case**: Welfare team member encounters a family in need → opens Theobase → "New Case" → enters recipient name (encrypted immediately) → describes situation → selects assistance needed → case created with auto-generated anonymous ID
2. **Log Assistance**: Team member opens case → "Provided food parcel (rice, tin fish, flour) — $45 estimated" → records date and provider
3. **Pantry Management**: Team member opens pantry → sees current stock levels → red items below threshold → "Restock" button → records new supplies added
4. **Privacy**: Recipient data is encrypted at rest; only welfare team members (assigned by admin) can decrypt; names never appear in logs, notifications, or regular views — only anonymous case IDs
5. **Review**: Monthly "Welfare Summary" — total cases, total assistance value, pantry stock levels — no recipient names in reports

### Edge Cases

- **Consent**: Before creating a case, the system prompts: "Has the recipient consented to their information being stored?" → welfare worker confirms
- **Case closure**: Case closed when assistance no longer needed; records preserved encrypted
- **Multi-church welfare**: A district-level welfare coordinator can see anonymous case counts across churches (not names)
- **GDPR right to erasure**: Encrypted data can be deleted by admin; decryption key destroyed

---

## 12. Evangelism & Bible Study Pipeline (#12)

**Addresses**: Contact tracking, spiritual journey pipeline, follow-up automation

### Data Model

```
evangelism_campaigns: id, church_id, name (Health Expo, Prophecy Seminar,
                      VBS, etc.), start_date, end_date, coordinator_id

evangelism_contacts: id, campaign_id, church_id, name, contact_method
                     (phone/email/address), interest_level (cold/warm/hot),
                     assigned_to (member_id)

contact_stages: id, contact_id, stage_name (initial_contact/attended_event/
                requested_literature/bible_studies_started/attending_church/
                baptismal_class/baptized/not_interested), entered_date,
                notes

bible_study_sessions: id, contact_id, date, topic, notes, attended (boolean)
```

### User Flows

1. **Capture Contact**: After community event, volunteer enters guest names and contact info → assigns an interest level → campaigns group contacts automatically
2. **Pipeline View**: Kanban board — columns for each stage → drag contacts from "Requested Literature" → "Bible Studies Started" → "Attending Church" → tracks the journey visually
3. **Assignment**: Coordinator assigns each contact to a church member for follow-up → member sees their assigned contacts on dashboard
4. **Reminder**: If no follow-up logged for 7 days, system prompts assigned member: "Have you contacted Taniela yet?"

### Edge Cases

- **Opt-out**: Contact says "not interested" → moved to "Not Interested" column → system stops reminders → contact preserved (not deleted) with note
- **Duplicate contact**: System suggests merge if same phone number appears
- **Consent**: System tracks whether contact consented to continued communication; GDPR compliance
- **Multi-campaign**: One person attends Health Expo and Prophecy Seminar → linked under single contact

---

## 13. Sabbath-Calibrated Timing Engine (#13)

**Addresses**: Sabbath-hour-aware notifications, no disruptive alerts during holy hours

### Configuration

```
church_settings: sabbath_timezone, latitude, longitude,
                 quiet_hours_override (nullable — for churches that
                 want stricter/longer quiet periods)
```

### Behavior

- **Sunset calculation**: Client-side via `suncalc` library using church lat/lng → "Sabbath begins Friday 6:42 PM, ends Saturday 6:41 PM"
- **Notification silence**: All non-emergency notifications suppressed during Sabbath window
- **Emergency override**: "Urgent Prayer Request" or "Natural Disaster Alert" bypasses Sabbath silence
- **Scheduling guard**: When creating a duty or event, the time picker warns if the time falls within Sabbath hours: "This event is scheduled during Sabbath hours. Continue?"
- **Extreme latitudes**: Churches above 60° N/S fall back to 6:00 PM clock-based Sabbath if suncalc cannot determine valid sunset/sunrise

---

## 14. Communion Service Planner (#14)

**Addresses**: Quarterly communion logistics, room setup, volunteer assignments, inventory

### Data Model

```
communion_services: id, church_id, date, status (planning/confirmed/completed)

communion_rooms: id, service_id, room_name (main_sanctuary_men,
                 main_sanctuary_women, mothers_room, etc.),
                 setup_notes, assigned_setup_team[]

communion_volunteers: id, service_id, role (foot_washing_men/women,
                      bread_baking, grape_juice_prep, linen_prep,
                      clean_up), member_id, status

communion_inventory: id, church_id, item (unleavened_bread, grape_juice,
                     linens, basins, towels), quantity, last_checked
```

### User Flows

1. **Create Service**: Deaconess or elder clicks "New Communion Service" → sets date → system auto-populates last communion's plan as template
2. **Assign Roles**: Drag-and-drop volunteers into roles (bread baking, linen prep, foot washing attendants, cleanup)
3. **Room Setup**: Define which rooms are used → add setup notes ("Men's foot washing: fellowship hall. Set up 12 chairs, 6 basins. Towels in vestry cupboard.")
4. **Inventory Check**: System displays current inventory → prompts: "Unleavened bread: 3 packs. Do you need to order more?" → deaconess marks items that need replenishing
5. **Volunteer Notifications**: Volunteers receive their assignments with room and role details one week before service

### Edge Cases

- **Combined services**: Two churches sharing communion → separate plans, same date
- **Inventory depletion**: If stock falls below threshold after a service, auto-adds to "Restocking List"
- **Last-minute volunteer swap**: Same swap mechanism as Duty Rota (#3)

---

## 15. Pulpit-to-AV Live-Sync (#15)

**Addresses**: Real-time communication between pulpit and AV booth

### Data Model

```
av_services: id, church_id, date, status (planning/live/completed)

service_items: id, service_id, sort_order, type (hymn/scripture_reading/
               prayer/special_music/sermon/announcements/benediction),
               title, details, hymn_number, scripture_reference,
               presenter, duration_estimate

av_playlist: id, service_id, item_order[], current_item_index,
             last_updated_by, last_updated_at
```

### User Flows

1. **Pre-Service**: AV team creates playlist → pastor reviews on their device → "Looks good"
2. **During Service**: Pastor on pulpit tablet swipes to next item → AV booth screen updates instantly (via Durable Objects WebSocket) → hymn lyrics appear on projector
3. **Last-Minute Change**: Pastor decides to change closing hymn → taps pulpit tablet → selects new hymn → AV screen updates within 1 second → no paper runners
4. **Timer**: Each item has a countdown timer visible to both pulpit and AV booth → gently helps manage service flow

### Edge Cases

- **WebSocket failure**: If WebSocket drops, the app falls back to 5-second polling → transparent to users
- **Both edit simultaneously**: Last-write-wins with timestamp comparison; merge conflicts are rare since pulpit and AV booth typically coordinate verbally
- **Guest preacher**: Guest mode — pastor generates a guest access link → guest opens on any device → sees the order of service → can advance items (but not edit)
- **Offline fallback**: If pulpit tablet has no signal, items pre-loaded; AV booth manually advances

---

## 16. Pastoral District Hub (#16)

**Addresses**: Multi-church coordination, travel logs, preaching calendars

### Data Model

```
district_config: id, district_id, pastor_id, churches[]

preaching_calendar: id, district_id, date, church_id, preacher_id
                    (pastor or lay_preacher), sermon_title, notes

pastoral_visits: id, district_id, member_id, church_id, visit_date,
                 visit_type (home/hospital/prison/school), notes,
                 follow_up_needed

travel_logs: id, district_id, pastor_id, date, from_location, to_location,
             purpose, distance_km, mileage_reimbursement_submitted
```

### User Flows

1. **District View**: Pastor opens district dashboard → sees all churches in their district → preaching calendar (who is preaching where each Sabbath) → "Drive 40 miles to a rural church site on a rainy morning" scenario prevented by clear calendar
2. **Preaching Schedule**: Pastor drags their name (or a lay preacher) onto a church for a specific Sabbath → all churches see the schedule → no double-booking
3. **Visit Log**: Pastor visits a member → opens app → logs visit type and notes → automatic date/time stamp → "Follow up in 2 weeks" reminder
4. **Mileage**: Travel log auto-calculates distance (from stored church coordinates) → pastor can submit monthly mileage report to conference

### Edge Cases

- **Itinerant pastor covers 8 churches**: Color-coded calendar shows which church each Sabbath; prevents driving to the wrong site
- **Lay preacher assignment**: Pastor assigns a lay preacher → lay preacher receives notification with sermon time, church address, and contact person
- **Mileage reimbursement**: Export mileage log as CSV/PDF for conference treasurer; links to expense module (#5) if the pastor's travel is reimbursed through the local church

---

## 17. Policy-Aware Facility Coordinator (#17)

**Addresses**: Church hall bookings, policy enforcement, approval workflows

### Data Model

```
facilities: id, church_id, name (main_hall, fellowship_hall, kitchen,
            classrooms, grounds), capacity, features[]

facility_policies: id, church_id, facility_id, rule_type (no_commercial_use,
                   no_alcohol, sabbath_hours_only, insurance_required,
                   max_attendees, requires_deposit),
                   rule_value, board_approved_date

facility_bookings: id, church_id, facility_id, requested_by, date, start_time,
                   end_time, event_name, event_type, expected_attendees,
                   policy_check_passed (boolean), policy_violations[],
                   status (pending_approval/approved/rejected/cancelled),
                   board_meeting_id (if applicable), approved_by
```

### User Flows

1. **Configure Policies**: Church board (#1) defines facility policies → admin enters them into the system → "No commercial use", "No alcohol on premises", "Sabbath hours only", "Insurance certificate required for > 50 attendees"
2. **Member Request**: Member opens app → "Book a Facility" → selects hall, date, time → describes event → system runs policy check
3. **Policy Check**: If event type is "Business garage sale" and policy says "No commercial use" → system flags: "This event violates church policy: No commercial operations on church grounds. Cannot proceed."
4. **Board Approval**: If policy check passes, request auto-routed to board for approval at next meeting (#1) → board votes → member notified
5. **Calendar**: Approved bookings visible on church facility calendar → prevents double-booking

### Edge Cases

- **Policy override**: Board can vote to approve an exception → recorded in meeting minutes → booking proceeds
- **Recurring bookings**: "Every Tuesday night Pathfinders meeting" → single approval covers recurring series
- **Emergency use**: "Cyclone shelter needed tonight" → admin can bypass policy check with emergency flag
- **Deposit tracking**: If deposit required, booking marked "Pending deposit" until treasurer confirms receipt

---

## 18. Crisis Resilience Matrix (#18)

**Addresses**: Disaster preparedness, asset tracking across churches

### Data Model

```
crisis_assets: id, church_id, asset_type (generator/solar_system/water_tank/
               first_aid_kit/fire_extinguisher/satellite_phone/emergency_food/
               boat/radio), description, capacity, status
               (operational/needs_maintenance/out_of_order),
               last_verified, verified_by

crisis_contacts: id, church_id, role (emergency_coordinator, first_aider,
                 security, evacuation_lead), member_id, contact_priority

regional_crisis_view: (in district database) aggregated from church crisis_assets
```

### User Flows

1. **Record Assets**: Church admin enters all crisis assets → "Generator 5kW, diesel — operational. Water tank 2000L — operational. Satellite phone — needs new battery."
2. **Verification Reminder**: Every 3 months, system prompts admin: "Please verify the status of your crisis assets" → admin walks through church and updates
3. **Regional Dashboard** (District/Conference Level): During a cyclone, regional coordinator opens Crisis Matrix → filters by affected area → sees: "Nadroga Church: generator (operational), water tank (2000L, full). Sigatoka Church: generator (out of order — parts needed)." → dispatches relief accordingly
4. **Rapid Contact**: In an emergency, coordinator can send mass notification to all church emergency contacts in affected area

### Edge Cases

- **Stale data**: Assets not verified in 6+ months → marked "Verification overdue" → escalated to district
- **Permission**: Asset data visible to district/conference admins only; not visible to regular members (operational security)
- **Data freshness**: "Last verified June 2026" prominently displayed; regional users can see how stale the data is

---

## 19. Offline-First Data Architecture (#19)

**Addressed throughout the technical architecture. Key UX behaviors:**

### Offline UX States

| State | UI Indicator | Behavior |
|-------|-------------|----------|
| **Online, synced** | Green dot with checkmark: "All changes synced" | Normal operation |
| **Online, syncing** | Spinning indicator: "Syncing..." | Non-blocking; user can continue working |
| **Offline, pending sync** | Yellow dot: "3 changes pending" | All features work; changes saved locally |
| **Offline, sync failed** | Red dot: "Sync failed — tap to retry" | Changes safe locally; manual retry or auto-retry on next app open |
| **Conflict detected** | Orange badge on module: "2 items need review" | Side-by-side resolution UI |

### Sync Priorities

Data syncs in priority order:
1. **Critical**: Attendance records, tithe envelopes, board votes (sync immediately)
2. **Standard**: Member profiles, duty rota, budget changes (sync within 5 minutes)
3. **Bulk**: Receipt photos, uploaded documents (sync when on WiFi, not metered data)

### Data Limits

- **On device**: Max 500 MB IndexedDB per church; oldest non-critical data evicted to cloud-only
- **Images**: Thumbnails stored locally (5 KB each); full resolution fetched on-demand
- **Documents**: Last 12 months of board minutes, receipts, and statements kept locally; older items cloud-only

### Performance Targets

| Metric | Target |
|--------|--------|
| App load time (cached) | < 1.5 seconds |
| App load time (first visit) | < 4 seconds on 3G |
| Sync payload size | < 50 KB typical, < 500 KB after 2 weeks offline |
| Local write latency | < 50 ms |
| OCR processing | < 3 seconds per envelope |
| WebSocket reconnection | < 5 seconds |
