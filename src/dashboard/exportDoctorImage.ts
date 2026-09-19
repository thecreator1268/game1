import type { Patient } from '@/db/types';
import i18n from '@/i18n';
import type { AdherenceDay, DomainBalanceEntry } from './dashboardData';
import { DOMAIN_COLOR } from './domainColors';

// Matches AdherenceChart.tsx's sequential hue, for visual consistency
// between the in-app chart and this shareable image.
const SEQUENTIAL_BLUE = '#256abf';
const WIDTH = 900;
const MARGIN = 48;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Canvas-rendered (not html2canvas/DOM-screenshot) so the output is crisp
// text at any zoom, has no dependency on the live DOM's current layout, and
// needs no extra library — same reasoning as exportReport.ts's PDF export,
// just as a single shareable PNG instead of a multi-page document. English
// section headers match exportSummaryPdf's existing convention rather than
// introducing a second, inconsistent localization rule for exported
// documents; domain names still go through i18n since they're a single
// t() call and read directly off the patient's own data.
export async function exportDoctorImage(
  patient: Patient,
  weeklySummary: string,
  domainBalance: DomainBalanceEntry[],
  adherence: { series: AdherenceDay[]; streak: number },
): Promise<File | null> {
  const canvas = document.createElement('canvas');
  const scale = 2;
  const height = 1000;
  canvas.width = WIDTH * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);

  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(0, 0, WIDTH, height);

  let y = MARGIN;
  ctx.fillStyle = '#10151a';
  ctx.font = 'bold 28px "Noto Sans", sans-serif';
  ctx.fillText('SmritiSetu — For Your Doctor', MARGIN, y);
  y += 36;

  ctx.font = '16px "Noto Sans", sans-serif';
  ctx.fillStyle = '#3d4650';
  ctx.fillText(`${patient.name} · ${new Date().toLocaleDateString()}`, MARGIN, y);
  y += 48;

  ctx.font = 'bold 20px "Noto Sans", sans-serif';
  ctx.fillStyle = '#10151a';
  ctx.fillText('This Week in Brief', MARGIN, y);
  y += 28;
  ctx.font = '16px "Noto Sans", sans-serif';
  ctx.fillStyle = '#3d4650';
  for (const line of wrapText(ctx, weeklySummary || 'Not enough data yet.', WIDTH - MARGIN * 2)) {
    ctx.fillText(line, MARGIN, y);
    y += 24;
  }
  y += 28;

  ctx.font = 'bold 20px "Noto Sans", sans-serif';
  ctx.fillStyle = '#10151a';
  ctx.fillText('Where Time Was Spent', MARGIN, y);
  y += 32;
  const maxCount = Math.max(1, ...domainBalance.map((d) => d.sessionCount));
  const barMaxWidth = WIDTH - MARGIN * 2 - 160;
  for (const entry of domainBalance) {
    ctx.font = '16px "Noto Sans", sans-serif';
    ctx.fillStyle = '#10151a';
    ctx.fillText(i18n.t(`domains.${entry.domain}`), MARGIN, y + 16);
    const barWidth = (entry.sessionCount / maxCount) * barMaxWidth;
    ctx.fillStyle = DOMAIN_COLOR[entry.domain];
    ctx.fillRect(MARGIN + 150, y, Math.max(4, barWidth), 22);
    ctx.fillStyle = '#3d4650';
    ctx.fillText(String(entry.sessionCount), MARGIN + 150 + barWidth + 10, y + 16);
    y += 36;
  }
  y += 28;

  ctx.font = 'bold 20px "Noto Sans", sans-serif';
  ctx.fillStyle = '#10151a';
  ctx.fillText(`Medicine / Activity Adherence — ${adherence.streak}-day streak`, MARGIN, y);
  y += 32;
  const dotSize = 24;
  const gap = 10;
  adherence.series.slice(-14).forEach((day, i) => {
    const x = MARGIN + i * (dotSize + gap);
    const met = day.expected > 0 && day.taken >= day.expected;
    ctx.fillStyle = met ? SEQUENTIAL_BLUE : '#e1e0d9';
    ctx.beginPath();
    ctx.arc(x + dotSize / 2, y + dotSize / 2, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  y += dotSize + 44;

  ctx.font = '13px "Noto Sans", sans-serif';
  ctx.fillStyle = '#7c948c';
  for (const line of wrapText(
    ctx,
    'This image shows trends to discuss with a doctor. It is not a diagnosis or a medical device.',
    WIDTH - MARGIN * 2,
  )) {
    ctx.fillText(line, MARGIN, y);
    y += 20;
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return null;
  return new File([blob], `${patient.name.replace(/\s+/g, '_')}_smritisetu_for_doctor.png`, {
    type: 'image/png',
  });
}

// Tries the Web Share API first (so "send it over WhatsApp" is a single tap
// on a phone/tablet's native share sheet); falls back to a plain download
// wherever navigator.share with files isn't available (most desktop
// browsers), same fallback shape as exportReport.ts's downloadBlob.
export async function shareOrDownloadDoctorImage(file: File): Promise<void> {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };

  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: 'SmritiSetu — For Your Doctor' });
      return;
    } catch {
      // Share sheet cancelled or failed — fall through to a plain download.
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
