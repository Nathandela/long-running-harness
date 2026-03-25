# ADR-0001: Initial Tooling Choices

**Status**: accepted
**Date**: 2026-03-25

## Context

This project needs issue tracking and session memory for AI agent collaboration from the start. Traditional tools (GitHub Issues, wikis) don't integrate well with agent workflows -- they require API calls, context switching, and lack dependency awareness.

## Decision

- **beads** (`bd`) for issue tracking -- Dolt-powered, dependency-aware, agent-optimized with JSON output and `bd ready` for unblocked work detection.
- **compound-agent** (`ca`) for session memory -- captures lessons learned during development, provides semantic search over past decisions and mistakes.

Both tools are CLI-first and operate entirely within the repo (no external services required).

## Consequences

- Agents can discover, claim, and complete work without leaving the terminal.
- Lessons persist across sessions, reducing repeated mistakes.
- Requires `bd` and `ca` CLI tools to be installed for contributors.
- Issue data lives in `.beads/` (Dolt), lessons in `.claude/lessons/` (JSONL + SQLite).
