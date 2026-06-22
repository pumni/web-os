import type { ReactNode } from 'react';

import { cn } from '@pumni/ui/lib/cn';

type PageSectionProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export function PageSection({ id, children, className }: PageSectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-32 space-y-10', className)}>
      {children}
    </section>
  );
}
