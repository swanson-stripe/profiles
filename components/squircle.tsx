'use client';

import React, { useRef, useState, useEffect, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { getSvgPath } from 'figma-squircle';

type SquircleProps = React.HTMLAttributes<HTMLDivElement> & {
  cornerRadius?: number;
  cornerSmoothing?: number;
  children?: ReactNode;
};

export function useSquircle(
  cornerRadius = 24,
  cornerSmoothing = 1,
): { ref: RefObject<HTMLDivElement>; clipPath: string } {
  const ref = useRef<HTMLDivElement>(null);
  const [clipPath, setClipPath] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width === 0 || height === 0) return;
      const path = getSvgPath({ width, height, cornerRadius, cornerSmoothing });
      setClipPath(`path('${path}')`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cornerRadius, cornerSmoothing]);

  return { ref, clipPath };
}

export function Squircle({
  cornerRadius = 24,
  cornerSmoothing = 1,
  className,
  style,
  children,
  ...rest
}: SquircleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [clipPath, setClipPath] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      // Use offsetWidth/offsetHeight (layout size) rather than getBoundingClientRect
      // because getBoundingClientRect includes CSS transforms applied by Framer Motion
      // layout animations, which would compute the squircle path at the wrong dimensions
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width === 0 || height === 0) return;
      const path = getSvgPath({ width, height, cornerRadius, cornerSmoothing });
      setClipPath(`path('${path}')`);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [cornerRadius, cornerSmoothing]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, clipPath: clipPath || undefined }}
      {...rest}
    >
      {children}
    </div>
  );
}
