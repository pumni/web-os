import * as React from 'react';
import { toast } from 'sonner';
import { AnimatePresence, motion, useReducedMotion } from '@pumni/ui/lib/motion-primitives';
import { Button } from '@pumni/ui/form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardWell,
} from '@pumni/ui/layout';
import { Window } from '@pumni/ui/os';
import { Skeleton } from '@pumni/ui/feedback';
import {
  easing,
  entranceYLarge,
  motionTokens,
  parallaxRate,
  recipes,
  springs,
  staggerFast,
  staggerSlow,
} from '@pumni/ui/lib/motion';
import { withViewTransition } from '@pumni/ui/lib/view-transition';
import { ShowcaseSection } from './showcase-section';

// ─── VT named-type demo data ────────────────────────────────────────────────
const VT_TYPES = [
  {
    type: 'slide-forward' as const,
    label: 'slide-forward',
    hint: 'Navigate deeper — dock click, breadcrumb forward.',
    color: 'bg-primary text-primary-foreground',
  },
  {
    type: 'slide-back' as const,
    label: 'slide-back',
    hint: 'Navigate shallower — back button, browser back.',
    color: 'bg-secondary text-secondary-foreground',
  },
  {
    type: 'morph-zoom' as const,
    label: 'morph-zoom',
    hint: 'Shared-element morph — same element, different page.',
    color: 'bg-muted text-foreground',
  },
  {
    type: 'card-crossfade' as const,
    label: 'card-crossfade',
    hint: 'Same-route swap — tabs, filter panels, section-nav.',
    color: 'bg-accent text-accent-foreground',
  },
] as const;

export function MotionSection() {
  const [motionWindowOpen, setMotionWindowOpen] = React.useState(true);
  const [staggerKey, setStaggerKey] = React.useState(0);
  const [staggerFastKey, setStaggerFastKey] = React.useState(0);
  const [staggerSlowKey, setStaggerSlowKey] = React.useState(0);
  const [fadeRiseVisible, setFadeRiseVisible] = React.useState(true);
  const [layoutBox, setLayoutBox] = React.useState(false);
  // tw-animate-css overlay demo
  const [overlayVisible, setOverlayVisible] = React.useState(false);
  // VT named type content swap demo
  const [vtContentIndex, setVtContentIndex] = React.useState(0);
  // draggable surface reset key
  const [dragKey, setDragKey] = React.useState(0);

  const shouldReduceMotion = useReducedMotion();

  // Parallax demo — mouse-move driven layer drift on the card.
  // Two layers move at different speeds (back = parallaxRate × front) so the
  // depth illusion is immediately visible as the cursor tracks across the card.
  // Reduced-motion renders both layers at (0, 0) statically.
  const parallaxRef = React.useRef<HTMLDivElement>(null);
  const [parallaxPos, setParallaxPos] = React.useState({ x: 0, y: 0 });

  const handleParallaxMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setParallaxPos({ x: nx, y: ny });
    },
    [shouldReduceMotion],
  );

  const handleParallaxLeave = React.useCallback(() => {
    setParallaxPos({ x: 0, y: 0 });
  }, []);

  return (
    <ShowcaseSection
      id="motion"
      title="Motion"
      description="5 animation surfaces: CSS micro-feedback · tw-animate-css overlays · JS motion orchestration · View Transitions · scroll-driven CSS."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ═══════════════════════════════════════════════════════════════════
            SURFACE 3 — JS Orchestration (motion library)
            ═══════════════════════════════════════════════════════════════════ */}

        {/* JS Recipes — hoverLift + pressScale */}
        <Card>
          <CardHeader>
            <CardTitle>JS Recipes</CardTitle>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 3 · JS motion
              </span>
              {' — '}common motion animations exported from @pumni/ui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <motion.div
              {...(shouldReduceMotion ? {} : recipes.hoverLift)}
              className="cursor-default rounded-xl border border-border bg-card p-4 text-xs transition-colors hover:border-primary/30"
            >
              <p className="font-semibold text-foreground">hoverLift Recipe</p>
              <p className="mt-1 text-muted-foreground">
                Hover to float up, click to compress. Snappy curve for cards.
              </p>
            </motion.div>

            <motion.button
              type="button"
              {...(shouldReduceMotion ? {} : recipes.pressScale)}
              onClick={() => toast.info('pressScale gesture tapped.')}
              className="w-full cursor-pointer rounded-xl bg-primary p-4 text-left text-xs text-primary-foreground"
            >
              <p className="font-semibold">pressScale Recipe</p>
              <p className="mt-1 text-primary-foreground/80">
                Touch interaction trigger for buttons and icon options.
              </p>
            </motion.button>
          </CardContent>
        </Card>

        {/* Stagger Sequence (base cadence) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stagger Entrances</CardTitle>
              <Button variant="outline" size="xs" onClick={() => setStaggerKey((k) => k + 1)}>
                Replay
              </Button>
            </div>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 3 · JS motion
              </span>
              {' — '}staggerContainer + staggerItem ({motionTokens.staggerBase * 1000}ms cadence).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.ul
              key={staggerKey}
              {...(shouldReduceMotion ? {} : recipes.staggerContainer)}
              className="grid gap-2"
            >
              {['Initial viewport mount', 'Synchronized step 1', 'Completed step 2'].map(
                (word, i) => (
                  <motion.li
                    key={word}
                    {...(shouldReduceMotion ? {} : recipes.staggerItem)}
                    className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs text-muted-foreground"
                  >
                    <span>{word}</span>
                    <span className="font-mono text-[10px] opacity-75">Index {i}</span>
                  </motion.li>
                ),
              )}
            </motion.ul>
          </CardContent>
        </Card>

        {/* CSS Micro-feedback */}
        <Card>
          <CardHeader>
            <CardTitle>CSS Micro-Feedback</CardTitle>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 1 · CSS
              </span>
              {' — '}transitions gated by <code>motion-safe:</code>. No JS dependency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card interactive>
              <CardContent className="pt-6">
                <p className="font-semibold text-card-foreground">Interactive CSS Card</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hover lift &amp; active press via CSS using the <code>--press-scale</code> token.
                </p>
              </CardContent>
            </Card>
            <Button className="w-full transition-transform active:scale-(--press-scale)">
              CSS Press Scaling
            </Button>
          </CardContent>
        </Card>

        {/* Window Enter/Exit — AnimatePresence */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Window Mounting Transition</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMotionWindowOpen((open) => !open)}
              >
                {motionWindowOpen ? 'Unmount Window' : 'Mount Window'}
              </Button>
            </div>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 3 · JS motion
              </span>
              {' — '}AnimatePresence orchestrates the enter/exit keyframes on mount/unmount.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <CardWell className="flex min-h-52 items-center justify-center border-dashed">
              <AnimatePresence>
                {motionWindowOpen && (
                  <Window
                    key="motion-demo"
                    title="Motion-tracked window"
                    className="w-full max-w-lg"
                  >
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-foreground">Smooth Entrance Spring</p>
                      <p className="text-xs text-muted-foreground">
                        Mount and unmount this container to test performance and entrance scaling.
                      </p>
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                  </Window>
                )}
              </AnimatePresence>
            </CardWell>
          </CardContent>
        </Card>

        {/* fadeRise Recipe */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>fadeRise Recipe</CardTitle>
              <Button variant="outline" size="xs" onClick={() => setFadeRiseVisible((v) => !v)}>
                {fadeRiseVisible ? 'Hide' : 'Show'}
              </Button>
            </div>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 3 · JS motion
              </span>
              {' — '}content enter/exit inside AnimatePresence.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-32 items-center justify-center">
            <AnimatePresence>
              {fadeRiseVisible && (
                <Card variant="inset" className="p-4 text-sm" asChild>
                  <motion.div
                    key="fade-rise-demo"
                    {...(shouldReduceMotion ? {} : recipes.fadeRise)}
                  >
                    <p className="font-semibold text-foreground">Fade + Rise</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Exit animation triggers when unmounted inside AnimatePresence.
                    </p>
                  </motion.div>
                </Card>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Springs */}
        <Card>
          <CardHeader>
            <CardTitle>Spring Presets</CardTitle>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 3 · JS motion
              </span>
              {' — '}physics-based motion. CSS easing cannot express inertia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['fluid', 'snappy', 'bouncy'] as const).map((name) => (
              <motion.button
                key={name}
                type="button"
                onClick={() => toast.info(`spring.${name} released.`)}
                {...(shouldReduceMotion
                  ? {}
                  : { whileTap: { scale: 0.95 }, transition: springs[name] })}
                className="w-full rounded-xl border border-border bg-card p-3 text-left text-xs transition-colors hover:border-primary/30"
              >
                <p className="font-mono font-semibold text-foreground">springs.{name}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  stiffness {springs[name].stiffness} · damping {springs[name].damping}
                </p>
              </motion.button>
            ))}
          </CardContent>
        </Card>

        {/* Parallax — mouse-move */}
        <Card ref={parallaxRef}>
          <CardHeader>
            <CardTitle>Parallax Depth</CardTitle>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 3 · JS motion
              </span>
              {' — '}move mouse over card. Two layers drift at different speeds via{' '}
              <code>parallaxRate</code> ({parallaxRate}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="relative h-36 cursor-crosshair overflow-hidden rounded-xl border border-border bg-muted select-none"
              onMouseMove={handleParallaxMove}
              onMouseLeave={handleParallaxLeave}
            >
              <div
                className="absolute inset-0 grid place-items-center text-xs text-muted-foreground"
                style={{
                  transform: `translate(${parallaxPos.x * 20 * parallaxRate}px, ${parallaxPos.y * 14 * parallaxRate}px)`,
                  transition: shouldReduceMotion ? 'none' : 'transform 0.08s linear',
                }}
              >
                <span className="rounded-md bg-background/60 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm">
                  back · ×{parallaxRate}
                </span>
              </div>
              <div
                className="absolute inset-0 grid place-items-center"
                style={{
                  transform: `translate(${parallaxPos.x * 20}px, ${parallaxPos.y * 14}px)`,
                  transition: shouldReduceMotion ? 'none' : 'transform 0.05s linear',
                }}
              >
                <span className="rounded-md bg-primary px-3 py-1.5 font-mono text-xs text-primary-foreground">
                  front · ×1
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Back moves at <strong>{parallaxRate}×</strong> speed of front — gap creates depth.
              Token: <code>--scroll-parallax-rate</code>.
            </p>
          </CardContent>
        </Card>

        {/* Fast Stagger */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fast Stagger</CardTitle>
              <Button variant="outline" size="xs" onClick={() => setStaggerFastKey((k) => k + 1)}>
                Replay
              </Button>
            </div>
            <CardDescription>
              <code>staggerContainerFast</code> — dropdown / palette rows ({staggerFast * 1000}ms).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.ul
              key={staggerFastKey}
              {...(shouldReduceMotion ? {} : recipes.staggerContainerFast)}
              className="grid gap-1.5"
            >
              {['Row alpha', 'Row beta', 'Row gamma', 'Row delta'].map((label, i) => (
                <motion.li
                  key={label}
                  {...(shouldReduceMotion ? {} : recipes.staggerItem)}
                  className="flex items-center justify-between rounded bg-muted px-3 py-1.5 text-xs text-muted-foreground"
                >
                  <span>{label}</span>
                  <span className="font-mono text-[10px] opacity-75">{i}</span>
                </motion.li>
              ))}
            </motion.ul>
          </CardContent>
        </Card>

        {/* Slow Stagger */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Slow Stagger</CardTitle>
              <Button variant="outline" size="xs" onClick={() => setStaggerSlowKey((k) => k + 1)}>
                Replay
              </Button>
            </div>
            <CardDescription>
              <code>staggerContainerSlow</code> — hero / onboarding ({staggerSlow * 1000}ms).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.ul
              key={staggerSlowKey}
              {...(shouldReduceMotion ? {} : recipes.staggerContainerSlow)}
              className="grid gap-2"
            >
              {['Hero headline', 'Supporting copy', 'CTA action'].map((label, i) => (
                <motion.li
                  key={label}
                  {...(shouldReduceMotion ? {} : recipes.staggerItem)}
                  className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs text-muted-foreground"
                >
                  <span>{label}</span>
                  <span className="font-mono text-[10px] opacity-75">{i}</span>
                </motion.li>
              ))}
            </motion.ul>
          </CardContent>
        </Card>

        {/* layoutAware — layout-shift animation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>layoutAware Recipe</CardTitle>
              <Button variant="outline" size="xs" onClick={() => setLayoutBox((v) => !v)}>
                {layoutBox ? 'Collapse' : 'Expand'}
              </Button>
            </div>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 3 · JS motion
              </span>
              {' — '}
              <code>recipes.layoutAware</code> smoothly animates layout shifts on state change.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-24 items-start justify-center">
            <motion.div
              {...(shouldReduceMotion ? {} : recipes.layoutAware)}
              className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs text-foreground"
              style={{ width: layoutBox ? '100%' : '50%' }}
            >
              <p className="font-semibold text-foreground">Layout-animated box</p>
              {layoutBox && (
                <p className="mt-1 text-muted-foreground">
                  Width transitions smoothly via <code>layout</code> prop — no keyframes needed.
                </p>
              )}
            </motion.div>
          </CardContent>
        </Card>

        {/* draggableSurface — drag with momentum */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>draggableSurface Recipe</CardTitle>
              <Button variant="outline" size="xs" onClick={() => setDragKey((k) => k + 1)}>
                Reset
              </Button>
            </div>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 3 · JS motion
              </span>
              {' — '}
              <code>recipes.draggableSurface</code>: drag with momentum, elastic edges, and coasting
              after release.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-40 overflow-hidden rounded-xl border border-border bg-muted">
              <motion.div
                key={dragKey}
                {...(shouldReduceMotion
                  ? {}
                  : {
                      drag: true,
                      dragMomentum: recipes.draggableSurface.dragMomentum,
                      dragElastic: recipes.draggableSurface.dragElastic,
                      dragTransition: recipes.draggableSurface.dragTransition,
                      dragConstraints: { left: -80, right: 80, top: -40, bottom: 40 },
                    })}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-md select-none active:cursor-grabbing"
                whileDrag={shouldReduceMotion ? undefined : { scale: 1.05 }}
              >
                Drag me
              </motion.div>
              <p className="absolute right-0 bottom-2 left-0 text-center text-[10px] text-muted-foreground">
                Release to coast — momentum + elastic edges
              </p>
            </div>
          </CardContent>
        </Card>

        {/* layoutId — shared element (MotionConfig context) */}
        <Card>
          <CardHeader>
            <CardTitle>MotionConfig + layoutId</CardTitle>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 3 · JS motion
              </span>
              {' — '}global reduced-motion safety net at app root. <code>layoutId</code> powers
              shared-element indicators (Tabs, SegmentedPicker).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Card variant="inset" className="p-4">
              <p className="font-mono text-xs font-semibold text-foreground">
                {'<MotionConfig reducedMotion="user">'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Inserted at <code>apps/web/src/app/layout.tsx</code> via{' '}
                <code>MotionConfigProvider</code>. Neutralises <code>layout</code> /{' '}
                <code>layoutId</code> animations (Tabs indicator, SegmentedPicker pill) under
                reduced-motion without needing explicit guards on each consumer.
              </p>
            </Card>
            <motion.div
              {...(shouldReduceMotion
                ? {}
                : {
                    animate: { scale: [1, 1.03, 1] },
                    transition: { duration: 1.2, repeat: Infinity, ease: easing.fluid },
                  })}
              className="rounded-xl border border-border bg-muted p-3 text-center text-xs text-muted-foreground"
            >
              Ambient pulse (stops under reduced-motion via MotionConfig)
            </motion.div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            SURFACE 2 — Overlay enter/exit (tw-animate-css)
            ═══════════════════════════════════════════════════════════════════ */}

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Overlay Enter / Exit</CardTitle>
              <Button variant="outline" size="xs" onClick={() => setOverlayVisible((v) => !v)}>
                {overlayVisible ? 'Dismiss' : 'Show Overlay'}
              </Button>
            </div>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 2 · tw-animate-css
              </span>
              {' — '}Dialog, Sheet, Popover, Dropdown, Tooltip all share this vocabulary via{' '}
              <code>_overlay-variants.ts</code>. Driven by <code>data-state</code>, not JS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative flex min-h-24 items-center justify-center">
              {overlayVisible && (
                <div
                  className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-sm shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
                  data-state="open"
                >
                  <p className="font-semibold text-foreground">Overlay panel</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter: <code>fade-in-0 zoom-in-95</code> · Exit:{' '}
                    <code>fade-out-0 zoom-out-95</code>. Side-anchored layers add{' '}
                    <code>slide-in-from-*</code> keyed to <code>data-side</code>.
                  </p>
                </div>
              )}
              {!overlayVisible && (
                <p className="text-xs text-muted-foreground">
                  Click &quot;Show Overlay&quot; to trigger the enter animation.
                </p>
              )}
            </div>
            <Card variant="inset" className="space-y-1.5 p-3">
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                OVERLAY_ANIMATION class string
              </p>
              <p className="font-mono text-[10px] leading-relaxed break-all text-foreground">
                data-[state=closed]:animate-out data-[state=closed]:fade-out-0
                data-[state=closed]:zoom-out-95 data-[state=open]:animate-in
                data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
              </p>
              <p className="mt-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                OVERLAY_SLIDE_SIDES (side-anchored)
              </p>
              <p className="font-mono text-[10px] leading-relaxed break-all text-foreground">
                data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
                data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
              </p>
              <p className="pt-1 text-[10px] text-muted-foreground">
                Why tw-animate-css over @starting-style: tw-animate-css uses <code>@property</code>{' '}
                registered custom props + <code>data-state</code> lifecycle. Radix controls
                visibility via <code>data-state</code>, not <code>display:none</code>, so
                @starting-style solves the wrong problem.
              </p>
            </Card>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            SURFACE 4 — View Transitions (native VT API)
            ═══════════════════════════════════════════════════════════════════ */}

        <Card>
          <CardHeader>
            <CardTitle>View Transitions</CardTitle>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 4 · Native VT API
              </span>
              {' — '}progressive enhancement. Wraps any callback in{' '}
              <code>document.startViewTransition()</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                withViewTransition(() => toast.success('Default crossfade — no type option.'))
              }
            >
              Default crossfade
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Falls back to plain call when unsupported or reduced-motion preferred. Pass{' '}
              <code>{'{ type }'}</code> to select a named CSS group (below).
            </p>
          </CardContent>
        </Card>

        {/* VT Named Types — full-width, 4 buttons */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>View Transition Named Types</CardTitle>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 4 · Native VT API
              </span>
              {' — '}4 named groups in <code>view-transitions.css</code>, selected via{' '}
              <code>{'withViewTransition(cb, { type })'}</code>. Each triggers distinct keyframes.
              The content box below snapshots before/after the transition.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {VT_TYPES.map(({ type, label, hint, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    withViewTransition(() => setVtContentIndex((i) => (i + 1) % VT_TYPES.length), {
                      type,
                    })
                  }
                  className={`rounded-xl px-3 py-2.5 text-left text-xs font-semibold ${color} border border-border/20 transition-opacity hover:opacity-80 active:opacity-60`}
                >
                  <p className="font-mono">{label}</p>
                  <p className="mt-0.5 font-sans text-[10px] leading-tight font-normal opacity-80">
                    {hint}
                  </p>
                </button>
              ))}
            </div>
            <CardWell className="flex min-h-16 items-center justify-center border-dashed">
              <div
                style={{ viewTransitionName: 'vt-demo-content' }}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
              >
                Content snapshot {vtContentIndex + 1} — trigger a type above to see the transition
              </div>
            </CardWell>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-4">
              <div>
                <code className="text-foreground">slide-forward</code> → dock click
              </div>
              <div>
                <code className="text-foreground">slide-back</code> → router.back()
              </div>
              <div>
                <code className="text-foreground">morph-zoom</code> → shared element
              </div>
              <div>
                <code className="text-foreground">card-crossfade</code> → section-nav
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            SURFACE 5 — Scroll-driven CSS (animation-timeline: view())
            ═══════════════════════════════════════════════════════════════════ */}

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Scroll-Driven Animations</CardTitle>
            <CardDescription>
              <span className="font-mono text-[10px] font-semibold text-primary/80">
                Surface 5 · CSS animation-timeline
              </span>
              {' — '}utilities from <code>scroll.css</code> using{' '}
              <code>animation-timeline: view()</code>. Progressive enhancement: falls back to static
              when unsupported. Scroll inside each container below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* scroll-fade-in */}
              <div className="space-y-2">
                <p className="font-mono text-xs font-semibold text-foreground">scroll-fade-in</p>
                <p className="text-[11px] text-muted-foreground">
                  Opacity + <code>translateY(--entrance-y-lg)</code> keyed to viewport entry. Used
                  for marketing-page content reveals.
                </p>
                <div className="h-44 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted p-3">
                  <p className="pb-1 text-center text-[10px] text-muted-foreground">↓ scroll</p>
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className="scroll-fade-in rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Item {i + 1}
                      </span>
                      <span className="ml-2">fade-in on scroll</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* scroll-slide-up */}
              <div className="space-y-2">
                <p className="font-mono text-xs font-semibold text-foreground">scroll-slide-up</p>
                <p className="text-[11px] text-muted-foreground">
                  Opacity + larger travel <code>calc(--entrance-y-lg * 2)</code> + scale from{' '}
                  <code>--entrance-scale</code>. For hero feature grids.
                </p>
                <div className="h-44 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted p-3">
                  <p className="pb-1 text-center text-[10px] text-muted-foreground">↓ scroll</p>
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className="scroll-slide-up rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-foreground"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Item {i + 1}
                      </span>
                      <span className="ml-2">slide-up + scale on scroll</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* scroll-parallax */}
              <div className="space-y-2">
                <p className="font-mono text-xs font-semibold text-foreground">scroll-parallax</p>
                <p className="text-[11px] text-muted-foreground">
                  Pure CSS scroll-linked Y drift using{' '}
                  <code>animation-timeline: scroll(nearest)</code>. Background layer drifts relative
                  to scrolling container.
                </p>
                <div
                  className="relative h-44 overflow-y-auto rounded-xl border border-border bg-muted"
                  style={{ isolation: 'isolate' }}
                >
                  {/* parallax background layer */}
                  <div
                    className="pointer-events-none absolute inset-0 grid scroll-parallax place-items-center"
                    aria-hidden
                  >
                    <span className="rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 font-mono text-[11px] text-primary/70">
                      CSS parallax layer
                    </span>
                  </div>
                  {/* foreground content */}
                  <div className="relative z-10 space-y-2 p-3">
                    <p className="pb-1 text-center text-[10px] text-muted-foreground">↓ scroll</p>
                    {Array.from({ length: 8 }, (_, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-card/80 px-3 py-2 text-xs text-foreground backdrop-blur-sm"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground">
                          Row {i + 1}
                        </span>
                        <span className="ml-2">foreground (fixed)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">
              All three utilities are in <code>packages/ui/src/styles/scroll.css</code>. They use{' '}
              <code>@supports (animation-timeline: view())</code> +{' '}
              <code>@media (prefers-reduced-motion: no-preference)</code> — double gated. Geometry
              tokens: <code>--entrance-y-lg</code> ({entranceYLarge}px),{' '}
              <code>--entrance-scale</code>, <code>--scroll-parallax-rate</code> ({parallaxRate}).
            </p>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            Motion Tokens — fully data-driven from motionTokens aggregate.
            No values are hardcoded here. When lib/motion.ts changes (and its
            drift-test against tokens.css passes), this table auto-updates on
            the next build — zero edits needed in this file.
            ═══════════════════════════════════════════════════════════════════ */}

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Motion Tokens</CardTitle>
            <CardDescription>
              All values read live from <code>motionTokens</code> (re-export of{' '}
              <code>packages/ui/src/lib/motion.ts</code>). CSS variables in <code>tokens.css</code>{' '}
              are kept in sync by the drift test — changing a token there propagates here on next
              build with no edits to this file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* duration — { fast, base, slow, slower } */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  duration (s) · mirrors <code>--duration-*</code>
                </span>
                {Object.entries(motionTokens.duration).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <code className="font-mono text-foreground">{key}</code>
                    <span className="font-mono text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>

              {/* easing — { fluid, snappy, spring } */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  easing · mirrors <code>--ease-*</code>
                </span>
                {Object.entries(motionTokens.easing).map(([key, points]) => (
                  <div key={key} className="flex items-center justify-between gap-2 text-xs">
                    <code className="font-mono text-foreground">{key}</code>
                    <span className="truncate font-mono text-muted-foreground">
                      [{(points as number[]).join(', ')}]
                    </span>
                  </div>
                ))}
              </div>

              {/* transition presets — { fluid, snappy } */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  transition presets
                </span>
                {Object.entries(motionTokens.transition).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <code className="font-mono text-foreground">{key}</code>
                    <span className="font-mono text-muted-foreground">
                      {value.duration}s · {key}
                    </span>
                  </div>
                ))}
              </div>

              {/* scalar tokens — pressScale, parallaxRate, hoverLift geometry */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  scalar tokens · mirrors <code>--press-scale</code> etc.
                </span>
                {(
                  [
                    ['pressScale', motionTokens.pressScale, ''],
                    ['parallaxRate', motionTokens.parallaxRate, ''],
                    ['hoverLiftY', motionTokens.hoverLiftY, 'px'],
                    ['hoverLiftScale', motionTokens.hoverLiftScale, ''],
                  ] as const
                ).map(([key, value, unit]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <code className="font-mono text-foreground">{key}</code>
                    <span className="font-mono text-muted-foreground">
                      {value}
                      {unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* entrance geometry — entranceY, entranceYLarge */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  entrance geometry · mirrors <code>--entrance-y*</code>
                </span>
                {(
                  [
                    ['entranceY', motionTokens.entranceY],
                    ['entranceYLarge', motionTokens.entranceYLarge],
                  ] as const
                ).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <code className="font-mono text-foreground">{key}</code>
                    <span className="font-mono text-muted-foreground">{value}px</span>
                  </div>
                ))}
                <p className="pt-0.5 text-[10px] text-muted-foreground">
                  Used by <code>fadeRise</code>, <code>staggerItem</code>,{' '}
                  <code>scroll-fade-in</code>.
                </p>
              </div>

              {/* stagger cadences — fast, base, slow */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  stagger cadences (s) · mirrors <code>--stagger-*</code>
                </span>
                {(
                  [
                    ['staggerFast', motionTokens.staggerFast],
                    ['staggerBase', motionTokens.staggerBase],
                    ['staggerSlow', motionTokens.staggerSlow],
                  ] as const
                ).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <code className="font-mono text-foreground">{key}</code>
                    <span className="font-mono text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>

              {/* spring presets — fluid, snappy, bouncy */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  spring presets · type: spring
                </span>
                {Object.entries(motionTokens.springs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-2 text-xs">
                    <code className="font-mono text-foreground">springs.{key}</code>
                    <span className="truncate font-mono text-muted-foreground">
                      k={value.stiffness} b={value.damping}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <p className="text-[11px] text-muted-foreground">
                <code>motionTokens</code>: {Object.keys(motionTokens).length} keys. Drift-tested by{' '}
                <code>src/test/design-system/motion-tokens.test.ts</code>.
              </p>
              <span className="font-mono text-[10px] font-semibold text-primary/60">
                live · no hardcode
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ShowcaseSection>
  );
}
