import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { Patient } from '@/db/types';
import { useAuthStore } from '@/store/authStore';

export function useCaregiverPatient(): Patient | undefined {
  const caregiverId = useAuthStore((s) => s.caregiverId);
  const viewPatientId = useAuthStore((s) => s.viewPatientId);
  return useLiveQuery(async () => {
    if (!caregiverId) return undefined;
    const caregiver = await db.caregivers.get(caregiverId);
    if (!caregiver || caregiver.patientIds.length === 0) return undefined;
    const targetId =
      viewPatientId && caregiver.patientIds.includes(viewPatientId)
        ? viewPatientId
        : caregiver.patientIds[0];
    return db.patients.get(targetId);
  }, [caregiverId, viewPatientId]);
}

// All patients linked to the signed-in caregiver, for the patient switcher —
// undefined while loading, [] if somehow none are linked.
export function useCaregiverPatients(): Patient[] | undefined {
  const caregiverId = useAuthStore((s) => s.caregiverId);
  return useLiveQuery(async () => {
    if (!caregiverId) return undefined;
    const caregiver = await db.caregivers.get(caregiverId);
    if (!caregiver || caregiver.patientIds.length === 0) return [];
    const patients = await db.patients.bulkGet(caregiver.patientIds);
    return patients.filter((p): p is Patient => p !== undefined);
  }, [caregiverId]);
}
