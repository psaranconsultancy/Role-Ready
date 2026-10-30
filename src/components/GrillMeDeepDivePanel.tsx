import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Flame,
  Lock,
  Clock,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  TrendingUp,
  SlidersHorizontal,
  HelpCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Timer,
  Upload,
  Link2,
  Building2,
  UserCheck,
  Gauge,
  Plus,
  X,
  FileText,
  BookOpen,
  Download,
} from 'lucide-react';
import type { Question, Feedback, ResumeLine, JdRequirement } from '@contracts';
import {
  useSubscriptionTier,
  buildGrillRoundsForQuestion,
  evaluateDeliveryComposure,
  HEAT_LEVELS,
  INTERVIEWER_PERSONAS,
  INDUSTRY_OPTIONS,
  DEPARTMENT_OPTIONS,
  SENIORITY_OPTIONS,
  NICHE_CATEGORY_OPTIONS,
  CSUITE_CATEGORY_OPTIONS,
  type HeatLevel,
  type DeliveryComposureMetrics,
} from '../lib/tiers';
import { TierPricingSection } from './TierPricingSection';

interface GrillMeDeepDivePanelProps {
  question: Question;
  resumeLines: ResumeLine[];
  jdItems: JdRequirement[];
  feedback?: Feedback;
  roleTitle?: string | null;
  company?: string | null;
}

// Grill Me is on the roadmap. Until it ships, the panel shows a labelled
// preview with no purchase or unlock buttons; flip this to show the full deck.
const GRILL_ME_LIVE = false;

export const GrillMeDeepDivePanel: React.FC<GrillMeDeepDivePanelProps> = ({
  question,
  resumeLines,
  jdItems,
  feedback,
  roleTitle,
  company,
}) => {
  const {
    grillContext,
    updateGrillContext,
    heat,
    setHeat,
    interviewerGender,
    setInterviewerGender,
  } = useSubscriptionTier();

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const contextFileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeRound, setActiveRound] = useState<1 | 2>(1);
  const [settledIds, setSettledIds] = useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({});
  const [composureByQuestionId, setComposureByQuestionId] = useState<
    Record<string, DeliveryComposureMetrics>
  >({});
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeDocsTab, setActiveDocsTab] = useState<'cdr' | 'glossary'>('cdr');
  const [copiedDossier, setCopiedDossier] = useState(false);

  // Voice synthesis & voice recognition state
  const [speakingQuestionId, setSpeakingQuestionId] = useState<string | null>(
    null
  );
  const [recordingQuestionId, setRecordingQuestionId] = useState<string | null>(
    null
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const recordingStartRef = useRef<number | null>(null);
  const firstWordLatencyRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const activePersona = INTERVIEWER_PERSONAS[interviewerGender];
  const activeHeatMeta = HEAT_LEVELS[heat];

  const plan = useMemo(
    () =>
      buildGrillRoundsForQuestion(
        question,
        resumeLines,
        jdItems,
        feedback,
        roleTitle,
        company,
        grillContext,
        heat
      ),
    [question, resumeLines, jdItems, feedback, roleTitle, company, grillContext, heat]
  );

  const round1 = plan.rounds[0];
  const round2 = plan.rounds[1];
  const currentRoundObj = activeRound === 1 ? round1 : round2;

  const isRound1Settled = round1.questions.every((q) => Boolean(settledIds[q.id]));
  const isRound2Settled = round2.questions.every((q) => Boolean(settledIds[q.id]));
  const isTreeCleared = isRound1Settled && isRound2Settled;

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleSpeakQuestion = (qId: string, textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (speakingQuestionId === qId) {
      window.speechSynthesis.cancel();
      setSpeakingQuestionId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();

    const femaleKeywords = ['zira', 'hazel', 'samantha', 'victoria', 'aria', 'jenny', 'sonia', 'female', 'google uk english female'];
    const maleKeywords = ['david', 'george', 'daniel', 'mark', 'guy', 'ryan', 'christopher', 'male', 'google uk english male'];

    const targetKeywords =
      interviewerGender === 'female' ? femaleKeywords : maleKeywords;

    const matchedVoice = voices.find((v) =>
      targetKeywords.some((kw) => v.name.toLowerCase().includes(kw))
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.pitch = activePersona.pitch;
    utterance.rate = activePersona.rateByHeat[heat];
    utterance.onend = () => setSpeakingQuestionId(null);
    utterance.onerror = () => setSpeakingQuestionId(null);

    setSpeakingQuestionId(qId);
    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceRecording = (qId: string, fallbackRecommended: string) => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    const totalSec = recordingStartRef.current
      ? Math.max(4, Math.round((Date.now() - recordingStartRef.current) / 1000))
      : Math.max(8, elapsedSeconds);
    const latencySec = firstWordLatencyRef.current ?? 1.9;

    setRecordingQuestionId(null);

    const currentText = customNotes[qId]?.trim() || fallbackRecommended;
    if (!customNotes[qId]?.trim()) {
      setCustomNotes((prev) => ({
        ...prev,
        [qId]: fallbackRecommended,
      }));
    }

    const metrics = evaluateDeliveryComposure(
      currentText,
      totalSec,
      latencySec,
      heat
    );
    setComposureByQuestionId((prev) => ({
      ...prev,
      [qId]: metrics,
    }));
    setSettledIds((prev) => ({
      ...prev,
      [qId]: currentText,
    }));
  };

  const startVoiceRecording = (qId: string, recommendedText: string) => {
    if (recordingQuestionId === qId) {
      stopVoiceRecording(qId, recommendedText);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingQuestionId(null);
    }

    setRecordingQuestionId(qId);
    setElapsedSeconds(0);
    recordingStartRef.current = Date.now();
    firstWordLatencyRef.current = null;

    timerIntervalRef.current = window.setInterval(() => {
      if (recordingStartRef.current) {
        setElapsedSeconds(
          Math.floor((Date.now() - recordingStartRef.current) / 1000)
        );
      }
    }, 500);

    const SpeechRecognitionCtor =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (typeof SpeechRecognitionCtor === 'function') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition: any = new (SpeechRecognitionCtor as any)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-GB';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          if (firstWordLatencyRef.current === null && recordingStartRef.current) {
            firstWordLatencyRef.current = Math.max(
              0.8,
              (Date.now() - recordingStartRef.current) / 1000
            );
          }
          let transcript = '';
          for (let i = 0; i < event.results.length; i += 1) {
            transcript += event.results[i][0].transcript + ' ';
          }
          if (transcript.trim()) {
            setCustomNotes((prev) => ({
              ...prev,
              [qId]: transcript.trim(),
            }));
          }
        };

        recognition.onerror = () => {
          // Keep timer active so user can still stop & score
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        // Fallback to timed simulation if browser blocks mic
      }
    }
  };

  const handleSettleQuestion = (qId: string, recommended: string) => {
    const chosen = customNotes[qId]?.trim() || recommended;
    const simulatedDuration = Math.max(
      14,
      Math.round(chosen.split(/\s+/).length / 2.3)
    );
    const metrics = evaluateDeliveryComposure(
      chosen,
      simulatedDuration,
      2.1,
      heat
    );
    setComposureByQuestionId((prev) => ({
      ...prev,
      [qId]: metrics,
    }));
    setSettledIds((prev) => ({
      ...prev,
      [qId]: chosen,
    }));
  };

  const handleAddContextFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!grillContext.uploadedFiles.includes(file.name)) {
      updateGrillContext({
        ...grillContext,
        uploadedFiles: [...grillContext.uploadedFiles, file.name],
      });
    }
    e.target.value = '';
  };

  const handleRemoveContextFile = (name: string) => {
    updateGrillContext({
      ...grillContext,
      uploadedFiles: grillContext.uploadedFiles.filter((f) => f !== name),
    });
  };

  const handleAddSharedLink = () => {
    const trimmed = newLinkUrl.trim();
    if (!trimmed) return;
    if (!grillContext.sharedLinks.includes(trimmed)) {
      updateGrillContext({
        ...grillContext,
        sharedLinks: [...grillContext.sharedLinks, trimmed],
      });
    }
    setNewLinkUrl('');
  };

  const handleRemoveSharedLink = (url: string) => {
    updateGrillContext({
      ...grillContext,
      sharedLinks: grillContext.sharedLinks.filter((l) => l !== url),
    });
  };

  const handleCopyNegotiation = async () => {
    try {
      await navigator.clipboard.writeText(plan.negotiationScript.spokenScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const buildDossierMarkdown = (): string => {
    const lines: string[] = [
      `# ${plan.grillWithDocs.dossierTitle}`,
      `- **Industry**: ${grillContext.industry}`,
      `- **Department**: ${grillContext.department}`,
      `- **Seniority Band**: ${grillContext.seniority}`,
      `- **Niche Category**: ${grillContext.nicheCategory}`,
      `- **C-Suite Category**: ${grillContext.cSuiteCategory}`,
      `- **Heat Level**: ${heat}/4 (${activeHeatMeta.name})`,
      `- **Uploaded Docs**: ${grillContext.uploadedFiles.join(', ') || 'None'}`,
      `- **Shared Links**: ${grillContext.sharedLinks.join(', ') || 'None'}`,
      '',
      '## 1. Candidate Decision Records (CDR Log)',
    ];

    plan.grillWithDocs.decisionRecords.forEach((cdr) => {
      const settledText = settledIds[cdr.questionId];
      lines.push(
        `### ${cdr.code} · ${cdr.title} (${settledText ? 'Settled' : 'Draft'})`,
        `- **Source Docs Cited**: ${cdr.sourceDocsCited}`,
        `- **Panel Challenge**: ${cdr.panelChallenge}`,
        `- **Your Decision & Rebuttal**: ${settledText || cdr.defaultDecisionSummary}`,
        `- **Trade-Off Defended**: ${cdr.tradeOffDefended}`,
        `- **Rollback & Guardrail Metric**: ${cdr.rollbackThreshold}`,
        ''
      );
    });

    lines.push('## 2. Niche & C-Suite Domain Glossary');
    plan.grillWithDocs.domainGlossary.forEach((entry) => {
      lines.push(
        `### ${entry.term} [${entry.categoryBadge}]`,
        `- **What the Panel Tests**: ${entry.panelMeaning}`,
        `- **Your Grounded Proof**: ${entry.yourGroundedProof}`,
        ''
      );
    });

    lines.push(
      '## 3. Salary & Offer Negotiation Script',
      plan.negotiationScript.spokenScript
    );

    return lines.join('\n');
  };

  const handleCopyDossier = async () => {
    try {
      await navigator.clipboard.writeText(buildDossierMarkdown());
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadDossier = () => {
    try {
      const md = buildDossierMarkdown();
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RoleReady-Grill-With-Docs-Q${question.position}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <section
      data-ui="grill-me-panel"
      aria-label="Grill Me deep-dive voice stress test"
      className="bento-card-dark mt-6 overflow-hidden p-6 text-[#f5f5f7] sm:p-8"
    >
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-3 py-1 text-xs font-semibold text-white">
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Grill Me · Voice &amp; Follow-Up Stress Test</span>
          </span>
          {!GRILL_ME_LIVE && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff9f0a]/40 bg-[#ff9f0a]/15 px-3 py-1 text-xs font-semibold text-[#ff9f0a]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Coming soon
            </span>
          )}
          {GRILL_ME_LIVE && (
          <>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${activeHeatMeta.badgeClass}`}
          >
            Heat {heat}/4 · {activeHeatMeta.name}
          </span>
          <span className="rounded-full border border-[#2997ff]/30 bg-[#0071e3]/15 px-3 py-1 text-xs font-medium text-[#2997ff]">
            Niche: {grillContext.nicheCategory}
          </span>
          <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-medium text-[#d2d2d7]">
            C-Suite: {grillContext.cSuiteCategory}
          </span>
          </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {GRILL_ME_LIVE && (
          <button
            type="button"
            onClick={() => setShowContextEditor((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-[#d2d2d7] transition-colors hover:bg-white/10"
          >
            <Building2 className="h-3.5 w-3.5 text-[#30d158]" aria-hidden="true" />
            <span>Niche &amp; C-Suite categories</span>
          </button>
          )}
          <button
            type="button"
            onClick={() => setShowPricingModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-[#2997ff] transition-colors hover:bg-white/10"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>See the roadmap</span>
          </button>
        </div>
      </div>

      {/* Expandable Niche Category, C-Suite Category, Uploads & Links Context Drawer */}
      {showContextEditor && (
        <div className="mt-5 rounded-2xl border border-white/15 bg-white/[0.04] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h4 className="font-display text-sm font-bold text-white">
                Niche Category, C-Suite Category, Extra Files &amp; Shared Links
              </h4>
              <p className="text-xs text-[#a1a1a6]">
                Configure your Niche specialization and C-Suite seat separately,
                or attach board decks and company links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowContextEditor(false)}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
            >
              Done
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor={`industry-select-${question.id}`}
                className="block text-xs font-semibold text-[#d2d2d7]"
              >
                Industry sector
              </label>
              <select
                id={`industry-select-${question.id}`}
                value={grillContext.industry}
                onChange={(e) =>
                  updateGrillContext({ ...grillContext, industry: e.target.value })
                }
                className="mt-1.5 block min-h-[40px] w-full rounded-xl border border-white/15 bg-[#161617] px-3 py-2 text-xs text-white focus:border-[#2997ff] focus:outline-none"
              >
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={`dept-select-${question.id}`}
                className="block text-xs font-semibold text-[#d2d2d7]"
              >
                Department / Function
              </label>
              <select
                id={`dept-select-${question.id}`}
                value={grillContext.department}
                onChange={(e) =>
                  updateGrillContext({
                    ...grillContext,
                    department: e.target.value,
                  })
                }
                className="mt-1.5 block min-h-[40px] w-full rounded-xl border border-white/15 bg-[#161617] px-3 py-2 text-xs text-white focus:border-[#2997ff] focus:outline-none"
              >
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={`seniority-select-${question.id}`}
                className="block text-xs font-semibold text-[#d2d2d7]"
              >
                Seniority Band
              </label>
              <select
                id={`seniority-select-${question.id}`}
                value={grillContext.seniority}
                onChange={(e) =>
                  updateGrillContext({
                    ...grillContext,
                    seniority: e.target.value,
                  })
                }
                className="mt-1.5 block min-h-[40px] w-full rounded-xl border border-white/15 bg-[#161617] px-3 py-2 text-xs text-white focus:border-[#2997ff] focus:outline-none"
              >
                {SENIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Separate Niche Category & Separate C-Suite Category */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#2997ff]/30 bg-[#0071e3]/10 p-3.5">
              <label
                htmlFor={`niche-cat-select-${question.id}`}
                className="block text-xs font-bold text-[#2997ff]"
              >
                Niche Category (Specialist Domain)
              </label>
              <select
                id={`niche-cat-select-${question.id}`}
                value={grillContext.nicheCategory}
                onChange={(e) =>
                  updateGrillContext({
                    ...grillContext,
                    nicheCategory: e.target.value,
                  })
                }
                className="mt-1.5 block min-h-[40px] w-full rounded-xl border border-white/15 bg-[#161617] px-3 py-2 text-xs text-white focus:border-[#2997ff] focus:outline-none"
              >
                {NICHE_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-white/15 bg-black/50 p-3.5">
              <label
                htmlFor={`csuite-cat-select-${question.id}`}
                className="block text-xs font-bold text-white"
              >
                C-Suite Category (Executive &amp; Board Seat)
              </label>
              <select
                id={`csuite-cat-select-${question.id}`}
                value={grillContext.cSuiteCategory}
                onChange={(e) =>
                  updateGrillContext({
                    ...grillContext,
                    cSuiteCategory: e.target.value,
                  })
                }
                className="mt-1.5 block min-h-[40px] w-full rounded-xl border border-white/15 bg-[#161617] px-3 py-2 text-xs text-white focus:border-[#2997ff] focus:outline-none"
              >
                {CSUITE_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor={`niche-input-${question.id}`}
              className="block text-xs font-semibold text-[#d2d2d7]"
            >
              Specific niche focus / 90-day board priority
            </label>
            <input
              id={`niche-input-${question.id}`}
              type="text"
              value={grillContext.nicheFocus}
              onChange={(e) =>
                updateGrillContext({
                  ...grillContext,
                  nicheFocus: e.target.value,
                })
              }
              placeholder="e.g. Post-merger integration, Series C international expansion, SOC2 & enterprise risk…"
              className="mt-1.5 block min-h-[40px] w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs text-white placeholder:text-[#aeaeb2] focus:border-[#2997ff] focus:outline-none"
            />
          </div>

          {/* Supplemental Uploads & Shared Links */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Uploaded Context Files */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Upload className="h-3.5 w-3.5 text-[#2997ff]" aria-hidden="true" />
                  <span>Extra files (Decks, 10-K, Case Studies)</span>
                </span>
                <input
                  ref={contextFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={handleAddContextFile}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => contextFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-[#2997ff] hover:bg-white/15"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  <span>Upload file</span>
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {grillContext.uploadedFiles.map((fileName) => (
                  <span
                    key={fileName}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-xs text-[#d2d2d7]"
                  >
                    <span className="max-w-[180px] truncate">{fileName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveContextFile(fileName)}
                      aria-label={`Remove ${fileName}`}
                      className="text-[#86868b] hover:text-white"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Shared Context Links */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Link2 className="h-3.5 w-3.5 text-[#30d158]" aria-hidden="true" />
                <span>Shared context links (Company URLs, Memos, Profiles)</span>
              </span>
              <div className="mt-2 flex gap-1.5">
                <input
                  type="url"
                  aria-label="Add context link URL"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://company.com/investor-memo"
                  className="min-h-[34px] flex-1 rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-xs text-white placeholder:text-[#aeaeb2] focus:border-[#2997ff] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSharedLink}
                  className="rounded-lg bg-[#0071e3] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0077ed]"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {grillContext.sharedLinks.map((url) => (
                  <span
                    key={url}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-xs text-[#2997ff]"
                  >
                    <span className="max-w-[200px] truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSharedLink(url)}
                      aria-label={`Remove ${url}`}
                      className="text-[#86868b] hover:text-white"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOCKED STATE (Tier 1 or Tier 2) -> Psychological Nudge + Frontier Preview */}
      {!GRILL_ME_LIVE ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-5 lg:grid-cols-12 lg:items-center">
            <div className="space-y-2.5 lg:col-span-8">
              <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
                Practise the follow-up questions panels ask when they press on your numbers
              </h3>
              <p className="text-xs leading-relaxed text-[#d2d2d7] sm:text-sm">
                Coming soon: turn the Heat Dial up to{' '}
                <strong className="text-[#ff453a]">Executive Roast</strong>,
                practise aloud with a male or female AI interviewer, and get
                scored on your timing and calm under pressure.
              </p>
            </div>
            <div className="rounded-2xl border border-[#30d158]/30 bg-[#30d158]/10 p-4 lg:col-span-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#30d158]">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                <span>Also on the roadmap</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#f5f5f7]">
                Niche and C-Suite question sets, and salary negotiation scripts
                built from your resume.
              </p>
            </div>
          </div>

          {/* Teaser of Round 1 Frontier Q1 */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#2997ff]">
                {round1.roundTitle} (Preview)
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#ff9f0a]">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Heat Dial and AI voice interviewer coming soon</span>
              </span>
            </div>

            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-white">
              <HelpCircle
                className="h-4 w-4 shrink-0 text-[#2997ff]"
                aria-hidden="true"
              />
              <span>
                {round1.questions[0].code} · {round1.questions[0].title}
              </span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#d2d2d7] sm:text-sm">
              {round1.questions[0].prompt}
            </p>

            {/* Gated Controls Preview */}
            <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-xl border border-white/10 bg-black/50 p-4 sm:flex-row sm:items-center">
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#a1a1a6]">
                  <ArrowRight
                    className="h-3.5 w-3.5 text-[#2997ff]"
                    aria-hidden="true"
                  />
                  <span>
                    Includes Male/Female AI Voice Interviewer, Roast Heat Dial
                    &amp; Composure Timing
                  </span>
                </p>
                <p className="text-xs text-[#86868b]">
                  Measures response latency, speaking pace (WPM), filler words,
                  and calm under pressure.
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
                <span className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-full border border-[#ff9f0a]/40 bg-[#ff9f0a]/15 px-5 py-2 text-xs font-semibold text-[#ff9f0a]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Coming soon</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TIER 3 STATE -> Full Heat Dial + Male/Female Voice Interviewer + Composure Telemetry */
        <div className="mt-6 space-y-6">
          {/* Control Deck: Heat Dial (1-4) + Male/Female Voice Persona Selector */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* 4-Stage Heat Dial */}
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 lg:col-span-7">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Flame
                    className={`h-4 w-4 ${
                      heat === 4 ? 'text-[#ff453a]' : 'text-[#ff9f0a]'
                    }`}
                    aria-hidden="true"
                  />
                  <span>
                    Intensity Heat Dial · {activeHeatMeta.name} (
                    {activeHeatMeta.timeLimitSeconds}s target)
                  </span>
                </span>
                <span className="text-xs text-[#a1a1a6]">
                  Turn up to get roasted or dial down
                </span>
              </div>

              <div
                role="group"
                aria-label="Select interview grilling heat level"
                className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {([1, 2, 3, 4] as HeatLevel[]).map((lvl) => {
                  const meta = HEAT_LEVELS[lvl];
                  const isSelected = heat === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setHeat(lvl)}
                      className={`min-h-[38px] rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isSelected
                          ? lvl === 4
                            ? 'border-[#ff453a] bg-[#ff453a] text-white'
                            : lvl === 3
                              ? 'border-[#ff9f0a] bg-[#ff9f0a] text-black'
                              : 'border-[#0071e3] bg-[#0071e3] text-white'
                          : 'border-white/10 bg-black/40 text-[#d2d2d7] hover:bg-white/10'
                      }`}
                    >
                      {lvl}. {meta.shortLabel}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-[#a1a1a6]">
                {activeHeatMeta.description}
              </p>
            </div>

            {/* Male / Female AI Voice Interviewer Selector */}
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 lg:col-span-5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <UserCheck
                    className="h-4 w-4 text-[#2997ff]"
                    aria-hidden="true"
                  />
                  <span>AI Voice Interviewer</span>
                </span>
                <span className="text-xs text-[#30d158]">Voice ready</span>
              </div>

              <div
                role="group"
                aria-label="Select female or male AI interviewer voice"
                className="mt-3 grid grid-cols-2 gap-2"
              >
                {(['female', 'male'] as const).map((g) => {
                  const p = INTERVIEWER_PERSONAS[g];
                  const active = interviewerGender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setInterviewerGender(g)}
                      className={`rounded-xl border p-2.5 text-left transition-colors ${
                        active
                          ? 'border-[#2997ff] bg-[#0071e3]/25 text-white'
                          : 'border-white/10 bg-black/40 text-[#d2d2d7] hover:bg-white/10'
                      }`}
                    >
                      <p className="text-xs font-bold capitalize">
                        {g} · {p.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#a1a1a6]">
                        {p.title}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[#a1a1a6]">
                {activePersona.styleNote}
              </p>
            </div>
          </div>

          {/* Round Stepper */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div>
              <p className="text-xs font-semibold text-[#2997ff]">
                {currentRoundObj.roundTitle}
              </p>
              <p className="mt-0.5 text-xs text-[#a1a1a6]">
                {currentRoundObj.frontierSummary}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveRound(1)}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  activeRound === 1
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-white/10 text-[#d2d2d7] hover:bg-white/15'
                }`}
              >
                <span>Round 1</span>
                {isRound1Settled && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#30d158]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveRound(2)}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  activeRound === 2
                    ? 'bg-[#0071e3] text-white'
                    : 'bg-white/10 text-[#d2d2d7] hover:bg-white/15'
                }`}
              >
                <span>Round 2</span>
                {isRound2Settled && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#30d158]" />
                )}
              </button>
            </div>
          </div>

          {/* Frontier Questions for Current Round */}
          <div className="space-y-4">
            {currentRoundObj.questions.map((q) => {
              const isSettled = Boolean(settledIds[q.id]);
              const isSpeaking = speakingQuestionId === q.id;
              const isRecording = recordingQuestionId === q.id;
              const composure = composureByQuestionId[q.id];

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border p-5 transition-colors ${
                    isSettled
                      ? 'border-[#30d158]/40 bg-[#30d158]/[0.07]'
                      : 'border-white/15 bg-white/[0.04]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-display text-sm font-bold text-white sm:text-base">
                      <HelpCircle
                        className="h-4 w-4 shrink-0 text-[#2997ff]"
                        aria-hidden="true"
                      />
                      <span>
                        {q.code} · {q.title}
                      </span>
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Have AI Interviewer Speak Question Aloud */}
                      <button
                        type="button"
                        onClick={() => handleSpeakQuestion(q.id, q.prompt)}
                        className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                          isSpeaking
                            ? 'border-[#2997ff] bg-[#0071e3] text-white'
                            : 'border-white/15 bg-white/10 text-white hover:bg-white/15'
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Stop {activePersona.name.split(' ')[0]}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5 text-[#2997ff]" aria-hidden="true" />
                            <span>
                              Hear {activePersona.name.split(' ')[0]} ask {q.code}
                            </span>
                          </>
                        )}
                      </button>

                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#30d158]/20 px-2.5 py-0.5 text-xs font-semibold text-[#30d158]">
                          <CheckCircle2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                          <span>Branch settled</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#ff9f0a]">
                          Open frontier branch
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#f5f5f7] sm:text-sm">
                    {q.prompt}
                  </p>

                  <p className="mt-2 text-xs text-[#a1a1a6]">
                    <strong className="text-[#d2d2d7]">What this tests:</strong>{' '}
                    {q.hiddenRiskTested}
                  </p>

                  {/* Recommended Answer Block */}
                  <div className="mt-4 rounded-xl border border-[#0071e3]/35 bg-[#0071e3]/15 p-3.5 text-xs leading-relaxed text-[#f5f5f7]">
                    <p className="flex items-center gap-1.5 font-semibold text-[#2997ff]">
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Recommended executive rebuttal:</span>
                    </p>
                    <p className="mt-1">{q.recommendedAnswer}</p>
                  </div>

                  {/* Voice Answer Mic + Pressure Timer + Text Input */}
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startVoiceRecording(q.id, q.recommendedAnswer)
                        }
                        className={`inline-flex min-h-[38px] items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                          isRecording
                            ? 'bg-[#ff453a] text-white'
                            : 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>
                              Stop &amp; Score Voice ({elapsedSeconds}s /{' '}
                              {activeHeatMeta.timeLimitSeconds}s)
                            </span>
                          </>
                        ) : (
                          <>
                            <Mic
                              className="h-3.5 w-3.5 text-[#30d158]"
                              aria-hidden="true"
                            />
                            <span>
                              Answer by Voice (Start Mic &amp;{' '}
                              {activeHeatMeta.timeLimitSeconds}s Clock)
                            </span>
                          </>
                        )}
                      </button>

                      <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-[#a1a1a6]">
                        <Timer className="h-3.5 w-3.5 text-[#ff9f0a]" aria-hidden="true" />
                        <span>
                          Target window: {activeHeatMeta.timeLimitSeconds}s under{' '}
                          {activeHeatMeta.name}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        aria-label={`Your spoken transcript or typed defence for ${q.code}`}
                        value={customNotes[q.id] ?? ''}
                        onChange={(e) =>
                          setCustomNotes((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder="Speak via mic above or type your defence (measures timing, filler words & calm under pressure)…"
                        className="min-h-[40px] flex-1 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2 text-xs text-white placeholder:text-[#aeaeb2] focus:border-[#2997ff] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleSettleQuestion(q.id, q.recommendedAnswer)
                        }
                        className="btn-pill-primary min-h-[40px] shrink-0 px-4 py-2 text-xs font-semibold"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        <span>
                          {isSettled
                            ? 'Re-score composure'
                            : 'Score defence & composure'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Timing, Confidence & Calm-Under-Pressure Scorecard */}
                  {composure && (
                    <div className="mt-4 rounded-xl border border-[#30d158]/35 bg-black/55 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#30d158]">
                          <Gauge className="h-4 w-4" aria-hidden="true" />
                          <span>
                            Voice Timing &amp; Calm Under Pressure ·{' '}
                            {composure.calmScore}/100 ({composure.calmLabel})
                          </span>
                        </span>
                        <span className="text-xs tabular-nums text-[#a1a1a6]">
                          Delivered in {composure.durationSeconds}s /{' '}
                          {composure.timeBoxTargetSeconds}s target
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-3">
                        <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                          <span className="text-[#a1a1a6]">
                            Response latency
                          </span>
                          <p className="mt-0.5 font-semibold tabular-nums text-white">
                            {composure.latencyVerdict}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                          <span className="text-[#a1a1a6]">
                            Delivery cadence
                          </span>
                          <p className="mt-0.5 font-semibold tabular-nums text-white">
                            {composure.wpmVerdict}
                          </p>
                        </div>
                        <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                          <span className="text-[#a1a1a6]">
                            Filler &amp; hedging words
                          </span>
                          <p className="mt-0.5 font-semibold tabular-nums text-white">
                            {composure.fillerCount === 0
                              ? '0 detected · Crisp authority'
                              : `${composure.fillerCount} detected (${composure.fillerWordsFound.join(', ')})`}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-[#d2d2d7]">
                        <strong className="text-[#2997ff]">
                          Composure coaching:
                        </strong>{' '}
                        {composure.coachingNote}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Advance to Round 2 CTA when Round 1 is settled */}
          {activeRound === 1 && isRound1Settled && !isRound2Settled && (
            <div className="flex items-center justify-between rounded-2xl border border-[#0071e3]/40 bg-[#0071e3]/15 p-4">
              <p className="text-xs font-semibold text-white sm:text-sm">
                Round 1 frontier settled. Ready for Round 2 failure-mode probes?
              </p>
              <button
                type="button"
                onClick={() => setActiveRound(2)}
                className="btn-pill-primary min-h-[38px] px-4 py-1.5 text-xs font-semibold"
              >
                <span>Advance to Round 2</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Executive Offer & Salary Negotiation Script */}
          <div
            className={`rounded-2xl border p-5 ${
              isTreeCleared
                ? 'border-[#30d158]/50 bg-[#30d158]/10'
                : 'border-white/15 bg-black/40'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#30d158]">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  <span>{plan.negotiationScript.anchorHeadline}</span>
                </span>
                <p className="mt-0.5 text-xs text-[#a1a1a6]">
                  {plan.negotiationScript.proofSummary}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyNegotiation}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                {copiedScript ? (
                  <>
                    <Check
                      className="h-3.5 w-3.5 text-[#30d158]"
                      aria-hidden="true"
                    />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy script</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#f5f5f7] sm:text-sm">
              {plan.negotiationScript.spokenScript}
            </p>
          </div>

          {/* Grill With Docs: Live Candidate Decision Records (CDRs) & Niche/C-Suite Domain Glossary */}
          <div className="rounded-2xl border border-[#2997ff]/35 bg-white/[0.04] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3]/25 px-3 py-0.5 text-xs font-semibold text-[#2997ff]">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Grill With Docs · Live Dossier</span>
                  </span>
                  <span className="text-xs font-medium text-[#30d158]">
                    {Object.keys(settledIds).length} of 4 Decision Records settled
                  </span>
                </div>
                <h4 className="mt-1.5 font-display text-base font-bold text-white">
                  {plan.grillWithDocs.dossierTitle}
                </h4>
                <p className="mt-0.5 text-xs text-[#a1a1a6]">
                  Builds Candidate Decision Records (CDRs) and a Niche &amp;
                  C-Suite Domain Glossary as you answer each round.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDossier}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                >
                  {copiedDossier ? (
                    <>
                      <Check
                        className="h-3.5 w-3.5 text-[#30d158]"
                        aria-hidden="true"
                      />
                      <span>Dossier copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy dossier</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDossier}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#0071e3] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0077ed]"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Sub-tabs: Decision Records vs Domain Glossary */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveDocsTab('cdr')}
                className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  activeDocsTab === 'cdr'
                    ? 'bg-white text-[#1d1d1f]'
                    : 'bg-white/10 text-[#d2d2d7] hover:bg-white/15'
                }`}
              >
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Candidate Decision Records (4 CDRs)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDocsTab('glossary')}
                className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  activeDocsTab === 'glossary'
                    ? 'bg-white text-[#1d1d1f]'
                    : 'bg-white/10 text-[#d2d2d7] hover:bg-white/15'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Niche &amp; C-Suite Glossary (4 Terms)</span>
              </button>
            </div>

            {activeDocsTab === 'cdr' ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {plan.grillWithDocs.decisionRecords.map((cdr) => {
                  const settledAnswer = settledIds[cdr.questionId];
                  const isRecorded = Boolean(settledAnswer);
                  return (
                    <div
                      key={cdr.id}
                      className={`rounded-xl border p-4 text-xs ${
                        isRecorded
                          ? 'border-[#30d158]/40 bg-[#30d158]/[0.07]'
                          : 'border-white/10 bg-black/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-bold text-white">
                          {cdr.code} · {cdr.title}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isRecorded
                              ? 'bg-[#30d158]/20 text-[#30d158]'
                              : 'bg-white/10 text-[#a1a1a6]'
                          }`}
                        >
                          {isRecorded ? 'Recorded from answer' : `Round ${cdr.roundNumber} draft`}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[#a1a1a6]">
                        <strong className="text-[#d2d2d7]">Docs cited:</strong>{' '}
                        {cdr.sourceDocsCited}
                      </p>
                      <p className="mt-1.5 leading-relaxed text-[#f5f5f7]">
                        <strong className="text-[#2997ff]">Decision:</strong>{' '}
                        {settledAnswer || cdr.defaultDecisionSummary}
                      </p>
                      <p className="mt-1.5 leading-relaxed text-[#d2d2d7]">
                        <strong className="text-white">Trade-off:</strong>{' '}
                        {cdr.tradeOffDefended}
                      </p>
                      <p className="mt-1.5 leading-relaxed text-[#a1a1a6]">
                        <strong className="text-[#30d158]">Guardrail:</strong>{' '}
                        {cdr.rollbackThreshold}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {plan.grillWithDocs.domainGlossary.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-white">
                        {item.term}
                      </span>
                      <span className="rounded-full border border-[#2997ff]/30 bg-[#0071e3]/15 px-2 py-0.5 text-[11px] font-semibold text-[#2997ff]">
                        {item.categoryBadge}
                      </span>
                    </div>
                    <p className="mt-2 leading-relaxed text-[#d2d2d7]">
                      <strong className="text-white">Panel lens:</strong>{' '}
                      {item.panelMeaning}
                    </p>
                    <p className="mt-1.5 leading-relaxed text-[#a1a1a6]">
                      <strong className="text-[#30d158]">Your proof:</strong>{' '}
                      {item.yourGroundedProof}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showPricingModal && (
        <TierPricingSection
          mode="modal"
          onCloseModal={() => setShowPricingModal(false)}
        />
      )}
    </section>
  );
};
