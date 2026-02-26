'use client';
import { cn } from '@/lib/utils';
import {
  motion,
  Transition,
  useMotionValue,
  useAnimationFrame,
  useMotionTemplate,
} from 'motion/react';

export type GlowEffectProps = {
  className?: string;
  style?: React.CSSProperties;
  colors?: string[];
  mode?:
    | 'rotate'
    | 'pulse'
    | 'breathe'
    | 'colorShift'
    | 'flowHorizontal'
    | 'static';
  blur?:
    | number
    | 'softest'
    | 'soft'
    | 'medium'
    | 'strong'
    | 'stronger'
    | 'strongest'
    | 'none';
  transition?: Transition;
  scale?: number;
  duration?: number;
};

export function GlowEffect({
  className,
  style,
  colors = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F'],
  mode = 'rotate',
  blur = 'medium',
  transition,
  scale = 1,
  duration = 5,
}: GlowEffectProps) {
  const BASE_TRANSITION = {
    repeat: Infinity,
    duration: duration,
    ease: 'linear',
  };

  // Always call hooks unconditionally
  const angle = useMotionValue(0);

  useAnimationFrame((t) => {
    if (mode === 'rotate') {
      angle.set(((t / (duration * 1000)) * 360) % 360);
    }
  });

  const gradientColors = [...colors, colors[0]].join(', ');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rotateBackground = useMotionTemplate`conic-gradient(from ${angle}deg at 50% 50%, ${gradientColors as any})`;

  const animations = {
    pulse: {
      background: colors.map(
        (color) =>
          `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`
      ),
      scale: [1 * scale, 1.1 * scale, 1 * scale],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        ...(transition ?? { ...BASE_TRANSITION, repeatType: 'mirror' as const }),
      },
    },
    breathe: {
      background: colors.map(
        (color) =>
          `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`
      ),
      scale: [1 * scale, 1.05 * scale, 1 * scale],
      transition: {
        ...(transition ?? { ...BASE_TRANSITION, repeatType: 'mirror' as const }),
      },
    },
    colorShift: {
      background: colors.map((color, index) => {
        const nextColor = colors[(index + 1) % colors.length];
        return `conic-gradient(from 0deg at 50% 50%, ${color} 0%, ${nextColor} 50%, ${color} 100%)`;
      }),
      transition: {
        ...(transition ?? { ...BASE_TRANSITION, repeatType: 'mirror' as const }),
      },
    },
    flowHorizontal: {
      background: colors.map((color, index) => {
        const nextColor = colors[(index + 1) % colors.length];
        return `linear-gradient(to right, ${color}, ${nextColor})`;
      }),
      transition: {
        ...(transition ?? { ...BASE_TRANSITION, repeatType: 'mirror' as const }),
      },
    },
    static: {
      background: `linear-gradient(to right, ${colors.join(', ')})`,
    },
  };

  const getBlurClass = (blur: GlowEffectProps['blur']) => {
    if (typeof blur === 'number') {
      return `blur-[${blur}px]`;
    }
    const presets: Record<string, string> = {
      softest: 'blur-xs',
      soft: 'blur-sm',
      medium: 'blur-md',
      strong: 'blur-lg',
      stronger: 'blur-xl',
      strongest: 'blur-2xl',
      none: 'blur-none',
    };
    return presets[blur as string] ?? 'blur-md';
  };

  const sharedClassName = cn(
    'pointer-events-none absolute inset-0',
    getBlurClass(blur),
    className
  );

  if (mode === 'rotate') {
    return (
      <motion.div
        className={sharedClassName}
        style={{ background: rotateBackground, scale, ...style }}
      />
    );
  }

  return (
    <motion.div
      className={sharedClassName}
      style={{ scale, ...style }}
      animate={animations[mode as keyof typeof animations]}
    />
  );
}
