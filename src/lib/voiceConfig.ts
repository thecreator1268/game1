// Master switch for speech the app starts on its own: the first-launch intro
// reading each screen aloud, an instruction being offered again after a stretch
// of inactivity (useInactivityRepeat), and the spoken reminder cue + replay
// (useReminderVoice). All of it is built and tested; it is switched off for
// now. Set to true to turn it back on.
//
// This does NOT affect the speaker button next to every instruction: that only
// speaks when the patient taps it, so it always works.
export const AUTO_SPEAK_ENABLED = false;
