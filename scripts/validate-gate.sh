#!/usr/bin/env bash
set -euo pipefail

PHASE="${1:-}"

case "$PHASE" in
  0)
    echo "=== Gate 0: Lint & Typecheck ==="
    npm run lint
    npm run format
    npm run typecheck
    echo "PASS"
    ;;
  3)
    echo "=== Gate 3: Tests & No Regressions ==="
    npm run typecheck
    npm run lint
    npm run format
    npm run test
    echo "PASS"
    ;;
  *)
    echo "Usage: $0 <phase-number>"
    echo "Phases: 0, 3"
    exit 1
    ;;
esac
