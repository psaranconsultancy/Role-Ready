import React, { useEffect, useRef, useState } from 'react';

// One small tooltip for the whole site. Any element with a data-tip attribute
// shows its text on mouse hover or keyboard focus. Touch screens skip it, as a
// tap should just press the button. Tips never block clicks.

interface Tip {
  text: string;
  x: number;
  y: number;
  below: boolean;
}

const DELAY_MS = 350;

export const Tooltips: React.FC = () => {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef<number | null>(null);
  const current = useRef<Element | null>(null);

  useEffect(() => {
    const clear = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
      current.current = null;
      setTip(null);
    };
    const showFor = (el: Element, now = false) => {
      const text = el.getAttribute('data-tip');
      if (!text) return;
      current.current = el;
      if (timer.current) window.clearTimeout(timer.current);
      const place = () => {
        if (current.current !== el || !el.isConnected) return;
        const r = el.getBoundingClientRect();
        const below = r.top < 64;
        setTip({
          text,
          x: Math.min(Math.max(r.left + r.width / 2, 138), Math.max(138, window.innerWidth - 138)),
          y: below ? r.bottom + 8 : r.top - 8,
          below,
        });
      };
      if (now) place();
      else timer.current = window.setTimeout(place, DELAY_MS);
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const el = (e.target as Element | null)?.closest?.('[data-tip]');
      if (!el) {
        if (current.current) clear();
        return;
      }
      if (el !== current.current) showFor(el);
    };
    const onFocus = (e: FocusEvent) => {
      const el = (e.target as Element | null)?.closest?.('[data-tip]');
      if (el && (e.target as Element).matches(':focus-visible')) showFor(el, true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clear();
    };

    document.addEventListener('pointerover', onOver);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', clear);
    document.addEventListener('pointerdown', clear);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', clear, true);
    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', clear);
      document.removeEventListener('pointerdown', clear);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', clear, true);
    };
  }, []);

  if (!tip) return null;
  return (
    <div
      role="tooltip"
      data-ui="tooltip"
      className="pointer-events-none fixed z-[100] max-w-[260px] rounded-lg border border-white/20 bg-[#0f172a] px-2.5 py-1.5 text-xs font-medium leading-snug text-white shadow-lg"
      style={{
        left: tip.x,
        top: tip.y,
        transform: `translate(-50%, ${tip.below ? '0' : '-100%'})`,
      }}
    >
      {tip.text}
    </div>
  );
};
