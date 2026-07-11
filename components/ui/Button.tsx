'use client';
import React from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'outline' | 'tinted' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type AccentColor = 'accent' | 'yellow' | 'red' | 'green';

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: AccentColor;
  shimmer?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface LinkButtonProps extends BaseProps {
  href: string;
  onClick?: (e: React.MouseEvent) => void;
}

interface ClickButtonProps extends BaseProps {
  href?: undefined;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

type ButtonProps = LinkButtonProps | ClickButtonProps;

const COLOR_MAP: Record<AccentColor, { solid: string; dim: string; border: string; text: string }> = {
  accent: { solid: 'var(--accent)', dim: 'var(--accent-dim)',  border: 'rgba(59,130,246,0.25)',  text: 'var(--accent)' },
  yellow: { solid: 'var(--yellow)', dim: 'var(--yellow-dim)',  border: 'rgba(234,179,8,0.25)',   text: 'var(--yellow)' },
  red:    { solid: 'var(--red)',    dim: 'var(--red-dim)',     border: 'rgba(239,68,68,0.25)',   text: 'var(--red)' },
  green:  { solid: 'var(--green)',  dim: 'var(--green-dim)',   border: 'rgba(34,197,94,0.25)',   text: 'var(--green)' },
};

const SIZE_MAP: Record<ButtonSize, { padding: string; fontSize: string }> = {
  sm: { padding: '0.45rem 1rem',    fontSize: '0.82rem' },
  md: { padding: '0.65rem 1.5rem',  fontSize: '0.88rem' },
  lg: { padding: '0.8rem 2.25rem',  fontSize: '0.9rem' },
};

function getVariantStyle(variant: ButtonVariant, c: ReturnType<typeof getColor>): React.CSSProperties {
  switch (variant) {
    case 'primary':
      return { background: c.solid, color: '#fff', border: 'none', fontWeight: 700 };
    case 'outline':
      return { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border3)', fontWeight: 500 };
    case 'tinted':
      return { background: c.dim, color: c.text, border: `1px solid ${c.border}`, fontWeight: 500 };
    case 'ghost':
      return { background: 'transparent', color: c.text, border: 'none', fontWeight: 500 };
  }
}

function getColor(color: AccentColor) {
  return COLOR_MAP[color];
}

/**
 * Shared Button — covers Link-rendered (href) and native <button> (onClick) cases.
 * Uses design tokens from globals.css (--radius-sm, --space-*).
 *
 * Variants: primary (solid CTA) · outline (bordered, neutral) · tinted (soft color bg) · ghost (text-only)
 * Pass `shimmer` for the glass-shine hover effect already used on primary CTAs site-wide.
 */
export default function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    color = 'accent',
    shimmer = false,
    fullWidth = false,
    disabled = false,
    children,
    className = '',
    style = {},
  } = props;

  const c = getColor(color);
  const sizeStyle = SIZE_MAP[size];
  const variantStyle = getVariantStyle(variant, c);

  const combinedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    borderRadius: 'var(--radius-sm)',
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    position: shimmer ? 'relative' : undefined,
    overflow: shimmer ? 'hidden' : undefined,
    transition: 'all 0.15s ease',
    ...sizeStyle,
    ...variantStyle,
    ...style,
  };

  const combinedClassName = `${shimmer ? 'shimmer-btn' : ''} ${className}`.trim();

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} onClick={props.onClick} className={combinedClassName || undefined} style={combinedStyle}>
        {children}
      </Link>
    );
  }

  const { onClick, type = 'button' } = props as ClickButtonProps;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName || undefined}
      style={combinedStyle}
    >
      {children}
    </button>
  );
}
