import { db } from '@/db/schema';

// Backing logic for the Settings → Privacy & Data "Delete this patient's
// data" action. Deletes every record scoped to this patient across all
// tables, and unlinks the patient from every caregiver that references it
// — a caregiver.patientIds entry pointing at a deleted patient would make
// useCaregiverPatient/useCaregiverPatients silently drop that slot (bulkGet
// filters out missing ids), which is a subtler bug than an obvious crash,
// so it's cleaned up explicitly here rather than relied upon.
//
// One Dexie transaction: either the whole wipe lands, or none of it does —
// a caregiver killing the app mid-delete must not end up with, say, the
// reminders gone but the family photos still present.
export async function deletePatientData(patientId: string): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.patients,
      db.familyMembers,
      db.sessions,
      db.levelChanges,
      db.masteryEstimates,
      db.reminders,
      db.reminderLogs,
      db.caregivers,
    ],
    async () => {
      await db.familyMembers.where('patientId').equals(patientId).delete();
      await db.sessions.where('patientId').equals(patientId).delete();
      await db.levelChanges.where('patientId').equals(patientId).delete();
      await db.masteryEstimates.where('patientId').equals(patientId).delete();
      await db.reminders.where('patientId').equals(patientId).delete();
      await db.reminderLogs.where('patientId').equals(patientId).delete();
      await db.caregivers.toCollection().modify((caregiver) => {
        caregiver.patientIds = caregiver.patientIds.filter((id) => id !== patientId);
      });
      await db.patients.delete(patientId);
    },
  );
}
