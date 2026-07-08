## Problem Statement

The Seventh-day Adventist Church operates a hierarchical structure from local churches up to the General Conference (world church). Currently, data collection from the grassroots level is fragmented, manual, and slow. Local churches struggle to report statistics, membership data, and ministry outcomes efficiently. Conference and union administrators spend excessive time consolidating reports from multiple sources. Division and General Conference leaders lack real-time visibility into global church health and growth metrics.

## Solution

Theobase is a web-based information system that enables seamless data collection at the local church level and automatically aggregates it through the church hierarchy. Local church clerks enter data once, and it flows up through conferences, unions, and divisions to the General Conference. The system provides role-based dashboards, automated reporting, and real-time analytics at every level.

## User Stories

1. As a local church clerk, I want to enter membership statistics quarterly, so that my conference has accurate data
2. As a local church clerk, I want to record baptisms and professions of faith, so that growth metrics are tracked
3. As a local church clerk, I want to submit Sabbath School attendance, so that ministry effectiveness is measured
4. As a local church clerk, I want to report financial tithes and offerings, so that stewardship is tracked
5. As a local church clerk, I want to see what reports are due and when, so that I don't miss deadlines
6. As a local church clerk, I want to use the system offline on my phone, so that I can enter data even with poor connectivity
7. As a local church elder, I want to review reports before submission, so that data is accurate
8. As a conference administrator, I want to see all churches in my conference at a glance, so that I can identify churches needing support
9. As a conference administrator, I want to consolidate reports from all churches automatically, so that I don't have to manually compile data
10. As a conference administrator, I want to send reminders to churches with overdue reports, so that compliance improves
11. As a conference administrator, I want to export data to spreadsheets, so that I can do custom analysis
12. As a union administrator, I want to see aggregated data from all conferences in my union, so that I can report to the division
13. As a union administrator, I want to compare performance across conferences, so that I can identify best practices
14. As a division administrator, I want to see regional trends across multiple unions, so that I can make strategic decisions
15. As a General Conference administrator, I want to see global church statistics in real-time, so that I can report to the world church
16. As a General Conference administrator, I want to generate Annual Statistical Reports automatically, so that the process is efficient
17. As a General Conference administrator, I want to track progress toward evangelism goals, so that we can celebrate growth and identify needs
18. As a church member, I want to verify my membership record is accurate, so that my standing is correct
19. As a pastor, I want to see trends in my church's attendance and giving, so that I can adjust ministry strategies
20. As a departmental director (e.g., Sabbath School, AY), I want to see participation metrics, so that I can support local departments
21. As an auditor, I want to see a complete audit trail of data changes, so that I can verify data integrity
22. As a system administrator, I want to manage user roles and permissions, so that data access is secure
23. As a system administrator, I want to configure report templates, so that new report types can be added
24. As a user, I want to receive notifications for important updates, so that I stay informed
25. As a user, I want to access the system in multiple languages, so that it works globally
26. As a user, I want the system to work on mobile devices, so that I can use it anywhere
27. As a user, I want my data to be backed up automatically, so that I don't lose information
28. As a conference administrator, I want to approve reports from churches, so that only verified data moves up the hierarchy
29. As a union administrator, I want to see year-over-year comparisons, so that I can track growth trends
30. As a General Conference administrator, I want to drill down from global to local data, so that I can investigate specific regions

## Implementation Decisions

### Data Model

- Hierarchical organization structure: Church → Conference → Union → Division → General Conference
- Each organization level can view aggregated data from all children
- Reports are versioned with timestamps and submitter information
- Data flows upward; each level can approve/reject before forwarding

### Authentication & Authorization

- Role-based access control (RBAC) with hierarchical permissions
- Users belong to specific organizations and inherit permissions
- Support for SSO integration with existing church systems

### Data Collection

- Forms are configurable per report type
- Support for quarterly, annual, and ad-hoc reports
- Offline-first PWA with sync when connectivity returns
- Validation rules enforced at entry time

### Aggregation

- Automatic rollup of numeric data (sums, averages, counts)
- Approval workflow at each level before data propagates upward
- Audit trail for all data changes and approvals

### Technology

- Backend: Hono on Cloudflare Workers for global edge performance
- Frontend: Vite + React + TanStack Router + TanStack Query PWA
- Database: Cloudflare D1 for serverless SQL
- Storage: Cloudflare R2 for file attachments
- Authentication: Cloudflare Access or custom JWT-based auth

### API Design

- RESTful API with clear resource hierarchy
- Pagination for large datasets
- Filtering and sorting on all list endpoints
- Webhook support for real-time notifications

### Multi-tenancy

- Data isolation by organization hierarchy
- Conference admins only see their churches
- Union admins only see their conferences
- Division admins only see their unions

### Internationalization

- Support for multiple languages from day one
- Date, number, and currency formatting per locale
- RTL language support

## Testing Decisions

### What makes a good test

- Tests verify external behavior, not implementation details
- Tests are independent and can run in any order
- Tests use realistic data fixtures
- Integration tests cover API boundaries
- E2E tests cover critical user journeys

### Modules to test

- Authentication and authorization logic
- Report submission and approval workflows
- Data aggregation and rollup calculations
- Offline sync mechanism
- Role-based access control

### Prior art

- Standard Vitest unit tests for business logic
- Integration tests for API endpoints
- E2E tests with Playwright for critical flows

## Out of Scope

- Financial transaction processing (tithes/offering amounts are reported, not processed)
- Member directory with contact information (privacy concerns)
- Communication features (messaging, announcements)
- Event management and scheduling
- Document management beyond report attachments
- Integration with external church management software (future phase)
- Mobile native apps (PWA covers mobile needs)

## Further Notes

### Phased Rollout

1. Phase 1: Local church data entry (membership, baptisms, attendance)
2. Phase 2: Conference-level aggregation and reporting
3. Phase 3: Union and division dashboards
4. Phase 4: General Conference global view and Annual Statistical Report generation
5. Phase 5: Advanced analytics, trend analysis, and predictive insights

### Compliance

- GDPR compliance for European users
- Data retention policies per organization level
- Right to erasure for individual members
- Audit logging for all data changes

### Performance Targets

- Page load < 2 seconds on 3G connections
- Offline-first with < 5 second sync time when online
- Support 10,000+ concurrent users globally
- 99.9% uptime SLA

### Success Metrics

- 80% of churches submitting reports on time within 6 months
- 50% reduction in time spent by conference admins on report consolidation
- 90% user satisfaction score from church clerks
- Real-time visibility for General Conference leadership
