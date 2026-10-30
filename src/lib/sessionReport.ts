import type { Feedback, Question, Session } from '@contracts';

// Session report (PRD should-have "Email report", simplified): a printable
// page the user saves as PDF, and a short plain-text version for their own
// mail app. Built in the browser from data already on the page, so it makes
// no API or LLM calls.

export interface ReportInput {
  session: Session;
  questions: Question[];
  answersByQuestionId: Record<string, Feedback>;
  overallScore: number;
}

export const QUESTION_TYPE_LABELS: Record<Question['type'], string> = {
  behavioural: 'Behavioural',
  technical: 'Technical',
  role_fit: 'Role fit',
  situational: 'Situational',
};

const CRITERIA: { key: keyof Feedback['scores']; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'structure', label: 'Structure' },
  { key: 'impact', label: 'Impact' },
];

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const roleLine = (session: Session) =>
  [session.role_title || 'Interview practice', session.company]
    .filter(Boolean)
    .join(' at ');

const formatDate = (iso: string | null) =>
  new Date(iso ?? Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const weakest = ({ questions, answersByQuestionId }: ReportInput) =>
  [...questions].sort(
    (a, b) =>
      (answersByQuestionId[a.id]?.overall ?? 100) -
      (answersByQuestionId[b.id]?.overall ?? 100)
  )[0];

export function buildReportHtml(input: ReportInput): string {
  const { session, questions, answersByQuestionId, overallScore } = input;
  const focus = weakest(input);

  const questionBlocks = questions
    .map((q) => {
      const a = answersByQuestionId[q.id];
      if (!a) return '';
      const bars = CRITERIA.map(
        (c) =>
          `<td><span class="crit">${c.label}</span><b>${a.scores[c.key]}/5</b></td>`
      ).join('');
      const claims = a.unsupported_claims.length
        ? `<h4>Not backed by your resume</h4><ul class="warn">${a.unsupported_claims
            .map((c) => `<li>${escapeHtml(c)}</li>`)
            .join('')}</ul>`
        : '';
      return `
      <section class="q">
        <div class="qhead">
          <span class="pos">Q${q.position} · ${QUESTION_TYPE_LABELS[q.type] ?? q.type}</span>
          <span class="score">${a.overall}/100</span>
        </div>
        <h3>${escapeHtml(q.text)}</h3>
        <table class="crits"><tr>${bars}</tr></table>
        <h4>Your answer</h4>
        <p class="answer">${escapeHtml(a.answer_text)}</p>
        <h4>What worked</h4>
        <p>${escapeHtml(a.what_worked)}</p>
        <h4>One fix</h4>
        <p>${escapeHtml(a.one_fix)}</p>
        <h4>Stronger answer</h4>
        <p class="stronger">${escapeHtml(a.stronger_answer)}</p>
        ${claims}
      </section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>RoleReady report · ${escapeHtml(roleLine(session))}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #f8fafc; color: #0f172a;
    font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .page { max-width: 760px; margin: 0 auto; padding: 32px 20px 48px; }
  .bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px; }
  .bar button { font: inherit; font-weight: 600; border: 0; border-radius: 999px; padding: 10px 20px;
    background: #0284c7; color: #fff; cursor: pointer; }
  header { background: #0f172a; color: #f8fafc; border-radius: 20px; padding: 24px; }
  header .brand { font-size: 12px; font-weight: 600; color: #38bdf8; letter-spacing: .02em; }
  header h1 { margin: 6px 0 2px; font-size: 22px; }
  header .meta { color: #a1a1a6; font-size: 13px; }
  .overall { display: flex; gap: 20px; align-items: baseline; margin-top: 16px; flex-wrap: wrap; }
  .overall b { font-size: 40px; line-height: 1; }
  .tiles { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 16px; }
  .tile { background: rgba(255,255,255,.08); border-radius: 12px; padding: 8px 10px; font-size: 12px; color: #a1a1a6; }
  .tile b { display: block; color: #fff; font-size: 18px; }
  .focus { margin-top: 16px; font-size: 13px; color: #f8fafc; }
  .q { background: #fff; border-radius: 20px; padding: 22px 24px; margin-top: 16px; break-inside: avoid-page; }
  .qhead { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; }
  .pos { color: #0284c7; }
  .score { color: #0f172a; }
  h3 { margin: 6px 0 10px; font-size: 16px; line-height: 1.4; }
  h4 { margin: 14px 0 4px; font-size: 12px; color: #6e6e73; text-transform: uppercase; letter-spacing: .04em; }
  p { margin: 0; }
  .answer { white-space: pre-wrap; color: #424245; }
  .stronger { background: #f0f9ff; border-left: 3px solid #0284c7; padding: 8px 12px; border-radius: 6px; }
  .crits { width: 100%; border-collapse: separate; border-spacing: 6px 0; margin: 0 -6px; }
  .crits td { background: #f8fafc; border-radius: 10px; padding: 6px 10px; font-size: 12px; }
  .crit { display: block; color: #6e6e73; }
  .warn { margin: 0; padding-left: 18px; color: #b45309; }
  footer { margin-top: 24px; font-size: 12px; color: #86868b; text-align: center; }
  @media (max-width: 560px) { .tiles { grid-template-columns: repeat(3, 1fr); } .crits td { padding: 6px; } }
  @media print {
    body { background: #fff; }
    .bar { display: none; }
    .page { padding: 0; }
    header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .q { border: 1px solid #e5e5ea; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="bar">
    <span>Use <b>Save as PDF</b> in the print dialog to keep a copy.</span>
    <button type="button" onclick="window.print()">Save as PDF</button>
  </div>
  <header>
    <div class="brand">RoleReady · Interview practice report</div>
    <h1>${escapeHtml(roleLine(session))}</h1>
    <div class="meta">${formatDate(session.completed_at ?? session.created_at)}</div>
    <div class="overall"><b>${overallScore}/100</b><span>Session average across ${questions.length} questions</span></div>
    <div class="tiles">${questions
      .map(
        (q) =>
          `<div class="tile">Q${q.position}<b>${answersByQuestionId[q.id]?.overall ?? '–'}</b></div>`
      )
      .join('')}</div>
    ${
      focus && answersByQuestionId[focus.id]
        ? `<p class="focus">Practise next: Q${focus.position} (${answersByQuestionId[focus.id].overall}/100). ${escapeHtml(answersByQuestionId[focus.id].one_fix)}</p>`
        : ''
    }
  </header>
  ${questionBlocks}
  <footer>Made with RoleReady · ${escapeHtml(window.location.host)}</footer>
</div>
</body>
</html>`;
}

/** Opens the report in a new tab. Falls back to downloading the file if pop-ups are blocked. */
export function openReport(input: ReportInput): void {
  const html = buildReportHtml(input);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `RoleReady-report-${input.session.id.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Mail apps cut long mailto links, so the email keeps to scores and fixes.
export function buildReportMailto(input: ReportInput, to = ''): string {
  const { session, questions, answersByQuestionId, overallScore } = input;
  const focus = weakest(input);
  const lines = [
    `RoleReady practice report: ${roleLine(session)}`,
    formatDate(session.completed_at ?? session.created_at),
    '',
    `Session average: ${overallScore}/100`,
    '',
    ...questions.flatMap((q) => {
      const a = answersByQuestionId[q.id];
      if (!a) return [];
      return [
        `Q${q.position}: ${a.overall}/100`,
        `Fix: ${a.one_fix}`,
        '',
      ];
    }),
    focus ? `Practise next: Q${focus.position}.` : '',
    '',
    'Full report with stronger answers: open the session in RoleReady and choose "Download report".',
    `${window.location.origin}/session/${session.id}`,
  ];
  const subject = `RoleReady report: ${roleLine(session)} (${overallScore}/100)`;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(lines.join('\n'))}`;
}
