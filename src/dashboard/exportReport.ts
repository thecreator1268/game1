import type { GameSession, LevelChange, Patient } from '@/db/types';
import { toCsv } from './dashboardData';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportSessionsCsv(patient: Patient, sessions: GameSession[]): void {
  const csv = toCsv(sessions, []);
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    `${patient.name.replace(/\s+/g, '_')}_smritisetu_export.csv`,
  );
}

export async function exportSummaryPdf(
  patient: Patient,
  weeklySummary: string,
  recentLevelChanges: LevelChange[],
): Promise<void> {
  // Lazy-loaded: jsPDF pulls in a sizeable canvas/parser dependency chain, and
  // most caregiver sessions never click "Export PDF" — no reason to ship it
  // in the caregiver bundle everyone downloads.
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  let y = margin;

  doc.setFontSize(18);
  doc.text('SmritiSetu — Caregiver Summary', margin, y);
  y += 24;

  doc.setFontSize(11);
  doc.text(`Patient: ${patient.name}`, margin, y);
  y += 16;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 28;

  doc.setFontSize(14);
  doc.text('This Week in Brief', margin, y);
  y += 18;
  doc.setFontSize(11);
  const summaryLines = doc.splitTextToSize(weeklySummary, 500);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 14 + 20;

  doc.setFontSize(14);
  doc.text('Recent Adaptive Engine Changes', margin, y);
  y += 18;
  doc.setFontSize(10);
  if (recentLevelChanges.length === 0) {
    doc.text('No level changes recorded yet.', margin, y);
    y += 14;
  } else {
    for (const change of recentLevelChanges.slice(0, 15)) {
      const line = `${new Date(change.timestamp).toLocaleDateString()} — ${change.gameId}: ${change.reason}`;
      const wrapped = doc.splitTextToSize(line, 500);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 12 + 4;
      if (y > 760) {
        doc.addPage();
        y = margin;
      }
    }
  }

  y += 20;
  doc.setFontSize(9);
  doc.setTextColor(120);
  const disclaimer = doc.splitTextToSize(
    'This report shows trends to discuss with a doctor. It is not a diagnosis or a medical device.',
    500,
  );
  doc.text(disclaimer, margin, y);

  doc.save(`${patient.name.replace(/\s+/g, '_')}_smritisetu_summary.pdf`);
}
