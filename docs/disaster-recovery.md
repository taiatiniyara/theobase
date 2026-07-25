# Disaster Recovery

This document describes how to recover a Theobase Conference database from Cloudflare D1's point-in-time restore capability.

## Recovery Point Objective (RPO)

**~30 minutes.** D1 automatically backs up databases continuously. The most you can lose is the transactions since the last backup checkpoint.

## Recovery Time Objective (RTO)

**~1 hour.** From detection of data loss to full recovery, assuming an operator is available.

## Scenario: Restore a single Conference database

### 1. Identify the database

Each Conference has its own D1 database named `theobase-<conference-code>`. Find the database ID:

- Cloudflare Dashboard → Workers & Pages → D1 → find `theobase-<code>`
- Or via CLI: `wrangler d1 list`

### 2. Initiate restore

1. In the Cloudflare Dashboard, open the target D1 database.
2. Click the **Backups** tab.
3. Select the restore point just before the data loss event.
4. Click **Restore**.
5. Confirm the restore. D1 creates a new database with the restored data. The original is NOT overwritten.

### 3. Update the Worker binding

After restore, you need to point the Worker at the restored database:

1. In Cloudflare Dashboard, go to Workers & Pages → theobase → Settings → Variables → D1 Database Bindings.
2. Update the binding for the affected Conference to point to the restored database ID.
3. Redeploy the Worker: `wrangler deploy`.

### 4. Verify integrity

1. Log in as the Conference administrator.
2. Check the audit trail (`/app/audit`) — the last entries should match the restore point.
3. Verify a few critical records: member count, last offering batch, most recent transfer.
4. If any data is missing, repeat the restore with an earlier restore point.

## Scenario: Wrong database restored

If you accidentally restore the wrong database (e.g., Conference A's data into Conference B's database):

1. **Do not panic.** The original database was not overwritten.
2. Find the original database ID (it's still in the D1 list with the old name).
3. Revert the Worker binding to the original database ID.
4. Repeat the restore procedure with the correct database.

## Scenario: Partial data corruption

If only some tables are corrupted (e.g., `transactions` but not `members`):

1. Restore the database to a new D1 instance (as above).
2. Export the affected table from the restored database:
   ```bash
   wrangler d1 export theobase-<code>-restored --table transactions --output transactions.sql
   ```
3. Import the exported data into the production database:
   ```bash
   wrangler d1 execute theobase-<code> --file=transactions.sql
   ```
4. Verify the imported data is correct.
5. Delete the temporary restored database.

## Scenario: Full platform outage (all Conferences)

If multiple Conference databases are affected simultaneously:

1. Follow the single-Conference restore procedure for each affected Conference.
2. Prioritize Conferences by activity (most recent transactions first).
3. Each Conference restore is independent — they can be restored in parallel.

## Escalation

If you cannot restore via the Cloudflare Dashboard:

- Cloudflare Support: https://dash.cloudflare.com/?to=/:account/support
- Emergency contact: [add your contact info here]
- Theobase repository: https://github.com/taiatiniyara/theobase

## Prevention

- The audit trail (`audit_log` table) is append-only — never truncated or updated. This provides a secondary reconstruction path if D1 backups are unavailable.
- All financial transactions are immutable after dual-custody confirmation per ADR-0001.
- Per-Conference D1 tenancy (ADR-0002) means one Conference's outage does not affect others.
