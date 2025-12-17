'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// Skip Link Component
// =============================================================================
// Allows keyboard users to skip repetitive navigation and jump to main content

export interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Becomes visible on focus
        'focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4',
        // Styling when visible
        'focus:px-4 focus:py-2 focus:rounded-lg',
        'focus:bg-amari-terracotta focus:text-white',
        'focus:outline-none focus:ring-2 focus:ring-amari-terracotta focus:ring-offset-2',
        'focus:font-medium focus:text-sm',
        className
      )}
    >
      {children}
    </a>
  );
}

// =============================================================================
// Skip Link Target
// =============================================================================
// Wrapper for main content that receives focus from skip link

export interface SkipLinkTargetProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  as?: 'main' | 'div' | 'section';
}

export function SkipLinkTarget({
  id = 'main-content',
  children,
  className,
  as: Component = 'main',
}: SkipLinkTargetProps) {
  return (
    <Component
      id={id}
      tabIndex={-1}
      className={cn('outline-none', className)}
    >
      {children}
    </Component>
  );
}

// =============================================================================
// Multiple Skip Links
// =============================================================================
// For pages with multiple sections to skip to

export interface SkipLinksProps {
  links: Array<{
    href: string;
    label: string;
  }>;
  className?: string;
}

export function SkipLinks({ links, className }: SkipLinksProps) {
  return (
    <div className={cn('sr-only focus-within:not-sr-only', className)}>
      <nav
        aria-label="Skip links"
        className="fixed top-0 left-0 z-[100] flex gap-2 p-4 bg-white shadow-lg rounded-br-lg"
      >
        {links.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className={cn(
              'px-4 py-2 rounded-lg',
              'bg-amari-terracotta text-white',
              'hover:bg-amari-terracotta/90',
              'focus:outline-none focus:ring-2 focus:ring-amari-terracotta focus:ring-offset-2',
              'font-medium text-sm'
            )}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}
