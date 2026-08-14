# Graph Report - theobase  (2026-08-14)

## Corpus Check
- 119 files · ~87,685 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 406 nodes · 393 edges · 48 communities (33 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ce41a94`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Issue tracker: GitHub
- Triage
- teach/SKILL.md
- Process
- Codebase Design
- During the session
- template.sh
- HTML Report Format
- Ask Matt
- Diagnosing Bugs
- Test-Driven Development
- Process
- writing-for-agents/SKILL.md
- wayfinder/SKILL.md
- Language
- to-spec/SKILL.md
- Process
- <Questionnaire title>
- Process
- Issue tracker: GitHub
- Agent skills
- Domain Docs
- hitl-loop.template.sh
- GLOSSARY.md Format
- opencode.json
- graphify.js
- 0001-theobase-replaces-eadventist.md
- 0002-offline-first-at-the-grassroots.md
- 0003-compliance-by-construction.md
- 0004-policy-versioned-tree-scoped.md
- 0005-radical-simplicity-volunteer-user.md
- 0006-modular-core-pluggable-modules.md
- 0007-reports-derived-from-event-log.md
- 0008-multi-tenant-at-conference-mission-level.md
- 0009-evidence-based-events.md
- 0010-flat-per-church-subscription-pricing.md
- 0011-subscription-is-the-only-revenue.md
- 0012-fully-open-source-under-agpl.md
- 0013-policy-content-separate-from-code.md
- agents/triage-labels.md

## God Nodes (most connected - your core abstractions)
1. `template.sh script` - 11 edges
2. `template.sh script` - 11 edges
3. `Triage` - 9 edges
4. `Ask Matt` - 8 edges
5. `Codebase Design` - 8 edges
6. `Diagnosing Bugs` - 8 edges
7. `HTML Report Format` - 8 edges
8. `Language` - 8 edges
9. `During the session` - 7 edges
10. `Process` - 7 edges

## Surprising Connections (you probably didn't know these)
- `hitl-loop.template.sh script` --calls--> `capture()`  [EXTRACTED]
  .agents/skills/diagnosing-bugs/scripts/hitl-loop.template.sh → .claude/skills/diagnosing-bugs/scripts/hitl-loop.template.sh
- `hitl-loop.template.sh script` --calls--> `step()`  [EXTRACTED]
  .agents/skills/diagnosing-bugs/scripts/hitl-loop.template.sh → .claude/skills/diagnosing-bugs/scripts/hitl-loop.template.sh
- `template.sh script` --calls--> `ask()`  [EXTRACTED]
  .agents/skills/wizard/template.sh → .claude/skills/wizard/template.sh
- `template.sh script` --calls--> `ask_secret()`  [EXTRACTED]
  .agents/skills/wizard/template.sh → .claude/skills/wizard/template.sh
- `template.sh script` --calls--> `banner()`  [EXTRACTED]
  .agents/skills/wizard/template.sh → .claude/skills/wizard/template.sh

## Import Cycles
- None detected.

## Communities (48 total, 15 thin omitted)

### Community 0 - "Issue tracker: GitHub"
Cohesion: 0.06
Nodes (30): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary, Conventions, Issue tracker: GitHub, Pull requests as a triage surface (+22 more)

### Community 1 - "Triage"
Cohesion: 0.06
Nodes (29): Bad agent brief, Behavioral, not procedural, Complete acceptance criteria, Durability over precision, Examples, Explicit scope boundaries, Good agent brief (bug), Good agent brief (enhancement) (+21 more)

### Community 2 - "teach/SKILL.md"
Cohesion: 0.07
Nodes (25): Learning Record Format, Numbering, Optional sections, Supersession, Template, What does _not_ qualify, When to write a learning record, MISSION.md Format (+17 more)

### Community 3 - "Process"
Cohesion: 0.07
Nodes (25): 1. State the question, 2. Isolate the logic in a portable module, 3. Build the shareable HTML file, 4. Hand it over, 5. Capture the answer and the prototype, Anti-patterns, Logic Prototype, Process (+17 more)

### Community 4 - "Codebase Design"
Cohesion: 0.09
Nodes (21): 1. In-process, 2. Local-substitutable, 3. Remote but owned (Ports & Adapters), 4. True external (Mock), Deepening, Dependency categories, Seam discipline, Testing strategy: replace, don't layer (+13 more)

### Community 5 - "During the session"
Cohesion: 0.09
Nodes (19): ADR Format, Numbering, Optional sections, Template, What qualifies, When to offer an ADR, CONTEXT.md Format, Rules (+11 more)

### Community 6 - "template.sh"
Cohesion: 0.25
Nodes (17): template.sh script, ask(), ask_secret(), banner(), _clear(), finish(), note(), open_url() (+9 more)

### Community 7 - "HTML Report Format"
Cohesion: 0.10
Nodes (18): Call-graph collapse, Candidate card, Cross-section (good for layered shallowness), Diagram patterns, Hand-built boxes-and-arrows (when Mermaid's layout fights you), Header, HTML Report Format, Mass diagram (good for "interface as wide as implementation") (+10 more)

### Community 8 - "Ask Matt"
Cohesion: 0.12
Nodes (14): Phase boundaries, Primary and secondary sources, The five options, The tree, These are judgement calls, Ask Matt, Codebase health, Context hygiene (+6 more)

### Community 9 - "Diagnosing Bugs"
Cohesion: 0.13
Nodes (14): Completion criterion — a tight loop that goes red, Diagnosing Bugs, Minimise, Non-deterministic bugs, Phase 1 — Build a feedback loop, Phase 2 — Reproduce + minimise, Phase 3 — Hypothesise, Phase 4 — Instrument (+6 more)

### Community 10 - "Test-Driven Development"
Cohesion: 0.15
Nodes (10): Designing for Mockability, When to Mock, Anti-patterns, Rules of the loop, Seams — where tests go, Test-Driven Development, What a good test is, Bad Tests (+2 more)

### Community 11 - "Process"
Cohesion: 0.15
Nodes (12): 1. Gather context, 2. Explore the codebase (optional), 3. Draft vertical slices, 4. Quiz the user, 5. Publish the tickets to the configured tracker, Acceptance criteria, Blocked by, <NN> — <Ticket title> (+4 more)

### Community 12 - "writing-for-agents/SKILL.md"
Cohesion: 0.15
Nodes (11): Context pointers, Information hierarchy, Leading words, Invocation, Router skills, Skill mechanics, Splitting by invocation, Pruning (+3 more)

### Community 13 - "wayfinder/SKILL.md"
Cohesion: 0.17
Nodes (11): Chart the map, Fog of war, Invocation, Out of scope, Plan, don't do, Refer by name, The Map, The map body (+3 more)

### Community 14 - "Language"
Cohesion: 0.20
Nodes (9): Commercial, Finance, Language, Membership, Offices and governance, Policy, The hierarchy, Theobase (+1 more)

### Community 15 - "to-spec/SKILL.md"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, Problem Statement, Process, Solution, Testing Decisions, User Stories

### Community 16 - "Process"
Cohesion: 0.25
Nodes (7): 1. Pin the fixed point, 2. Identify the spec source, 3. Identify the standards sources, 4. Spawn both sub-agents in parallel, 5. Aggregate, Process, Why two axes

### Community 17 - "<Questionnaire title>"
Cohesion: 0.25
Nodes (7): Anything else?, Context, Document structure, How to answer, <Questionnaire title>, <Theme heading>, What load is the system expected to handle at launch?

### Community 18 - "Process"
Cohesion: 0.29
Nodes (6): 1. Scope the procedure, 2. Map each stage's journey, 3. Author the wizard, 4. Verify and hand off, Process, Wizard

### Community 19 - "Issue tracker: GitHub"
Cohesion: 0.29
Nodes (6): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 20 - "Agent skills"
Cohesion: 0.33
Nodes (5): Agent skills, Domain docs, graphify, Issue tracker, Triage labels

### Community 21 - "Domain Docs"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 22 - "hitl-loop.template.sh"
Cohesion: 0.80
Nodes (4): hitl-loop.template.sh script, capture(), hitl-loop.template.sh script, step()

### Community 23 - "GLOSSARY.md Format"
Cohesion: 0.50
Nodes (3): GLOSSARY.md Format, Rules, Structure

### Community 24 - "opencode.json"
Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

## Knowledge Gaps
- **248 isolated node(s):** `$schema`, `.opencode/plugins/graphify.js`, `The five options`, `The tree`, `Primary and secondary sources` (+243 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `$schema`, `.opencode/plugins/graphify.js`, `The five options` to the rest of the system?**
  _248 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Issue tracker: GitHub` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Triage` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `teach/SKILL.md` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Process` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Codebase Design` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `During the session` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._