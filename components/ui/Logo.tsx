'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
  className?: string;
}

const sizes = {
  sm: { width: 100, height: 25 },
  md: { width: 140, height: 35 },
  lg: { width: 180, height: 45 },
};

export function Logo({ size = 'md', linkTo = '/', className = '' }: LogoProps) {
  const { width, height } = sizes[size];

  const logo = (
    <Image
      src="/amari-logo.svg"
      alt="Amari"
      width={width}
      height={height}
      className={`h-auto ${className}`}
      priority
    />
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="flex items-center">
        {logo}
      </Link>
    );
  }

  return logo;
}

// Inline SVG version for more control
export function LogoInline({
  size = 'md',
  linkTo = '/',
  className = ''
}: LogoProps) {
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.2 : 1;

  const logo = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 145 50"
      width={145 * scale}
      height={50 * scale}
      className={className}
    >
      <defs>
        <linearGradient id="butterflyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6"/>
          <stop offset="100%" stopColor="#EC4899"/>
        </linearGradient>
      </defs>

      {/* Full "Amari" text */}
      <text x="5" y="38" fontFamily="Georgia, serif" fontSize="36" fontWeight="600" fill="#2D3436">Amari</text>

      {/* White rectangle to cover the original dot */}
      <rect x="120" y="5" width="16" height="16" fill="#FAF8F5"/>

      {/* Butterfly as the dot on the "i" - bigger and pink */}
      <g transform="translate(113, -2) scale(1.4)">
        {/* Left wing */}
        <path d="M8 6 C4 2, 0 4, 2 8 C0 10, 2 14, 6 12 C7 11, 8 10, 8 9 Z" fill="url(#butterflyGrad)"/>
        {/* Right wing */}
        <path d="M10 6 C14 2, 18 4, 16 8 C18 10, 16 14, 12 12 C11 11, 10 10, 10 9 Z" fill="url(#butterflyGrad)"/>
        {/* Body */}
        <ellipse cx="9" cy="10" rx="1.2" ry="3.5" fill="#2D3436"/>
        {/* Antennae */}
        <path d="M8 6.5 C7 5, 6 4, 5 3" stroke="#2D3436" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
        <path d="M10 6.5 C11 5, 12 4, 13 3" stroke="#2D3436" strokeWidth="0.6" fill="none" strokeLinecap="round"/>
      </g>
    </svg>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="flex items-center">
        {logo}
      </Link>
    );
  }

  return logo;
}
