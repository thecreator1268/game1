# Session rules

## Token discipline
- Be terse. No preambles, no postambles, no "Great question!" — go straight to the change.
- Only show diffs/snippets for what changed, not whole files, unless asked.
- Don't re-explain code that isn't touched.
- Don't restate the plan before every tool call — just do it, then summarize once at the end.

## Context hygiene
- Before reading a file, check whether it's already been read this session — don't re-read unchanged files.
- Prefer `@-mention`-style direct file references over searching/grepping when the path is already known.
- Pipe noisy commands through something quiet (`--silent`, `-q`, `2>&1 | tail -20`) instead of dumping full output into context.
- When a task is done, suggest `/compact` or `/clear` rather than continuing to pile on unrelated work in the same session.

## Rule scoping (optional, for large repos)
Split domain-specific rules into `.claude/rules/*.md` with `paths:` frontmatter so they
only load when relevant, e.g.:

```
---
paths:
  - "src/api/**/*.ts"
---
# API layer rules
- Validate all input with Zod.
- Never leak raw DB errors to the client.
```

## Model / effort
- Confirm model and effort level at the start of the session; don't switch mid-session
  (switching busts the prompt cache and costs more).

## Verification
- Prefer giving me a check you can run yourself (tests, build, lint) over asking me to
  eyeball the result.
