'use client';

import { Badge } from '@pumni/ui/feedback';

interface TierBadgeProps {
  tier: string;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const getBadgeConfig = () => {
    switch (tier) {
      case 'max':
        return { tone: 'primary' as const, text: 'Max Premium', pulse: true };
      case 'pro':
        return { tone: 'info' as const, text: 'Pro Member', pulse: false };
      default:
        return { tone: 'neutral' as const, text: 'Free Tier', pulse: false };
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge tone={config.tone} pulse={config.pulse} className="font-semibold uppercase tracking-wider">
      {config.text}
    </Badge>
  );
}
