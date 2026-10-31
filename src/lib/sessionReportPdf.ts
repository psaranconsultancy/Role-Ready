import type { Feedback } from '@contracts';
import { QUESTION_TYPE_LABELS, type ReportInput } from './sessionReport';

// A real, downloadable PDF of a finished session, built in the browser with
// jsPDF (loaded only when the button is pressed). No API or LLM calls.

const INK = '#0f172a';
const MUTED = '#6e6e73';
const SKY = '#0284c7';
const SKY_TEXT = '#38bdf8';
const TEAL = '#0d9488';
const AMBER = '#b45309';
const SOFT = '#f1f5f9';
const SKY_SOFT = '#f0f9ff';

const CRITERIA: { key: keyof Feedback['scores']; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'structure', label: 'Structure' },
  { key: 'impact', label: 'Impact' },
];

// The built-in PDF fonts only cover Western European characters. Swap the
// common typographic ones and drop anything else (emoji etc.) so nothing
// prints as garbage.
const clean = (s: string | null | undefined) =>
  (s ?? '')
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[•●]/g, '-')
    .replace(/ /g, ' ')
    .normalize('NFKC')
    .replace(/[^\x09\x0A\x0D\x20-\x7E¡-ÿ]/g, '')
    .trim();

const roleLine = (r: ReportInput) =>
  [r.session.role_title || 'Interview practice', r.session.company].filter(Boolean).join(' at ');

const formatDate = (iso: string | null) =>
  new Date(iso ?? Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const scoreColour = (n: number) => (n >= 75 ? TEAL : n >= 50 ? '#d97706' : '#dc2626');

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch('/assets/img/roleready-mark.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : null);
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function reportFileName(input: ReportInput): string {
  const slug = clean(roleLine(input))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const date = new Date(input.session.completed_at ?? input.session.created_at)
    .toISOString()
    .slice(0, 10);
  return `RoleReady-report-${slug || 'session'}-${date}.pdf`;
}

export async function downloadReportPdf(input: ReportInput): Promise<void> {
  const [{ jsPDF }, logo] = await Promise.all([import('jspdf'), loadLogo()]);
  const { session, questions, answersByQuestionId, overallScore } = input;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16; // page margin
  const CW = W - M * 2; // content width
  const BOTTOM = H - 16;
  let y = M;

  const font = (size: number, style: 'normal' | 'bold' = 'normal', colour = INK) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(colour);
  };
  const lineH = (size: number) => size * 0.42; // mm per line at 1.2 leading
  const ensure = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      y = M;
    }
  };
  /** Writes wrapped text, breaking across pages when needed. */
  const para = (text: string, size: number, opts: { style?: 'normal' | 'bold'; colour?: string; indent?: number; width?: number } = {}) => {
    const indent = opts.indent ?? 0;
    font(size, opts.style ?? 'normal', opts.colour ?? INK);
    const lines: string[] = doc.splitTextToSize(clean(text) || '-', (opts.width ?? CW) - indent);
    const lh = lineH(size);
    for (const ln of lines) {
      ensure(lh);
      doc.text(ln, M + indent, y + lh * 0.8);
      y += lh;
    }
  };
  const label = (text: string) => {
    ensure(10);
    y += 3;
    font(8, 'bold', MUTED);
    doc.text(text.toUpperCase(), M, y + 3);
    y += 5;
  };

  // ---- Header band ----
  const focus = [...questions]
    .filter((q) => answersByQuestionId[q.id])
    .sort((a, b) => answersByQuestionId[a.id].overall - answersByQuestionId[b.id].overall)[0];
  font(10);
  const focusLines: string[] = focus
    ? doc.splitTextToSize(
        clean(`Practise next: Q${focus.position} (${answersByQuestionId[focus.id].overall}/100). ${answersByQuestionId[focus.id].one_fix}`),
        CW - 12
      )
    : [];
  // Up to 8 tiles fit on one row; 10 or 15 questions wrap onto a second row.
  const TILES_PER_ROW = 8;
  const tileRows = Math.max(1, Math.ceil(questions.length / TILES_PER_ROW));
  const extraTileH = (tileRows - 1) * 14;
  const bandH = 66 + extraTileH + focusLines.length * lineH(10);
  doc.setFillColor(INK);
  doc.roundedRect(M, y, CW, bandH, 4, 4, 'F');

  let hx = M + 6;
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', hx, y + 6, 8, 8);
      hx += 10;
    } catch {
      /* logo is optional */
    }
  }
  font(10, 'bold', '#ffffff');
  doc.text('Role', hx, y + 11.5);
  font(10, 'bold', SKY_TEXT);
  doc.text('Ready', hx + doc.getTextWidth('Role'), y + 11.5);
  font(8, 'normal', '#a1a1a6');
  doc.text('Interview practice report', M + CW - 6, y + 11.5, { align: 'right' });

  font(16, 'bold', '#ffffff');
  const title: string[] = doc.splitTextToSize(clean(roleLine(input)), CW - 12);
  doc.text(title[0], M + 6, y + 22);
  font(9, 'normal', '#a1a1a6');
  doc.text(formatDate(session.completed_at ?? session.created_at), M + 6, y + 28);

  font(28, 'bold', '#ffffff');
  doc.text(`${overallScore}`, M + 6, y + 42);
  const sw = doc.getTextWidth(`${overallScore}`);
  font(11, 'normal', '#a1a1a6');
  doc.text(`/100  session average across ${questions.length} questions`, M + 7 + sw, y + 42);

  // Per-question tiles
  const tileGap = 2.5;
  const n = Math.max(1, Math.ceil(questions.length / tileRows));
  const tileW = (CW - 12 - tileGap * (n - 1)) / n;
  questions.forEach((q, i) => {
    const tx = M + 6 + (i % n) * (tileW + tileGap);
    const ty = y + 47 + Math.floor(i / n) * 14;
    doc.setFillColor('#1e293b');
    doc.roundedRect(tx, ty, tileW, 12, 2, 2, 'F');
    const s = answersByQuestionId[q.id]?.overall;
    font(7, 'normal', '#a1a1a6');
    doc.text(`Q${q.position}`, tx + 2.5, ty + 4.5);
    font(11, 'bold', '#ffffff');
    doc.text(s === undefined ? '-' : `${s}`, tx + 2.5, ty + 10);
    if (s !== undefined) {
      doc.setFillColor(scoreColour(s));
      doc.rect(tx + tileW - 4, ty + 3, 1.5, 6.5, 'F');
    }
  });
  if (focusLines.length) {
    font(10, 'normal', '#f8fafc');
    focusLines.forEach((ln, i) => doc.text(ln, M + 6, y + 66 + extraTileH + i * lineH(10)));
  }
  y += bandH + 6;

  // ---- One block per question ----
  for (const q of questions) {
    const a = answersByQuestionId[q.id];
    if (!a) continue;
    ensure(40);
    doc.setDrawColor('#e2e8f0');
    doc.setLineWidth(0.3);
    doc.line(M, y, M + CW, y);
    y += 5;

    font(8, 'bold', SKY);
    doc.text(`Q${q.position} - ${QUESTION_TYPE_LABELS[q.type] ?? q.type}`.toUpperCase(), M, y + 3);
    font(11, 'bold', scoreColour(a.overall));
    doc.text(`${a.overall}/100`, M + CW, y + 3.5, { align: 'right' });
    y += 6;
    para(q.text, 11.5, { style: 'bold' });
    y += 2;

    // Criteria row
    ensure(11);
    const cw = (CW - 3 * 3) / 4;
    CRITERIA.forEach((c, i) => {
      const cx = M + i * (cw + 3);
      doc.setFillColor(SOFT);
      doc.roundedRect(cx, y, cw, 9, 1.5, 1.5, 'F');
      font(7.5, 'normal', MUTED);
      doc.text(c.label, cx + 2.5, y + 5.8);
      font(9.5, 'bold', INK);
      doc.text(`${a.scores[c.key]}/5`, cx + cw - 2.5, y + 6, { align: 'right' });
    });
    y += 11;

    label('Your answer');
    para(a.answer_text, 9.5, { colour: '#424245' });
    label('What worked');
    para(a.what_worked, 9.5);
    label('One fix');
    para(a.one_fix, 9.5);

    label('Stronger answer');
    // Tinted panel with a sky rule on the left; drawn per page if it breaks.
    font(9.5);
    const sLines: string[] = doc.splitTextToSize(clean(a.stronger_answer) || '-', CW - 8);
    const lh = lineH(9.5);
    let i = 0;
    while (i < sLines.length) {
      ensure(lh + 3);
      const fit = Math.max(1, Math.min(sLines.length - i, Math.floor((BOTTOM - y - 3) / lh)));
      const h = fit * lh + 3;
      doc.setFillColor(SKY_SOFT);
      doc.rect(M, y, CW, h, 'F');
      doc.setFillColor(SKY);
      doc.rect(M, y, 0.9, h, 'F');
      font(9.5, 'normal', INK);
      for (let k = 0; k < fit; k++) doc.text(sLines[i + k], M + 4, y + 1.5 + lh * (k + 0.8));
      y += h;
      i += fit;
    }

    if (a.unsupported_claims.length) {
      label('Not backed by your resume');
      for (const c of a.unsupported_claims) para(`- ${c}`, 9.5, { colour: AMBER, indent: 2 });
    }
    y += 6;
  }

  // ---- Footer on every page ----
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    font(7.5, 'normal', '#86868b');
    doc.text(`RoleReady - Ready, Set, You're Hired - ${window.location.host}`, M, H - 8);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 8, { align: 'right' });
  }

  doc.setProperties({ title: `RoleReady report - ${clean(roleLine(input))}`, creator: 'RoleReady' });
  doc.save(reportFileName(input));
}
