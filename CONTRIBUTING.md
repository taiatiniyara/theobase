# Contributing

## Setup

One-command clone + install + run:

```bash
git clone https://github.com/taiatiniyara/theobase.git
cd theobase
npm install
npm run dev
```

## Development

```bash
# Run all dev servers
npm run dev

# Run linter
npm run lint

# Run typechecker
npm run typecheck

# Run formatter check
npm run format:check

# Run tests
npm run test
```

## Branching

- Branch from `main`: `issue-<n>-<slug>` (e.g., `issue-42-auth-flow`)
- One issue per branch — no multi-issue branches
- Squash-merge back to `main`, then delete the branch
- No direct commits to `main` — all changes via branch + merge

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).
Enforced locally via `commitlint` in the `commit-msg` hook.

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`.

**Rules:**

- Description: imperative mood, lowercase, no period, max 72 chars
- Scope: module or area affected (optional but encouraged)
- Body: wrap at 80 chars, explain what and why (not how)
- Footer: `BREAKING CHANGE:`, `Refs #123`, `Closes #456`

## Git Hooks

Powered by [Husky](https://typicode.github.io/husky/). All hooks run
locally — they apply to humans and AI agents equally.

| Hook         | What it does                                      |
| ------------ | ------------------------------------------------- |
| `pre-commit` | lint-staged (format), typecheck, unit tests       |
| `commit-msg` | commitlint (conventional commit format)           |
| `pre-push`   | blocks force-push to `main`, runs full test suite |

## Signing

All commits should be signed (GPG or SSH). Enable with:

```bash
git config commit.gpgsign true
```

## CI

CI runs on GitHub Actions. The pipeline:

1. Linter
2. Typechecker
3. Tests
4. Build

All must pass before merge to `main`.

## Releases

Versioned with [Semantic Versioning](https://semver.org/). Tags follow
`vMAJOR.MINOR.PATCH`. CHANGELOG is generated from conventional commits.
