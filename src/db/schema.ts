import Dexie, { type EntityTable, type Table } from 'dexie';
import type {
  Caregiver,
  FamilyMember,
  GameSession,
  LevelChange,
  MasteryEstimate,
  Patient,
  Reminder,
  ReminderLog,
} from './types';

export class SmritiSetuDB extends Dexie {
  patients!: EntityTable<Patient, 'id'>;
  familyMembers!: EntityTable<FamilyMember, 'id'>;
  sessions!: EntityTable<GameSession, 'id'>;
  levelChanges!: EntityTable<LevelChange, 'id'>;
  reminders!: EntityTable<Reminder, 'id'>;
  reminderLogs!: EntityTable<ReminderLog, 'id'>;
  caregivers!: EntityTable<Caregiver, 'id'>;
  // Compound primary key [patientId, domain].
  masteryEstimates!: Table<MasteryEstimate, [string, string]>;

  constructor() {
    super('smriti-setu');
    this.version(1).stores({
      patients: 'id, name',
      familyMembers: 'id, patientId',
      sessions: 'id, patientId, gameId, domain, startedAt, synced',
      levelChanges: 'id, patientId, gameId, timestamp',
      reminders: 'id, patientId, category, active',
      reminderLogs: 'id, reminderId, patientId, acknowledgedAt, synced',
      caregivers: 'id',
    });
    // v2 adds the BKT mastery table only; existing tables and rows are
    // untouched. Patients with history but no row yet are bootstrapped by
    // replaying their sessions on first use (engine/masteryService.ts).
    this.version(2).stores({
      masteryEstimates: '[patientId+domain], patientId',
    });
  }
}

export const db = new SmritiSetuDB();
