export type GameId =
  | 'smriti-cards'
  | 'smriti-katha'
  | 'naam-yaad'
  | 'dhyan-dhaam'
  | 'ginti-dhyan'
  | 'awaaz-pehchan'
  | 'dinacharya-sequence'
  | 'bazaar-list'
  | 'ghar-ka-kaam'
  | 'aakar-milan'
  | 'chaya-khoj'
  | 'naksha-jodo'
  | 'aaj-ka-din'
  | 'ghadi-dekho';

export type Domain = 'memory' | 'attention' | 'routine' | 'pattern' | 'orientation';

export type SupportedLanguage = 'en' | 'hi' | 'as' | 'mni' | 'kha' | 'lus' | 'nsm' | 'kok' | 'ne';

export type ErrorType = 'none' | 'wrong-choice' | 'timeout-skip' | 'sequence-error' | 'no-response';

export interface Patient {
  id: string;
  name: string;
  preferredLanguage: SupportedLanguage;
  dateOfBirth?: string;
  photoUrl?: string;
  caregiverIds: string[];
  highContrastPalette: 'theme-1' | 'theme-2';
  textScale: 'normal' | 'large' | 'xl';
  // Optional: patients created before this field existed fall back to
  // 'light' at every read site rather than needing a Dexie migration.
  colorMode?: 'light' | 'dark';
  // Timestamp the setting caregiver accepted the on-device data-storage
  // notice during onboarding (see Onboarding.tsx's "consent" step).
  consentGivenAt: number;
  // Opt-in only, off by default — Notification permission is intrusive to
  // ask for automatically, so this stays false until a caregiver explicitly
  // enables it from Settings (see reminders/notificationService.ts).
  reminderAlertsEnabled: boolean;
  createdAt: number;
}

export interface FamilyMember {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  photoUrl: string;
  voiceNoteUrl?: string;
  createdAt: number;
}

export interface GameSession {
  id: string;
  patientId: string;
  gameId: GameId;
  domain: Domain;
  level: number;
  score: number;
  accuracy: number; // 0-1
  avgResponseMs: number;
  errorTypes: ErrorType[];
  startedAt: number;
  endedAt: number;
  synced: boolean;
}

// Current BKT mastery estimate for one patient in one domain (see
// engine/bkt.ts). One row per (patientId, domain); derived data — it can always
// be rebuilt by replaying the patient's sessions, so it is not synced.
export interface MasteryEstimate {
  patientId: string;
  domain: Domain;
  pL: number; // probability of mastery, 0-1
  updatedAt: number;
}

export interface LevelChange {
  id: string;
  patientId: string;
  gameId: GameId;
  fromLevel: number;
  toLevel: number;
  reason: string;
  timestamp: number;
}

export type ReminderCategory = 'medicine' | 'hydration' | 'activity' | 'appointment';

export interface Reminder {
  id: string;
  patientId: string;
  category: ReminderCategory;
  label: string;
  schedule: string; // e.g. "08:00" daily, or ISO datetime for appointments
  notes?: string;
  photoUrl?: string;
  voiceNoteUrl?: string;
  lastAcknowledgedAt?: number;
  active: boolean;
  createdAt: number;
}

export interface ReminderLog {
  id: string;
  reminderId: string;
  patientId: string;
  acknowledgedAt: number;
  synced: boolean;
}

export type CaregiverRole = 'caregiver' | 'admin';

export interface Caregiver {
  id: string;
  name: string;
  relation: string;
  pinHash: string;
  pinSalt: string;
  patientIds: string[];
  role: CaregiverRole;
  createdAt: number;
}
