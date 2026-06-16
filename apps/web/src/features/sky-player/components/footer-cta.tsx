'use client';

import { motion, recipes, useReducedMotion } from '@pumni/ui';

import { SkyPlayerCta } from './sky-player-cta';

export function FooterCta() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.section
      {...(shouldReduce ? {} : recipes.fadeRise)}
      className="relative overflow-hidden rounded-2xl border border-border"
    >
      {/* Gradient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-(--brand-gradient-from)/8 via-transparent to-(--brand-gradient-to)/8"
      />

      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-(--brand-gradient-to)/8 blur-3xl"
      />

      <div className="relative px-8 py-16 text-center md:px-16 md:py-24 xl:py-28">
        <span className="type-caption mb-4 inline-block font-bold tracking-widest text-primary uppercase">
          Ready to play
        </span>

        <h2 className="type-display mx-auto max-w-2xl text-balance text-foreground xl:text-5xl">
          Bring music to Sky with{' '}
          <span className="text-gradient-brand">Sky Player.</span>
        </h2>

        <p className="type-body mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
          Grab the latest release, open your instrument in Sky, and experience automatic song
          playback from the terminal.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <SkyPlayerCta size="compact" />
        </div>
      </div>
    </motion.section>
  );
}
