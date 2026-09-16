import { db } from '@/db/schema';
import type { FamilyMember } from '@/db/types';
import { newId } from '@/lib/id';

export interface NewFamilyMemberInput {
  patientId: string;
  name: string;
  relation: string;
  photoUrl: string;
  voiceNoteUrl?: string;
}

export async function addFamilyMember(input: NewFamilyMemberInput): Promise<void> {
  await db.familyMembers.add({ id: newId(), createdAt: Date.now(), ...input });
}

export async function updateFamilyMember(id: string, changes: Partial<FamilyMember>): Promise<void> {
  await db.familyMembers.update(id, changes);
}

export async function deleteFamilyMember(id: string): Promise<void> {
  await db.familyMembers.delete(id);
}
