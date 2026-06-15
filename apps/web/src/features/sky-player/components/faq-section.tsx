'use client';

import * as React from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

import {
  Card,
  CardContent,
  AnimatePresence,
  motion,
  recipes,
  useReducedMotion,
  cn,
} from '@pumni/ui';

import { FAQ_ITEMS } from '../content';

export function FaqSection() {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const shouldReduce = useReducedMotion();

  const toggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((faq, idx) => {
        const isOpen = activeIndex === idx;
        return (
          <Card key={faq.question} className="overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 p-4 text-left font-bold text-sm text-foreground hover:bg-muted/30 transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
                {faq.question}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) ease-fluid',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="content"
                  initial={shouldReduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={shouldReduce ? undefined : { height: 0, opacity: 0 }}
                  transition={shouldReduce ? { duration: 0 } : recipes.fadeRise.transition}
                  className="overflow-hidden"
                >
                  <CardContent className="border-t border-border bg-muted p-4 text-xs text-muted-foreground leading-relaxed">
                    {faq.answer}
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
