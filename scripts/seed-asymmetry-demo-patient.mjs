// Seeds a demo patient with realistic multi-domain session history where one
// domain (Pattern) lags the other four by well over the asymmetric-domain
// flag's 25-point threshold, sustained across its 2-week "not one session"
// check (see src/engine/masteryService.ts's getAsymmetricDomainFlag).
//
// Why this exists: the long-standing "50 sessions" manual test patient has
// data in only one domain (Memory), so the flag correctly never fires for
// them — the gate requires all 5 domains to have data before comparing any
// of them. That's the right behavior, but it also means there was no account
// where a judge could see the flag's card actually render. This patient is
// that account.
//
// Usage: open the app (dev server or the deployed site) in a browser tab
// where a caregiver is already logged in, open DevTools console on that tab,
// paste this whole file, press Enter. Reload the caregiver dashboard
// afterward — the new patient appears in the existing caregiver's patient
// switcher, lagging in Pattern. Safe to re-run: skips seeding if a patient
// with this name already exists (delete it in the Admin Panel first to
// reseed with different numbers).
//
// Raw IndexedDB, not the app's Dexie instance, so it runs from a bare
// console with no app internals exposed on window. Mirrors the schema in
// src/db/schema.ts and the domain->game mapping in src/games/gameList.ts —
// keep this in sync if either changes.

(async () => {
  const PATIENT_NAME = 'Asymmetry Demo Patient';
  const LAGGING_DOMAIN = 'pattern';
  const LAGGING_ACCURACY = 0.3; // well under the other four's 0.9 (a >25-point BKT gap)
  const SOLID_ACCURACY = 0.9;
  const DAYS_AGO = [35, 28, 21, 14, 7, 1]; // spans the flag's 2-week sustained re-check

  const DOMAIN_GAME = {
    memory: 'smriti-cards',
    attention: 'dhyan-dhaam',
    routine: 'ghar-ka-kaam',
    pattern: 'aakar-milan',
    orientation: 'ghadi-dekho',
  };

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('smriti-setu');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function getAll(db, storeName) {
    return new Promise((resolve, reject) => {
      const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function put(db, storeName, value) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  const db = await openDb();
  const [patients, caregivers] = await Promise.all([getAll(db, 'patients'), getAll(db, 'caregivers')]);

  if (patients.some((p) => p.name === PATIENT_NAME)) {
    console.log(`"${PATIENT_NAME}" already exists — not re-seeding. Delete it first to reseed.`);
    return;
  }
  if (caregivers.length === 0) {
    console.error('No caregiver account found on this device — create one in the app first, then re-run this.');
    return;
  }
  const caregiverId = caregivers[0].id;

  const patientId = crypto.randomUUID();
  const now = Date.now();
  const patient = {
    id: patientId,
    name: PATIENT_NAME,
    preferredLanguage: 'en',
    caregiverIds: [caregiverId],
    highContrastPalette: 'theme-1',
    textScale: 'normal',
    colorMode: 'light',
    consentGivenAt: now,
    reminderAlertsEnabled: false,
    createdAt: now,
    introSeenAt: now,
  };
  await put(db, 'patients', patient);

  const sessions = [];
  for (const [domain, gameId] of Object.entries(DOMAIN_GAME)) {
    const accuracy = domain === LAGGING_DOMAIN ? LAGGING_ACCURACY : SOLID_ACCURACY;
    for (const daysAgo of DAYS_AGO) {
      const startedAt = now - daysAgo * 24 * 60 * 60 * 1000;
      sessions.push({
        id: crypto.randomUUID(),
        patientId,
        gameId,
        domain,
        level: 1,
        score: Math.round(accuracy * 10),
        accuracy,
        avgResponseMs: 2800,
        errorTypes: ['none'],
        startedAt,
        endedAt: startedAt + 30_000,
        synced: false,
      });
    }
  }
  for (const s of sessions) await put(db, 'sessions', s);

  console.log(
    `Seeded "${PATIENT_NAME}" (${patientId}) with ${sessions.length} sessions across 5 domains. ` +
      'Pattern is the deliberately lagging domain. Reload the caregiver dashboard and switch to this patient ' +
      'to see the asymmetric-domain flag card. Mastery estimates are computed on first read, not seeded here.',
  );
})();
