'use client';

import { AlertTriangle } from 'lucide-react';

import { Card, CardContent, motion, recipes, useReducedMotion } from '@pumni/ui';

import { PreviewWindow } from './preview-window';
import { SKY_PLAYER_VERSION } from './content';
import { SectionHeader } from './components/section-header';
import { SkyPlayerCta } from './components/sky-player-cta';
import { CapabilitiesGrid } from './components/capabilities-grid';
import { InstallTabs } from './components/install-tabs';
import { ShortcutsReference } from './components/shortcuts-reference';
import { AddSongsCallout } from './components/add-songs-callout';
import { FaqSection } from './components/faq-section';

export function SkyPlayerIntro() {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div {...(shouldReduce ? {} : recipes.staggerContainer)} className="space-y-16 pb-20">
      {/* Hero */}
      <motion.section
        {...(shouldReduce ? {} : recipes.staggerItem)}
        className="grid gap-10 lg:grid-cols-12 lg:items-center"
      >
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span className="h-2 w-2 rounded-full bg-warning motion-safe:animate-pulse" />
            {SKY_PLAYER_VERSION} · Textual TUI · Windows PC
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Play Sky music sheets on PC{' '}
            <span className="bg-linear-to-r from-(--brand-gradient-from) via-(--brand-gradient-via) to-(--brand-gradient-to) bg-clip-text text-transparent">
              with Sky Player.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground">
            Sky Player is an automatic music sheet player for{' '}
            <strong>Sky: Children of the Light</strong> on Windows. Pick a song from the Textual TUI,
            then let it simulate keyboard keypresses in real time while you play in-game.
          </p>

          <SkyPlayerCta />
        </div>

        <div className="flex justify-center lg:col-span-5">
          <PreviewWindow />
        </div>
      </motion.section>

      {/* Capabilities */}
      <motion.section {...(shouldReduce ? {} : recipes.staggerItem)} className="space-y-8">
        <SectionHeader
          align="center"
          eyebrow="Capabilities"
          title="Everything you need in one focused player."
          description="Fuzzy search, a command palette, playback tuning, and a drop-in song library — built for Sky PC musicians."
        />
        <CapabilitiesGrid />
      </motion.section>

      {/* Get Started */}
      <motion.section {...(shouldReduce ? {} : recipes.staggerItem)} className="space-y-8">
        <SectionHeader
          eyebrow="Get started"
          title="Download and play in a few steps."
          description="Choose the standalone release for quick setup, or run from source if you prefer Python."
        />
        <InstallTabs />
      </motion.section>

      {/* Using Sky Player */}
      <motion.section {...(shouldReduce ? {} : recipes.staggerItem)} className="space-y-10">
        <SectionHeader
          eyebrow="Using Sky Player"
          title="Keyboard reference and song library."
          description="Master the TUI shortcuts, then expand your library with sheets from Sky Music."
        />
        <ShortcutsReference />
        <AddSongsCallout />
      </motion.section>

      {/* Responsible use */}
      <motion.section {...(shouldReduce ? {} : recipes.staggerItem)}>
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="flex items-start gap-4 p-5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div className="space-y-1">
              <h4 className="font-bold text-foreground text-sm">Responsible use guidance</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatically playing music sheets or using simulated keystrokes might violate
                Thatgamecompany&apos;s Terms of Service. Use this tool responsibly and at your own
                risk.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* FAQ */}
      <motion.section {...(shouldReduce ? {} : recipes.staggerItem)} className="space-y-6">
        <SectionHeader eyebrow="FAQ" title="Common questions." />
        <FaqSection />
      </motion.section>

      {/* Footer CTA */}
      <motion.section {...(shouldReduce ? {} : recipes.staggerItem)}>
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-8 md:p-12">
          <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Ready to try Sky Player?
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Grab the latest release, open your instrument in Sky, and experience automatic song
              playback from the terminal.
            </p>
            <SkyPlayerCta size="compact" />
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
