# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Project Map

```
README.md             # Project overview
AGENTS.md             # YOU ARE HERE -- agent entry point
index.html            # Vite entry point
package.json          # Dependencies and scripts
src/
  main.tsx            # React entry point
  App.tsx             # Root component
  audio/              # Web Audio API engine (path alias: @audio)
  ui/                 # UI components (path alias: @ui)
  state/              # State management (path alias: @state)
  test/               # Test setup and utilities
docs/
  INDEX.md            # Documentation hub
  adr/                # Architectural Decision Records
  research/           # Deep research papers
  compound/           # Compound-agent documentation
.claude/
  CLAUDE.md           # Project instructions + agentic principles
  skills/             # Skill definitions (compound workflows)
  agents/             # Subagent definitions
  commands/           # Slash command definitions
  lessons/            # Session memory (NEVER edit directly -- use `ca` CLI)
.beads/               # Issue tracking data (Dolt-powered)
```

## Stack

- **React 19 + TypeScript 5.8** (strict mode, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Vite 8** for dev server and build
- **Vitest 4** for testing (jsdom environment, @testing-library/react)
- **ESLint 10** with typescript-eslint strict type-checked rules
- **Prettier** for formatting
- **Husky** pre-commit hooks (lint + format check)
- **GitHub Actions CI** (lint, format, test, build)

## Build Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Type-check + production build
pnpm test             # Run tests once
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage
pnpm lint             # ESLint + TypeScript noEmit
pnpm lint:fix         # Auto-fix lint issues
pnpm format           # Format source files
pnpm format:check     # Check formatting (CI)
pnpm check            # Full quality gate: lint + format + test
```

## Path Aliases

Use `@/`, `@audio/`, `@ui/`, `@state/` instead of deep relative imports. ESLint enforces this (no `../../../` allowed).

## Conventions

- **Issue tracking**: `bd` only. No markdown TODOs.
- **Session memory**: `ca search` before decisions, `ca learn` after discoveries.
- **Decisions**: Record in `docs/adr/` using the template. See [ADR-0001](docs/adr/0001-initial-tooling-choices.md).
- **Research**: Extensive docs in `docs/research/`. Send subagents there for context (`ca knowledge "topic"`).
- **Tests**: Write tests first (TDD). Tests live next to source files as `*.test.tsx`/`*.test.ts`.
- **Types**: Strict TS everywhere. No `any`. Explicit return types on functions.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

<!-- BEGIN BEADS INTEGRATION profile:full hash:d4f96305 -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
<!-- compound-agent:start -->
## Compound Agent Integration

This project uses compound-agent for session memory via **CLI commands**.

### CLI Commands (ALWAYS USE THESE)

**You MUST use CLI commands for lesson management:**

| Command | Purpose |
|---------|---------|
| `ca search "query"` | Search lessons - MUST call before architectural decisions; use anytime you need context |
| `ca knowledge "query"` | Semantic search over project docs - MUST call before architectural decisions; use keyword phrases, not questions |
| `ca learn "insight"` | Capture lessons - use AFTER corrections or discoveries |
| `ca list` | List all stored lessons |
| `ca show <id>` | Show details of a specific lesson |
| `ca wrong <id>` | Mark a lesson as incorrect |

### Mandatory Recall

You MUST call `ca search` and `ca knowledge` BEFORE:
- Architectural decisions or complex planning
- Patterns you've implemented before in this repo
- After user corrections ("actually...", "wrong", "use X instead")

**NEVER skip search for complex decisions.** Past mistakes will repeat.

Beyond mandatory triggers, use these commands freely — they are lightweight queries, not heavyweight operations. Uncertain about a pattern? `ca search`. Need a detail from the docs? `ca knowledge`. The cost of an unnecessary search is near-zero; the cost of a missed one can be hours.

### Capture Protocol

Run `ca learn` AFTER:
- User corrects you
- Test fail -> fix -> pass cycles
- You discover project-specific knowledge

**Workflow**: Search BEFORE deciding, capture AFTER learning.

### Quality Gate

Before capturing, verify the lesson is:
- **Novel** - Not already stored
- **Specific** - Clear guidance
- **Actionable** (preferred) - Obvious what to do

### Never Edit JSONL Directly

**WARNING: NEVER edit .claude/lessons/index.jsonl directly.**

The JSONL file requires proper ID generation, schema validation, and SQLite sync.
Use CLI (`ca learn`) — never manual edits.

See [documentation](https://github.com/Nathandela/compound-agent) for more details.
<!-- compound-agent:end -->
