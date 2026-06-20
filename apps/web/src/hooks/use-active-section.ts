'use client';

import * as React from 'react';

export function useActiveSection(sectionIds: string[]) {
  const [activeId, setActiveId] = React.useState<string>(sectionIds[0] ?? '');

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );

    const elements = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    for (const el of elements) observer.observe(el!);

    return () => observer.disconnect();
  }, [sectionIds]);

  return activeId;
}
