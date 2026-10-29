import React, { useEffect, useRef } from 'react';

interface AmbientHeroCanvasProps {
  /** Optional background photograph to blend subtly beneath the ambient video & canvas */
  backdropImage?: string;
  /** Optional opacity override for the video layer */
  videoOpacity?: number;
}

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
}

export const AmbientHeroCanvas: React.FC<AmbientHeroCanvasProps> = ({
  backdropImage = '/assets/img/hero-boardroom.jpg',
  videoOpacity = 0.52,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let rafId: number | null = null;
    let isVisible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || container.clientWidth || window.innerWidth;
      height = canvas.clientHeight || container.clientHeight || 600;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const orbs: Orb[] = [
      { x: 0.28, y: 0.35, vx: 0.00028, vy: 0.0002, r: 0.46, color: 'rgba(0, 113, 227, 0.22)' },
      { x: 0.72, y: 0.58, vx: -0.00024, vy: 0.00028, r: 0.42, color: 'rgba(48, 209, 88, 0.14)' },
      { x: 0.5, y: 0.24, vx: 0.00018, vy: -0.00022, r: 0.52, color: 'rgba(20, 42, 78, 0.44)' },
    ];

    const renderFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);
      const maxDim = Math.max(width, height, 1);

      for (const orb of orbs) {
        if (animate) {
          orb.x += orb.vx;
          orb.y += orb.vy;
          if (orb.x < 0.1 || orb.x > 0.9) orb.vx *= -1;
          if (orb.y < 0.1 || orb.y > 0.9) orb.vy *= -1;
        }

        const cx = orb.x * width;
        const cy = orb.y * height;
        const radius = orb.r * maxDim;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      if (!isVisible) {
        rafId = null;
        return;
      }
      renderFrame(true);
      rafId = window.requestAnimationFrame(tick);
    };

    if (prefersReducedMotion) {
      renderFrame(false);
      if (video) {
        video.pause();
      }
    } else {
      tick();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (entry.isIntersecting && !prefersReducedMotion) {
            if (!rafId) {
              tick();
            }
            if (video && video.paused) {
              video.play().catch(() => {});
            }
          } else {
            if (rafId) {
              window.cancelAnimationFrame(rafId);
              rafId = null;
            }
            if (video && !video.paused) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(container);

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {backdropImage && (
        <img
          src={backdropImage}
          alt=""
          loading="eager"
          decoding="async"
          className="hero-backdrop-photo absolute inset-0 h-full w-full object-cover opacity-20"
        />
      )}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        style={{ opacity: videoOpacity }}
        className="hero-bg-video absolute inset-0 h-full w-full object-cover"
      >
        <source src="/assets/video/ambient-loop.mp4" type="video/mp4" />
      </video>
      <canvas
        ref={canvasRef}
        className="hero-canvas absolute inset-0 h-full w-full"
      />
      <div className="hero-vignette absolute inset-0" />
    </div>
  );
};

