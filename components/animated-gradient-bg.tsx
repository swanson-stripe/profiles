'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';

export type GradientVariant = 'drift' | 'pulse' | 'network';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const ARROW_PATH = 'M10 18V15L12 14L10 13V10L16 14L10 18Z';
const CELL = 40; // grid spacing in px
const EXIT_COLOR = '#533AFD';
const EXIT_OPACITIES = [1, 0.7, 0.4];

function PriorityBackground({ className, children, triggerExit }: { className?: string; children?: ReactNode; triggerExit?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const arrowRefs = useRef<HTMLDivElement[]>([]);
  const exitStarted = useRef(false); // prevent re-running when dims change mid-animation
  const [dims, setDims] = useState({ cols: 0, rows: 0 });

  // Rebuild grid dimensions when container resizes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      setDims({
        cols: Math.ceil(width / CELL) + 2,
        rows: Math.ceil(height / CELL) + 2,
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Direct DOM mutation for pointer tracking — no React re-renders on mousemove
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onEnter = () => {
      arrowRefs.current.forEach((el) => {
        if (el) el.style.transition = 'none';
      });
    };

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      arrowRefs.current.forEach((el) => {
        if (!el) return;
        const ax = parseFloat(el.dataset.ax!);
        const ay = parseFloat(el.dataset.ay!);
        const angle = Math.atan2(cy - ay, cx - ax) * (180 / Math.PI);
        el.style.transform = `rotate(${angle}deg)`;
      });
    };

    const onLeave = () => {
      arrowRefs.current.forEach((el) => {
        if (!el) return;
        el.style.transition = 'transform 0.7s ease-out';
        el.style.transform = 'rotate(0deg)';
      });
    };

    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);
    return () => {
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Animate arrows out when triggerExit becomes true; reset when it returns to false
  useEffect(() => {
    if (!triggerExit) {
      exitStarted.current = false;
      arrowRefs.current.forEach((el) => {
        if (!el) return;
        el.style.animation = '';
        el.style.transform = '';
        const path = el.querySelector('path') as SVGPathElement | null;
        if (path) {
          // Cancel any in-progress WAAPI fill animation and restore defaults
          path.getAnimations().forEach((a) => a.cancel());
        }
      });
      return;
    }

    // Don't restart if dims change mid-animation (ResizeObserver can re-trigger this effect)
    if (exitStarted.current) return;
    exitStarted.current = true;

    const cols = dims.cols || 1;
    arrowRefs.current.forEach((el, i) => {
      if (!el) return;
      const col = i % cols;
      // 500 ms global hold, then columns sweep left-to-right over ~2.5 s
      const baseDelay = 500 + col * 90;
      const jitter = (Math.random() - 0.5) * 300; // ±150 ms per-arrow randomness
      const delayMs = Math.max(250, baseDelay + jitter);
      // Each arrow slides out over 1.2 – 1.9 s for a slow, drifting feel
      const durationS = 1.2 + Math.random() * 0.7;

      el.style.transition = 'none';
      el.style.transform = ''; // clear inline rotation so animation owns transform
      el.style.animation = `arrow-exit ${durationS.toFixed(2)}s linear ${delayMs.toFixed(0)}ms forwards`;

      // Use the Web Animations API to tint the path fill — WAAPI drives SVG fill directly
      // without going through the CSS stylesheet cascade, which is unreliable for SVG fill.
      const targetOpacity = EXIT_OPACITIES[Math.floor(Math.random() * EXIT_OPACITIES.length)];
      const path = el.querySelector('path') as SVGPathElement | null;
      if (path) {
        path.animate(
          [{ fill: '#3C4F69', opacity: 0.1 }, { fill: EXIT_COLOR, opacity: targetOpacity }],
          { duration: 700, delay: 0, easing: 'ease', fill: 'forwards' }
        );
      }
    });
  }, [triggerExit, dims.cols]);

  const arrows: { key: string; x: number; y: number }[] = [];
  for (let row = 0; row < dims.rows; row++) {
    for (let col = 0; col < dims.cols; col++) {
      arrows.push({ key: `${row}-${col}`, x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 });
    }
  }
  // Reset refs array to match current grid size
  arrowRefs.current = new Array(arrows.length);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: '#ffffff', background: 'linear-gradient(180deg, rgba(216,222,228,0.08) 0%, rgba(216,222,228,0.16) 100%)' }}
    >
      {/* Arrow tile grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {arrows.map(({ key, x, y }, i) => (
          <div
            key={key}
            ref={(el) => { if (el) arrowRefs.current[i] = el; }}
            data-ax={x}
            data-ay={y}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 0,
              height: 0,
              willChange: 'transform',
            }}
          >
            <svg
              width="26"
              height="28"
              viewBox="0 0 26 28"
              fill="none"
              style={{ display: 'block', transform: 'translate(-13px, -14px)' }}
            >
              <path opacity="0.1" d={ARROW_PATH} fill="#3C4F69" />
            </svg>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

type Props = {
  color1: string;
  color2: string;
  variant: GradientVariant;
  className?: string;
  children?: ReactNode;
  triggerExit?: boolean;
};

export function AnimatedGradientBg({ color1, color2, variant, className = '', children, triggerExit }: Props) {
  const c1 = hexToRgba(color1, 1);
  const c2 = hexToRgba(color2, 1);
  const c1Soft = hexToRgba(color1, 0.7);
  const c2Soft = hexToRgba(color2, 0.7);

  if (variant === 'network') {
    return <PriorityBackground className={className} triggerExit={triggerExit}>{children}</PriorityBackground>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Subtle base wash */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${hexToRgba(color1, 0.5)} 0%, ${hexToRgba(color2, 0.5)} 100%)`,
          pointerEvents: 'none',
        }}
      />

      {variant === 'drift' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Blob 1 — color1, starts top-left */}
          <motion.div
            style={{
              position: 'absolute',
              width: '70%',
              height: '70%',
              top: '0%',
              left: '0%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${c1} 0%, transparent 70%)`,
              filter: 'blur(50px)',
            }}
            animate={{
              x: ['0%', '38%', '22%', '-12%', '0%'],
              y: ['0%', '-12%', '42%', '18%', '0%'],
            }}
            transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Blob 2 — color2, starts bottom-right */}
          <motion.div
            style={{
              position: 'absolute',
              width: '65%',
              height: '65%',
              bottom: '0%',
              right: '0%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${c2} 0%, transparent 70%)`,
              filter: 'blur(50px)',
            }}
            animate={{
              x: ['0%', '-32%', '-18%', '22%', '0%'],
              y: ['0%', '18%', '-35%', '-12%', '0%'],
            }}
            transition={{ duration: 33, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Blob 3 — color1 soft, center roamer */}
          <motion.div
            style={{
              position: 'absolute',
              width: '50%',
              height: '50%',
              top: '25%',
              left: '25%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${c1Soft} 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
            animate={{
              x: ['0%', '22%', '-28%', '12%', '0%'],
              y: ['0%', '-32%', '12%', '28%', '0%'],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {variant === 'pulse' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Blob 1 — color1, top-left, breathes out */}
          <motion.div
            style={{
              position: 'absolute',
              width: '85%',
              height: '85%',
              top: '-18%',
              left: '-18%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${c1} 0%, transparent 70%)`,
              filter: 'blur(50px)',
              transformOrigin: 'center center',
            }}
            animate={{
              scale: [1, 1.38, 1],
              opacity: [0.8, 0.38, 0.8],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Blob 2 — color2, bottom-right, breathes in (opposite phase) */}
          <motion.div
            style={{
              position: 'absolute',
              width: '85%',
              height: '85%',
              bottom: '-18%',
              right: '-18%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${c2} 0%, transparent 70%)`,
              filter: 'blur(50px)',
              transformOrigin: 'center center',
            }}
            animate={{
              scale: [1.38, 1, 1.38],
              opacity: [0.38, 0.8, 0.38],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {children}
    </div>
  );
}

type GradientControlProps = {
  variant: GradientVariant;
  onChange: (v: GradientVariant) => void;
};

export function GradientControl({ variant, onChange }: GradientControlProps) {
  const options: GradientVariant[] = ['drift', 'pulse'];
  return (
    <div className="flex rounded-lg p-1 gap-0.5" style={{ backgroundColor: '#F0F2F4' }}>
      {options.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all capitalize ${
            variant === v
              ? 'bg-white text-gray-900 shadow-sm'
              : 'hover:bg-white/60'
          }`}
          style={{ color: variant === v ? '#21252C' : '#596171' }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
