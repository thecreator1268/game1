import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import type { Patient } from '@/db/types';
import { useAuthStore } from '@/store/authStore';

export function useCaregiverPatient(): Patient | undefined {
  const caregiverId = useAuthStore((s) => s.caregiverId);
  return useLiveQuery(async () => {
    if (!caregiverId) return undefined;
    const caregiver = await db.caregivers.get(caregiverId);
    if (!caregiver || caregiver.patientIds.length === 0) return undefined;
    return db.patients.get(caregiver.patientIds[0]);
  }, [caregiverId]);
}
