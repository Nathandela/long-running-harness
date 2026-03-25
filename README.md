# Long-Running Harness

A harness for managing long-running AI agent tasks. Stack TBD.

## Project Structure

```
.claude/          # Claude Code configuration, skills, agents
docs/
  research/       # Deep research papers (design, development, B2C product)
  compound/       # Compound-agent documentation
  adr/            # Architectural Decision Records
AGENTS.md         # Agent entry point (tooling, conventions, workflow)
```

## Tooling

- **beads** (`bd`) -- Issue tracking with dependency awareness. See `bd ready` for available work.
- **compound-agent** (`ca`) -- Session memory and lesson capture. See `ca search` / `ca learn`.

## Getting Started

```bash
bd onboard          # Set up issue tracking
bd ready            # Find available work
ca search "topic"   # Search project lessons
```
