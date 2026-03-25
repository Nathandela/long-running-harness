# Project Instructions
<!-- compound-agent:claude-ref:start -->
## Compound Agent
See AGENTS.md for lesson capture workflow.
<!-- compound-agent:claude-ref:end -->

You have a lot of research that you can scheme in @docs/. Do not hesitate to send subagents there when needed.

## Agentic Codebase Principles

This project follows the **Agentic Codebase Manifesto** (15 principles, 3 pillars). The full audit skill lives in `.claude/skills/compound/agentic/SKILL.md`.

### Linting & Constraints (P6)

Tight linting is a force multiplier for agentic development:

- **Strict TypeScript** (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) -- catches type errors at compile time, not runtime.
- **ESLint strict type-checked** with custom architectural rules -- import boundaries enforced mechanically (no deep relative imports, use `@/` aliases).
- **Pre-commit hooks + CI gates** -- linting that isn't enforced is linting that drifts. Both Husky and GitHub Actions enforce the same `pnpm check`.
- **Custom lint rules** for project-specific constraints (import boundaries, naming conventions, forbidden patterns). These make the codebase self-documenting for agents.

### Key Manifesto Concepts

- **Repository is the only truth** (P1): All context an agent needs lives in version control
- **Trace decisions** (P2): Use ADRs in `docs/adr/` for architectural rationale
- **Constraints are multipliers** (P6): Linters, type checkers, and custom rules reduce agent error surface
- **Write feedback for machines** (P7): Structured errors with remediation hints
- **Map, not manual** (P9): AGENTS.md provides navigable entry points, not encyclopedias
- **Simplicity compounds** (P13): Prefer boring tech, minimal abstractions