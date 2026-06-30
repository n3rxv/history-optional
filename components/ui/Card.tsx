import React from 'react';

type CardTone = 'neutral' | 'blue' | 'gold' | 'red' | 'green';

interface CardProps {
  tone?: CardTone;
  padding?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const PADDING_MAP = {
  sm: '1rem',
  md: '1.5rem',
  lg: '1.75rem 2rem',
};

const TONE_CLASS_MAP: Record<CardTone, string> = {
  neutral: 'g-card',
  blue: 'g-card g-card-blue',
  gold: 'g-card g-card-gold',
  red: 'g-card g-card-red',
  green: 'g-card g-card-green',
};

/**
 * Shared Card — thin TSX wrapper around the existing .g-card gradient/glow CSS
 * system in globals.css. Use this instead of re-declaring border/background/
 * radius inline. Tone controls the gradient + hover glow color.
 */
export default function Card({
  tone = 'neutral',
  padding = 'md',
  children,
  className = '',
  style = {},
  onClick,
}: CardProps) {
  const combinedClassName = `${TONE_CLASS_MAP[tone]} ${className}`.trim();

  return (
    <div
      className={combinedClassName}
      style={{ padding: PADDING_MAP[padding], cursor: onClick ? 'pointer' : undefined, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
