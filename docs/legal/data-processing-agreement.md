# Data Processing Agreement (DPA)

This Data Processing Agreement forms part of the Terms of Service between Theobase and the Conference.

## 1. Parties

- **Data Controller**: The Seventh-day Adventist Conference or Mission that has registered for a Theobase account ("Conference" or "Controller").
- **Data Processor**: Theobase, provider of the church administration platform ("Theobase" or "Processor").

## 2. Purpose and Scope

The Processor will process personal data on behalf of the Controller for the purpose of providing the Theobase church administration platform, including church administration, membership management, financial record-keeping, attendance tracking, and reporting.

## 3. Duration

This DPA is effective for the duration of the Controller's subscription to the Service and continues until all personal data is deleted in accordance with Section 10.

## 4. Nature and Purpose of Processing

The processing activities consist of:

- **Storage**: Storing church membership, financial, and attendance data in Cloudflare D1 databases.
- **Retrieval**: Making stored data available to authorized users via the Theobase web application and API.
- **Reporting**: Aggregating data to generate monthly treasurer reports, quarterly business meeting reports, and Conference dashboards.
- **Audit logging**: Recording all data modifications in an append-only audit trail for accountability and annual church audit purposes.
- **Billing**: Calculating monthly charges based on church count for payment processing.

## 5. Types of Personal Data

The following categories of personal data are processed:

- Member names (first, middle, last)
- Contact details (address, phone number, email address)
- Dates of birth
- Baptism records (date, method, officiating minister, previous denomination)
- Membership status and transfer history
- Church position assignments
- Household associations
- Tithe and offering records (amounts, dates, fund designations)
- User account information (names, email addresses, roles)

## 6. Categories of Data Subjects

- Seventh-day Adventist church members
- Church officers (Elders, Treasurers, Clerks, Deacons, etc.)
- Conference officers (President, Secretary, Treasurer, Auditor)
- District pastors

## 7. Sub-processors

The Controller authorizes the Processor to engage the following sub-processors:

| Sub-processor  | Service Provided                                                                                                                  | Data Processed                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Cloudflare** | D1 database (primary data storage), Workers runtime (application hosting), Email routing (password reset and verification emails) | All Conference Data                                                                                   |
| **Stripe**     | Payment processing                                                                                                                | Conference billing details, invoice amounts (does not access church member data or financial records) |

The Processor will notify the Controller of any intended changes concerning the addition or replacement of sub-processors at least 14 days in advance. The Controller may object to a new sub-processor by terminating the Service in accordance with the Terms of Service.

All sub-processors are bound by written agreements that impose data protection obligations no less protective than those in this DPA.

## 8. Technical and Organizational Measures (TOMs)

The Processor implements and maintains the following measures:

### 8.1 Encryption

- **At rest**: All data stored in Cloudflare D1 is encrypted at rest using AES-256.
- **In transit**: All data transmission uses TLS 1.3.

### 8.2 Access Controls

- **Authentication**: JWT-based authentication with HS256 signing. Access tokens expire after 15 minutes; refresh tokens expire after 7 days.
- **Password security**: User passwords are hashed using PBKDF2 with 100,000 iterations and SHA-256. Passwords are never stored in plaintext.
- **Authorization**: Role-based access control (sysadmin, president, secretary, treasurer, auditor, pastor, member). Users can only access data within their authorized scope.
- **Tenant isolation**: Each Conference's data resides in its own Cloudflare D1 database. Cross-tenant access is prevented at the database level.

### 8.3 Audit Logging

- All data creation, modification, and deletion events are recorded in the `audit_log` table.
- Each entry captures: actor ID, action, entity type, entity ID, previous state (JSON), new state (JSON), module, timestamp, and device information.
- The audit log is **append-only** with no update or delete operations permitted.

### 8.4 Rate Limiting

- Authentication endpoints: 5 requests per minute per IP.
- Read operations: 300 requests per minute per IP.
- Write operations: 100 requests per minute per IP.

### 8.5 Monitoring

- Error logging via internal D1-based error logs table.
- Analytics via Cloudflare Analytics Engine.
- Cron-based subscription status checks run monthly.

### 8.6 Availability and Resilience

- Cloudflare Workers provides globally distributed, high-availability hosting.
- D1 databases benefit from continuous automated backups with point-in-time restore.
- Durable Objects (ChurchSyncDO, ConferenceDO) manage stateful operations with automatic failover.
- Disaster recovery procedures are documented and tested.

## 9. Data Subject Rights

The Controller is responsible for receiving and responding to data subject requests from church members. The Processor shall:

- Provide technical mechanisms within the Service for the Controller to access, correct, and delete personal data.
- Assist the Controller in fulfilling data subject access, correction, and deletion requests within **30 days** of notification.
- Notify the Controller without undue delay of any data subject request received directly by the Processor.

## 10. Breach Notification

In the event of a personal data breach, the Processor shall:

- Notify the Controller **within 72 hours** of becoming aware of the breach.
- Provide a description of the nature of the breach, the categories and approximate number of data subjects and records affected, the likely consequences, and the measures taken or proposed to address the breach.
- Cooperate with the Controller's investigation and any required notifications to supervisory authorities or data subjects.

## 11. Data Deletion

Upon termination of the Service:

- The Controller may request a full export of its Conference Data at any point during the 30 days following termination.
- The Processor will permanently delete all Conference Data from its systems, including D1 databases, backups, and any cached or derived copies, within **30 days** of contract termination.
- Anonymized aggregate metrics (which cannot be re-identified) may be retained.

## 12. Audit Rights

The Controller may, no more than once per year and at its own expense:

- Request written documentation of the Processor's security measures and compliance certifications.
- Request the results of any third-party security assessments or penetration tests conducted on the Service.

On-site audits are not available due to the cloud-native, multi-tenant architecture of the Service. The Processor will provide security documentation sufficient to demonstrate compliance with this DPA.

## 13. International Data Transfers

Data is stored and processed on Cloudflare's global infrastructure. By entering into this DPA, the Controller acknowledges that data will be processed in the Cloudflare region(s) closest to the Controller's geographic location. All sub-processors maintain appropriate safeguards for international data transfers as required by applicable data protection laws.

## 14. Limitation of Liability

Each party's liability arising from this DPA is subject to the limitations and exclusions set forth in the Terms of Service.
