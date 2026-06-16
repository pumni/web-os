'use client';

import * as React from 'react';
import { Plus, Minus } from 'lucide-react';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  cn,
  Card,
  CardContent,
} from '@pumni/ui';

import { FAQ_ITEMS } from '../content';

export function FaqSection() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const shouldReduce = useReducedMotion();

  const toggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
      {FAQ_ITEMS.map((faq, idx) => {
        const isOpen = activeIndex === idx;

        return (
          <Card
            key={faq.question}
            className={cn(
              'overflow-hidden gap-0 py-0 transition-colors duration-(--duration-base) ease-fluid',
              isOpen ? 'border-primary/30' : '',
            )}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/50 cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* Question number */}
                <span
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                    isOpen
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {idx + 1}
                </span>
                <span className="type-label font-semibold text-foreground">{faq.question}</span>
              </div>
              <span className="mt-0.5 shrink-0 text-muted-foreground">
                {isOpen ? (
                  <Minus className="size-4" />
                ) : (
                  <Plus className="size-4" />
                )}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="content"
                  initial={shouldReduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={shouldReduce ? undefined : { height: 0, opacity: 0 }}
                  transition={shouldReduce ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <CardContent className="border-t border-border pb-5 pt-4">
                    <p className="type-body ps-8 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}
