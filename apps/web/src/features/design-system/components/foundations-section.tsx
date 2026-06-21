import {
  apcaContrast,
  apcaLuminance,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardWell,
  cn,
  GlassSurface,
  Input,
  Label,
  Separator,
  Window,
} from '@pumni/ui';
import * as React from 'react';
import { ShowcaseSection } from './showcase-section';

interface FoundationsSectionProps {
  previewContrast: 'standard' | 'more';
  setPreviewContrast: React.Dispatch<React.SetStateAction<'standard' | 'more'>>;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16) / 255,
    Number.parseInt(hex.slice(3, 5), 16) / 255,
    Number.parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export function FoundationsSection({
  previewContrast,
  setPreviewContrast,
}: FoundationsSectionProps) {
  const [previewTransparency, setPreviewTransparency] = React.useState<'standard' | 'reduced'>(
    'standard',
  );
  const [apcaFg, setApcaFg] = React.useState('#0a0a0a');
  const [apcaBg, setApcaBg] = React.useState('#fafafa');

  return (
    <ShowcaseSection
      id="foundations"
      title="Foundations"
      description="Core design tokens: semantic colors, typography scale, radius knobs, elevation, and z-index layers."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Semantic Palette</CardTitle>
            <CardDescription>Theme-aware color roles consumed by UI components.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Swatch
              label="Background"
              className="border border-border bg-background text-foreground"
            />
            <Swatch label="Foreground" className="bg-foreground text-background" />
            <Swatch label="Card" className="border border-border bg-card text-card-foreground" />
            <Swatch
              label="Popover"
              className="border border-border bg-popover text-popover-foreground"
            />
            <Swatch label="Primary" className="bg-primary text-primary-foreground" />
            <Swatch label="Secondary" className="bg-secondary text-secondary-foreground" />
            <Swatch label="Muted" className="bg-muted text-muted-foreground" />
            <Swatch label="Accent" className="bg-accent text-accent-foreground" />
            <Swatch label="Success" className="bg-success text-success-foreground" />
            <Swatch label="Warning" className="bg-warning text-warning-foreground" />
            <Swatch label="Destructive" className="bg-destructive text-destructive-foreground" />
            <Swatch
              label="Border"
              className="flex items-center justify-center bg-border text-xs text-foreground"
            />
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Scale</CardTitle>
            <CardDescription>Typography steps and paired line-heights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between border-b pb-1.5">
              <span className="text-xs text-muted-foreground">Scale</span>
              <span className="text-xs text-muted-foreground">Example</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs text-muted-foreground">text-4xl</span>
              <span className="text-4xl font-bold tracking-tight">OS Title</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs text-muted-foreground">text-3xl</span>
              <span className="text-3xl font-semibold">Section Header</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs text-muted-foreground">text-2xl</span>
              <span className="text-2xl font-semibold">Sub-heading</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs text-muted-foreground">text-xl</span>
              <span className="text-xl font-medium">Card Header</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs text-muted-foreground">text-lg</span>
              <span className="text-lg font-medium">Lead text</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs text-muted-foreground">text-base</span>
              <span className="text-base text-foreground">Body default</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs text-muted-foreground">text-sm</span>
              <span className="text-sm text-muted-foreground">Subdued detail</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs text-muted-foreground">text-xs</span>
              <span className="text-xs text-muted-foreground">Captions & labels</span>
            </div>
          </CardContent>
        </Card>

        {/* Radius Scale */}
        <Card>
          <CardHeader>
            <CardTitle>Radius Scale</CardTitle>
            <CardDescription>Scale calculated dynamically off a single base knob.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RadiusDemo label="rounded-xs" className="rounded-xs" />
            <RadiusDemo label="rounded-sm" className="rounded-sm" />
            <RadiusDemo label="rounded-md" className="rounded-md" />
            <RadiusDemo label="rounded-lg" className="rounded-lg" />
            <RadiusDemo label="rounded-xl" className="rounded-xl" />
            <RadiusDemo label="rounded-2xl" className="rounded-2xl" />
            <RadiusDemo label="rounded-3xl" className="rounded-3xl" />
            <RadiusDemo label="rounded-full" className="rounded-full" />
          </CardContent>
        </Card>

        {/* Layering & Elevation */}
        <Card>
          <CardHeader>
            <CardTitle>Layering (z-index)</CardTitle>
            <CardDescription>The global layering order for overlap coordination.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between border-b pb-1 text-xs font-medium text-muted-foreground">
              <span>Layer Role</span>
              <span>Utility Name / Value</span>
            </div>
            {[
              { role: 'Toasts (always frontmost)', token: 'z-toast (1200)' },
              { role: 'Command Palette', token: 'z-command (1100)' },
              { role: 'Overlay Scrim', token: 'z-overlay (900)' },
              { role: 'Floating Dock', token: 'z-dock (800)' },
              { role: 'Top App Bar', token: 'z-topbar (850)' },
              { role: 'OS Windows', token: 'z-window (100)' },
            ].map(({ role, token }) => (
              <div key={token} className="flex justify-between">
                <span>{role}</span>
                <span className="font-mono text-xs">{token}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* APCA Contrast Verification */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              APCA Contrast Verification
            </h3>
            <p className="text-sm text-muted-foreground">
              Perceptual contrast (APCA Lc) across surface opacities, accent layers, and
              high-contrast mode. This is the single contrast source of truth — APCA, not WCAG 2.x.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-md border bg-card p-1">
              <Button
                type="button"
                size="sm"
                variant={previewTransparency === 'standard' ? 'secondary' : 'ghost'}
                aria-pressed={previewTransparency === 'standard'}
                onClick={() => setPreviewTransparency('standard')}
              >
                Standard
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewTransparency === 'reduced' ? 'secondary' : 'ghost'}
                aria-pressed={previewTransparency === 'reduced'}
                onClick={() => setPreviewTransparency('reduced')}
              >
                Opaque Solid
              </Button>
            </div>
            <div className="inline-flex rounded-md border bg-card p-1">
              <Button
                type="button"
                size="sm"
                variant={previewContrast === 'standard' ? 'secondary' : 'ghost'}
                aria-pressed={previewContrast === 'standard'}
                onClick={() => setPreviewContrast('standard')}
              >
                Normal Contrast
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewContrast === 'more' ? 'secondary' : 'ghost'}
                aria-pressed={previewContrast === 'more'}
                onClick={() => setPreviewContrast('more')}
              >
                High Contrast
              </Button>
            </div>
          </div>
        </div>

        <div
          className="glass-a11y-preview relative min-h-80 overflow-hidden rounded-xl border bg-background p-6"
          data-transparency={previewTransparency}
          data-contrast={previewContrast}
        >
          {/* Animated decorative blobs in background */}
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-24 size-96 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-(--desktop-blob-secondary) opacity-55 blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 size-96 rounded-full bg-(--desktop-blob-accent) opacity-50 blur-3xl" />
            <div className="absolute inset-0 bg-muted/30" />
          </div>

          <div className="relative grid gap-4 md:grid-cols-2">
            <GlassSurface variant="panel" className="flex min-h-64 flex-col justify-between p-5">
              <div className="space-y-2">
                <span className="case-upper text-xs font-semibold text-primary">
                  APCA Contrast Gate
                </span>
                <h4 className="text-2xl font-bold tracking-tight text-foreground">Lc 60 / Lc 25</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  All semantic color pairs are gated: body text ≥ Lc 60, UI elements ≥ Lc 25. APCA
                  is perceptually accurate across both light and dark backgrounds.
                </p>
              </div>
              <div className="flex gap-2">
                <Badge tone="success" size="sm">
                  Lc 60+ Text
                </Badge>
                <Badge tone="primary" size="sm">
                  Lc 25+ UI
                </Badge>
              </div>
            </GlassSurface>

            <Window title="Surface Contrast Monitor" className="min-h-64">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">APCA Gate Status</span>
                  <Badge tone={previewContrast === 'more' ? 'warning' : 'success'} size="sm">
                    {previewContrast === 'more' ? 'Contrast Boosted' : 'Verified'}
                  </Badge>
                </div>
                <Input aria-label="Quick focus text" placeholder="Focus outline validation" />
                <div className="flex gap-2">
                  <Button className="grow">Primary Action</Button>
                  <Button variant="outline">Dismiss</Button>
                </div>
              </div>
            </Window>
          </div>

          <Separator className="my-6" />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">APCA Contrast Utility</h4>
            <p className="text-xs text-muted-foreground">
              <code>apcaContrast</code> and <code>apcaLuminance</code> from <code>@pumni/ui</code>{' '}
              compute perceptual contrast (Lc) using the APCA algorithm. Drag the color pickers to
              see live values.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="apca-fg" className="text-xs">
                  Foreground
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    id="apca-fg"
                    type="color"
                    value={apcaFg}
                    onChange={(e) => setApcaFg(e.target.value)}
                    className="size-8 cursor-pointer rounded border bg-transparent"
                  />
                  <span className="font-mono text-xs text-muted-foreground">{apcaFg}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="apca-bg" className="text-xs">
                  Background
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    id="apca-bg"
                    type="color"
                    value={apcaBg}
                    onChange={(e) => setApcaBg(e.target.value)}
                    className="size-8 cursor-pointer rounded border bg-transparent"
                  />
                  <span className="font-mono text-xs text-muted-foreground">{apcaBg}</span>
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-3 rounded-lg border p-3"
              style={{ backgroundColor: apcaBg }}
            >
              <span className="text-lg font-bold" style={{ color: apcaFg }}>
                Aa
              </span>
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold" style={{ color: apcaFg }}>
                    {(() => {
                      const fgRgb = hexToRgb(apcaFg);
                      const bgRgb = hexToRgb(apcaBg);
                      const val = apcaContrast(fgRgb, bgRgb);
                      const absVal = Math.abs(val);
                      const polarity = val > 0 ? 'BoW' : val < 0 ? 'WoB' : '';
                      return `Lc ${absVal.toFixed(1)} ${polarity}`.trim();
                    })()}
                  </span>
                  {(() => {
                    const val = Math.abs(apcaContrast(hexToRgb(apcaFg), hexToRgb(apcaBg)));
                    if (val >= 60)
                      return (
                        <Badge tone="success" size="sm">
                          Pass — Text
                        </Badge>
                      );
                    if (val >= 25)
                      return (
                        <Badge tone="warning" size="sm">
                          Pass — UI
                        </Badge>
                      );
                    return (
                      <Badge tone="destructive" size="sm">
                        Fail
                      </Badge>
                    );
                  })()}
                </div>
                <span className="block" style={{ color: apcaFg, opacity: 0.7 }}>
                  Project gate: Lc 60+ = Text, Lc 25+ = UI elements
                </span>
                <span className="font-mono text-[10px] opacity-50" style={{ color: apcaFg }}>
                  {(() => {
                    const fgLum = apcaLuminance(...hexToRgb(apcaFg));
                    const bgLum = apcaLuminance(...hexToRgb(apcaBg));
                    return `Lum fg=${fgLum.toFixed(3)} bg=${bgLum.toFixed(3)}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShowcaseSection>
  );
}

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div
      className={cn(
        'flex h-12 flex-col justify-between rounded-md p-2 text-[11px] leading-none font-medium',
        className,
      )}
    >
      <span>{label}</span>
      <span className="self-end text-[10px] opacity-75">Aa</span>
    </div>
  );
}

function RadiusDemo({ label, className }: { label: string; className: string }) {
  return (
    <CardWell className="flex flex-col items-center gap-1.5 p-2">
      <div className={cn('size-12 border-2 border-primary bg-background shadow-xs', className)} />
      <span className="w-full truncate text-center font-mono text-[10px] text-muted-foreground">
        {label}
      </span>
    </CardWell>
  );
}
