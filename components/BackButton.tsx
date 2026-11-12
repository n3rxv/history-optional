'use client';
import Link from '@/components/Link';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Where Back goes. Omit and pass onClick for browser history or an in-page step. */
  href?: string;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
};

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5" /><path d="M11 18l-6-6 6-6" />
  </svg>
);

/**
 * The one way back out of a page, styled as a real button rather than a line
 * of blue text with an arrow in front of it.
 */
export default function BackButton({ children, href, onClick, size = 'md', className = '' }: Props) {
  const cls = `back-btn${size === 'sm' ? ' back-btn-sm' : ''}${className ? ` ${className}` : ''}`;
  if (href) {
    return <Link href={href} onClick={onClick} className={cls}><Arrow />{children}</Link>;
  }
  return <button type="button" onClick={onClick} className={cls}><Arrow />{children}</button>;
}
