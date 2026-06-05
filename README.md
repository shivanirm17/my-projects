# My Projects

A monorepo for prototypes, experiments, and builds — mostly made with [Claude Code](https://claude.ai/code).

## Structure

```
my-projects/
├── .claude/CLAUDE.md          # Claude Code instructions & preferences
├── projects/                  # Individual projects (each self-contained)
├── snippets/                  # Reusable code bits
│   ├── python/
│   └── js/
└── docs/
    └── setup.md               # Dev environment notes
```

## Projects

| Project | Description | Stack | Status |
|---------|-------------|-------|--------|
| [example-project](./projects/example-project/) | Template/demo | — | 🗂 template |

> Add new rows as you create projects.

## Quick Start (new project)

```bash
cp -r projects/example-project projects/my-new-thing
cd projects/my-new-thing
# Start hacking
```

## Conventions

- Each project is fully self-contained with its own README and NOTES
- Commit often — even rough/broken states
- Tag stable points: `git tag v0.1-working`
- `NOTES.md` is for thinking out loud — decisions, dead ends, next steps
