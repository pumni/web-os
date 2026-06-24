'use client';

import * as React from 'react';
import { Plus, Minus } from 'lucide-react';

import { AnimatePresence, motion, useReducedMotion } from '@pumni/ui/lib/motion-primitives';
import { cn } from '@pumni/ui/lib/cn';
import { Card, CardContent } from '@pumni/ui/layout';
import { recipes } from '@pumni/ui/lib/motion';

import { FAQ_ITEMS, type FaqItem as FaqItemType } from '../content';

// fallow-ignore-next-line complexity
function FaqCard({
  faq,
  idx,
  isOpen,
  shouldReduce,
  onToggle,
}: {
  faq: FaqItemType;
  idx: number;
  isOpen: boolean;
  shouldReduce: boolean | null;
  onToggle: (idx: number) => void;
}) {
  const cardClass = cn(
    'overflow-hidden gap-0 py-0 transition-colors duration-(--duration-base) ease-fluid',
    isOpen ? 'border-primary' : '',
  );
  const badgeClass = cn(
    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
    isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
  );
  const collapseProps = shouldReduce
    ? {
        initial: false,
        animate: { height: 'auto', opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0 },
      }
    : recipes.collapse;

  return (
    <Card key={faq.question} className={cardClass}>
      <button
        type="button"
        onClick={() => onToggle(idx)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-start justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-ring"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className={badgeClass}>{idx + 1}</span>
          <span className="type-label font-semibold text-foreground">{faq.question}</span>
        </div>
        <span className="mt-0.5 shrink-0 text-muted-foreground">
          {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div key="content" {...collapseProps} className="overflow-hidden">
            <CardContent className="border-t border-border pt-4 pb-5">
              <p className="ps-8 type-body leading-relaxed text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}

export function FaqSection() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const shouldReduce = useReducedMotion();

  const toggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
      {FAQ_ITEMS.map((faq, idx) => (
        <FaqCard
          key={faq.question}
          faq={faq}
          idx={idx}
          isOpen={activeIndex === idx}
          shouldReduce={shouldReduce}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}
