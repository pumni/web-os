'use client';

import {
  CardSpotlight,
  CardHeader,
  CardTitle,
  CardDescription,
  motion,
  recipes,
  useReducedMotion,
} from '@pumni/ui';

import { CAPABILITIES } from '../content';

export function CapabilitiesGrid() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      {...(shouldReduce ? {} : recipes.staggerContainer)}
      className="grid gap-6 sm:grid-cols-2"
    >
      {CAPABILITIES.map((cap) => {
        const Icon = cap.icon;
        return (
          <motion.div key={cap.title} {...(shouldReduce ? {} : recipes.staggerItem)}>
            <CardSpotlight interactive className="h-full">
              <CardHeader>
                <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">{cap.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {cap.description}
                </CardDescription>
              </CardHeader>
            </CardSpotlight>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
