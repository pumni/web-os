import * as React from 'react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Separator,
  SegmentedPicker,
  ACCENTS,
  GLASS_LEVELS,
  DENSITIES,
  usePersonalization,
  cn,
} from '@pumni/ui';
import { ShowcaseSection } from './showcase-section';

export function IdentitySection() {
  const { accent, glass, density, setAccent, setGlass, setDensity } = usePersonalization();

  return (
    <ShowcaseSection
      id="identity-personalization"
      title="Identity & Personalization"
      description="Profile branding and personalization settings: user avatars, accent triggers, and surface intensity levels."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Avatars */}
        <Card>
          <CardHeader>
            <CardTitle>Avatars</CardTitle>
            <CardDescription>User profile assets and badge combinations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Avatar className="size-10">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                  alt="Jane"
                />
                <AvatarFallback>JN</AvatarFallback>
                <AvatarBadge className="size-3 border-2 border-background bg-success" />
              </Avatar>
              <Avatar className="size-8">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
            <Separator />
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-muted-foreground">
                Avatar Group
              </span>
              <AvatarGroup>
                <Avatar>
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                    alt="Jane"
                  />
                  <AvatarFallback>JN</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>PN</AvatarFallback>
                </Avatar>
                <AvatarGroupCount>+3</AvatarGroupCount>
              </AvatarGroup>
            </div>
          </CardContent>
        </Card>

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
