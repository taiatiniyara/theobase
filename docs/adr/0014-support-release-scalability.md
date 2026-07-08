# ADR 0014: Support, Release Process, and Scalability

## Status

Accepted

## Context

Churches depend on Theobase every Sabbath. An update that breaks on Friday night is catastrophic. A clerk who can't get help will abandon the product. Scaling from 1 church to 10,000 must not degrade the experience for the first church.

## Decision

### Support and Feedback

**In-app feedback, one tap away:**

- "Tell us what happened" — simple text field + auto-attached screenshot
- System context auto-included (screen, role, recent action)
- Feature requests use the same channel
- No chatbot. No knowledge base. A real person reads it.
- Frustrated clerk → feedback sent in under 10 seconds

**Public changelog in user language:**

- "Fixed: Adding a member saves instantly, even on slow connections"
- Not: "fix: resolved race condition in optimistic mutation queue"
- Every release has a changelog entry

**Transparent known issues:**

- Subtle in-app banner when a feature is degraded
- "We're working on improving photo upload speed"
- Honesty builds trust

### Release Process

**Continuous delivery:**

- Small, frequent changes. Multiple deploys per day if needed.
- Backwards-compatible API changes — old clients and new clients coexist
- Deprecated fields marked, not removed until transition window closes

**Feature flags for risk:**

- Data model or auth changes ship dark
- Gradual rollout: 1% → 10% → 50% → 100%
- 24-hour monitoring window between each step
- Automatic rollback if error rate increases

**Deployment rules:**

- No deploys Friday sunset to Saturday sunset (Sabbath)
- No deploys during quarterly report deadlines (end of quarter week)
- One-click rollback for every deploy
- Rollback under 1 minute

**PWA updates:**

- Service worker updates in background
- User opens app → already on latest version
- No "please refresh" prompts
- No version incompatibility

**Public status page:**

- status.theobase.org
- Current health visible
- Honest about issues. Honest about resolutions.

### Scalability

**Architecture that scales linearly:**

- Cloudflare Workers scale to zero and scale to infinity automatically
- D1 reads scale globally (replicas), writes bottleneck at primary (acceptable for church-size datasets)
- R2 scales automatically for file storage

**Performance targets at scale:**

- 1 church (120 members): sub-100ms response times
- 1 Division (10,000 churches): sub-200ms response times
- Worldwide (100,000+ churches): sub-300ms response times

**Cost model scales predictably:**

- 1 church: ~$0.50/month (free tier covers most usage)
- 1 Conference (100 churches): ~$25/month
- 1 Division (10,000 churches): ~$250/month
- Worldwide (100,000+): ~$2,500/month

**No multi-tenant degradation:**

- One church's usage doesn't slow down another church
- One Division doesn't slow down another Division
- Cloudflare edge handles isolation at the infrastructure level

**Data growth management:**

- Historical reports archived after 2 years (R2)
- Active data stays in D1 for fast access
- No practical limit on church size or number of churches

## Consequences

### Positive

- Support frictionless for grassroots users
- Releases invisible — church never disrupted
- Linear cost scaling, predictable at any size
- Architecture handles growth without redesign

### Negative

- Feature flags add deployment complexity
- Staged rollouts slow down time-to-full-deployment for risky changes
- Monitoring infrastructure needed for status page and error detection
- Archived data in R2 requires different query patterns than active data in D1
