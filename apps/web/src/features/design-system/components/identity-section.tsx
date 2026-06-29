import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@pumni/ui/layout';
import { SegmentedPicker } from '@pumni/ui/form';
import { ACCENTS, GLASS_LEVELS, DENSITIES, usePersonalization } from '@pumni/ui/identity';
import { cn } from '@pumni/ui/lib/cn';
import { ShowcaseSection } from './showcase-section';

export function IdentitySection() {
  const { accent, glass, density, setAccent, setGlass, setDensity } = usePersonalization();

  return (
    <ShowcaseSection
      id="identity-personalization"
      title="Identity & Personalization"
      description="Profile branding and personalization settings: accent triggers, surface intensity levels, and text/UI density."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Accent personalization */}
        <Card>
          <CardHeader>
            <CardTitle>Accent personalizations</CardTitle>
            <CardDescription>Brand color overrides across actions and outlines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {ACCENTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  data-accent={value}
                  aria-label={value}
                  aria-pressed={accent === value}
                  onClick={() => setAccent(value)}
                  className={cn(
                    'size-8 cursor-pointer rounded-full border-2 bg-primary capitalize transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    accent === value ? 'scale-105 border-foreground' : 'border-transparent',
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Applies <code>data-accent</code> attribute to scope color mixes. Accent is currently:{' '}
              <span className="font-mono font-semibold text-foreground capitalize">
                {accent || 'coral (default)'}
              </span>
              .
            </p>
          </CardContent>
        </Card>

        {/* Surface intensity personalization */}
        <Card>
          <CardHeader>
            <CardTitle>Surface Intensity</CardTitle>
            <CardDescription>Adjust transparency fallbacks and blur weights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SegmentedPicker
              aria-label="Glass level"
              options={GLASS_LEVELS}
              value={glass}
              onChange={setGlass}
            />
            <p className="text-xs text-muted-foreground">
              Current intensity:{' '}
              <span className="font-mono font-semibold text-foreground capitalize">
                {glass || 'default'}
              </span>
              . Applies <code>data-glass</code> parameter to override global variables.
            </p>
          </CardContent>
        </Card>

        {/* Data Density personalization */}
        <Card>
          <CardHeader>
            <CardTitle>Data Density</CardTitle>
            <CardDescription>
              Adjust control spacing and height for high-density layouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SegmentedPicker
              aria-label="Density"
              options={DENSITIES}
              value={density}
              onChange={setDensity}
            />
            <p className="text-xs text-muted-foreground">
              Current density:{' '}
              <span className="font-mono font-semibold text-foreground capitalize">
                {density || 'comfortable'}
              </span>
              . Applies <code>data-density</code> parameter to override control height (h-control:
              36px ↔ 32px) and paddings.
            </p>
          </CardContent>
        </Card>
      </div>
    </ShowcaseSection>
  );
}
