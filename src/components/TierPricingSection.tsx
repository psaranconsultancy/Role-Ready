import React from 'react';
import { CheckCircle2, Clock, Flame, X } from 'lucide-react';
import {
  TIER_FRAMEWORKS,
  useSubscriptionTier,
  type TierFrameworkId,
} from '../lib/tiers';

interface TierPricingSectionProps {
  mode?: 'section' | 'modal';
  onCloseModal?: () => void;
}

// Plans are shown as a roadmap: no prices and nothing to buy yet. Features that
// are not built (Grill Me voice, Heat Dial, Niche & C-Suite, salary scripts)
// are tagged "Coming soon"; Tier 3 is the bundle of those features.
const ROADMAP_FEATURE = /grill me|heat dial|voice|niche|c-suite|salary|negotiat/i;

const FRAMEWORK_ORDER: TierFrameworkId[] = [
  'outcome',
  'ambition',
  'competitive',
  'niche',
  'csuite',
];

export const TierPricingSection: React.FC<TierPricingSectionProps> = ({
  mode = 'section',
  onCloseModal,
}) => {
  const { framework, setFramework, activeFramework } = useSubscriptionTier();

  const content = (
    <div className="mx-auto max-w-[1080px]" data-ui="tier-pricing">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0284c7]/25 bg-[#0284c7]/10 px-3.5 py-1 text-xs font-semibold text-[#0369a1]">
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Roadmap · Coming soon</span>
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-[#0f172a] sm:text-4xl">
          {activeFramework.headline}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#6e6e73] sm:text-base">
          {activeFramework.subheadline}
        </p>

        {/* 5 Framing & Category Switcher Pills (Outcome, Ambition, Competitive, Niche, C-Suite) */}
        <div
          role="tablist"
          aria-label="Select interview preparation category and tier framing"
          className="mt-6 inline-flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-black/10 bg-white p-1.5"
        >
          {FRAMEWORK_ORDER.map((fwId) => {
            const fw = TIER_FRAMEWORKS[fwId];
            const active = framework === fwId;
            return (
              <button
                key={fwId}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFramework(fwId)}
                className={`min-h-[36px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#0f172a] text-white'
                    : 'text-[#6e6e73] hover:text-[#0f172a]'
                }`}
              >
                {fw.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tagline Banner directly below the buttons */}
        <div className="mx-auto mt-3 max-w-2xl rounded-xl border border-[#0284c7]/20 bg-[#0284c7]/[0.06] px-4 py-2 text-xs font-semibold text-[#0369a1] sm:text-sm">
          {activeFramework.tagline}
        </div>
      </div>

      {/* Dynamic 4-Pillar Context Box (changes when switching between Outcome, Ambition, Competitive, Niche, and C-Suite) */}
      <div className="mt-8 grid gap-4 rounded-[24px] border border-black/10 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        {activeFramework.pillars.map((pillar, idx) => (
          <div
            key={`${activeFramework.id}-pillar-${idx}`}
            className="flex flex-col justify-between rounded-2xl bg-[#f1f5f9] p-4"
          >
            <div>
              <span className="inline-block rounded-full border border-[#0284c7]/25 bg-[#0284c7]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0369a1]">
                {pillar.categoryTag}
              </span>
              <p className="mt-2.5 font-display text-sm font-bold text-[#0f172a]">
                {pillar.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#6e6e73]">
                {pillar.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 3-Tier Cards Grid */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3 lg:items-stretch">
        {activeFramework.tiers.map((item) => {
          const isTier1 = item.level === 'tier1';
          const isTier2 = item.level === 'tier2';
          const isTier3 = item.level === 'tier3';

          return (
            <div
              key={`${activeFramework.id}-${item.level}`}
              className={`relative flex flex-col rounded-[26px] p-6 transition-colors sm:p-7 ${
                isTier3
                  ? 'border-2 border-[#0284c7] bg-[#0f172a] text-[#f8fafc]'
                  : isTier2
                    ? 'border border-black/15 bg-white text-[#0f172a]'
                    : 'border border-black/10 bg-[#f1f5f9]/80 text-[#6e6e73] opacity-90'
              }`}
            >
              {isTier3 && (
                <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#0284c7] px-3 py-1 text-xs font-semibold text-white">
                  <span>{item.badgeLabel}</span>
                </div>
              )}
              {isTier2 && (
                <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-black/[0.06] px-3 py-1 text-xs font-semibold text-[#0f172a]">
                  <span>{item.badgeLabel}</span>
                </div>
              )}
              {isTier1 && (
                <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-black/[0.05] px-3 py-1 text-xs font-medium text-[#6e6e73]">
                  <span>{item.badgeLabel}</span>
                </div>
              )}

              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <h3
                    className={`font-display text-2xl font-bold ${
                      isTier3
                        ? 'text-white'
                        : isTier2
                          ? 'text-[#0f172a]'
                          : 'text-[#0f172a]/80'
                    }`}
                  >
                    {item.name}
                  </h3>
                </div>

                <p
                  className={`mt-1.5 text-xs leading-relaxed ${
                    isTier3 ? 'text-[#d2d2d7]' : 'text-[#6e6e73]'
                  }`}
                >
                  {item.subtitle}
                </p>

                {/* Availability instead of a price */}
                <div className="mt-5 border-b border-current/10 pb-5">
                  {isTier3 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff9f0a]/40 bg-[#ff9f0a]/15 px-3 py-1 text-xs font-semibold text-[#ff9f0a]">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      Coming soon
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#14b8a6]/40 bg-[#14b8a6]/15 px-3 py-1 text-xs font-semibold text-[#0f766e]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Available in the demo
                    </span>
                  )}
                </div>

                {/* Feature Checklist */}
                <ul className="mt-5 space-y-2.5 text-xs sm:text-sm">
                  {item.features.map((feat, idx) => {
                    const comingSoon = ROADMAP_FEATURE.test(feat.text);
                    return (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 ${
                        feat.included
                          ? isTier3
                            ? 'text-[#f8fafc]'
                            : 'text-[#0f172a]'
                          : isTier3
                            ? 'text-[#86868b] line-through'
                            : 'text-[#86868b]'
                      }`}
                    >
                      {comingSoon ? (
                        <Clock
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#ff9f0a]"
                          aria-hidden="true"
                        />
                      ) : feat.included ? (
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            feat.highlight
                              ? 'text-[#14b8a6]'
                              : isTier3
                                ? 'text-[#38bdf8]'
                                : 'text-[#0369a1]'
                          }`}
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className="mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span className={feat.highlight ? 'font-semibold' : ''}>
                        {feat.text}
                        {comingSoon && (
                          <span className="ml-1.5 whitespace-nowrap text-xs font-semibold text-[#ff9f0a]">
                            · Coming soon
                          </span>
                        )}
                      </span>
                    </li>
                    );
                  })}
                </ul>
              </div>

              <p
                className={`mt-auto pt-6 text-center text-xs ${
                  isTier3 ? 'text-[#a1a1a6]' : 'text-[#86868b]'
                }`}
              >
                {isTier3
                  ? 'On the roadmap. Not available to buy yet.'
                  : 'Included in the free demo.'}
              </p>
            </div>
          );
        })}
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
      >
        <div className="relative max-h-[92vh] w-full max-w-[1120px] overflow-y-auto rounded-[30px] bg-[#f1f5f9] p-6 sm:p-10">
          {onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              aria-label="Close roadmap"
              className=" sticky top-2 z-20 ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#0f172a] hover:bg-black/5"
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
