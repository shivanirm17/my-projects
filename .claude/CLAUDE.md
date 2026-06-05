# Claude Code Instructions

This file is read automatically by Claude Code at the start of every session.
Edit it to reflect your preferences — the more specific, the better.

---

## My Preferences

### General
- I'm prototyping, so prioritize working code over perfect code
- Keep things simple — avoid over-engineering unless I ask
- If you're unsure about something, ask me rather than guessing

### Code Style
- Use clear variable names over abbreviations
- Add comments for anything non-obvious
- Prefer readability over cleverness

### Languages & Defaults
- **Python**: 3.11+, use `uv` for packages when possible, type hints on functions
- **JavaScript/TypeScript**: prefer TS, use modern ES syntax, no semicolons
- **CSS**: plain CSS or Tailwind — ask me which if it's not clear from context

### File & Project Conventions
- Always create a `README.md` for new projects
- Keep a `NOTES.md` for decisions, TODOs, and context
- Use `.env.example` for environment variables, never commit `.env`

### When Starting a New Project
1. Check the project's `NOTES.md` for context
2. Check `README.md` for the stack and current state
3. Ask me what I'm trying to accomplish before writing code

---

## Repo Layout

```
projects/        # One folder per project
snippets/        # Reusable code (check here before reinventing)
docs/            # Dev environment and setup notes
```

---

## Things I Don't Like
- Unnecessary dependencies
- Boilerplate files I didn't ask for
- Long explanations when a short one works
- Installing global packages without asking first
