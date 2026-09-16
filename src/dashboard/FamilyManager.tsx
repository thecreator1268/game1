import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { db } from '@/db/schema';
import { useCaregiverPatient } from '@/hooks/useCaregiverPatient';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { readFileAsDataUrl } from '@/lib/file';
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
  const recorder = useAudioRecorder();

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUrl(await readFileAsDataUrl(file));
  }

  async function handleAdd() {
    if (!patient || !name.trim() || !relation.trim() || !photoUrl) return;
    await addFamilyMember({
      patientId: patient.id,
      name: name.trim(),
      relation: relation.trim(),
      photoUrl,
      voiceNoteUrl: recorder.audioUrl,
    });
    setName('');
    setRelation('');
    setPhotoUrl('');
    recorder.setAudioUrl(undefined);
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
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-alt text-sm text-text-muted">
                {t('familyManager.photo')}
              </div>
            )}
            <label className="cursor-pointer text-sm font-semibold text-primary">
              {t('familyManager.photo')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhotoChange(e)} />
            </label>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('familyManager.name')}
              className="tap-target rounded-card border-2 border-border bg-surface px-4 text-body"
            />
            <input
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder={t('familyManager.relation')}
              className="tap-target rounded-card border-2 border-border bg-surface px-4 text-body"
            />
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
            <Button onClick={() => void handleAdd()} disabled={!name.trim() || !relation.trim() || !photoUrl}>
              {t('common.add')}
            </Button>
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
                onClick={() => void deleteFamilyMember(m.id)}
                className="mt-2 text-sm font-semibold text-danger"
              >
                {t('common.delete')}
              </button>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-body text-text-muted">{t('familyManager.noMembers')}</p>
        )}
      </div>
    </div>
  );
}
