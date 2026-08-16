## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, default label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Branding

Theobase's identity system — mark, palette, type, voice, positioning — lives in `branding/BRAND.md`. Follow it when writing UI or user-facing strings.

### UI

The interaction model — task-first home, action-first modules, evidence, dual signature, sync, onboarding — lives in `docs/ui.md`. Follow it when building or changing the frontend.

### Specs

Implementation specs — data model, event catalog, offices/actions, policy schema, finance module, sync protocol, testing, migration, deployment, non-functional — live in `docs/specs/`. Read the relevant spec before implementing its area.

### Strategy

The champion thesis, moat, and platform roadmap live in `docs/strategy.md`. Read it before making product-direction or scope decisions.
