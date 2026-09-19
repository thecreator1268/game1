#!/usr/bin/env node
// PreToolUse hook — blocks Write/Edit calls that would introduce emoji.
//
// This is a PreToolUse hook, not PostToolUse, even though it was asked for
// as PostToolUse: PostToolUse fires after the tool already ran and cannot
// block anything (Claude Code docs — it can only add a system message).
// Since "no emoji, anywhere" was specified as a hard rule, blocking before
// the write actually happens is what satisfies that, not a warning after
// the fact.
//
// No exceptions carved out for the game item-pool files that still use
// emoji as deliberate match-pair content (smriti-cards, chaya-khoj,
// ghar-ka-kaam, bazaar-list, aakar-milan, dinacharya-sequence) — this
// blocks edits to those too, per the literal "anywhere" instruction. Flag
// this to the user if it turns out to be too broad in practice.
const EMOJI_RANGE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

let raw = '';
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0); // Can't parse -> don't block on our own bug.
  }

  const toolName = payload.tool_name;
  if (toolName !== 'Write' && toolName !== 'Edit') {
    process.exit(0);
  }

  const input = payload.tool_input || {};
  const textToCheck = toolName === 'Write' ? input.content : input.new_string;

  if (typeof textToCheck === 'string' && EMOJI_RANGE.test(textToCheck)) {
    const match = textToCheck.match(EMOJI_RANGE);
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Blocked: this ${toolName} would introduce an emoji character ("${match[0]}") into ` +
          `${input.file_path || 'a file'}. SmritiSetu's design system uses custom SVG icons ` +
          `(src/components/IconSprite.tsx), never emoji, for anything but the accepted ` +
          `game-item-pool exceptions. If this file IS one of those accepted exceptions, ` +
          `override manually rather than editing this hook to special-case it silently.`,
      },
    };
    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  }

  process.exit(0);
});
