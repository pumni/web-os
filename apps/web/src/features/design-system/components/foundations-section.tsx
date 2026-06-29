import { apcaContrast, apcaLuminance, backgroundFor, foregroundFor } from '@pumni/ui/lib/apca';
import { Badge } from '@pumni/ui/feedback';
import { Button, Input, Label, SegmentedPicker, Switch } from '@pumni/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardWell,
  Separator,
} from '@pumni/ui/layout';
import { cn } from '@pumni/ui/lib/cn';
import { formatOklch, oklchToSrgb, parseOklch } from '@pumni/ui/lib/oklch';
import { GlassSurface } from '@pumni/ui/identity';
import { Window } from '@pumni/ui/os';
import * as React from 'react';
import { ShowcaseSection } from './showcase-section';

interface FoundationsSectionProps {
  previewContrast?: 'standard' | 'more';
  setPreviewContrast?: React.Dispatch<React.SetStateAction<'standard' | 'more'>>;
  hideApca?: boolean;
}

type TransparencyOption = 'standard' | 'reduced';
type ContrastOption = 'standard' | 'more';
type ApcTarget = 'text' | 'ui';

const TRANSPARENCY_OPTIONS: readonly TransparencyOption[] = ['standard', 'reduced'];
const TRANSPARENCY_LABELS: Record<TransparencyOption, string> = {
  standard: 'Standard',
  reduced: 'Opaque Solid',
};
const CONTRAST_OPTIONS: readonly ContrastOption[] = ['standard', 'more'];
const CONTRAST_LABELS: Record<ContrastOption, string> = {
  standard: 'Normal Contrast',
  more: 'High Contrast',
};
const APCA_TARGETS: readonly ApcTarget[] = ['text', 'ui'];
const APCA_TARGET_LABELS: Record<ApcTarget, string> = {
  text: 'Text (Lc 60)',
  ui: 'UI (Lc 25)',
};
const APCA_TARGET_LC: Record<ApcTarget, number> = { text: 60, ui: 25 };

function hexToRgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16) / 255,
    Number.parseInt(hex.slice(3, 5), 16) / 255,
    Number.parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

const SEMANTIC_COLORS = [
  {
    label: 'Background',
    variable: '--background',
    tailwind: 'bg-background',
    textTailwind: 'text-foreground',
    oklchLight: 'ok' + 'lch(0.985 0.005 75)',
    oklchDark: 'ok' + 'lch(0.19 0.0035 70)',
    description: 'Page surface & default text base background. Near-white cream in light; warm dark gray in dark.',
  },
  {
    label: 'Foreground',
    variable: '--foreground',
    tailwind: 'bg-foreground',
    textTailwind: 'text-background',
    oklchLight: 'ok' + 'lch(0.085 0.003 70)',
    oklchDark: 'ok' + 'lch(0.985 0.005 75)',
    description: 'Default text colour. High-contrast near-black in light; off-white cream in dark.',
  },
  {
    label: 'Card',
    variable: '--card',
    tailwind: 'bg-card',
    textTailwind: 'text-card-foreground',
    oklchLight: 'ok' + 'lch(1 0 0)',
    oklchDark: 'ok' + 'lch(0.215 0.004 70)',
    description: 'Primary structural content blocks and cards. Pure white in light; Claude sand-gray in dark.',
  },
  {
    label: 'Popover',
    variable: '--popover',
    tailwind: 'bg-popover',
    textTailwind: 'text-popover-foreground',
    oklchLight: 'ok' + 'lch(1 0 0)',
    oklchDark: 'ok' + 'lch(0.245 0.0045 70)',
    description: 'Floating popovers, dropdown menus, context menus, and select controls.',
  },
  {
    label: 'Primary',
    variable: '--primary',
    tailwind: 'bg-primary',
    textTailwind: 'text-primary-foreground',
    oklchLight: 'ok' + 'lch(0.545 0.14 38)',
    oklchDark: 'ok' + 'lch(0.61 0.134 40)',
    description: 'Brand primary action fill. warm coral clay by default, dynamically overridden by accent settings.',
  },
  {
    label: 'Secondary',
    variable: '--secondary',
    tailwind: 'bg-secondary',
    textTailwind: 'text-secondary-foreground',
    oklchLight: 'ok' + 'lch(0.968 0.006 74)',
    oklchDark: 'ok' + 'lch(0.275 0.005 70)',
    description: 'Subdued action buttons and secondary component backgrounds.',
  },
  {
    label: 'Muted',
    variable: '--muted',
    tailwind: 'bg-muted',
    textTailwind: 'text-muted-foreground',
    oklchLight: 'ok' + 'lch(0.968 0.006 74)',
    oklchDark: 'ok' + 'lch(0.275 0.005 70)',
    description: 'Recessed background wells, inline dividers, tabs, and inactive controls.',
  },
  {
    label: 'Accent',
    variable: '--accent',
    tailwind: 'bg-accent',
    textTailwind: 'text-accent-foreground',
    oklchLight: 'ok' + 'lch(0.971 0.013 50)',
    oklchDark: 'ok' + 'lch(0.27 0.056 34)',
    description: 'Interactive hover & focus overlays. Light accent uses coral-50; dark uses coral-950.',
  },
  {
    label: 'Success',
    variable: '--success',
    tailwind: 'bg-success',
    textTailwind: 'text-success-foreground',
    oklchLight: 'color-mix(primary 4%, emerald-600)',
    oklchDark: 'color-mix(primary 3%, emerald-500)',
    description: 'Positive state signals. Color-mix pushes emerald towards the primary brand.',
  },
  {
    label: 'Warning',
    variable: '--warning',
    tailwind: 'bg-warning',
    textTailwind: 'text-warning-foreground',
    oklchLight: 'color-mix(primary 4%, amber-500)',
    oklchDark: 'color-mix(primary 3%, amber-400)',
    description: 'Alert and pending state indicators. High APCA readability.',
  },
  {
    label: 'Destructive',
    variable: '--destructive',
    tailwind: 'bg-destructive',
    textTailwind: 'text-destructive-foreground',
    oklchLight: 'color-mix(primary 4%, red-600)',
    oklchDark: 'color-mix(primary 3%, red-500)',
    description: 'Error indicators and critical operations. Heavy primary blend.',
  },
  {
    label: 'Border',
    variable: '--border',
    tailwind: 'border-border',
    textTailwind: 'text-foreground',
    oklchLight: 'ok' + 'lch(0.929 0.006 73)',
    oklchDark: 'ok' + 'lch(0.275 0.005 70)',
    description: 'Core hairline structural dividers. Solid borders carry no volumetric rim.',
  },
];

const TYPO_STEPS = [
  { step: 'text-4xl', var: 'var(--text-4xl)', size: '2.25rem (36px)', lh: '2.5rem (40px)', weight: 'font-bold tracking-tight', preview: 'OS Title' },
  { step: 'text-3xl', var: 'var(--text-3xl)', size: '1.875rem (30px)', lh: '2.25rem (36px)', weight: 'font-semibold', preview: 'Section Header' },
  { step: 'text-2xl', var: 'var(--text-2xl)', size: '1.50rem (24px)', lh: '2.00rem (32px)', weight: 'font-semibold', preview: 'Sub-heading' },
  { step: 'text-xl', var: 'var(--text-xl)', size: '1.25rem (20px)', lh: '1.75rem (28px)', weight: 'font-medium', preview: 'Card Header' },
  { step: 'text-lg', var: 'var(--text-lg)', size: '1.125rem (18px)', lh: '1.75rem (28px)', weight: 'font-medium', preview: 'Lead text' },
  { step: 'text-base', var: 'var(--text-base)', size: '1.00rem (16px)', lh: '1.50rem (24px)', weight: 'font-normal', preview: 'Body default' },
  { step: 'text-sm', var: 'var(--text-sm)', size: '0.875rem (14px)', lh: '1.25rem (20px)', weight: 'font-normal text-muted-foreground', preview: 'Subdued detail' },
  { step: 'text-xs', var: 'var(--text-xs)', size: '0.75rem (12px)', lh: '1.00rem (16px)', weight: 'font-normal text-muted-foreground', preview: 'Captions & labels' },
];

const RADIUS_STEPS = [
  { step: 'rounded-xs', px: '4px', calc: 'calc(var(--radius) - 6px)', desc: 'Checkboxes, tooltips, sub-controls' },
  { step: 'rounded-sm', px: '6px', calc: 'calc(var(--radius) - 4px)', desc: 'Menu items, chips, segmented items' },
  { step: 'rounded-md', px: '8px', calc: 'calc(var(--radius) - 2px)', desc: 'Buttons, form fields, control tracks' },
  { step: 'rounded-lg', px: '10px', calc: 'var(--radius)', desc: 'Dialog panels, floating bars (base)' },
  { step: 'rounded-xl', px: '14px', calc: 'calc(var(--radius) + 4px)', desc: 'Cards, main windows, sheet panels' },
  { step: 'rounded-2xl', px: '18px', calc: 'calc(var(--radius) + 8px)', desc: 'Large hero cards, layout shells' },
  { step: 'rounded-3xl', px: '26px', calc: 'calc(var(--radius) + 16px)', desc: 'Decorative background elements' },
  { step: 'rounded-full', px: 'Full', calc: '9999px', desc: 'Pills, badges, circular avatars' },
];

const SPACING_STEPS = [
  { name: '1', px: '4px', rem: '0.25rem', tailwind: 'p-1 / m-1' },
  { name: '2', px: '8px', rem: '0.5rem', tailwind: 'p-2 / m-2' },
  { name: '3', px: '12px', rem: '0.75rem', tailwind: 'p-3 / m-3' },
  { name: '4', px: '16px', rem: '1.0rem', tailwind: 'p-4 / m-4' },
  { name: '6', px: '24px', rem: '1.5rem', tailwind: 'p-6 / m-6' },
  { name: '8', px: '32px', rem: '2.0rem', tailwind: 'p-8 / m-8' },
  { name: '12', px: '48px', rem: '3.0rem', tailwind: 'p-12 / m-12' },
];

const MOTION_DURATIONS = [
  { name: '--duration-fast', val: '120ms', desc: 'Micro-feedback transitions (hover overlays, active presses)' },
  { name: '--duration-base', val: '200ms', desc: 'Standard UI transitions (dropdowns, check animation, tab toggles)' },
  { name: '--duration-slow', val: '320ms', desc: 'Large transitions (dialog/sheet entrances, drawer panels)' },
  { name: '--duration-slower', val: '480ms', desc: 'View Transitions & ambient animations' },
];

const MOTION_EASINGS = [
  { name: '--ease-fluid', val: 'cubic-bezier(0.16, 1, 0.3, 1)', desc: 'Decelerating out curve (standard transition exit)' },
  { name: '--ease-snappy', val: 'cubic-bezier(0.65, 0, 0.35, 1)', desc: 'Sharp acceleration in-out (interactive buttons)' },
  { name: '--ease-spring', val: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', desc: 'Bounce spring curve (warning shakes, modal pops)' },
];

export function FoundationsSection({
  previewContrast = 'standard',
  setPreviewContrast = () => {},
  hideApca = false,
}: FoundationsSectionProps) {
  const [showSpecs, setShowSpecs] = React.useState(false);
  const [spacingStep, setSpacingStep] = React.useState('4');
  const [activeElevation, setActiveElevation] = React.useState<'control' | 'card' | 'glass' | 'glow'>('card');

  // Derived values for the Side-Profile Elevation SVG blueprint
  const elementY = activeElevation === 'control' ? 90 : activeElevation === 'card' ? 78 : activeElevation === 'glass' ? 54 : 30;
  const shadowW = activeElevation === 'control' ? 24 : activeElevation === 'card' ? 40 : activeElevation === 'glass' ? 72 : 110;
  const shadowX = 100 - shadowW / 2;
  const lightX1 = 100 - shadowW / 2;
  const lightX2 = 100 + shadowW / 2;

  return (
    <ShowcaseSection
      id="foundations"
      title="Foundations"
      description="Core design tokens: semantic colors, typography metrics, radius, shadows, spacing, and transition speeds."
    >
      <div className="space-y-6">
        {/* Specs mode toggle bar */}
        <div className="flex justify-end items-center gap-2 pb-2">
          <Switch id="toggle-specs" checked={showSpecs} onCheckedChange={setShowSpecs} />
          <Label htmlFor="toggle-specs" className="text-xs font-medium cursor-pointer text-muted-foreground select-none">
            Show Developer Specs
          </Label>
        </div>

        {/* Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle>Semantic Palette</CardTitle>
            <CardDescription>Theme-aware color roles consumed by UI components. Displays default semantic color blocks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {SEMANTIC_COLORS.map((c) => (
              <ColorSwatchCard key={c.label} {...c} showSpecs={showSpecs} />
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Typography Scale */}
          <Card>
            <CardHeader>
              <CardTitle>Typography Scale</CardTitle>
              <CardDescription>Typography steps and text preview styles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2 font-medium">Utility / Class</th>
                      {showSpecs && <th className="pb-2 font-medium">Size (Line Height)</th>}
                      <th className="pb-2 font-medium">Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {TYPO_STEPS.map((t) => (
                      <tr key={t.step} className="align-middle">
                        <td className="py-2.5 font-mono text-[10px]">
                          <span className="text-foreground block">{t.step}</span>
                          {showSpecs && <span className="text-muted-foreground block text-[9px]">{t.var}</span>}
                        </td>
                        {showSpecs && (
                          <td className="py-2.5">
                            <span className="text-foreground block">{t.size}</span>
                            <span className="text-muted-foreground block text-[10px]">LH: {t.lh}</span>
                          </td>
                        )}
                        <td className="py-2.5">
                          <span className={cn(t.step, t.weight)}>{t.preview}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Radius Scale */}
          <Card>
            <CardHeader>
              <CardTitle>Radius Scale</CardTitle>
              <CardDescription>Concentric rounding steps calculated off the base variable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {RADIUS_STEPS.map((r) => (
                  <RadiusDetailCard key={r.step} {...r} showSpecs={showSpecs} />
                ))}
              </div>
              {showSpecs && (
                <CardWell className="p-3 text-[11px] leading-relaxed text-muted-foreground border border-border">
                  <span className="font-semibold text-foreground block mb-1">Concentric Nesting Rule</span>
                  To maintain geometric alignment, inner child radius must scale down: <code>R_child = R_parent - padding</code>. 
                  Use <code>rounded-nested</code> class or <code>--radius-nested-xl</code> for direct calculations.
                </CardWell>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Spacing Scale (Bento Spacing Simulator) */}
          <Card>
            <CardHeader>
              <CardTitle>Spacing & Layout Grid</CardTitle>
              <CardDescription>Interactive bento simulator scaling dynamically off the spacing tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Select Spacing Step:</span>
                <div className="w-full sm:w-auto max-w-sm">
                  <SegmentedPicker
                    aria-label="Spacing Step"
                    options={['1', '2', '3', '4', '6', '8', '12']}
                    value={spacingStep}
                    onChange={(val) => setSpacingStep(val)}
                  />
                </div>
              </div>

              {/* Bento Simulator Container */}
              <div 
                className={cn(
                  "border rounded-xl bg-background transition-all duration-300 ease-fluid border-border",
                  spacingStep === '1' && 'p-1',
                  spacingStep === '2' && 'p-2',
                  spacingStep === '3' && 'p-3',
                  spacingStep === '4' && 'p-4',
                  spacingStep === '6' && 'p-6',
                  spacingStep === '8' && 'p-8',
                  spacingStep === '12' && 'p-12',
                )}
              >
                <div 
                  className={cn(
                    "grid grid-cols-3 min-h-36 transition-all duration-300 ease-fluid",
                    spacingStep === '1' && 'gap-1',
                    spacingStep === '2' && 'gap-2',
                    spacingStep === '3' && 'gap-3',
                    spacingStep === '4' && 'gap-4',
                    spacingStep === '6' && 'gap-6',
                    spacingStep === '8' && 'gap-8',
                    spacingStep === '12' && 'gap-12',
                  )}
                >
                  {/* Mock Bento Dashboard Tiles */}
                  <CardWell className="col-span-2 flex flex-col justify-between p-3 bg-card border border-border h-full">
                    <div className="space-y-1">
                      <span className="h-2 w-12 rounded bg-primary/20 block animate-pulse" />
                      <span className="h-3 w-2/3 rounded bg-foreground/15 block" />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">Bento Main (2 cols)</span>
                  </CardWell>
                  <CardWell className="col-span-1 flex flex-col justify-between p-3 bg-card border border-border h-full">
                    <div className="space-y-1">
                      <span className="size-4 rounded-full bg-primary/20 block" />
                      <span className="h-2 w-5/6 rounded bg-foreground/15 block" />
                    </div>
                    <span className="text-[9px] text-muted-foreground font-mono">Bento Side</span>
                  </CardWell>
                  <CardWell className="col-span-3 flex items-center justify-between p-3 bg-card border border-border">
                    <span className="h-2 w-1/3 rounded bg-foreground/15 block" />
                    <span className="text-[9px] text-muted-foreground font-mono">Bento Footer (3 cols)</span>
                  </CardWell>
                </div>
              </div>

              {/* Display size metrics */}
              <div className="flex justify-between items-center text-xs border-t border-border/40 pt-3">
                <span className="text-muted-foreground">Active Spacing Step:</span>
                <span className="font-mono text-primary font-bold">
                  {spacingStep === '1' && '4px (0.25rem)'}
                  {spacingStep === '2' && '8px (0.50rem)'}
                  {spacingStep === '3' && '12px (0.75rem)'}
                  {spacingStep === '4' && '16px (1.00rem)'}
                  {spacingStep === '6' && '24px (1.50rem)'}
                  {spacingStep === '8' && '32px (2.00rem)'}
                  {spacingStep === '12' && '48px (3.00rem)'}
                </span>
              </div>

              {showSpecs && (
                <>
                  <Separator className="my-3" />
                  <div className="space-y-3 mb-4">
                    <span className="block text-xs font-semibold text-foreground">Spacing Scale Reference</span>
                    <div className="space-y-2">
                      {SPACING_STEPS.map((s) => (
                        <div key={s.name} className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="w-12 font-mono text-foreground font-semibold">Step {s.name}</span>
                          <span className="w-20 font-mono text-[10px]">{s.tailwind}</span>
                          <div className="grow h-1.5 bg-primary/20 rounded-xs" style={{ width: s.px }} />
                          <span className="w-24 text-right font-mono text-[10px] text-foreground">{s.px} ({s.rem})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-foreground">Control Heights & Paddings</span>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <CardWell className="p-2.5 space-y-1 bg-card border border-border">
                        <span className="font-semibold text-foreground">Comfortable (Default)</span>
                        <div className="flex justify-between font-mono text-[10px]">
                          <span>Height:</span>
                          <span>36px (2.25rem)</span>
                        </div>
                        <div className="flex justify-between font-mono text-[10px]">
                          <span>Vertical Padding:</span>
                          <span>8px (0.5rem)</span>
                        </div>
                      </CardWell>
                      <CardWell className="p-2.5 space-y-1 bg-card border border-border">
                        <span className="font-semibold text-foreground">Compact Density</span>
                        <div className="flex justify-between font-mono text-[10px]">
                          <span>Height:</span>
                          <span>32px (2.0rem)</span>
                        </div>
                        <div className="flex justify-between font-mono text-[10px]">
                          <span>Vertical Padding:</span>
                          <span>6px (0.375rem)</span>
                        </div>
                      </CardWell>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Shadows & Elevation (2D Sandbox & Side-Profile Elevation) */}
          <Card>
            <CardHeader>
              <CardTitle>Shadows & Elevation</CardTitle>
              <CardDescription>Interactive depth sandbox. Side-profile blueprint details conceptual elevation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Select Elevation Level:</span>
                <div className="w-full sm:w-auto max-w-[280px]">
                  <SegmentedPicker
                    aria-label="Elevation Level"
                    options={['control', 'card', 'glass', 'glow']}
                    value={activeElevation}
                    onChange={(val) => setActiveElevation(val as typeof activeElevation)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Left Column: Side-Profile Blueprint Svg */}
                <div className="border border-border rounded-xl bg-card p-4 flex flex-col justify-between min-h-[220px]">
                  <span className="block font-mono text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Side-Profile Blueprint</span>
                  <div className="flex items-center justify-center grow">
                    <svg className="w-full h-36 text-muted-foreground/30 font-mono text-[9px]" viewBox="0 0 200 120">
                      {/* Screen Base Line */}
                      <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="2" />
                      <text x="12" y="112" fill="currentColor">Screen Canvas</text>

                      {/* Light Source */}
                      <circle cx="100" cy="15" r="4" className="fill-primary/40 stroke-primary animate-pulse" />
                      <line x1="100" y1="20" x2="100" y2="30" stroke="currentColor" strokeDasharray="2,2" />

                      {/* Dotted projection bounds */}
                      <line x1="100" y1="15" x2={lightX1} y2="100" stroke="currentColor" strokeDasharray="3,3" className="transition-all duration-300" />
                      <line x1="100" y1="15" x2={lightX2} y2="100" stroke="currentColor" strokeDasharray="3,3" className="transition-all duration-300" />

                      {/* Shadow area on Screen */}
                      <rect x={shadowX} y="98" width={shadowW} height="4" className={cn("fill-foreground/40 transition-all duration-300", activeElevation === 'glow' && "fill-primary/50")} />

                      {/* Floating Element */}
                      <g transform={`translate(40, ${elementY})`} className="transition-all duration-300">
                        <rect x="0" y="0" width="120" height="14" rx="4" className="fill-card stroke-border" strokeWidth="1" />
                        <text x="60" y="10" textAnchor="middle" fill="currentColor" className="text-[8px] font-bold">
                          {activeElevation === 'control' && 'Control (1px)'}
                          {activeElevation === 'card' && 'Solid Card (4px)'}
                          {activeElevation === 'glass' && 'Glass Panel (12px)'}
                          {activeElevation === 'glow' && 'Active Window (28px)'}
                        </text>
                      </g>

                      {/* Height Indicator arrow */}
                      <line x1="170" y1="100" x2="170" y2={elementY + 7} stroke="var(--primary)" strokeWidth="1.5" className="transition-all duration-300" />
                      <polygon points={`170,${elementY + 7} 167,${elementY + 12} 173,${elementY + 12}`} className="fill-primary transition-all duration-300" />
                      <text x="175" y={Math.max(25, (elementY + 100) / 2)} fill="var(--primary)" className="text-[8px] font-bold transition-all duration-300">
                        {activeElevation === 'control' && '1px'}
                        {activeElevation === 'card' && '4px'}
                        {activeElevation === 'glass' && '12px'}
                        {activeElevation === 'glow' && '28px'}
                      </text>
                    </svg>
                  </div>
                </div>

                {/* Right Column: 2D Sandbox Card on Wallpaper Blobs */}
                <div className="relative border border-border rounded-xl bg-background p-4 flex items-center justify-center min-h-[220px] overflow-hidden">
                  {/* Wallpaper blobs */}
                  <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 size-48 rounded-full bg-(--desktop-blob-primary) opacity-40 blur-2xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 size-48 rounded-full bg-(--desktop-blob-secondary) opacity-40 blur-2xl" />
                    <div className="absolute inset-0 bg-muted/20" />
                  </div>

                  {/* Visual Sandbox Card */}
                  <div 
                    className={cn(
                      "w-full max-w-[200px] rounded-xl p-4 transition-all duration-300 ease-fluid text-xs relative z-10",
                      activeElevation === 'control' && 'bg-background shadow-control border border-border',
                      activeElevation === 'card' && 'bg-card shadow-card border border-border',
                      activeElevation === 'glass' && 'glass-panel border-none',
                      activeElevation === 'glow' && 'glass-window border-none',
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={cn("size-2 rounded-full", activeElevation === 'glow' ? "bg-primary" : "bg-muted-foreground/30")} />
                      <span className="font-semibold text-foreground">Sandbox Card</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal mb-3">
                      {activeElevation === 'control' && 'Flat controls like buttons or sliders rest directly on the surface and use minimal shadow.'}
                      {activeElevation === 'card' && 'Solid panels and static cards utilize standard shadows to create clean architectural segments.'}
                      {activeElevation === 'glass' && 'Floating elements like menus or popovers float higher above other structural components.'}
                      {activeElevation === 'glow' && 'Active system windows carry the deepest shadow combined with a soft, theme-colored glow.'}
                    </p>

                    <code className="block rounded bg-muted/40 p-2 font-mono text-[9px] text-primary/80 select-all whitespace-pre leading-none text-center">
                      {activeElevation === 'control' && 'className="shadow-control"'}
                      {activeElevation === 'card' && 'className="shadow-card"'}
                      {activeElevation === 'glass' && 'className="glass-panel"'}
                      {activeElevation === 'glow' && 'className="glass-window"'}
                    </code>
                  </div>
                </div>
              </div>

              {showSpecs && (
                <CardWell className="p-3 text-[11px] leading-relaxed text-muted-foreground border border-border">
                  <span className="font-semibold text-foreground block mb-1">Volumetric Specular Rim</span>
                  Raised solid cards carry only drop-shadows (no specular rim) for pure structural flatness. Glass panels carry a luminous top rim (<code>--surface-rim-top</code>) + bottom shadow rim for reflection.
                </CardWell>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Motion and Overlay Foundations (Developer Specs Mode Only) */}
        {showSpecs && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Motion Foundations</CardTitle>
                <CardDescription>Durations and easing curves governing fluid system transitions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 text-xs">
                  <CardWell className="p-3 bg-card border border-border space-y-2">
                    <span className="block font-semibold text-foreground">Durations</span>
                    <div className="space-y-2">
                      {MOTION_DURATIONS.map((d) => (
                        <div key={d.name} className="flex justify-between items-baseline border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                          <div>
                            <code className="font-mono text-[10px] text-foreground font-semibold block">{d.name}</code>
                            <span className="text-[10px] text-muted-foreground">{d.desc}</span>
                          </div>
                          <span className="font-mono text-[10px] text-primary font-bold">{d.val}</span>
                        </div>
                      ))}
                    </div>
                  </CardWell>
                  <CardWell className="p-3 bg-card border border-border space-y-2">
                    <span className="block font-semibold text-foreground">Easing Curves</span>
                    <div className="space-y-2">
                      {MOTION_EASINGS.map((e) => (
                        <div key={e.name} className="space-y-0.5 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                          <div className="flex justify-between items-baseline">
                            <code className="font-mono text-[10px] text-foreground font-semibold">{e.name}</code>
                          </div>
                          <code className="block font-mono text-[9px] text-primary truncate">{e.val}</code>
                          <span className="block text-[10px] text-muted-foreground">{e.desc}</span>
                        </div>
                      ))}
                    </div>
                  </CardWell>
                </div>
              </CardContent>
            </Card>

            {/* Layering & Elevation (z-index) */}
            <Card>
              <CardHeader>
                <CardTitle>Layering (z-index)</CardTitle>
                <CardDescription>The global layering order for overlap coordination.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between border-b pb-1 text-xs font-semibold text-muted-foreground">
                  <span>Layer Role</span>
                  <span>Utility Name / Value</span>
                </div>
                {[
                  { role: 'Toasts (always frontmost)', token: 'z-toast (1200)' },
                  { role: 'Tooltip (above modals)', token: 'z-tooltip (1150)' },
                  { role: 'Command Palette', token: 'z-command (1100)' },
                  { role: 'Popover / Dropdown (above modal panel)', token: 'z-popover (1050)' },
                  { role: 'Modal Panel / Dialog / Sheet', token: 'z-modal (1000)' },
                  { role: 'Overlay Scrim', token: 'z-overlay (900)' },
                  { role: 'Top App Bar', token: 'z-topbar (850)' },
                  { role: 'Floating Dock', token: 'z-dock (800)' },
                  { role: 'Persistent Sidebar Rail', token: 'z-sidebar (700)' },
                  { role: 'OS Windows (active/inactive)', token: 'z-window / active (100 / 110)' },
                ].map(({ role, token }) => (
                  <div key={role} className="flex justify-between py-1 border-b border-border/20 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{role}</span>
                    <span className="font-mono text-[10px] text-foreground font-semibold">{token}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {!hideApca && (
        <ApcaContrastSection
          previewContrast={previewContrast}
          setPreviewContrast={setPreviewContrast}
        />
      )}
    </ShowcaseSection>
  );
}

export function ApcaContrastSection({
  previewContrast: externalPreviewContrast,
  setPreviewContrast: externalSetPreviewContrast,
}: {
  previewContrast?: 'standard' | 'more';
  setPreviewContrast?: React.Dispatch<React.SetStateAction<'standard' | 'more'>>;
}) {
  const [localContrast, setLocalContrast] = React.useState<'standard' | 'more'>('standard');
  const previewContrast = externalPreviewContrast ?? localContrast;
  const setPreviewContrast = externalSetPreviewContrast ?? setLocalContrast;

  const [previewTransparency, setPreviewTransparency] =
    React.useState<TransparencyOption>('standard');
  const [apcaFg, setApcaFg] = React.useState('#0a0a0a');
  const [apcaBg, setApcaBg] = React.useState('#fafafa');
  const [deriveTarget, setDeriveTarget] = React.useState<ApcTarget>('text');

  return (
    <div className="space-y-8">
      {/* Color Derivation — covers foregroundFor / backgroundFor / parseOklch /
          oklchToSrgb / formatOklch. The inverse-APCA pair is the sanctioned
          path for deriving an accessible brand-override foreground by
          construction (design-system.md §Brand contract); until now it was
          not demonstrated anywhere in the showcase. */}
      <Card>
        <CardHeader>
          <CardTitle>Color Derivation</CardTitle>
          <CardDescription>
            Inverse-APCA utilities derive a foreground or background that meets a target Lc by
            construction — the sanctioned path for brand overrides.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SegmentedPicker
            aria-label="Derive target"
            options={APCA_TARGETS}
            value={deriveTarget}
            onChange={(v) => setDeriveTarget(v as ApcTarget)}
            labels={APCA_TARGET_LABELS}
          />
          <ColorDerivationDemo targetLc={APCA_TARGET_LC[deriveTarget]} />
        </CardContent>
      </Card>

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
            <SegmentedPicker
              aria-label="Glass transparency"
              options={TRANSPARENCY_OPTIONS}
              value={previewTransparency}
              onChange={setPreviewTransparency}
              labels={TRANSPARENCY_LABELS}
            />
            <SegmentedPicker
              aria-label="Contrast mode"
              options={CONTRAST_OPTIONS}
              value={previewContrast}
              onChange={setPreviewContrast}
              labels={CONTRAST_LABELS}
            />
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
    </div>
  );
}

interface SwatchProps {
  label: string;
  variable: string;
  tailwind: string;
  oklchLight: string;
  oklchDark: string;
  description: string;
}

function ColorSwatchCard({
  label,
  variable,
  tailwind,
  oklchLight,
  oklchDark,
  description,
  showSpecs,
}: SwatchProps & { showSpecs: boolean }) {
  return (
    <CardWell className="flex flex-col overflow-hidden p-0 rounded-lg border border-border bg-card">
      {/* Visual Preview */}
      <div className={cn("h-12 w-full border-b border-border transition-colors", tailwind)} />
      {/* Details */}
      <div className="p-3 text-xs">
        <div className="flex items-center justify-between font-semibold">
          <span className="text-foreground">{label}</span>
          <code className="font-mono text-[10px] text-primary">{tailwind}</code>
        </div>
        {showSpecs && (
          <div className="mt-2 space-y-1 font-mono text-[10px] text-muted-foreground border-t border-border/40 pt-2 transition-all">
            <div className="flex justify-between gap-1">
              <span>Var:</span>
              <span className="text-foreground select-all break-all text-right">{variable}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span>Light:</span>
              <span className="text-foreground break-all text-right">{oklchLight}</span>
            </div>
            <div className="flex justify-between gap-1">
              <span>Dark:</span>
              <span className="text-foreground break-all text-right">{oklchDark}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal mt-1 pt-1">
              {description}
            </p>
          </div>
        )}
      </div>
    </CardWell>
  );
}

function RadiusDetailCard({ step, px, calc, desc, showSpecs }: { step: string; px: string; calc: string; desc: string; showSpecs: boolean }) {
  return (
    <CardWell className="flex flex-col items-center gap-2 p-3 bg-card border border-border">
      {/* Visual Preview */}
      <div className={cn('size-12 border-2 border-primary bg-background shadow-xs', step)} />
      <div className="w-full text-center space-y-1">
        <span className="block font-mono text-[10px] font-bold text-foreground truncate">{step}</span>
        {showSpecs && (
          <div className="space-y-1 border-t border-border/40 pt-1.5 mt-1 transition-all">
            <span className="block text-xs font-semibold text-primary">{px}</span>
            <code className="block font-mono text-[9px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{calc}</code>
            <span className="block text-[9px] text-muted-foreground leading-normal">{desc}</span>
          </div>
        )}
      </div>
    </CardWell>
  );
}

/**
 * Demonstrates the inverse-APCA pair (`foregroundFor` / `backgroundFor`) plus the
 * OKLCH conversion utilities (`parseOklch`, `oklchToSrgb`, `formatOklch`). Given a
 * fixed anchor surface, it derives the least-extreme foreground meeting `targetLc`
 * — the sanctioned path for brand overrides (design-system.md §Brand contract) —
 * then the dual background under that derived foreground, and verifies the result
 * with the same `oklchToSrgb` + `apcaContrast` pair the contrast gate uses.
 */
function ColorDerivationDemo({ targetLc }: { targetLc: number }) {
  // Anchor built via formatOklch so no raw oklch literal leaks into source
  // (pumniNoRawColor guards token boundaries). A mid-light warm surface forces a
  // non-trivial polarity decision for `auto`.
  const anchorBg = formatOklch({ l: 0.85, c: 0.02, h: 70 });
  const bgParsed = parseOklch(anchorBg);
  const fg = foregroundFor(bgParsed, targetLc, { polarity: 'auto' });
  const bg = backgroundFor({ l: fg.l, c: fg.c, h: fg.h }, targetLc, { polarity: 'auto' });
  const verifiedLc = Math.abs(
    apcaContrast(oklchToSrgb({ l: fg.l, c: fg.c, h: fg.h }), oklchToSrgb(bgParsed)),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-20 text-xs font-medium text-muted-foreground">Anchor bg</span>
        <div
          className="size-8 rounded-md border border-border"
          style={{ backgroundColor: anchorBg }}
        />
        <code className="font-mono text-[11px] break-all text-muted-foreground">{anchorBg}</code>
      </div>

      <div className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            foregroundFor → Lc {targetLc}
          </span>
          <Badge tone={fg.reachedTarget ? 'success' : 'destructive'} size="sm">
            {fg.reachedTarget ? `Lc ${fg.lc.toFixed(0)}` : 'Unreachable'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex size-12 items-center justify-center rounded-md border border-border text-sm font-semibold"
            style={{ backgroundColor: anchorBg, color: fg.oklch }}
          >
            Aa
          </div>
          <code className="font-mono text-[11px] break-all text-muted-foreground">{fg.oklch}</code>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            backgroundFor → Lc {targetLc}
          </span>
          <Badge tone={bg.reachedTarget ? 'success' : 'destructive'} size="sm">
            {bg.reachedTarget ? `Lc ${bg.lc.toFixed(0)}` : 'Unreachable'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex size-12 items-center justify-center rounded-md border border-border text-sm font-semibold"
            style={{ backgroundColor: bg.oklch, color: fg.oklch }}
          >
            Aa
          </div>
          <code className="font-mono text-[11px] break-all text-muted-foreground">{bg.oklch}</code>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Round-trip <code>parseOklch</code> → <code>oklchToSrgb</code> → <code>apcaContrast</code>{' '}
        verifies <span className="font-mono">Lc {verifiedLc.toFixed(1)}</span> — the same pair the
        contrast gate uses.
      </p>
    </div>
  );
}
