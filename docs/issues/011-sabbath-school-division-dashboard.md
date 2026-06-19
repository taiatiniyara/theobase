# 011 — Sabbath School Division Dashboard

## What to build

Digital class registers for each Sabbath School age division (Beginners, Kindergarten, Primary, Juniors, Earliteen, Youth, Adult). Teachers record attendance weekly and see personal engagement trends. Includes built-in links to the current lesson study (the Quarterly). Replaces physical paper roll-books.

## Acceptance criteria

- [ ] Drizzle schema: `sabbath_school_division` (congregation_id, name, age_range), `sabbath_school_class` (division_id, teacher_id, name), `sabbath_school_attendance` (class_id, date, member_id, present, notes)
- [ ] Hono endpoint `GET /sabbath-school/divisions` — list divisions for congregation
- [ ] Hono endpoint `GET /sabbath-school/divisions/:id/classes` — list classes in division
- [ ] Hono endpoint `GET /sabbath-school/classes/:id/attendance` — attendance records for date range
- [ ] Hono endpoint `POST /sabbath-school/classes/:id/attendance` — record weekly attendance (bulk: array of {member_id, present})
- [ ] Attendance trends: chart showing per-member attendance over last 12 weeks
- [ ] Lesson study links: current Quarterly URL by age division, configurable per congregation
- [ ] Test: teacher opens register → marks attendance → trends update → next week shows comparison
- [ ] Test: division/class creation scoped to congregation

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
