// The admin panel's only gate is a 4-digit PIN whose "forgot PIN" recovery
// requires no prior credential at all (see ForgotPinReset) — adequate for
// the caregiver PIN, which this app's own docs call "a lightweight gate,
// not a security boundary," but not for a panel that manages every
// patient/caregiver record on the device. Off by default in production;
// VITE_ENABLE_ADMIN=true opts a specific build back in.
//
// It IS set for the public GitHub Pages demo (.github/workflows/deploy.yml)
// at the site owner's explicit request, accepting that anyone with the demo
// URL can reach /admin and reset a PIN unverified — a known, chosen
// trade-off for this hackathon demo build, not an oversight. Revisit before
// any real deployment holding real patient data: give ForgotPinReset (both
// admin and caregiver) a real identity check, then this flag is safe
// everywhere rather than a per-build risk decision.
export const ADMIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true';
