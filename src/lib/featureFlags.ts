// The admin panel's only gate is a 4-digit PIN whose "forgot PIN" recovery
// requires no prior credential at all (see ForgotPinReset) — adequate for
// the caregiver PIN, which this app's own docs call "a lightweight gate,
// not a security boundary," but not for a panel that manages every
// patient/caregiver record on the device. Until that recovery flow gets a
// real identity check, the panel stays reachable only in local dev, never
// in a build anyone could hand to a judge/demo audience — set
// VITE_ENABLE_ADMIN=true at build time to opt a specific production build
// back in (e.g. a real staging deploy for actual admins).
export const ADMIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === 'true';
