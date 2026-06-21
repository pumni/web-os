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
  motion,
  recipes,
  useReducedMotion,
  withViewTransition,
} from '@pumni/ui';
import { ShowcaseSection } from './showcase-section';

export function MotionSection() {
  const [motionWindowOpen, setMotionWindowOpen] = React.useState(true);
  const [staggerKey, setStaggerKey] = React.useState(0);
  const [fadeRiseVisible, setFadeRiseVisible] = React.useState(true);
  const shouldReduceMotion = useReducedMotion();

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
      </div>
    </ShowcaseSection>
  );
}
