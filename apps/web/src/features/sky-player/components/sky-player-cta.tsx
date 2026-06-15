import { Download, GitFork, ExternalLink } from 'lucide-react';

import { Button } from '@pumni/ui';

import { SKY_PLAYER_LINKS } from '../content';

type SkyPlayerCtaProps = {
  size?: 'default' | 'compact';
};

export function SkyPlayerCta({ size = 'default' }: SkyPlayerCtaProps) {
  const isCompact = size === 'compact';

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild className={isCompact ? 'rounded-full' : 'rounded-full px-6 py-5 font-semibold'}>
        <a href={SKY_PLAYER_LINKS.releases} target="_blank" rel="noopener noreferrer">
          <Download className="mr-2 h-4 w-4" />
          Download latest release
        </a>
      </Button>
      <Button
        asChild
        variant="outline"
        className={isCompact ? 'rounded-full' : 'rounded-full px-6 py-5 font-semibold'}
      >
        <a href={SKY_PLAYER_LINKS.repo} target="_blank" rel="noopener noreferrer">
          <GitFork className="mr-2 h-4 w-4" />
          View source on GitHub
        </a>
      </Button>
      <Button asChild variant="outline" className="rounded-full">
        <a href={SKY_PLAYER_LINKS.website} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          Project website
        </a>
      </Button>
    </div>
  );
}
