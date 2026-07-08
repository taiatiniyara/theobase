# ADR 0005: Mobile-First PWA

## Status

Accepted

## Context

Grassroots church users (clerks, administrators) often don't have computers or reliable internet access. They rely on mobile phones for data entry, especially in developing regions where the church is growing fastest.

## Decision

Build Theobase as a mobile-first Progressive Web App (PWA), not a desktop-first web application.

**Key implications:**

- Touch targets >= 44x44px (Apple HIG) for thumb-friendly interaction
- Bottom navigation (thumb zone) instead of sidebar
- Single-column layouts on mobile, progressive enhancement for desktop
- Offline-first with TanStack Query (optimistic UI, background sync)
- Skeleton screens instead of spinners (perceived performance on slow networks)
- Dark mode designed from start (battery conservation, outdoor use, low light)
- PWA installable on home screen (native app feel without app store friction)

## Alternatives Considered

### Desktop-first web app

- Pros: Easier to build complex dashboards, more screen real estate for data entry
- Cons: Excludes grassroots users without computers, not mobile-friendly, requires responsive retrofitting later

### Native mobile apps (iOS/Android)

- Pros: Better performance, offline support, device features (camera, GPS)
- Cons: App store friction (users must download), maintenance burden (two codebases), slower iteration, not installable in restricted environments

### Responsive web app (desktop-first, then mobile)

- Pros: Can build for desktop first, then adapt
- Cons: Mobile experience is an afterthought, UX compromises, harder to optimize for mobile constraints

## Consequences

### Positive

- Accessible to grassroots users on mobile phones (primary use case)
- Installable as PWA (native app feel without app store)
- Offline-first works in low-connectivity environments
- Single codebase (easier maintenance than native apps)
- Dark mode conserves battery on OLED screens
- Touch-optimized UI works well for volunteers with varying technical skills

### Negative

- Complex dashboards harder to build on mobile (limited screen real estate)
- PWA limitations (no access to some native features, browser compatibility issues)
- Offline-first adds complexity (conflict resolution, sync logic)
- Dark mode from start requires more design work upfront

## Related Decisions

- ADR 0003: Authentication Approach (magic links for mobile users who forget passwords)
- ADR 0004: RBAC with Row-Level Security (mobile UI must still enforce data isolation)
