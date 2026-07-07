#!/usr/bin/env bash
# Validate phase gates by checking artifacts and running verification commands.
# Stack-agnostic: detects Node.js, Python, Go, Rust, and runs equivalent commands.
# Usage: ./scripts/validate-gate.sh <phase>
# Exit 0 if all checks pass, exit 1 if any check fails.

set -euo pipefail

PHASE="${1:-}"
ERRORS=0

if [[ -z "$PHASE" ]]; then
  echo "Usage: validate-gate.sh <phase>"
  exit 1
fi

error() {
  echo "FAIL: $1"
  ERRORS=$((ERRORS + 1))
}

check_file() {
  if [[ ! -f "$1" ]]; then
    error "Missing file: $1"
    return 1
  fi
  return 0
}

check_dir() {
  if [[ ! -d "$1" ]]; then
    error "Missing directory: $1"
    return 1
  fi
  return 0
}

check_nonempty() {
  if [[ ! -s "$1" ]]; then
    error "File is empty: $1"
    return 1
  fi
  return 0
}

check_meaningful_content() {
  # Check file has more than just template/headers - at least N lines of actual content
  local file="$1"
  local min_lines="${2:-20}"
  if [[ ! -f "$file" ]]; then
    error "Missing file: $file"
    return 1
  fi
  local line_count=$(wc -l < "$file")
  if [[ $line_count -lt $min_lines ]]; then
    error "File $file has only $line_count lines (expected at least $min_lines)"
    return 1
  fi
  return 0
}

check_table_rows() {
  # Check markdown file has actual table rows (not just headers)
  local file="$1"
  local min_rows="${2:-3}"
  if [[ ! -f "$file" ]]; then
    error "Missing file: $file"
    return 1
  fi
  # Count lines with | that aren't just headers (contain actual data)
  local row_count=$(grep -E '^\|[^-]+\|' "$file" | grep -v '^\|[-:]+\|' | wc -l)
  if [[ $row_count -lt $min_rows ]]; then
    error "File $file has only $row_count table rows (expected at least $min_rows)"
    return 1
  fi
  return 0
}

check_section_content() {
  # Check a markdown section has actual content (not just header)
  local file="$1"
  local section="$2"
  local min_chars="${3:-50}"
  if [[ ! -f "$file" ]]; then
    error "Missing file: $file"
    return 1
  fi
  # Extract section content (from header to next header or EOF)
  local content=$(awk "/^#+ .*${section}/,/^#+ /" "$file" | head -n -1)
  local char_count=$(echo "$content" | wc -c)
  if [[ $char_count -lt $min_chars ]]; then
    error "Section '$section' in $file has only $char_count chars (expected at least $min_chars)"
    return 1
  fi
  return 0
}

# Detect stack
detect_stack() {
  if [[ -f "package.json" ]]; then
    echo "node"
  elif [[ -f "pyproject.toml" ]] || [[ -f "setup.py" ]] || [[ -f "requirements.txt" ]]; then
    echo "python"
  elif [[ -f "go.mod" ]]; then
    echo "go"
  elif [[ -f "Cargo.toml" ]]; then
    echo "rust"
  elif [[ -f "pom.xml" ]] || [[ -f "build.gradle" ]]; then
    echo "java"
  else
    echo "unknown"
  fi
}

STACK=$(detect_stack)
echo "Detected stack: $STACK"

# Run stack-specific command
run_stack_cmd() {
  local cmd_name="$1"
  local description="$2"
  
  case "$STACK" in
    node)
      if [[ -f "package.json" ]] && grep -q "\"$cmd_name\"" package.json; then
        echo "Running $description (npm run $cmd_name)..."
        if ! npm run "$cmd_name" --silent 2>/dev/null; then
          error "$description failed"
        else
          echo "  $description: OK"
        fi
      else
        echo "  $description: skipped (no '$cmd_name' script in package.json)"
      fi
      ;;
    python)
      case "$cmd_name" in
        lint)
          if command -v ruff &>/dev/null; then
            echo "Running $description (ruff check)..."
            if ! ruff check . 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          elif command -v flake8 &>/dev/null; then
            echo "Running $description (flake8)..."
            if ! flake8 . 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          else
            echo "  $description: skipped (no linter found)"
          fi
          ;;
        typecheck)
          if command -v mypy &>/dev/null; then
            echo "Running $description (mypy)..."
            if ! mypy . 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          elif command -v pyright &>/dev/null; then
            echo "Running $description (pyright)..."
            if ! pyright . 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          else
            echo "  $description: skipped (no typechecker found)"
          fi
          ;;
        test)
          if command -v pytest &>/dev/null; then
            echo "Running $description (pytest)..."
            if ! pytest 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          else
            echo "  $description: skipped (pytest not found)"
          fi
          ;;
        audit)
          if command -v pip-audit &>/dev/null; then
            echo "Running $description (pip-audit)..."
            if ! pip-audit 2>/dev/null; then
              error "$description found vulnerabilities"
            else
              echo "  $description: OK"
            fi
          else
            echo "  $description: skipped (pip-audit not found)"
          fi
          ;;
      esac
      ;;
    go)
      case "$cmd_name" in
        lint)
          if command -v golangci-lint &>/dev/null; then
            echo "Running $description (golangci-lint)..."
            if ! golangci-lint run 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          else
            echo "  $description: skipped (golangci-lint not found)"
          fi
          ;;
        typecheck)
          echo "Running $description (go build)..."
          if ! go build ./... 2>/dev/null; then
            error "$description failed"
          else
            echo "  $description: OK"
          fi
          ;;
        test)
          echo "Running $description (go test)..."
          if ! go test ./... 2>/dev/null; then
            error "$description failed"
          else
            echo "  $description: OK"
          fi
          ;;
        audit)
          if command -v govulncheck &>/dev/null; then
            echo "Running $description (govulncheck)..."
            if ! govulncheck ./... 2>/dev/null; then
              error "$description found vulnerabilities"
            else
              echo "  $description: OK"
            fi
          else
            echo "  $description: skipped (govulncheck not found)"
          fi
          ;;
      esac
      ;;
    rust)
      case "$cmd_name" in
        lint)
          echo "Running $description (cargo clippy)..."
          if ! cargo clippy -- -D warnings 2>/dev/null; then
            error "$description failed"
          else
            echo "  $description: OK"
          fi
          ;;
        typecheck)
          echo "Running $description (cargo check)..."
          if ! cargo check 2>/dev/null; then
            error "$description failed"
          else
            echo "  $description: OK"
          fi
          ;;
        test)
          echo "Running $description (cargo test)..."
          if ! cargo test 2>/dev/null; then
            error "$description failed"
          else
            echo "  $description: OK"
          fi
          ;;
        audit)
          if command -v cargo-audit &>/dev/null; then
            echo "Running $description (cargo audit)..."
            if ! cargo audit 2>/dev/null; then
              error "$description found vulnerabilities"
            else
              echo "  $description: OK"
            fi
          else
            echo "  $description: skipped (cargo-audit not found)"
          fi
          ;;
      esac
      ;;
    java)
      case "$cmd_name" in
        lint|typecheck)
          if [[ -f "pom.xml" ]] && command -v mvn &>/dev/null; then
            echo "Running $description (mvn compile)..."
            if ! mvn compile 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          elif [[ -f "build.gradle" ]] && command -v gradle &>/dev/null; then
            echo "Running $description (gradle build)..."
            if ! gradle build 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          else
            echo "  $description: skipped (no build tool found)"
          fi
          ;;
        test)
          if [[ -f "pom.xml" ]] && command -v mvn &>/dev/null; then
            echo "Running $description (mvn test)..."
            if ! mvn test 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          elif [[ -f "build.gradle" ]] && command -v gradle &>/dev/null; then
            echo "Running $description (gradle test)..."
            if ! gradle test 2>/dev/null; then
              error "$description failed"
            else
              echo "  $description: OK"
            fi
          else
            echo "  $description: skipped (no build tool found)"
          fi
          ;;
      esac
      ;;
    *)
      echo "  $description: skipped (unknown stack)"
      ;;
  esac
}

echo "=== Phase $PHASE Gate Validation ==="
echo ""

case "$PHASE" in
  0)
    echo "Checking Phase 0 artifacts..."
    
    # Git
    check_dir ".git" || true
    check_file ".gitignore" || true
    
    # Core files
    check_file "README.md" || true
    check_nonempty "README.md" || true
    check_file "CONTRIBUTING.md" || true
    check_nonempty "CONTRIBUTING.md" || true
    check_file "CHANGELOG.md" || true
    
    # CHANGELOG format
    if check_file "CHANGELOG.md"; then
      if ! grep -q "## \[Unreleased\]" CHANGELOG.md; then
        error "CHANGELOG.md missing [Unreleased] section"
      fi
      if ! grep -q "keepachangelog" CHANGELOG.md; then
        error "CHANGELOG.md doesn't reference keepachangelog.com"
      fi
    fi
    
    # Directory structure
    check_dir "docs" || true
    check_dir "docs/adr" || true
    check_dir "docs/agents" || true
    check_dir "docs/agents/contracts" || true
    check_dir "docs/agents/schemas" || true
    check_dir ".scratch" || true
    
    # Git hooks (check for any pre-commit hook framework)
    if [[ -d ".husky" ]] || [[ -d ".git/hooks" ]]; then
      if [[ -f ".husky/pre-commit" ]] || [[ -f ".git/hooks/pre-commit" ]]; then
        echo "  Pre-commit hook: found"
      else
        error "No pre-commit hook found"
      fi
      if [[ -f ".husky/commit-msg" ]] || [[ -f ".git/hooks/commit-msg" ]]; then
        echo "  Commit-msg hook: found"
      else
        error "No commit-msg hook found"
      fi
      if [[ -f ".husky/pre-push" ]] || [[ -f ".git/hooks/pre-push" ]]; then
        echo "  Pre-push hook: found"
      else
        error "No pre-push hook found"
      fi
    else
      error "No git hook framework found (Husky, lefthook, pre-commit, etc.)"
    fi
    
    # Commitlint (check for any commit message validation)
    if [[ -f "commitlint.config.js" ]] || [[ -f ".commitlintrc.json" ]] || [[ -f ".commitlintrc.yml" ]]; then
      echo "  Commitlint: found"
    else
      echo "  Commitlint: not found (recommended for conventional commits)"
    fi
    
    # State files
    check_file "CONTEXT.md" || true
    check_file "docs/ARCHITECTURE.md" || true
    
    # Run linter
    run_stack_cmd "lint" "Linter"
    
    # Run typechecker
    run_stack_cmd "typecheck" "Typechecker"
    ;;
    
  1)
    echo "Checking Phase 1 artifacts..."
    
    # CONTEXT.md populated with actual terms
    check_file "CONTEXT.md" || true
    if check_file "CONTEXT.md"; then
      if ! grep -q "## Terms" CONTEXT.md; then
        error "CONTEXT.md missing Terms section"
      fi
      # Check it has actual content (not just template)
      check_meaningful_content "CONTEXT.md" 30 || true
      # Check it has actual term definitions (table rows)
      check_table_rows "CONTEXT.md" 5 || true
    fi
    
    # ARCHITECTURE.md has required sections WITH CONTENT
    check_file "docs/ARCHITECTURE.md" || true
    if check_file "docs/ARCHITECTURE.md"; then
      # Check each required section exists and has meaningful content
      for section in "Stack" "Topology" "API" "UI/UX" "Compliance" "Cost" "Documentation"; do
        if ! grep -qi "$section" docs/ARCHITECTURE.md; then
          error "docs/ARCHITECTURE.md missing $section section"
        else
          # Verify section has actual content (not just header)
          check_section_content "docs/ARCHITECTURE.md" "$section" 100 || true
        fi
      done
      # Overall file should be substantial
      check_meaningful_content "docs/ARCHITECTURE.md" 100 || true
    fi
    
    # ADRs exist AND have actual content
    check_dir "docs/adr" || true
    if check_dir "docs/adr"; then
      adr_count=$(find docs/adr -name "*.md" -type f 2>/dev/null | wc -l)
      if [[ $adr_count -eq 0 ]]; then
        error "docs/adr/ is empty (no ADRs)"
      else
        # Verify at least one ADR has substantial content
        for adr in docs/adr/*.md; do
          if [[ -f "$adr" ]]; then
            check_meaningful_content "$adr" 20 || true
            break  # Just check one to prove they're not empty templates
          fi
        done
      fi
    fi
    ;;
    
  2)
    echo "Checking Phase 2 artifacts..."
    
    # ISSUES.md exists AND has actual issues
    check_file "docs/ISSUES.md" || true
    check_nonempty "docs/ISSUES.md" || true
    if check_file "docs/ISSUES.md"; then
      check_meaningful_content "docs/ISSUES.md" 30 || true
      # Check for actual issue entries (look for issue markers or numbered items)
      if ! grep -qE "(^#.*[Ii]ssue|^##.*[Ii]ssue|^[0-9]+\.)" docs/ISSUES.md; then
        error "docs/ISSUES.md appears to be just a template (no actual issues)"
      fi
    fi
    
    # Issues in .scratch/ with actual content
    check_dir ".scratch" || true
    if check_dir ".scratch"; then
      issue_files=$(find .scratch -name "issue.md" -type f 2>/dev/null | wc -l)
      if [[ $issue_files -eq 0 ]]; then
        error "No issue.md files found in .scratch/"
      else
        # Verify at least one issue file has substantial content
        for issue in .scratch/*/issue.md; do
          if [[ -f "$issue" ]]; then
            check_meaningful_content "$issue" 15 || true
            break
          fi
        done
      fi
    fi
    
    # Graphify (if source files exist)
    if [[ -d "src" ]] || [[ -d "lib" ]] || [[ -f "package.json" ]] || [[ -f "pyproject.toml" ]] || [[ -f "go.mod" ]] || [[ -f "Cargo.toml" ]]; then
      check_dir "graphify-out" || true
      check_file "graphify-out/graph.json" || true
      check_file "graphify-out/GRAPH_REPORT.md" || true
      # Verify graph report has actual content
      if check_file "graphify-out/GRAPH_REPORT.md"; then
        check_meaningful_content "graphify-out/GRAPH_REPORT.md" 30 || true
      fi
    fi
    ;;
    
  3)
    echo "Checking Phase 3 artifacts..."
    
    # All tests pass
    run_stack_cmd "test" "Full test suite"
    
    # Linter + typechecker
    run_stack_cmd "lint" "Linter"
    run_stack_cmd "typecheck" "Typechecker"
    
    # CHANGELOG updated with actual entries
    check_file "CHANGELOG.md" || true
    if check_file "CHANGELOG.md"; then
      # Check for entries beyond [Unreleased]
      if ! grep -q "### Added\|### Changed\|### Fixed" CHANGELOG.md; then
        error "CHANGELOG.md has no entries"
      fi
      # Verify CHANGELOG has substantial content
      check_meaningful_content "CHANGELOG.md" 15 || true
    fi
    
    # Agent contracts exist AND have actual content
    check_dir "docs/agents/contracts" || true
    if check_dir "docs/agents/contracts"; then
      contract_count=$(find docs/agents/contracts -type f 2>/dev/null | wc -l)
      if [[ $contract_count -eq 0 ]]; then
        error "docs/agents/contracts/ is empty"
      else
        # Verify at least one contract has substantial content
        for contract in docs/agents/contracts/*; do
          if [[ -f "$contract" ]]; then
            check_meaningful_content "$contract" 20 || true
            break
          fi
        done
      fi
    fi
    
    # Git log check (all issues merged)
    if git rev-parse --git-dir &>/dev/null; then
      echo "Checking git log for merged issues..."
      if ! git log --oneline | grep -q "issue-"; then
        error "No issue branches found in git log"
      fi
      # Verify there are multiple commits (not just one)
      commit_count=$(git rev-list --count HEAD 2>/dev/null || echo "0")
      if [[ $commit_count -lt 3 ]]; then
        error "Only $commit_count commits found (expected at least 3 for Phase 3)"
      fi
    fi
    ;;
    
  4)
    echo "Checking Phase 4 artifacts..."
    
    # CI config (check for any CI system) with actual content
    ci_found=false
    for ci_file in ".github/workflows" ".gitlab-ci.yml" "azure-pipelines.yml" "bitbucket-pipelines.yml" ".circleci/config.yml" "Jenkinsfile"; do
      if [[ -d "$ci_file" ]] || [[ -f "$ci_file" ]]; then
        ci_found=true
        # If it's a directory (like .github/workflows), check for actual workflow files
        if [[ -d "$ci_file" ]]; then
          workflow_count=$(find "$ci_file" -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l)
          if [[ $workflow_count -eq 0 ]]; then
            error "CI directory $ci_file exists but has no workflow files"
          fi
        else
          check_meaningful_content "$ci_file" 15 || true
        fi
        break
      fi
    done
    if [[ "$ci_found" == "false" ]]; then
      error "No CI configuration found"
    fi
    
    # Deployment artifacts (check for any deployment config) with actual content
    deploy_found=false
    for deploy_file in "Dockerfile" "docker-compose.yml" "serverless.yml" "serverless.yaml" "wrangler.toml" "wrangler.json" "vercel.json" "netlify.toml" "fly.toml" "railway.json" "Procfile" "app.yaml"; do
      if [[ -f "$deploy_file" ]]; then
        deploy_found=true
        check_meaningful_content "$deploy_file" 10 || true
        break
      fi
    done
    if [[ "$deploy_found" == "false" ]]; then
      error "No deployment artifacts found"
    fi
    
    # DEPLOYMENT.md with actual content
    check_file "docs/DEPLOYMENT.md" || true
    check_nonempty "docs/DEPLOYMENT.md" || true
    if check_file "docs/DEPLOYMENT.md"; then
      check_meaningful_content "docs/DEPLOYMENT.md" 30 || true
      # Check for key deployment sections
      if ! grep -qi "deploy\|setup\|install" docs/DEPLOYMENT.md; then
        error "docs/DEPLOYMENT.md missing deployment instructions"
      fi
    fi
    ;;
    
  5)
    echo "Checking Phase 5 artifacts..."
    
    # Schemas documented with actual content
    check_dir "docs/agents/schemas" || true
    if check_dir "docs/agents/schemas"; then
      schema_count=$(find docs/agents/schemas -type f 2>/dev/null | wc -l)
      if [[ $schema_count -eq 0 ]]; then
        error "docs/agents/schemas/ is empty"
      else
        # Verify at least one schema has substantial content
        for schema in docs/agents/schemas/*; do
          if [[ -f "$schema" ]]; then
            check_meaningful_content "$schema" 20 || true
            break
          fi
        done
      fi
    fi
    
    # Auth flow documented with detail
    if check_file "docs/ARCHITECTURE.md"; then
      if ! grep -qi "auth" docs/ARCHITECTURE.md; then
        error "docs/ARCHITECTURE.md doesn't mention auth flow"
      fi
      # Verify auth section has substantial content (not just a mention)
      check_section_content "docs/ARCHITECTURE.md" "auth\|Auth\|AUTH" 100 || true
    fi
    
    # Verify validation/security patterns are documented
    if check_file "docs/ARCHITECTURE.md"; then
      if ! grep -qi "validat\|secur\|rate.limit\|idempoten" docs/ARCHITECTURE.md; then
        error "docs/ARCHITECTURE.md doesn't document validation/security patterns"
      fi
    fi
    ;;
    
  6)
    echo "Checking Phase 6 artifacts..."
    
    # Runbooks exist with actual content
    check_dir "docs/runbooks" || true
    if check_dir "docs/runbooks"; then
      runbook_count=$(find docs/runbooks -name "*.md" -type f 2>/dev/null | wc -l)
      if [[ $runbook_count -eq 0 ]]; then
        error "docs/runbooks/ is empty (no runbooks)"
      else
        # Verify at least one runbook has substantial content
        for runbook in docs/runbooks/*.md; do
          if [[ -f "$runbook" ]]; then
            check_meaningful_content "$runbook" 20 || true
            # Check for key runbook sections
            if ! grep -qi "symptom\|cause\|resolution\|escalat" "$runbook"; then
              error "Runbook $runbook missing key sections (symptom/cause/resolution)"
            fi
            break
          fi
        done
      fi
    fi
    
    # DEPLOYMENT.md finalized with operational content
    check_file "docs/DEPLOYMENT.md" || true
    if check_file "docs/DEPLOYMENT.md"; then
      check_meaningful_content "docs/DEPLOYMENT.md" 40 || true
      if ! grep -qi "runbook" docs/DEPLOYMENT.md; then
        error "docs/DEPLOYMENT.md doesn't reference runbooks"
      fi
      # Check for operational checklist
      if ! grep -qi "checklist\|operational\|monitoring\|alert" docs/DEPLOYMENT.md; then
        error "docs/DEPLOYMENT.md missing operational checklist"
      fi
    fi
    ;;
    
  7)
    echo "Checking Phase 7 artifacts..."
    
    # Graphify rebuilt with actual content
    check_dir "graphify-out" || true
    check_file "graphify-out/graph.json" || true
    check_file "graphify-out/GRAPH_REPORT.md" || true
    if check_file "graphify-out/GRAPH_REPORT.md"; then
      check_meaningful_content "graphify-out/GRAPH_REPORT.md" 50 || true
      # Check for key report sections
      if ! grep -qi "god node\|community\|surpris" graphify-out/GRAPH_REPORT.md; then
        error "GRAPH_REPORT.md missing key analysis sections"
      fi
    fi
    
    # SESSION.md complete with proper status
    check_file "docs/SESSION.md" || true
    if check_file "docs/SESSION.md"; then
      if ! grep -q "status: complete" docs/SESSION.md; then
        error "docs/SESSION.md doesn't have status: complete"
      fi
      # Verify SESSION.md has substantial tracking content
      check_meaningful_content "docs/SESSION.md" 50 || true
      # Check for phase tracking
      if ! grep -q "phase: 7" docs/SESSION.md; then
        error "docs/SESSION.md doesn't show phase: 7"
      fi
    fi
    
    # Dependency audit
    run_stack_cmd "audit" "Dependency audit"
    
    # Verify code quality audit was performed (check for audit artifacts)
    if check_file "docs/SESSION.md"; then
      if ! grep -qi "audit\|review\|quality" docs/SESSION.md; then
        error "docs/SESSION.md doesn't document audit activities"
      fi
    fi
    ;;
    
  *)
    echo "Gate validation not automated for phase $PHASE."
    echo "Check the gate criteria in references/phase-checklists.md."
    exit 0
    ;;
esac

echo ""
if [[ $ERRORS -gt 0 ]]; then
  echo "=== VALIDATION FAILED: $ERRORS error(s) ==="
  exit 1
else
  echo "=== Phase $PHASE gate passed ==="
  exit 0
fi
