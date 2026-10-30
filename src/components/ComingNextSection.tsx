import React from 'react';
import { Clock, Flame, Mic, Briefcase, PoundSterling, FileStack, X } from 'lucide-react';

interface ComingNextSectionProps {
  mode?: 'section' | 'modal';
  onCloseModal?: () => void;
}

// A short, honest roadmap: what is live today, and the four things we plan to
// build next. No tiers or prices until those features exist.
const COMING_NEXT = [
  {
    Icon: Mic,
    title: 'Spoken AI interviewer',
    text: 'Answer out loud to a male or female AI voice that asks follow-ups in real time.',
  },
  {
    Icon: Briefcase,
    title: 'Specialist and executive question sets',
    text: 'Question sets for specialist roles and for director, VP and C-suite interviews.',
  },
  {
    Icon: FileStack,
    title: 'Grill With Docs',
    text: 'Add case studies, reports and company links so follow-ups use your own material.',
  },
  {
    Icon: PoundSterling,
    title: 'Salary negotiation scripts',
    text: 'A word-for-word script for the pay conversation, built from your strongest answers.',
  },
];

export const ComingNextSection: React.FC<ComingNextSectionProps> = ({
  mode = 'section',
  onCloseModal,
}) => {
  const content = (
    <div className="mx-auto max-w-[1080px]" data-ui="coming-next">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0284c7]/25 bg-[#0284c7]/10 px-3 py-1 text-xs font-semibold text-[#0369a1]">
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          Roadmap
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
          What’s coming next
        </h2>
        <p className="mt-3 text-base text-[#6e6e73] sm:text-lg">
          Everything in RoleReady today is free to try, including Grill Me
          follow-ups and spoken answers. Here is what we are building next.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COMING_NEXT.map(({ Icon, title, text }) => (
          <div
            key={title}
            className="flex flex-col rounded-[22px] border border-black/[0.06] bg-white p-5"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0284c7]/10 text-[#0369a1]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-display text-base font-bold text-[#0f172a]">
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6e6e73]">
              {text}
            </p>
            <span className="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 text-xs font-semibold text-[#b45309]">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (mode === 'modal') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="RoleReady roadmap"
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
        onClick={onCloseModal}
      >
        <div
          className="relative max-h-[92vh] w-full max-w-[1120px] overflow-y-auto rounded-[30px] bg-[#f1f5f9] p-6 sm:p-10"
          onClick={(e) => e.stopPropagation()}
        >
          {onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              aria-label="Close roadmap"
              className="sticky top-2 z-20 ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#0f172a] hover:bg-black/5"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          {content}
        </div>
      </div>
    );
  }

  return content;
};
