'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';

export type GradientVariant = 'drift' | 'pulse';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Props = {
  color1: string;
  color2: string;
  variant: GradientVariant;
  className?: string;
  children?: ReactNode;
};

export function AnimatedGradientBg({ color1, color2, variant, className = '', children }: Props) {
  const c1 = hexToRgba(color1, 1);
  const c2 = hexToRgba(color2, 1);
  const c1Soft = hexToRgba(color1, 0.7);
  const c2Soft = hexToRgba(color2, 0.7);

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
