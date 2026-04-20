import { TrackId } from '@/lib/types';

type Props = { id: TrackId; className?: string };

export function TrackIcon({ id, className = 'w-5 h-5' }: Props) {
  const common = {
    viewBox: '0 0 24 24',
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (id) {
    case 'kick':
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="6" />
          <line x1="12" y1="3" x2="12" y2="8" />
          <circle cx="12" cy="3" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'snare':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="9" rx="7" ry="2.5" />
          <line x1="5" y1="9" x2="5" y2="15" />
          <line x1="19" y1="9" x2="19" y2="15" />
          <ellipse cx="12" cy="15" rx="7" ry="2.5" />
        </svg>
      );
    case 'closedHat':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="11" rx="9" ry="1.5" />
          <line x1="12" y1="13" x2="12" y2="20" />
        </svg>
      );
    case 'openHat':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="8" rx="9" ry="1.5" />
          <ellipse cx="12" cy="13" rx="9" ry="1.5" />
          <line x1="12" y1="15" x2="12" y2="20" />
        </svg>
      );
    case 'clap':
      return (
        <svg {...common}>
          <path d="M5 4 l1 7" />
          <path d="M9 3 l0.5 8" />
          <path d="M13 4 l0 7" />
          <path d="M17 6 l-0.5 5" />
          <path d="M3 11 h18 l-1 4 a8 3 0 0 1 -16 0 z" />
        </svg>
      );
    case 'cowbell':
      return (
        <svg {...common}>
          <path d="M8 4 l8 0 l2 14 l-12 0 z" />
          <line x1="10" y1="18" x2="14" y2="18" strokeWidth="2" />
        </svg>
      );
    case 'tom':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="7" rx="8" ry="2.5" />
          <path d="M4 7 l1.5 11 l13 0 l1.5 -11" />
          <line x1="5" y1="18" x2="7" y2="21" />
          <line x1="19" y1="18" x2="17" y2="21" />
        </svg>
      );
  }
}
