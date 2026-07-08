# Issue 30: Notification System

## What to build

Batched, channel-appropriate notifications. Push notifications, in-app badges, email coordination. Quiet hours respected.

## Input/Output

**Input:** Domain events (census started, report due, transfer received, giving verified, guest visited, meeting scheduled), user notification preferences, user timezone
**Output:** Batched notifications delivered via correct channel (push, in-app badge, email), no duplicate messages, quiet hours respected

## Validation Requirements

- Batching: multiple events of same type within 15 minutes → one notification
- Channel routing: census → push, weekly summary → in-app badge, report due → email, transfer → push + in-app badge
- Same message never delivered via multiple channels simultaneously
- Quiet hours: no push notifications between 9 PM and 7 AM local time (user timezone)
- Preferences: opt-out per notification type without affecting other types
- Each notification must include context ("Quarterly report ready for Central SDA (85 members)")
- Tap notification must deep-link to relevant screen, not just open app
- In-app badge: count of unread/unresolved items only, clears on view
- Notification history: viewable in app, searchable by type and date

## Acceptance Criteria

- [ ] Batched: multiple pending items → one notification, not five
- [ ] Right channel: census → push, weekly summary → in-app badge, report due → email
- [ ] Same message never duplicated across channels
- [ ] Quiet hours: no notifications 9 PM - 7 AM local time
- [ ] Manage preferences: opt out of specific notification types without consequence
- [ ] Context-rich: "Quarterly report ready for Central SDA (85 members)" not "Report ready"
- [ ] Actionable: tap notification → go directly to relevant screen
- [ ] In-app badge count shows only unread/unresolved items

## Blocked by

- Issue 1, 10, 22

## Docs

- `CHANGELOG.md`
