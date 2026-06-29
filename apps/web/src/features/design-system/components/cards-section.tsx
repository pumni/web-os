import { HelpCircleIcon } from 'lucide-react';
import { Button } from '@pumni/ui/form';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardSpotlight,
  CardTitle,
} from '@pumni/ui/layout';
import { Skeleton } from '@pumni/ui/feedback';
import { ShowcaseSection } from './showcase-section';

export function CardsSection() {
  return (
    <ShowcaseSection
      id="card-states"
      title="Card States & Spotlight"
      description="Fundamental variants (Solid vs Glassmorphism), state machine (idle/loading/error/success), and pointer-tracked spotlight variant."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 columns: Variants comparison over gradient blobs backdrop */}
        <div className="relative overflow-hidden rounded-2xl border bg-background p-4 lg:col-span-2">
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -left-16 size-80 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
            <div className="absolute -right-12 -bottom-24 size-80 rounded-full bg-(--desktop-blob-secondary) opacity-50 blur-3xl" />
            <div className="absolute inset-0 bg-muted/30" />
          </div>
          <div className="relative grid gap-4 sm:grid-cols-2">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Glass Card</CardTitle>
                  <CardAction>
                    <Button variant="ghost" size="icon-sm" aria-label="More options">
                      <HelpCircleIcon className="size-4" />
                    </Button>
                  </CardAction>
                </div>
                <CardDescription>
                  Glassmorphism (opt-in, <code>variant=&quot;glass&quot;</code>): frosted vibrant
                  fill with a luminous light border and a volumetric rim pair. Float it over a
                  backdrop.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Optimal for OS windows, dialog panels, and elements layered on top of backdrops.
              </CardContent>
              <CardFooter className="justify-end gap-2 border-t pt-4">
                <Button variant="outline" size="sm">
                  Secondary
                </Button>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="solid">
              <CardHeader>
                <CardTitle>Solid Card</CardTitle>
                <CardDescription>
                  Opaque background for dense or high-contrast content.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Optimal for inline content blocks, lists, and forms sitting inside dialogs.
              </CardContent>
              <CardFooter className="justify-between border-t pt-4 text-xs text-muted-foreground">
                <span>Last updated 2 mins ago</span>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Right 1 column: Explanatory card for depth, elevation, or visual rules */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Visual Hierarchy</CardTitle>
            <CardDescription>Rules of depth and elevation layers.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-3 text-muted-foreground leading-relaxed">
            <p>
              <strong>Opaque Solid Cards</strong> are optimized for inline contents, forms, and nested listings sitting inside parent containers to maintain text readability and high contrast.
            </p>
            <p>
              <strong>Translucent Glass Cards</strong> must float over rich backdrops (gradients, blobs) to establish visual depth, and are reserved for active OS-like windows or modal overlays.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Idle — default */}
        <Card state="idle" className="p-5">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm">Idle State</CardTitle>
            <CardDescription>Default — no feedback</CardDescription>
          </CardHeader>
          <CardContent className="px-0 text-xs text-muted-foreground">
            Passive surface, no animation.
          </CardContent>
        </Card>

        {/* Loading */}
        <Card state="loading" className="p-5">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm">Loading State</CardTitle>
            <CardDescription>Breathing pulse + aria-busy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-0">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </CardContent>
        </Card>

        {/* Error */}
        <Card state="error" className="p-5">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm text-destructive">Error State</CardTitle>
            <CardDescription>Shake + destructive border</CardDescription>
          </CardHeader>
          <CardContent className="px-0 text-xs text-muted-foreground">
            Lateral shake runs once. Border tint: destructive/20.
          </CardContent>
        </Card>

        {/* Success */}
        <Card state="success" className="p-5">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-sm text-success">Success State</CardTitle>
            <CardDescription>Spring border + success tint</CardDescription>
          </CardHeader>
          <CardContent className="px-0 text-xs text-muted-foreground">
            Border tint: success/20 with --ease-spring transition.
          </CardContent>
        </Card>
      </div>

      {/* Spotlight */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <CardSpotlight interactive className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Spotlight Variant</CardTitle>
            <CardDescription>Hover to see the pointer-tracked radial highlight.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 text-sm text-muted-foreground">
            The highlight uses a semantic token expression, not a raw color. Reduced-motion hides it
            entirely.
          </CardContent>
        </CardSpotlight>

        <CardSpotlight interactive className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Spotlight + Content</CardTitle>
            <CardDescription>
              Highlight passes through clicks (pointer-events: none).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-0">
            <Button size="sm">Action Button</Button>
            <p className="text-xs text-muted-foreground">
              Interactive content works normally inside a spotlight card.
            </p>
          </CardContent>
        </CardSpotlight>
      </div>
    </ShowcaseSection>
  );
}
