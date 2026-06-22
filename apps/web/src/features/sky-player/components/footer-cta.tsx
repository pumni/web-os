'use client';

import { Card, CardContent } from '@pumni/ui/layout';
import { motion, useReducedMotion } from '@pumni/ui/lib/motion-primitives';
import { recipes } from '@pumni/ui/lib/motion';

import { SkyPlayerCta } from './sky-player-cta';

export function FooterCta() {
  const shouldReduce = useReducedMotion();

  return (
    <Card asChild radius="2xl" className="relative overflow-hidden border-border">
      <motion.section {...(shouldReduce ? {} : recipes.fadeRise)}>
        {/* Gradient background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-(--brand-gradient-from)/8 via-transparent to-(--brand-gradient-to)/8"
        />

        {/* Ambient glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-(--brand-gradient-to)/8 blur-3xl"
        />

        <CardContent className="relative px-8 py-16 text-center md:px-16 md:py-24 xl:py-28">
          <span className="mb-4 inline-block type-caption font-bold tracking-widest text-primary uppercase">
            Ready to play
          </span>

          <h2 className="mx-auto max-w-2xl type-display text-balance text-foreground xl:text-5xl">
            Bring music to Sky with <span className="text-gradient-brand">Sky Player.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-md type-body text-pretty text-muted-foreground">
            Grab the latest release, open your instrument in Sky, and experience automatic song
            playback from the terminal.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <SkyPlayerCta size="compact" />
          </div>
        </CardContent>
      </motion.section>
    </Card>
  );
}
