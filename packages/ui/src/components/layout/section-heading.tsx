import type { LucideIcon } from 'lucide-react';

import { cn } from '../../lib/cn';
import { IconBadge } from './icon-badge';

type SectionHeadingProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
};

function SectionHeading({ id, eyebrow, title, description, icon: Icon, className }: SectionHeadingProps) {
  return (
    <header id={id} className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        {Icon ? (
          <IconBadge size="sm" tone="primary-soft" radius="md" aria-hidden>
            <Icon />
          </IconBadge>
        ) : null}
        <span className="type-caption font-bold tracking-widest text-primary uppercase">
          {eyebrow}
        </span>
      </div>

      <h2 className="type-title text-balance text-foreground">{title}</h2>

      {description ? (
        <p className="max-w-2xl type-body text-pretty text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}

export { SectionHeading, type SectionHeadingProps };
