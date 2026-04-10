import { useId } from 'react';

interface OrbitLogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export default function OrbitLogo({ variant = 'full', className }: OrbitLogoProps) {
  const uid = useId().replace(/:/g, '');
  const o1 = `${uid}o1`, o2 = `${uid}o2`, o3 = `${uid}o3`, gw = `${uid}gw`;

  const defs = (
    <defs>
      <linearGradient id={o1} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF3366" />
        <stop offset="100%" stopColor="#FF9933" />
      </linearGradient>
      <linearGradient id={o2} x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3366FF" />
        <stop offset="100%" stopColor="#33CCFF" />
      </linearGradient>
      <linearGradient id={o3} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#9933FF" />
        <stop offset="100%" stopColor="#FF33CC" />
      </linearGradient>
      <filter id={gw} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  const orbital = (
    <g transform="translate(20, 20)">
      <ellipse cx="60" cy="60" rx="55" ry="22" fill="none" stroke={`url(#${o1})`} strokeWidth="6" strokeLinecap="round" transform="rotate(30 60 60)" opacity="0.85" />
      <ellipse cx="60" cy="60" rx="55" ry="22" fill="none" stroke={`url(#${o2})`} strokeWidth="6" strokeLinecap="round" transform="rotate(-30 60 60)" opacity="0.85" />
      <ellipse cx="60" cy="60" rx="55" ry="22" fill="none" stroke={`url(#${o3})`} strokeWidth="6" strokeLinecap="round" transform="rotate(90 60 60)" opacity="0.85" />
      <circle cx="60" cy="60" r="16" fill="#0F172A" />
      <circle cx="5" cy="60" r="7" fill="#FF9933" filter={`url(#${gw})`} transform="rotate(30 60 60)" />
      <circle cx="115" cy="60" r="7" fill="#33CCFF" filter={`url(#${gw})`} transform="rotate(-30 60 60)" />
      <circle cx="5" cy="60" r="7" fill="#FF33CC" filter={`url(#${gw})`} transform="rotate(90 60 60)" />
    </g>
  );

  if (variant === 'icon') {
    return (
      <svg viewBox="10 10 140 145" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Orbit">
        {defs}
        {orbital}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 520 160" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Orbit">
      {defs}
      {orbital}
      <g transform="translate(160, 0)">
        <text x="0" y="98" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="82" letterSpacing="-0.04em" fill="currentColor">orbit</text>
        <text x="5" y="128" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="14" letterSpacing="0.25em" fill="#64748B">CONTENT OPS PLATFORM</text>
      </g>
    </svg>
  );
}
