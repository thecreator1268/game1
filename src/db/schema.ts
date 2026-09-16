import Dexie, { type EntityTable } from 'dexie';
import type {
  Caregiver,
  FamilyMember,
  GameSession,
  LevelChange,
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
  }
}

export const db = new SmritiSetuDB();
