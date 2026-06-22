import { Button } from '@pumni/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardSpotlight, CardTitle } from '@pumni/ui/layout';
import { Skeleton } from '@pumni/ui/feedback';
import { ShowcaseSection } from './showcase-section';

export function CardsSection() {
  return (
    <ShowcaseSection
      id="card-states"
      title="Card States & Spotlight"
      description="State machine (idle/loading/error/success) and pointer-tracked spotlight variant."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
