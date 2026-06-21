import * as React from 'react';
import { toast } from 'sonner';
import {
  AnimatePresence,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardWell,
  Window,
  Skeleton,
  duration,
  easing,
  motion,
  motionTokens,
  parallaxRate,
  pressScale,
  recipes,
  springs,
  staggerBase,
  transition,
  useReducedMotion,
  withViewTransition,
} from '@pumni/ui';
import { ShowcaseSection } from './showcase-section';

export function MotionSection() {
  const [motionWindowOpen, setMotionWindowOpen] = React.useState(true);
  const [staggerKey, setStaggerKey] = React.useState(0);
  const [fadeRiseVisible, setFadeRiseVisible] = React.useState(true);
  const shouldReduceMotion = useReducedMotion();

  // Parallax demo — scroll-linked transform on a layered card. `useScroll`
  // returns a MotionValue that tracks the container's scroll progress; we map
  // it to a Y translate so the back layer drifts against the front. Reduced
  // motion skips the transform (the section still renders statically).
  const parallaxRef = React.useRef<HTMLDivElement>(null);
  const parallaxScrollY = React.useMemo(() => ({ current: 0 }), []);
  React.useEffect(() => {
    if (shouldReduceMotion) return;
    const el = parallaxRef.current;
    if (!el) return;
    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const node = parallaxRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, 1 - rect.top / window.innerHeight));
        parallaxScrollY.current = progress * 40 * parallaxRate;
        node.style.setProperty('--parallax-y', `${parallaxScrollY.current}px`);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [shouldReduceMotion, parallaxScrollY]);

  return (
    <ShowcaseSection
      id="motion"
      title="Motion"
      description="Feedback curves: CSS micro-animations, JS framer-motion orchestration, and conditional window mount transitions."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* JS Recipes */}
        <Card>
          <CardHeader>
            <CardTitle>JS Recipes</CardTitle>
            <CardDescription>Common motion animations exported from @pumni/ui.</CardDescription>
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

        {/* Stagger Sequence */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Stagger Entrances</CardTitle>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setStaggerKey((key) => key + 1)}
              >
                Replay Sequence
              </Button>
            </div>
            <CardDescription>
              Sequence delays via staggerContainer/staggerItem recipes.
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
              CSS transitions (no motion dependencies) gated by motion-safe query.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card interactive>
              <CardContent className="pt-6">
                <p className="font-semibold text-card-foreground">Interactive CSS Card</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hover lift & active press down scaling driven by CSS using the{' '}
                  <code>--press-scale</code> token.
                </p>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Button className="w-full transition-transform active:scale-(--press-scale)">
                CSS Press Scaling
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Window Enter/Exit Dialog and AnimatePresence */}
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
            <CardDescription>Framer Motion AnimatePresence transition hooks.</CardDescription>
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
            <CardDescription>Content enter/exit for use with AnimatePresence.</CardDescription>
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

        {/* Springs — physics-based motion presets (CSS easing cannot express inertia). */}
        <Card>
          <CardHeader>
            <CardTitle>Spring Presets</CardTitle>
            <CardDescription>
              Physics-based motion for tactile settle and playful overshoot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['fluid', 'snappy', 'bouncy'] as const).map((name) => (
              <motion.button
                key={name}
                type="button"
                onClick={() => toast.info(`spring.${name} released.`)}
                {...(shouldReduceMotion ? {} : { whileTap: { scale: 0.95 }, transition: springs[name] })}
                className="w-full rounded-xl bg-card p-3 text-left text-xs border border-border transition-colors hover:border-primary/30"
              >
                <p className="font-semibold text-foreground font-mono">springs.{name}</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  stiffness {springs[name].stiffness} · damping {springs[name].damping}
                </p>
              </motion.button>
            ))}
          </CardContent>
        </Card>

        {/* Parallax depth — scroll-linked transform (the JS analogue of CSS scroll-parallax). */}
        <Card ref={parallaxRef as React.RefObject<HTMLDivElement> as never}>
          <CardHeader>
            <CardTitle>Parallax Depth</CardTitle>
            <CardDescription>
              Scroll-linked layer drift via <code>parallaxRate</code> ({parallaxRate}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-28 overflow-hidden rounded-xl border border-border bg-muted">
              <div
                className="absolute inset-0 grid place-items-center text-xs text-muted-foreground"
                style={{ transform: 'translateY(var(--parallax-y, 0px))' }}
              >
                <span className="rounded-md bg-background/60 px-2 py-1 backdrop-blur-sm">
                  back layer (drifts)
                </span>
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
                  front layer (fixed)
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Scroll the page to see the back layer drift against the front.
            </p>
          </CardContent>
        </Card>

        {/* View Transitions */}
        <Card>
          <CardHeader>
            <CardTitle>View Transitions</CardTitle>
            <CardDescription>
              Native View Transitions API with progressive enhancement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                withViewTransition(() => toast.success('View transition callback executed.'))
              }
            >
              Trigger withViewTransition
            </Button>
            <p className="text-xs text-muted-foreground">
              <code>withViewTransition</code> wraps callbacks in{' '}
              <code>document.startViewTransition()</code>. Falls back to immediate execution
              when unsupported or reduced-motion is preferred.
            </p>
          </CardContent>
        </Card>

        {/* Motion Tokens — the CSS-mirror exports (duration/easing/transition/
            pressScale/staggerBase) that underpin every recipe above. Sourced
            directly from the exports so the table can't drift from the package. */}
        <Card>
          <CardHeader>
            <CardTitle>Motion Tokens</CardTitle>
            <CardDescription>
              CSS-bridge exports mirroring <code>--duration-*</code> /{' '}
              <code>--ease-*</code> — the sanctioned replacements for{' '}
              <code>ease-out</code> / <code>duration-300</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">duration (s)</span>
              {Object.entries(duration).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <code className="font-mono text-foreground">{key}</code>
                  <span className="font-mono text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">easing</span>
              {Object.entries(easing).map(([key, points]) => (
                <div key={key} className="flex items-center justify-between gap-2 text-xs">
                  <code className="font-mono text-foreground">{key}</code>
                  <span className="truncate font-mono text-muted-foreground">
                    [{(points as number[]).join(', ')}]
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs">
              <code className="font-mono text-foreground">pressScale</code>
              <span className="font-mono text-muted-foreground">{pressScale}</span>
            </div>
            <div className="flex justify-between text-xs">
              <code className="font-mono text-foreground">parallaxRate</code>
              <span className="font-mono text-muted-foreground">{parallaxRate}</span>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">stagger cadences</span>
              <div className="flex justify-between text-xs">
                <code className="font-mono text-foreground">staggerFast</code>
                <span className="font-mono text-muted-foreground">{staggerBase}</span>
              </div>
              <div className="flex justify-between text-xs">
                <code className="font-mono text-foreground">staggerBase</code>
                <span className="font-mono text-muted-foreground">{staggerBase}</span>
              </div>
            </div>
            <div className="space-y-1.5 border-t pt-3">
              <span className="text-xs font-semibold text-muted-foreground">spring presets</span>
              {Object.entries(springs).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-2 text-xs">
                  <code className="font-mono text-foreground">springs.{key}</code>
                  <span className="truncate font-mono text-muted-foreground">
                    {value.stiffness}/{value.damping}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t pt-3">
              <span className="text-xs font-semibold text-muted-foreground">transition presets</span>
              {Object.entries(transition).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <code className="font-mono text-foreground">{key}</code>
                  <span className="font-mono text-muted-foreground">
                    {value.duration}s · ease.{value.ease}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              All exports also bundle under <code>motionTokens</code> ({Object.keys(motionTokens).length}{' '}
              keys) for one-shot import.
            </p>
          </CardContent>
        </Card>
      </div>
    </ShowcaseSection>
  );
}
