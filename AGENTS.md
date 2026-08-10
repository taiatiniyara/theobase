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

GitHub Issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical five: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Pre-commit self-review

Before every commit, run a sub-agent to verify the diff against the ticket's acceptance criteria:

1. At the start of a ticket, save the spec to `.scratch/spec.md`:
   ```
   gh issue view <number> --json body,title > .scratch/spec.md
   ```

2. After implementation, before committing, spawn a sub-agent with:
   - `git diff HEAD` (the unstaged changes)
   - `.scratch/spec.md` contents
   - Relevant ADR sections from `docs/adr/`
   - Prompt: "Check every AC against the diff. Report missing, partial, or wrong items. Under 200 words."

3. Fix any gaps found, then commit.

4. After committing, run `graphify update .`.
