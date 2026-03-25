# Research: AI Navigation Guide

This file documents the canonical structure, conventions, and rules for the `research/` directory. Any AI agent reading or writing research files MUST follow these rules.

## Canonical Root

The single source of truth for all research is `research/`. The old `docs/research/` path no longer exists — never create or reference it.

## Folder Structure

```
research/
├── CLAUDE.md                  ← This file (AI navigation guide)
├── b2c_product/               ← B2C strategy, market dynamics, consumer behaviour
│   ├── market-growth/
│   └── INDEX.md
├── design/                    ← Visual design, typography, frontend craft
│   ├── data-visualization/
│   ├── financial-reports/
│   ├── frontend-design/
│   ├── grid/
│   ├── mermaid-phd/
│   ├── reports/
│   ├── style/
│   └── INDEX.md
├── development/               ← Software engineering, specs, testing, code review
│   ├── code-review/
│   ├── debugging/
│   ├── document-management/
│   ├── go/
│   ├── learning-systems/
│   ├── privacy/
│   ├── q-and-a/
│   ├── rust/
│   ├── scenario-testing/
│   ├── spec-design/
│   ├── test-driven-development/
│   └── INDEX.md
└── statistics/                ← Statistical modelling, NLP, data science
    ├── nlp/
    └── INDEX.md
```

## Frontmatter Schema

Every `.md` file in `research/` (except `INDEX.md` and `CLAUDE.md`) MUST start with a YAML frontmatter block:

```yaml
---
title: Full Human-Readable Title
date: YYYY-MM-DD
summary: 1–2 sentence abstract describing what the document covers.
keywords: [keyword1, keyword2, keyword3]
---
```

**Rules:**
- `title`: matches the H1 heading in the document body
- `date`: ISO 8601 format; use the document's publication/creation date
- `summary`: extracted from the Abstract section or first substantive paragraph
- `keywords`: 3–5 terms; first keyword should be the topic folder name

## Naming Convention

**All files and folders use kebab-case** — words separated by hyphens, no underscores, no spaces, all lowercase.

Examples:
- ✅ `behavioral-economics-decision-science.md`
- ✅ `frontend-design/`
- ❌ `behavioral_economics.md`
- ❌ `Frontend Design/`

Exception: `b2c_product/` uses an underscore as a product category abbreviation.

## Index Files

Each top-level topic folder contains an `INDEX.md` that lists all papers in that subtree with title, summary, and keywords drawn from frontmatter.

**Regenerate an index** whenever you add, remove, or rename a file:
```
/tidy
```

## Adding New Papers

1. Choose the correct topic subfolder from the existing ones above (or create a new subfolder if no existing topic fits)
2. Name the file in kebab-case: `topic-slug.md`
3. Add required YAML frontmatter at line 1
4. Run `/tidy` to regenerate the relevant INDEX.md

## The /tidy Command

Run `/tidy` to automatically:
- Check and auto-fix missing frontmatter
- Flag and rename snake_case files/folders
- Warn about files in the wrong location
- Regenerate all INDEX.md files
- Print a summary of changes and remaining issues

## Pre-push Hook

A warn-only git hook checks for common violations before each push. Install it with:

```bash
git config core.hooksPath .githooks
```

The hook checks for:
- Any `.md` files in `docs/research/` (migration incomplete)
- Any `research/**/*.md` files missing a frontmatter `---` block
- Any filename or folder with underscores under `research/`

It is warn-only — it will not block pushes.
