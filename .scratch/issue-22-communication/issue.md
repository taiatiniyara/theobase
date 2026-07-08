# Issue 22: Communication Hub

## What to build

Church communication — announcements, notifications, prayer requests.

## Input/Output

**Input:** Announcement (title, body, categories, visibility scope, expiry date), PrayerRequest (text, visibility public/private, status)
**Output:** Announcement record with auto-expiry, PrayerRequest with status tracking (new/prayed/answered)

## Validation Requirements

- Announcement title and body are required
- Expiry date must be in the future
- Categories are configurable (worship, evangelism, fellowship, service, other)
- Prayer request text is required (max 2000 chars)
- Visibility must be public or private
- Private prayer requests visible only to pastors and the requester
- Members can only edit their own prayer requests
- Announcements data filtered by user's church

## Acceptance Criteria

- [ ] Clerk creates announcements with categories and visibility
- [ ] Announcements auto-expire based on date
- [ ] Members submit prayer requests (public/private visibility)
- [ ] Prayer requests track status (new/prayed/answered)
- [ ] System sends automated notifications (census reminders, report due, transfers)

## Blocked by

- Issue 1: Add First Member

## Docs: `docs/agents/contracts/communication-api.md`, `docs/agents/schemas/announcement.json`
