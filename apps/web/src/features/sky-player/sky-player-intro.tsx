'use client';

import { AlertTriangle, Sparkles, Download, Keyboard, HelpCircle } from 'lucide-react';

import { Badge } from '@pumni/ui/feedback';
import { Card, CardContent, CardWell } from '@pumni/ui/layout';
import { motion, useReducedMotion } from '@pumni/ui/lib/motion-primitives';
import { recipes } from '@pumni/ui/lib/motion';

import { PreviewWindow } from './preview-window';
import { HERO_HIGHLIGHTS, SKY_PLAYER_VERSION } from './content';
import { SkyPlayerSectionNav } from './components/section-nav';
import { PageSection } from './components/page-section';
import { SectionHeader } from './components/section-header';
import { SkyPlayerCta } from './components/sky-player-cta';
import { CapabilitiesGrid } from './components/capabilities-grid';
import { InstallTabs } from './components/install-tabs';
import { ShortcutsReference } from './components/shortcuts-reference';
import { FaqSection } from './components/faq-section';
import { FooterCta } from './components/footer-cta';

export function SkyPlayerIntro() {
  const shouldReduce = useReducedMotion();

  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col justify-center overflow-hidden pt-14 pb-16 md:pt-20 md:pb-20 lg:pt-24 lg:pb-24">
        {/* Ambient background blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 size-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute top-1/3 right-0 size-96 rounded-full bg-(--desktop-blob-cyan)/10 blur-[80px]" />
          <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-(--brand-gradient-to)/8 blur-[80px]" />
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left: Text + CTA */}
          <motion.div
            {...(shouldReduce ? {} : recipes.fadeRise)}
            className="space-y-8 lg:col-span-6"
          >
            {/* Version badge */}
            <Badge tone="primary" pulse className="px-3 py-1">
              {SKY_PLAYER_VERSION} · Windows PC
            </Badge>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="type-display leading-[1.08] text-balance text-foreground md:text-5xl lg:text-6xl xl:text-7xl">
                Play Sky music
                <br />
                <span className="text-gradient-brand">with Sky Player.</span>
              </h1>

              <p className="max-w-lg type-body text-pretty text-muted-foreground md:text-lg">
                An automatic music sheet player for{' '}
                <strong className="font-semibold text-foreground">
                  Sky: Children of the Light
                </strong>{' '}
                on Windows. Pick a song from the Textual TUI, then let it simulate keyboard
                keypresses in real time while you play in-game.
              </p>
            </div>

            {/* CTA Buttons */}
            <SkyPlayerCta />

            {/* Stats row */}
            <div className="flex flex-wrap gap-2 border-t border-border pt-6">
              {HERO_HIGHLIGHTS.map((item) => (
                <CardWell
                  key={item.label}
                  radius="lg"
                  padding="none"
                  className="flex flex-col gap-0.5 px-4 py-2.5"
                >
                  <span className="text-xs font-bold text-foreground">{item.label}</span>
                  <span className="mt-0.5 type-caption text-muted-foreground">{item.detail}</span>
                </CardWell>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...(shouldReduce
              ? {}
              : {
                  ...recipes.fadeRise,
                  transition: { ...recipes.fadeRise.transition, delay: 0.15 },
                })}
            className="relative flex justify-center lg:sticky lg:top-24 lg:col-span-6 lg:self-start"
          >
            {/* Glow halo behind window */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-72 w-full max-w-xl -translate-y-1/2 rounded-full bg-primary/12 blur-3xl"
            />
            <PreviewWindow className="w-full max-w-xl" />
          </motion.div>
        </div>
      </section>

      {/* ── Sticky section nav ───────────────────────────────────────────── */}
      <SkyPlayerSectionNav />

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <motion.div
        {...(shouldReduce ? {} : recipes.staggerContainer)}
        className="space-y-16 py-12 md:space-y-20 md:py-16"
      >
        {/* Capabilities */}
        <motion.div {...(shouldReduce ? {} : recipes.staggerItem)}>
          <PageSection id="capabilities">
            <SectionHeader
              eyebrow="Capabilities"
              icon={Sparkles}
              title="Everything you need in one focused player."
              description="Fuzzy search, a command palette, playback tuning, and a drop-in song library — built for Sky PC musicians."
            />
            <CapabilitiesGrid />
          </PageSection>
        </motion.div>

        {/* Get Started */}
        <motion.div {...(shouldReduce ? {} : recipes.staggerItem)}>
          <PageSection id="get-started">
            <SectionHeader
              eyebrow="Get started"
              icon={Download}
              title="Download and play in a few steps."
              description="Choose the standalone release for quick setup, or run from source if you prefer Python."
            />
            <InstallTabs />
          </PageSection>
        </motion.div>

        {/* Shortcuts */}
        <motion.div {...(shouldReduce ? {} : recipes.staggerItem)}>
          <PageSection id="shortcuts">
            <SectionHeader
              eyebrow="Using Sky Player"
              icon={Keyboard}
              title="Keyboard reference and song library."
              description="Shortcuts are grouped by workflow — picker, palette, playback, and library management."
            />
            <ShortcutsReference />
          </PageSection>
        </motion.div>

        {/* Responsible use */}
        <motion.div {...(shouldReduce ? {} : recipes.staggerItem)}>
          <PageSection id="responsible-use">
            <Card className="border border-border bg-warning/5">
              <CardContent className="flex items-start gap-4 p-6 md:p-7">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="type-heading text-foreground">Responsible use guidance</h3>
                  <p className="type-body text-muted-foreground">
                    Automatically playing music sheets or using simulated keystrokes might violate
                    Thatgamecompany&apos;s Terms of Service. Use this tool responsibly and at your
                    own risk.
                  </p>
                </div>
              </CardContent>
            </Card>
          </PageSection>
        </motion.div>

        {/* FAQ */}
        <motion.div {...(shouldReduce ? {} : recipes.staggerItem)}>
          <PageSection id="faq">
            <SectionHeader
              eyebrow="FAQ"
              icon={HelpCircle}
              title="Common questions."
              description="Answers to topics not covered in the sections above."
            />
            <FaqSection />
          </PageSection>
        </motion.div>

        {/* Footer CTA */}
        <motion.div {...(shouldReduce ? {} : recipes.staggerItem)}>
          <FooterCta />
        </motion.div>
      </motion.div>
    </div>
  );
}
