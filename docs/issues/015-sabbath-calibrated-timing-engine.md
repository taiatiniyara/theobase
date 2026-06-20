# 015 — Sabbath-Calibrated Timing Engine

**Status: Implemented** (Sabbath timing utilities in packages/shared; guard in API middleware; acceptance criteria need review)

## What to build

All scheduled notifications and reminders are calibrated to local Friday sunset times, not midnight or arbitrary time zones. The engine queries a global geolocation database for the congregation's coordinates and adjusts all scheduled DO alarms, email dispatches, and in-app reminders to respect sacred hours (never fire between Friday sunset and Saturday sunset).

## Acceptance criteria

- [ ] Sunset data: integrate a geolocation-to-sunset-time service or pre-computed table (sunset times by lat/lng + date)
- [ ] Congregation setup extended: clerk enters address → geocode to lat/lng → store in `congregation` table
- [ ] Timing utility: `getNextSabbathBoundaries(congregationId)` returns { sunset_friday: Date, sunset_saturday: Date }
- [ ] All DO alarms (duty rota reminders from Slice 006) adjusted: fire before Friday sunset, never during Sabbath
- [ ] Email dispatch: reminders scheduled for Thursday evening local time
- [ ] Notification block window: any notification that would fire during Sabbath hours gets shifted to before Friday sunset or after Saturday sunset
- [ ] Test: congregation in Suva (GMT+12) gets reminders at correct local time, not UTC midnight
- [ ] Test: notification scheduled for Saturday 10am auto-shifts to Friday 5pm local
- [ ] Test: congregation near the Arctic Circle (extreme sunset variation) handled correctly

## Blocked by

- 001 — Monorepo + Auth Foundation
- 006 — Smart-Swap Duty Rota + Safety Shield
