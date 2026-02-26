'use client';
import { useEffect, useRef, useState } from 'react';
import {
  MotionValue,
  motion,
  useSpring,
  useTransform,
  motionValue,
} from 'motion/react';

const TRANSITION = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 18,
  mass: 0.3,
};

function Number({ mv, number, height }: { mv: MotionValue<number>; number: number; height: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;
    let memo = offset * height;
    if (offset > 5) {
      memo -= 10 * height;
    }
    return memo;
  });

  return (
    <motion.span
      style={{ y }}
      className='absolute inset-0 flex items-center justify-center'
    >
      {number}
    </motion.span>
  );
}

function Digit({ value, place }: { value: number; place: number }) {
  const valueRoundedToPlace = Math.floor(value / place) % 10;
  const initial = motionValue(valueRoundedToPlace);
  const animatedValue = useSpring(initial, TRANSITION);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  useEffect(() => {
    if (placeholderRef.current) {
      setHeight(placeholderRef.current.getBoundingClientRect().height);
    }
  }, []);

  return (
    <div
      className='relative inline-block w-[1ch] overflow-hidden tabular-nums'
      style={{ height: height || undefined }}
    >
      <div ref={placeholderRef} className='invisible leading-none'>0</div>
      {height > 0 && Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  );
}

type SlidingNumberProps = {
  value: number;
  padStart?: boolean;
  decimalSeparator?: string;
};

export function SlidingNumber({
  value,
  padStart = false,
  decimalSeparator = '.',
}: SlidingNumberProps) {
  const absValue = Math.abs(value);

  // Format to always show 2 decimal places
  const formatted = absValue.toFixed(2);
  const [integerPart, decimalPart] = formatted.split('.');

  const integerValue = parseInt(integerPart, 10);
  const paddedInteger =
    padStart && integerValue < 10 ? `0${integerPart}` : integerPart;
  const integerDigits = paddedInteger.split('');
  const integerPlaces = integerDigits.map((_, i) =>
    Math.pow(10, integerDigits.length - i - 1)
  );

  return (
    <div className='flex items-center'>
      {value < 0 && '-'}
      {integerDigits.map((_, index) => {
        const positionFromRight = integerDigits.length - index - 1;
        const shouldAddComma = index > 0 && (positionFromRight + 1) % 3 === 0;

        return (
          <span key={`pos-${integerPlaces[index]}`} className='flex items-center'>
            {shouldAddComma && <span>,</span>}
            <Digit
              value={integerValue}
              place={integerPlaces[index]}
            />
          </span>
        );
      })}
      <span>{decimalSeparator}</span>
      {decimalPart.split('').map((_, index) => (
        <Digit
          key={`decimal-${index}`}
          value={parseInt(decimalPart, 10)}
          place={Math.pow(10, decimalPart.length - index - 1)}
        />
      ))}
    </div>
  );
}
