import React from 'react';
import {
  CheckCircle2,
  Lock,
  Sparkles,
  Flame,
  TrendingUp,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  TIER_FRAMEWORKS,
  useSubscriptionTier,
  type TierFrameworkId,
  type TierLevel,
} from '../lib/tiers';

interface TierPricingSectionProps {
  mode?: 'section' | 'modal';
  onCloseModal?: () => void;
  onTierSelected?: (level: TierLevel) => void;
}

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
  onTierSelected,
}) => {
  const { tier, setTier, framework, setFramework, activeFramework } =
    useSubscriptionTier();

  const handleSelectTier = (level: TierLevel) => {
    setTier(level);
    if (onTierSelected) {
      onTierSelected(level);
    }
    if (mode === 'modal' && onCloseModal) {
      onCloseModal();
    }
  };

  const content = (
    <div className="mx-auto max-w-[1080px]" data-ui="tier-pricing">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0071e3]/25 bg-[#0071e3]/10 px-3.5 py-1 text-xs font-semibold text-[#0071e3]">
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Grill Me Deep-Dive Questioning &amp; Tier Plans</span>
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-[#1d1d1f] sm:text-4xl">
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
                    ? 'bg-[#1d1d1f] text-white'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                {fw.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tagline Banner directly below the buttons */}
        <div className="mx-auto mt-3 max-w-2xl rounded-xl border border-[#0071e3]/20 bg-[#0071e3]/[0.06] px-4 py-2 text-xs font-semibold text-[#0071e3] sm:text-sm">
          {activeFramework.tagline}
        </div>
      </div>

      {/* Dynamic 4-Pillar Context Box (changes when switching between Outcome, Ambition, Competitive, Niche, and C-Suite) */}
      <div className="mt-8 grid gap-4 rounded-[24px] border border-black/10 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
        {activeFramework.pillars.map((pillar, idx) => (
          <div
            key={`${activeFramework.id}-pillar-${idx}`}
            className="flex flex-col justify-between rounded-2xl bg-[#f5f5f7] p-4"
          >
            <div>
              <span className="inline-block rounded-full border border-[#0071e3]/25 bg-[#0071e3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0071e3]">
                {pillar.categoryTag}
              </span>
              <p className="mt-2.5 font-display text-sm font-bold text-[#1d1d1f]">
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
          const isCurrent = tier === item.level;
          const isTier1 = item.level === 'tier1';
          const isTier2 = item.level === 'tier2';
          const isTier3 = item.level === 'tier3';

          return (
            <div
              key={`${activeFramework.id}-${item.level}`}
              className={`relative flex flex-col justify-between rounded-[26px] p-6 transition-colors sm:p-7 ${
                isTier3
                  ? 'border-2 border-[#0071e3] bg-[#161617] text-[#f5f5f7]'
                  : isTier2
                    ? 'border border-black/15 bg-white text-[#1d1d1f]'
                    : 'border border-black/10 bg-[#f5f5f7]/80 text-[#6e6e73] opacity-90'
              }`}
            >
              {/* Highlight Badge on Tier 3 or Decoy Bridge tag on Tier 2 */}
              {item.highlightBadge && (
                <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#0071e3] px-3.5 py-1 text-xs font-semibold text-white">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{item.highlightBadge}</span>
                </div>
              )}
              {isTier2 && (
                <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-black/[0.06] px-3 py-1 text-xs font-semibold text-[#1d1d1f]">
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
                          ? 'text-[#1d1d1f]'
                          : 'text-[#1d1d1f]/80'
                    }`}
                  >
                    {item.name}
                  </h3>
                  {isCurrent && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isTier3
                          ? 'bg-[#30d158]/20 text-[#30d158]'
                          : 'bg-[#0071e3]/15 text-[#0071e3]'
                      }`}
                    >
                      Active plan
                    </span>
                  )}
                </div>

                <p
                  className={`mt-1.5 text-xs leading-relaxed ${
                    isTier3 ? 'text-[#d2d2d7]' : 'text-[#6e6e73]'
                  }`}
                >
                  {item.subtitle}
                </p>

                {/* Price Block */}
                <div className="mt-5 flex items-baseline gap-2 border-b border-current/10 pb-5">
                  <span
                    className={`font-display text-4xl font-bold tabular-nums ${
                      isTier3
                        ? 'text-white'
                        : isTier2
                          ? 'text-[#1d1d1f]'
                          : 'text-[#6e6e73]'
                    }`}
                  >
                    {item.priceMonthly}
                  </span>
                  <span
                    className={`text-xs ${
                      isTier3 ? 'text-[#30d158]' : 'text-[#86868b]'
                    }`}
                  >
                    {item.billingNote}
                  </span>
                </div>

                {/* Psychological Nudge Box */}
                <div
                  className={`mt-4 rounded-2xl p-3.5 text-xs leading-relaxed ${
                    isTier3
                      ? 'border border-[#30d158]/30 bg-[#30d158]/10 text-[#f5f5f7]'
                      : isTier2
                        ? 'border border-[#ff9f0a]/30 bg-[#fffbeb] text-[#92400e]'
                        : 'border border-black/10 bg-black/[0.03] text-[#6e6e73]'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isTier3 ? (
                      <TrendingUp
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#30d158]"
                        aria-hidden="true"
                      />
                    ) : (
                      <ShieldAlert
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]"
                        aria-hidden="true"
                      />
                    )}
                    <span>{item.psychologicalNudge}</span>
                  </div>
                </div>

                {/* Feature Checklist */}
                <ul className="mt-5 space-y-2.5 text-xs sm:text-sm">
                  {item.features.map((feat, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 ${
                        feat.included
                          ? isTier3
                            ? 'text-[#f5f5f7]'
                            : 'text-[#1d1d1f]'
                          : isTier3
                            ? 'text-[#86868b] line-through'
                            : 'text-[#86868b]'
                      }`}
                    >
                      {feat.included ? (
                        <CheckCircle2
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            feat.highlight
                              ? 'text-[#30d158]'
                              : isTier3
                                ? 'text-[#2997ff]'
                                : 'text-[#0071e3]'
                          }`}
                          aria-hidden="true"
                        />
                      ) : (
                        <Lock
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#86868b]/60"
                          aria-hidden="true"
                        />
                      )}
                      <span className={feat.highlight ? 'font-semibold' : ''}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ROI Anchor + Action Button */}
              <div className="mt-6 pt-4">
                {item.roiAnchor && (
                  <div className="mb-4 rounded-2xl border border-[#0071e3]/35 bg-[#0071e3]/15 p-3 text-xs text-[#f5f5f7]">
                    <span className="font-semibold text-[#2997ff]">
                      ROI Anchor:
                    </span>{' '}
                    {item.roiAnchor}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleSelectTier(item.level)}
                  className={`min-h-[46px] w-full rounded-full px-5 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                    isTier3
                      ? 'btn-pill-primary'
                      : isTier2
                        ? 'btn-pill-secondary-light'
                        : 'border border-black/15 bg-transparent text-[#6e6e73] hover:bg-black/[0.05] hover:text-[#1d1d1f]'
                  }`}
                >
                  {isCurrent ? `Active: ${item.name}` : item.ctaLabel}
                </button>
              </div>
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
        aria-label="Upgrade subscription tier"
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      >
        <div className="relative max-h-[92vh] w-full max-w-[1120px] overflow-y-auto rounded-[30px] bg-[#f5f5f7] p-6 sm:p-10">
          {onCloseModal && (
            <button
              type="button"
              onClick={onCloseModal}
              aria-label="Close tier comparison modal"
              className=" sticky top-2 z-20 ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#1d1d1f] hover:bg-black/5"
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
