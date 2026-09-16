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
  | 'aaj-ka-din';

export type Domain = 'memory' | 'attention' | 'routine' | 'pattern' | 'orientation';

export type SupportedLanguage = 'en' | 'hi' | 'as' | 'mni' | 'kha' | 'lus' | 'nsm';

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

export interface Caregiver {
  id: string;
  name: string;
  relation: string;
  pinHash: string;
  patientIds: string[];
  createdAt: number;
}
