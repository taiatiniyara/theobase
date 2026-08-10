# User Management

## Overview

User management lets you invite church officers and Conference staff to Theobase and assign them the right permissions for their work. Users are separate from members — a person can be listed as a church member without having a platform login, and vice versa.

## Roles

Theobase uses these system roles:

| Role          | Access Level                                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sysadmin**  | Full platform access across all Conferences. Can manage organization structure, users, and all modules. For platform administrators only.                        |
| **president** | Read-only access to membership, finance, and audit across the Conference. Can view dashboards and reports but cannot modify data.                                |
| **secretary** | Can manage members, record attendance, initiate transfers, and update member records for assigned churches. Can also invite users to the platform.               |
| **treasurer** | Can create and confirm offering batches, enter transactions and expenses, and view financial reports for assigned churches. Full write access to finance module. |
| **auditor**   | Read-only access to membership, finance, and audit logs across the Conference. Can view all audit trail entries and reports.                                     |
| **pastor**    | Can view members, attendance, and dashboards for churches in their assigned district(s). Can also record attendance and manage member records.                   |
| **member**    | Limited self-service access — can view their own giving history, attendance, and submit transfer requests. Can also submit giving declarations for verification. |

## Inviting a User

1. From the Conference dashboard, navigate to **Users**.
2. Click **Invite User**.
3. Fill in the invitation details:
   - **Name**: The user's full name.
   - **Email**: Their email address. This is where the invitation is sent.
   - **Role**: Select the appropriate system role.
   - **Church(es)**: Assign the user to one or more churches, or leave at Conference level for Conference-wide access.
4. Click **Send Invitation**.

The user receives an email with a temporary password and instructions to log in. On first login, they'll be prompted to set their own password.

## Bulk Inviting Users

If you have many officers to invite (e.g., all clerks and treasurers for a new set of churches):

1. From the Users page, click **Bulk Invite**.
2. Download the CSV template.
3. Fill in names, emails, roles, and church assignments.
4. Upload the completed CSV.
5. Review the preview and confirm.

Each user receives their own invitation email.

## Managing Existing Users

From the user list, click any user to:

- **Edit role**: Change their system role.
- **Change church assignment**: Add or remove church-level access.
- **Update email**: Change the email associated with their account.
- **Deactivate**: Temporarily disable their account (preserves their data but prevents login).

## Resending an Invitation

If a user didn't receive or lost their invitation:

1. Find the user in the user list.
2. Click **Resend Invitation**.
3. A new temporary password is generated and sent.

## Self-Service: Member Access

Members can have limited platform access for:

- Viewing their tithe and offering history.
- Submitting a transfer request when moving to a new church.

Member accounts are created through the self-service signup flow, not through user invitation.

## Tips

- Assign the secretary role to church clerks for membership and attendance management.
- A user can be assigned to multiple churches (useful for a treasurer serving two small churches).
- Pastors should be assigned to districts, not individual churches — the district assignment automatically includes all churches in that district.
- User deactivation does not delete the person from the membership roll — it only removes their platform access.
