# Graph Report - .  (2026-06-17)

## Corpus Check
- Corpus is ~298 words - fits in a single context window. You may not need a graph.

## Summary
- 17 nodes · 14 edges · 6 communities (2 shown, 4 thin omitted)
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Graphify Ecosystem|Graphify Ecosystem]]
- [[_COMMUNITY_OpenCode Config Schema|OpenCode Config Schema]]
- [[_COMMUNITY_Plugin Dependencies|Plugin Dependencies]]
- [[_COMMUNITY_OpenCode Setup|OpenCode Setup]]
- [[_COMMUNITY_Project Context|Project Context]]

## God Nodes (most connected - your core abstractions)
1. `GraphifyPlugin` - 4 edges
2. `Graphify Agent Rules` - 3 edges
3. `OpenCode Plugin Configuration` - 2 edges
4. `graphify-out/ Knowledge Graph` - 2 edges
5. `Graphify CLI Tool` - 2 edges
6. `Graphify Skill` - 2 edges
7. `$schema` - 1 edges
8. `plugin` - 1 edges
9. `@opencode-ai/plugin` - 1 edges
10. `OpenCode Plugin Dependencies` - 1 edges

## Surprising Connections (you probably didn't know these)
- `GraphifyPlugin` --semantically_similar_to--> `Graphify Skill`  [INFERRED] [semantically similar]
  .opencode/plugins/graphify.js → AGENTS.md
- `GraphifyPlugin` --conceptually_related_to--> `Graphify CLI Tool`  [INFERRED]
  .opencode/plugins/graphify.js → AGENTS.md
- `GraphifyPlugin` --references--> `graphify-out/ Knowledge Graph`  [EXTRACTED]
  .opencode/plugins/graphify.js → AGENTS.md
- `OpenCode Plugin Configuration` --references--> `GraphifyPlugin`  [EXTRACTED]
  .opencode/opencode.json → .opencode/plugins/graphify.js
- `OpenCode Plugin Dependencies` --shares_data_with--> `OpenCode Plugin Configuration`  [INFERRED]
  .opencode/package.json → .opencode/opencode.json

## Hyperedges (group relationships)
- **Graphify Integration System** — graphifyjs_GraphifyPlugin, graphify_skill, graphify_cli_tool, graphify_out_kg [INFERRED 0.85]

## Communities (6 total, 4 thin omitted)

### Community 0 - "Graphify Ecosystem"
Cohesion: 0.60
Nodes (5): Graphify Agent Rules, Graphify CLI Tool, graphify-out/ Knowledge Graph, Graphify Skill, GraphifyPlugin

## Knowledge Gaps
- **6 isolated node(s):** `$schema`, `plugin`, `@opencode-ai/plugin`, `OpenCode Plugin Dependencies`, `Theobase Project` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GraphifyPlugin` connect `Graphify Ecosystem` to `OpenCode Setup`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `OpenCode Plugin Configuration` connect `OpenCode Setup` to `Graphify Ecosystem`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `GraphifyPlugin` (e.g. with `Graphify CLI Tool` and `Graphify Skill`) actually correct?**
  _`GraphifyPlugin` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `plugin`, `@opencode-ai/plugin` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._