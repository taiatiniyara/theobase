#!/usr/bin/env bash
# Pre-push hook: blocks force-push to protected branches and runs full test suite.
# Install to .husky/pre-push (Husky) or .git/hooks/pre-push (manual).
# Agent-agnostic: applies to all users and AI agents equally.

set -euo pipefail

PROTECTED_BRANCHES=("main" "master")
REMOTE="$1"

current_branch=$(git symbolic-ref HEAD 2>/dev/null | sed 's|refs/heads/||')

for protected in "${PROTECTED_BRANCHES[@]}"; do
  if [[ "$current_branch" == "$protected" ]]; then
    echo "ERROR: Direct push to '$protected' is not allowed."
    echo "Create a branch, push that, then open a pull request."
    exit 1
  fi
done

while read local_ref local_sha remote_ref remote_sha; do
  for protected in "${PROTECTED_BRANCHES[@]}"; do
    if [[ "$remote_ref" == "refs/heads/$protected" ]]; then
      if [[ "$remote_sha" == "0000000000000000000000000000000000000000" ]]; then
        continue
      fi
      if ! git merge-base --is-ancestor "$remote_sha" "$local_sha" 2>/dev/null; then
        echo "ERROR: Force-push to '$protected' is blocked."
        echo "Use a regular push or rebase instead."
        exit 1
      fi
    fi
  done
done

echo "Running full test suite before push..."

if command -v npx &>/dev/null && [[ -f package.json ]]; then
  if npm run lint --silent 2>/dev/null; then
    echo "Lint: OK"
  else
    echo "ERROR: Lint failed. Fix before pushing."
    exit 1
  fi

  if npm run typecheck --silent 2>/dev/null; then
    echo "Typecheck: OK"
  else
    echo "ERROR: Typecheck failed. Fix before pushing."
    exit 1
  fi

  if npm test --silent 2>/dev/null; then
    echo "Tests: OK"
  else
    echo "ERROR: Tests failed. Fix before pushing."
    exit 1
  fi
fi

echo "Pre-push checks passed."
exit 0
