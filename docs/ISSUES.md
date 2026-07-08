# Issue Tracker

Dependency graph and issue list for Theobase implementation. 33 issues across 7 phases.

## Implementation Order

**Phase 0 — Cross-Cutting Quality (24-26, 29):**
Ship early — affect every other issue.

1. Issue 24: Offline-First Infrastructure
2. Issue 25: Error-Proof UI Patterns
3. Issue 26: Accessibility Implementation
4. Issue 29: Onboarding Flow

**Phase A — Foundation (1-3):** 5. Issue 1: Add First Member (TRACER BULLET) 6. Issue 2: View Member List 7. Issue 3: Edit Member Details

**Phase B — Core Features (4-10, 28, 30):** 8. Issue 5: Quarterly Membership Report 9. Issue 6: Financial Tracking 10. Issue 7: Ministry Participation 11. Issue 9: User Roles and Permissions 12. Issue 4: Transfer Member 13. Issue 10: Dashboard and Navigation 14. Issue 8: Hierarchical Data Aggregation 15. Issue 28: Search Implementation 16. Issue 30: Notification System

**Phase C — Membership Lifecycle (11-13, 31):** 17. Issue 11: Baptism Class Management 18. Issue 31: Profession of Faith 19. Issue 12: Transfer Request Workflow 20. Issue 13: Membership Discipline and Restoration

**Phase D — Governance & Ministries (14-16, 19, 32-33):** 21. Issue 14: Officer Elections 22. Issue 15: Meeting Management 23. Issue 19: Sabbath School Management 24. Issue 16: Youth Club Management 25. Issue 32: Ministry Activity Report 26. Issue 33: Directives Management

**Phase E — Finance (17-18, 27):** 27. Issue 17: Photo-Based Giving 28. Issue 18: Treasurer Verification 29. Issue 27: Email Infrastructure

**Phase F — Communication & Outreach (20-23):** 30. Issue 22: Communication Hub 31. Issue 20: Census Self-Confirmation 32. Issue 21: Guest Tracking and Follow-up 33. Issue 23: Pastoral Visit Tracking

## High-Risk Issues

- Issue 4: Transfer Member — cross-church boundary
- Issue 8: Hierarchical Data Aggregation — cross-community, security critical
- Issue 12: Transfer Request Workflow — cross-church workflow
- Issue 13: Membership Discipline — sensitive data, privacy
- Issue 24: Offline-First Infrastructure — architectural foundation

## All Issues (33 total)

| #   | Title                         | Blocked by    | Risk   | Phase |
| --- | ----------------------------- | ------------- | ------ | ----- |
| 1   | Add First Member              | None          | Medium | A     |
| 2   | View Member List              | 1             | Low    | A     |
| 3   | Edit Member Details           | 1             | Low    | A     |
| 4   | Transfer Member               | 2, 3          | High   | B     |
| 5   | Quarterly Membership Report   | 1             | Low    | B     |
| 6   | Financial Tracking            | 1             | Medium | B     |
| 7   | Ministry Participation        | 1             | Low    | B     |
| 8   | Hierarchical Data Aggregation | 1, 5, 6       | High   | B     |
| 9   | User Roles and Permissions    | 1             | Medium | B     |
| 10  | Dashboard and Navigation      | 2, 5          | Low    | B     |
| 11  | Baptism Class Management      | 1             | Low    | C     |
| 12  | Transfer Request Workflow     | 2, 3, 4       | High   | C     |
| 13  | Discipline and Restoration    | 1             | High   | C     |
| 14  | Officer Elections             | 1             | Low    | D     |
| 15  | Meeting Management            | 1             | Low    | D     |
| 16  | Youth Club Management         | 1, 7          | Low    | D     |
| 17  | Photo-Based Giving            | 1             | Medium | E     |
| 18  | Treasurer Verification        | 17            | Medium | E     |
| 19  | Sabbath School Management     | 1             | Low    | D     |
| 20  | Census Self-Confirmation      | 1, 2, 22      | Medium | F     |
| 21  | Guest Tracking and Follow-up  | 1, 11         | Low    | F     |
| 22  | Communication Hub             | 1             | Low    | F     |
| 23  | Pastoral Visit Tracking       | 1             | Low    | F     |
| 24  | Offline-First Infrastructure  | 1             | High   | 0     |
| 25  | Error-Proof UI Patterns       | 1             | Medium | 0     |
| 26  | Accessibility Implementation  | 1             | Medium | 0     |
| 27  | Email Infrastructure          | 1, 17, 18, 20 | Medium | E     |
| 28  | Search Implementation         | 2, 5          | Low    | B     |
| 29  | Onboarding Flow               | 1             | Low    | 0     |
| 30  | Notification System           | 1, 10, 22     | Low    | B     |
| 31  | Profession of Faith           | 1             | Low    | C     |
| 32  | Ministry Activity Report      | 7             | Low    | D     |
| 33  | Directives Management         | 1, 9          | Low    | D     |
