import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ConfirmDangerModal } from '@/components/ConfirmDangerModal';
import { Icon } from '@/components/IconSprite';
import { db } from '@/db/schema';
import type { FamilyMember } from '@/db/types';
import { useCaregiverPatient } from '@/hooks/useCaregiverPatient';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { readImageFileAsCompressedDataUrl } from '@/lib/file';
import { addFamilyMember, deleteFamilyMember } from '@/family/familyService';

export default function FamilyManager() {
  const { t } = useTranslation();
  const patient = useCaregiverPatient();
  const members = useLiveQuery(
    () => (patient ? db.familyMembers.where('patientId').equals(patient.id).toArray() : []),
    [patient?.id],
    [],
  );

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  // Errors only appear once the caregiver has tried to submit — not on
  // every keystroke of a still-in-progress form, which would just be noise.
  const [attempted, setAttempted] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<FamilyMember | null>(null);
  const recorder = useAudioRecorder();

  // Without this, an in-progress draft (photo/name/voice note already
  // captured) would silently get attributed to whichever patient the
  // caregiver switches to next via CaregiverPatientSwitcher — since "Add"
  // always uses whatever patient.id is current at click time, that's a real
  // "your work went to the wrong patient" bug, not just stale UI. Reset
  // during render (see CaregiverHome's identical pattern) rather than in an
  // effect — setAudioUrl is a bare useState setter, safe to call here.
  const [lastPatientId, setLastPatientId] = useState(patient?.id);
  if (patient?.id !== lastPatientId) {
    setLastPatientId(patient?.id);
    setName('');
    setRelation('');
    setPhotoUrl('');
    setAttempted(false);
    setJustAdded(null);
    setRemoveTarget(null);
    recorder.setAudioUrl(undefined);
  }

  // Transient, decorative confirmation only (same idea as the game screens'
  // "Well done!" toast) — not a countdown the caregiver has to race, and the
  // banner's text stays behind in the member list regardless (the new card
  // itself). Cleared on unmount/patient-switch by the effect's own cleanup.
  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(null), 5000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUrl(await readImageFileAsCompressedDataUrl(file));
  }

  const nameInvalid = attempted && !name.trim();
  const relationInvalid = attempted && !relation.trim();
  const photoInvalid = attempted && !photoUrl;

  async function handleAdd() {
    setAttempted(true);
    if (!patient || !name.trim() || !relation.trim() || !photoUrl) return;
    const addedName = name.trim();
    await addFamilyMember({
      patientId: patient.id,
      name: addedName,
      relation: relation.trim(),
      photoUrl,
      voiceNoteUrl: recorder.audioUrl,
    });
    setName('');
    setRelation('');
    setPhotoUrl('');
    setAttempted(false);
    recorder.setAudioUrl(undefined);
    setJustAdded(addedName);
  }

  async function handleConfirmRemove() {
    if (!removeTarget) return;
    await deleteFamilyMember(removeTarget.id);
    setRemoveTarget(null);
  }

  if (!patient) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-lg font-bold">{t('familyManager.title')}</h1>
        <p className="text-body text-text-muted">{t('familyManager.body')}</p>
      </div>

      <Card>
        <h2 className="text-action font-bold">{t('familyManager.addMember')}</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full bg-surface-alt text-text-muted ${
                  photoInvalid ? 'ring-2 ring-danger' : ''
                }`}
              >
                <Icon name="person" size={36} />
              </div>
            )}
            <label className="cursor-pointer text-sm font-semibold text-primary">
              {t('familyManager.photo')}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handlePhotoChange(e)}
                aria-invalid={photoInvalid}
                aria-describedby={photoInvalid ? 'photo-error' : undefined}
              />
            </label>
            {photoInvalid && (
              <p id="photo-error" className="flex items-center gap-1 text-sm font-semibold text-danger">
                <Icon name="alert" size={14} />
                {t('familyManager.photoRequired')}
              </p>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('familyManager.name')}
                aria-invalid={nameInvalid}
                aria-describedby={nameInvalid ? 'name-error' : undefined}
                className={`tap-target rounded-card border-2 bg-surface px-4 text-body ${
                  nameInvalid ? 'border-danger' : 'border-border'
                }`}
              />
              {nameInvalid && (
                <p id="name-error" className="text-sm font-semibold text-danger">
                  {t('familyManager.nameRequired')}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <input
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder={t('familyManager.relation')}
                aria-invalid={relationInvalid}
                aria-describedby={relationInvalid ? 'relation-error' : undefined}
                className={`tap-target rounded-card border-2 bg-surface px-4 text-body ${
                  relationInvalid ? 'border-danger' : 'border-border'
                }`}
              />
              {relationInvalid && (
                <p id="relation-error" className="text-sm font-semibold text-danger">
                  {t('familyManager.relationRequired')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => void (recorder.recording ? recorder.stop() : recorder.start())}
              >
                {recorder.recording
                  ? t('common.done')
                  : recorder.audioUrl
                    ? t('familyManager.reRecord')
                    : t('familyManager.recordVoiceNote')}
              </Button>
              {recorder.audioUrl && <audio controls src={recorder.audioUrl} className="h-10" />}
            </div>
            {recorder.unsupported && (
              <p className="text-sm text-text-muted">Microphone recording isn't available on this device/browser.</p>
            )}
            <Button onClick={() => void handleAdd()}>{t('common.add')}</Button>
            {justAdded && (
              <p role="status" className="flex items-center gap-1.5 text-body font-semibold text-success">
                <Icon name="check" size={18} />
                {t('familyManager.memberAdded', { name: justAdded })}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {members && members.length > 0 ? (
          members.map((m) => (
            <Card key={m.id} className="flex flex-col items-center gap-2 text-center">
              <img src={m.photoUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
              <p className="text-body font-semibold">{m.name}</p>
              <p className="text-sm text-text-muted">{m.relation}</p>
              {m.voiceNoteUrl && <audio controls src={m.voiceNoteUrl} className="h-8 w-full" />}
              <button
                onClick={() => setRemoveTarget(m)}
                className="tap-target mt-2 text-sm font-semibold text-danger"
              >
                {t('common.delete')}
              </button>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-body text-text-muted">{t('familyManager.noMembers')}</p>
        )}
      </div>

      {removeTarget && (
        <ConfirmDangerModal
          title={t('familyManager.removeMember', { name: removeTarget.name })}
          body={t('familyManager.removeMemberBody', {
            name: removeTarget.name,
            voice: removeTarget.voiceNoteUrl ? t('familyManager.removeMemberVoice') : '',
          })}
          confirmLabel={t('familyManager.removeMemberConfirm')}
          onConfirm={() => void handleConfirmRemove()}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
