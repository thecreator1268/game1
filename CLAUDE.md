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

## Session canary
- Begin every reply in this project with the tag `[SmritiSetu]`, as the very first characters.
- If the tag is ever missing from a reply, the session's context has degraded: stop, tell the
  user to run `/context` (and `/compact` if it's bloated), and start a fresh session for the
  next task instead of pushing a stale one.

## Model / effort
- Confirm model and effort level at the start of the session; don't switch mid-session
  (switching busts the prompt cache and costs more).
- Tiering: Opus for architecture decisions and code review; Sonnet for day-to-day feature
  work; Haiku for quick fixes, formatting and repetitive tasks. Pick the session model by the
  task type when starting a session. Within a session, get a different tier by delegating to a
  subagent with the `model` override (e.g. an Opus review) rather than switching the main model.

## Design skills
- `taste-skill` (redesign-existing-projects, design-taste-frontend) and Anthropic's
  `frontend-design` / `react-best-practices` (if installed) only improve execution quality.
  `design-system`, `accessibility-checklist` and `motion-system` always win: same palette,
  Unbounded/Space Grotesk, 64px tap targets, sprite icons only, no emoji.

## Pending decisions
- Use a git worktree for a spec decision that would otherwise block bug-fixing. Merge it back
  and remove the worktree as soon as the decision lands; don't keep long-lived parallel worktrees.
  To run checks in one, mount it in Docker with the compose volume, not the image's stale
  modules: `docker run --rm -v <worktree>:/app -v game_node_modules:/app/node_modules game-web ...`.
- Settled: 14 games, 10 difficulty levels (the build prompt was updated to match).

## Verification
- Prefer giving me a check you can run yourself (tests, build, lint) over asking me to
  eyeball the result.
