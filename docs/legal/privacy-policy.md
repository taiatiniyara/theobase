# Privacy Policy

**Last updated: July 2025**

## 1. Introduction

Theobase ("we", "us", or "our") is committed to protecting the privacy of Seventh-day Adventist Conferences, churches, and their members who use our church administration platform. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data.

## 2. Data We Collect

### 2.1 Account Information

When a Conference administrator creates an account, we collect:

- Full name and email address of the administrator
- Conference name, code, and contact information
- User email addresses for each invited officer (secretaries, treasurers, pastors, etc.)

### 2.2 Church Member Data

As directed by the Conference and its local churches, the Service processes:

- Member names, contact information (address, phone, email), and dates of birth
- Baptism records (date, method — immersion or profession of faith, officiating minister)
- Membership status (active, transferred, deceased, removed)
- Church position assignments (Elder, Treasurer, Clerk, Deacon, etc.)
- Household groupings and family relationships

### 2.3 Financial Data

- Tithe and offering records, including amounts, dates, and member attribution (where provided)
- Expense records and budget allocations
- Offering batch records with dual-custody confirmations

### 2.4 Attendance Data

- Weekly attendance counts by category (Sabbath School, Church Service, Youth)

### 2.5 Technical Data

- Authentication logs (login timestamps, IP addresses)
- Audit trail entries (who changed what and when)
- Device information (user agent, IP address) captured for audit purposes

## 3. How We Use Your Data

We use the collected data exclusively to provide and improve the Service:

- **Platform operation**: Storing, retrieving, and displaying church administration data to authorized users within each Conference.
- **Reporting**: Generating monthly treasurer reports, quarterly business meeting reports, and Conference dashboards from data entered by users.
- **Billing**: Calculating monthly charges based on church count and processing payments through Stripe.
- **Support**: Responding to support requests and troubleshooting issues.

We do **not** sell, rent, or share Conference Data with third parties for their own marketing or commercial purposes. We do **not** use Conference Data to train machine learning models.

## 4. Data Storage

All Conference Data is stored in **Cloudflare D1** databases. Each Conference's data resides in its own **isolated database** — no two Conferences share a database. This architecture ensures physical data separation between tenants.

Data is stored at rest in the Cloudflare region closest to the Conference's geographic location, as determined by Cloudflare's global network.

## 5. Third-Party Sub-processors

We use the following sub-processors to deliver the Service:

| Sub-processor  | Purpose                                                      | Location |
| -------------- | ------------------------------------------------------------ | -------- |
| **Cloudflare** | Infrastructure (D1 database, Workers runtime, Email routing) | Global   |
| **Stripe**     | Payment processing                                           | Global   |

We evaluate all sub-processors for security and privacy compliance before engagement. A current list of sub-processors is maintained here; we will notify account holders of any changes at least 14 days before a new sub-processor begins processing data.

## 6. Data Retention

Conference Data is retained for as long as the Conference's account remains active. Upon account termination:

- **30-day export window**: The Conference may request a full export of its data at any point during the 30 days following termination.
- **Deletion**: After 30 days, all Conference Data is permanently deleted from our systems, including backups, except for anonymized aggregate metrics that cannot be re-identified.

Individual member or transaction records can be corrected or updated at any time through the Service interface by authorized users. The audit trail preserves the history of all changes.

## 7. Your Rights

Conferences and their users have the following rights regarding their data:

- **Access**: View all data stored in the Service through the application interface or API.
- **Correction**: Update or correct inaccurate data through the Service interface.
- **Deletion**: Remove member records, transactions, or entire churches as permitted by the application's business logic.
- **Data portability**: Request a complete export of Conference Data in a machine-readable format (JSON/CSV) by contacting support@theobase.app.
- **Account deletion**: Terminate the Conference account and request deletion of all associated data.

The Conference, as data controller, is responsible for handling data subject requests from individual church members. Theobase, as data processor, will assist the Conference in fulfilling such requests within 30 days.

## 8. Cookies and Tracking

Theobase uses the following browser storage:

- **JWT tokens** in `localStorage`: Used for session management (access token, 15-minute expiry; refresh token, 7-day expiry). These are functional tokens required for authentication, not tracking cookies.
- **IndexedDB** (via Dexie.js): Used for offline data synchronization, storing a local copy of the user's church data for offline access.

We do **not** use third-party tracking cookies, analytics cookies, or advertising cookies.

## 9. Children's Data

Theobase is designed for use by adult church officers and administrators. We do not knowingly collect personal data from children under the age of 13. Member records for minors are entered by authorized church officers as part of the membership roll.

## 10. International Data Transfers

Theobase operates on Cloudflare's global infrastructure. Data is stored and processed in the Cloudflare region closest to the Conference's location. By using the Service, data may be transferred to and processed in countries outside the Conference's home jurisdiction. All transfers are protected by appropriate safeguards, including Cloudflare's data processing terms.

## 11. Security

We implement technical and organizational measures to protect Conference Data:

- **Encryption at rest**: D1 databases are encrypted at rest.
- **Encryption in transit**: All connections use TLS 1.3.
- **Access controls**: JWT-based authentication with 15-minute access token expiry. Role-based permissions restrict data access to authorized users within each Conference.
- **Per-Conference isolation**: Each Conference's data resides in its own D1 database, preventing cross-tenant access.
- **Audit logging**: All data modifications are recorded in an append-only audit trail.

For full security details, see our Security Audit documentation and Data Processing Agreement.

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify account holders of material changes via email at least 30 days before the changes take effect. The "Last updated" date at the top of this policy indicates the most recent revision.

## 13. Contact

For privacy-related inquiries or to exercise your data rights:

**Email**: support@theobase.app
