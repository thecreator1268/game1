import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';
import { usePatientStore } from '@/store/patientStore';
import type { Patient } from '@/db/types';

export function useActivePatient(): Patient | undefined {
  const activePatientId = usePatientStore((s) => s.activePatientId);
  return useLiveQuery(
    () => (activePatientId ? db.patients.get(activePatientId) : undefined),
    [activePatientId],
  );
}
