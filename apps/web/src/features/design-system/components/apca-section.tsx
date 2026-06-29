'use client';

import * as React from 'react';
import { apcaContrast, foregroundFor } from '@pumni/ui/lib/apca';
import { formatOklch, oklchToSrgb } from '@pumni/ui/lib/oklch';
import { Badge } from '@pumni/ui/feedback';
import { Button, Input, Label, SegmentedPicker } from '@pumni/ui/form';
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
import { ShowcaseSection } from './showcase-section';

// ──────────────────────── helpers ────────────────────────

/** Parse a `#rrggbb` hex string into the `[r, g, b]` triple that `apcaContrast` expects. */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ];
}

function srgbToOklch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const linearize = (c: number) => {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);

  const x = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const y = 0.2119034982 * lr + 0.6806995477 * lg + 0.1073969541 * lb;
  const z = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const lPrime = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597155 * z);
  const mPrime = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361451849 * z);
  const sPrime = Math.cbrt(0.0482003018 * x + 0.2643542568 * y + 0.6338517070 * z);

  const L = 0.2104542553 * lPrime + 0.7936177850 * mPrime - 0.0040720403 * sPrime;
  const oklabA = 1.9779984951 * lPrime - 2.4285922050 * mPrime + 0.4505937099 * sPrime;
  const oklabB = 0.0259040371 * lPrime + 0.7827717662 * mPrime - 0.8086757660 * sPrime;

  const C = Math.sqrt(oklabA * oklabA + oklabB * oklabB);
  let h = (Math.atan2(oklabB, oklabA) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c: C, h };
}

function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const [r, g, b] = hexToRgb(hex);
  return srgbToOklch(r, g, b);
}

function getLcValue(fgHex: string, bgHex: string): number {
  try {
    return apcaContrast(oklchToSrgb(hexToOklch(fgHex)), oklchToSrgb(hexToOklch(bgHex)));
  } catch {
    return 0;
  }
}

interface LcGrade {
  label: string;
  tone: 'success' | 'warning' | 'destructive';
  desc: string;
}

function getLcGrade(absLc: number): LcGrade {
  if (absLc >= 90) return { label: 'Lc 90+ — Max', tone: 'success', desc: 'Any text size, decorative or body' };
  if (absLc >= 75) return { label: 'Lc 75+ — Body', tone: 'success', desc: 'Body text ≥12px, headlines ≥9px' };
  if (absLc >= 60) return { label: 'Lc 60+ — Pass Text', tone: 'success', desc: 'Body text ≥16px, subheadings ≥12px' };
  if (absLc >= 45) return { label: 'Lc 45 — Large Text', tone: 'warning', desc: 'Large text ≥24px only' };
  if (absLc >= 25) return { label: 'Lc 25 — Non-text UI', tone: 'warning', desc: 'UI chrome, decorative icons' };
  if (absLc >= 15) return { label: 'Lc 15 — Subminimal', tone: 'destructive', desc: 'Placeholders only' };
  return { label: 'Lc < 15 — Fail', tone: 'destructive', desc: 'Insufficient for any content' };
}

// ──────────────────────── static data ────────────────────────

const PRESET_PAIRS = [
  { label: 'Classic B/W', fg: '#0a0a0a', bg: '#fafafa' },
  { label: 'Coral on Dark', fg: '#e87b4f', bg: '#1a1614' },
  { label: 'Muted on Card', fg: '#6b7280', bg: '#ffffff' },
  { label: 'Yellow Warning', fg: '#f0c000', bg: '#ffffff' },
  { label: 'White on Primary', fg: '#ffffff', bg: '#c05a28' },
  { label: 'Low Contrast', fg: '#9a9a9a', bg: '#c0c0c0' },
] as const;

const SEMANTIC_PAIRS = [
  {
    name: 'foreground / background',
    lightFg: { l: 0.085, c: 0.003, h: 70 },
    lightBg: { l: 0.985, c: 0.005, h: 75 },
    darkFg: { l: 0.985, c: 0.005, h: 75 },
    darkBg: { l: 0.19, c: 0.0035, h: 70 },
    usage: 'Body text',
    target: 60,
  },
  {
    name: 'primary-fg / primary',
    lightFg: { l: 0.985, c: 0.005, h: 75 },
    lightBg: { l: 0.545, c: 0.14, h: 38 },
    darkFg: { l: 0.985, c: 0.005, h: 75 },
    darkBg: { l: 0.61, c: 0.134, h: 40 },
    usage: 'Primary button label',
    target: 60,
  },
  {
    name: 'muted-fg / card',
    lightFg: { l: 0.555, c: 0.005, h: 70 },
    lightBg: { l: 1, c: 0, h: 0 },
    darkFg: { l: 0.884, c: 0.006, h: 72 },
    darkBg: { l: 0.215, c: 0.004, h: 70 },
    usage: 'Subdued / caption text',
    target: 45,
  },
  {
    name: 'border / background',
    lightFg: { l: 0.929, c: 0.006, h: 73 },
    lightBg: { l: 0.985, c: 0.005, h: 75 },
    darkFg: { l: 0.275, c: 0.005, h: 70 },
    darkBg: { l: 0.19, c: 0.0035, h: 70 },
    usage: 'Structural dividers',
    target: 15,
  },
  {
    name: 'success-fg / success',
    lightFg: { l: 0.985, c: 0.005, h: 75 },
    lightBg: { l: 0.596, c: 0.145, h: 163.225 },
    darkFg: { l: 0.085, c: 0.003, h: 70 },
    darkBg: { l: 0.696, c: 0.17, h: 162.48 },
    usage: 'Status badge labels',
    target: 60,
  },
  {
    name: 'destructive-fg / destructive',
    lightFg: { l: 0.985, c: 0.005, h: 75 },
    lightBg: { l: 0.577, c: 0.245, h: 27.325 },
    darkFg: { l: 0.985, c: 0.005, h: 75 },
    darkBg: { l: 0.637, c: 0.237, h: 25.331 },
    usage: 'Error badge labels',
    target: 60,
  },
] as const;

const LC_SCALE_ROWS = [
  { lc: 90, label: 'Lc 90+', desc: 'Any text, any size. Maximum clarity.', tone: 'success' as const },
  { lc: 75, label: 'Lc 75', desc: 'Body text ≥12px, headings ≥9px bold.', tone: 'success' as const },
  { lc: 60, label: 'Lc 60 ✓ Text gate', desc: 'Minimum for body text ≥16px. Project gate.', tone: 'success' as const },
  { lc: 45, label: 'Lc 45', desc: 'Large display text ≥24px only.', tone: 'warning' as const },
  { lc: 25, label: 'Lc 25 ✓ UI gate', desc: 'UI chrome, non-text decorative elements. Project gate.', tone: 'warning' as const },
  { lc: 15, label: 'Lc 15', desc: 'Inactive/disabled states, placeholder hints only.', tone: 'destructive' as const },
  { lc: 0, label: 'Lc < 15', desc: 'Invisible. Fail for all use cases.', tone: 'destructive' as const },
];

const FONT_SIZE_GATES = [
  { size: '12px', w400: 80, w700: 60 },
  { size: '14px', w400: 75, w700: 55 },
  { size: '16px (body)', w400: 60, w700: 45 },
  { size: '18px', w400: 55, w700: 40 },
  { size: '24px', w400: 45, w700: 35 },
  { size: '32px+', w400: 35, w700: 25 },
];

/**
 * OKLCH anchor presets — real design-system token values from tokens.css / brand.css.
 * Pass directly to foregroundFor() as { l, c, h }.
 */
const OKLCH_ANCHORS = [
  { label: 'Page bg (light)', token: '--neutral-50', css: 'oklch(0.985 0.005 75)', l: 0.985, c: 0.005, h: 75 },
  { label: 'Card (light)', token: '--neutral-0', css: 'oklch(1 0 0)', l: 1, c: 0, h: 0 },
  { label: 'Secondary', token: '--neutral-100', css: 'oklch(0.968 0.006 74)', l: 0.968, c: 0.006, h: 74 },
  { label: 'Muted (dark)', token: '--neutral-800', css: 'oklch(0.275 0.005 70)', l: 0.275, c: 0.005, h: 70 },
  { label: 'Card (dark)', token: '--neutral-880', css: 'oklch(0.215 0.004 70)', l: 0.215, c: 0.004, h: 70 },
  { label: 'Page bg (dark)', token: '--neutral-890', css: 'oklch(0.19 0.0035 70)', l: 0.19, c: 0.0035, h: 70 },
  { label: 'Primary (light)', token: '--coral-600', css: 'oklch(0.545 0.14 38)', l: 0.545, c: 0.14, h: 38 },
  { label: 'Primary (dark)', token: '--coral-500', css: 'oklch(0.61 0.134 40)', l: 0.61, c: 0.134, h: 40 },
  { label: 'Coral mid', token: '--coral-400', css: 'oklch(0.71 0.115 41)', l: 0.71, c: 0.115, h: 41 },
] as const;

type AnchorLabel = typeof OKLCH_ANCHORS[number]['label'];

// ──────────────────────── sub-components ────────────────────────

function LcScaleBar({ lc }: { lc: number }) {
  const absLc = Math.abs(lc);
  const pct = Math.min(100, (absLc / 110) * 100);
  const grade = getLcGrade(absLc);

  return (
    <div className="space-y-2">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-[width] duration-(--duration-slow) ease-fluid',
            absLc >= 60 ? 'bg-success' : absLc >= 25 ? 'bg-warning' : 'bg-destructive',
          )}
          style={{ width: `${pct}%` }}
        />
        {[15, 25, 45, 60, 75, 90].map((tick) => (
          <div
            key={tick}
            className="absolute bottom-0 top-0 w-px bg-background/60"
            style={{ left: `${(tick / 110) * 100}%` }}
          />
        ))}
      </div>
      <div className="relative h-4">
        {[15, 25, 45, 60, 75, 90].map((v) => (
          <span
            key={v}
            className={cn(
              'absolute -translate-x-1/2 font-mono text-xs transition-colors',
              absLc >= v ? 'font-bold text-foreground' : 'text-muted-foreground/40',
            )}
            style={{ left: `${(v / 110) * 100}%` }}
          >
            {v}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{grade.desc}</span>
        <Badge tone={grade.tone} size="sm">{grade.label}</Badge>
      </div>
    </div>
  );
}

function TextPreview({ fg, bg, lc }: { fg: string; bg: string; lc: number }) {
  const polarity = lc > 0 ? 'BoW' : lc < 0 ? 'WoB' : '—';
  return (
    <div className="overflow-hidden rounded-xl border border-border" style={{ backgroundColor: bg }}>
      <div className="space-y-2 p-5">
        <p className="text-4xl font-black leading-tight" style={{ color: fg }}>The quick brown fox</p>
        <p className="text-xl font-semibold" style={{ color: fg }}>Design systems enable consistency</p>
        <p className="text-base font-normal" style={{ color: fg }}>Body text (text-base / 16px) — the most common reading context.</p>
        <p className="text-sm font-normal" style={{ color: fg }}>Small (text-sm / 14px) — captions, data tables, secondary metadata.</p>
        <p className="text-xs font-normal" style={{ color: fg }}>Micro (text-xs / 12px) — requires Lc 75+ for comfortable readability.</p>
      </div>
      <div
        className="flex items-center justify-between border-t px-5 py-2"
        style={{ borderColor: `${fg}25`, backgroundColor: `${fg}08` }}
      >
        <span className="font-mono text-sm" style={{ color: fg, opacity: 0.7 }}>
          Lc {Math.abs(lc).toFixed(1)} — {polarity}
        </span>
        <span className="font-mono text-xs" style={{ color: fg, opacity: 0.4 }}>fg: {fg} · bg: {bg}</span>
      </div>
    </div>
  );
}

function ConceptCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <CardWell className="h-full space-y-2 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>{icon}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </CardWell>
  );
}

// ──────────────────────── main component ────────────────────────

export function ApcaSection() {
  // Playground
  const [fg, setFg] = React.useState('#0f0f0f');
  const [bg, setBg] = React.useState('#fafafa');
  const lc = getLcValue(fg, bg);
  const absLc = Math.abs(lc);
  const swapColors = () => { const tmp = fg; setFg(bg); setBg(tmp); };

  // Derivation
  const [anchorLabel, setAnchorLabel] = React.useState<AnchorLabel>('Primary (light)');
  const [deriveTargetLc, setDeriveTargetLc] = React.useState(60);
  const anchor = OKLCH_ANCHORS.find((a) => a.label === anchorLabel) ?? OKLCH_ANCHORS[6];

  const derivedFg = React.useMemo(() => {
    try {
      return foregroundFor(
        { l: anchor.l, c: anchor.c, h: anchor.h },
        deriveTargetLc,
        { polarity: 'auto', chroma: 0, hue: 0 },
      );
    } catch {
      return null;
    }
  }, [anchor, deriveTargetLc]);

  return (
    <ShowcaseSection
      id="apca-contrast"
      title="APCA Contrast"
      description="Advanced Perceptual Contrast Algorithm — the perceptually-accurate contrast standard. Lc scores map directly to human visual perception, replacing WCAG 2.x ratios."
    >
      <div className="space-y-8">

        {/* 1 — Concept education */}
        <div className="grid gap-4 md:grid-cols-3">
          <ConceptCard icon="📐" title="What is Lc?">
            <p>
              <strong className="text-foreground">Lc (Lightness contrast)</strong> is APCA&apos;s
              output — a signed number from approximately −110 to +110.
            </p>
            <p>
              Unlike WCAG&apos;s ratio (e.g. 4.5:1), Lc maps directly to visual perception.
              <strong className="text-foreground"> Lc 60</strong> = body text minimum.
              <strong className="text-foreground"> Lc 25</strong> = UI chrome minimum.
            </p>
          </ConceptCard>
          <ConceptCard icon="🔄" title="BoW vs WoB Polarity">
            <p>
              APCA returns a <strong className="text-foreground">signed value</strong> because
              dark-on-light and light-on-dark are perceptually asymmetric:
            </p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li><strong className="text-foreground">+ Positive</strong>: dark text on light bg (BoW)</li>
              <li><strong className="text-foreground">− Negative</strong>: light text on dark bg (WoB)</li>
            </ul>
            <p className="mt-1">WCAG 2.x ignores this — APCA uses different exponents per polarity.</p>
          </ConceptCard>
          <ConceptCard icon="⚖️" title="Why not WCAG 2.x?">
            <p>WCAG 2.x contrast ratio has known perceptual failures:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Yellow on white: WCAG ≈1.07:1 (pass!), APCA Lc ≈10 — <strong className="text-destructive">Fail</strong></li>
              <li>Dark-mode: WCAG is symmetric, APCA is polarity-aware</li>
              <li>Font size: WCAG ignores it, APCA tables by weight + size</li>
            </ul>
          </ConceptCard>
        </div>

        {/* 2 — Lc scale reference */}
        <Card>
          <CardHeader>
            <CardTitle>Lc Scale Reference</CardTitle>
            <CardDescription>
              Visual map of Lc milestones. Project gates: text ≥ Lc 60, UI elements ≥ Lc 25.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {LC_SCALE_ROWS.map(({ lc: v, label, desc, tone }) => (
                <div key={label} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
                  <div className="w-36 shrink-0">
                    <Badge tone={tone} size="sm" className="w-full justify-center font-mono text-xs">{label}</Badge>
                  </div>
                  <div
                    className={cn('h-2 shrink-0 rounded-full opacity-60', tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : 'bg-destructive')}
                    style={{ width: `${Math.max(8, (v / 110) * 180)}px` }}
                  />
                  <span className="text-sm text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3 — Interactive Playground */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Lc Playground</CardTitle>
            <CardDescription>
              Pick any foreground and background — see the live Lc score, polarity, and text
              legibility at every type-scale step simultaneously.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <span className="text-sm font-semibold text-muted-foreground">Quick presets:</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_PAIRS.map((pair) => {
                  const pLc = Math.abs(getLcValue(pair.fg, pair.bg));
                  const isActive = pair.fg === fg && pair.bg === bg;
                  return (
                    <button
                      key={pair.label}
                      type="button"
                      onClick={() => { setFg(pair.fg); setBg(pair.bg); }}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors duration-(--duration-base) ease-fluid',
                        isActive ? 'border-primary bg-primary text-primary-foreground font-semibold' : 'border-border text-foreground state-hover',
                      )}
                    >
                      <span
                        className="inline-flex size-3 shrink-0 rounded-full border border-border/50"
                        style={{ background: `linear-gradient(135deg, ${pair.fg} 50%, ${pair.bg} 50%)` }}
                      />
                      {pair.label}
                      <span className={cn('font-mono text-xs', pLc >= 60 ? 'text-success' : pLc >= 25 ? 'text-warning' : 'text-destructive', isActive && 'text-primary-foreground')}>
                        {pLc.toFixed(0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Separator />
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="play-fg" className="text-sm font-semibold">Foreground (text / icon)</Label>
                  <div className="flex items-center gap-2">
                    <input id="play-fg" type="color" value={fg} onChange={(e) => setFg(e.target.value)}
                      className="size-10 cursor-pointer rounded-md border border-border bg-transparent" />
                    <div className="flex flex-col">
                      <Input
                        value={fg}
                        onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setFg(e.target.value); }}
                        className="h-9 w-28 font-mono text-sm"
                        aria-label="Foreground hex value"
                      />
                      <span className="font-mono text-[10px] text-muted-foreground mt-0.5 select-all">
                        {formatOklch(hexToOklch(fg))}
                      </span>
                    </div>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={swapColors} className="w-full" aria-label="Swap foreground and background">
                  ⇅ Swap FG ↔ BG
                </Button>
                <div className="space-y-1.5">
                  <Label htmlFor="play-bg" className="text-sm font-semibold">Background</Label>
                  <div className="flex items-center gap-2">
                    <input id="play-bg" type="color" value={bg} onChange={(e) => setBg(e.target.value)}
                      className="size-10 cursor-pointer rounded-md border border-border bg-transparent" />
                    <div className="flex flex-col">
                      <Input
                        value={bg}
                        onChange={(e) => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setBg(e.target.value); }}
                        className="h-9 w-28 font-mono text-sm"
                        aria-label="Background hex value"
                      />
                      <span className="font-mono text-[10px] text-muted-foreground mt-0.5 select-all">
                        {formatOklch(hexToOklch(bg))}
                      </span>
                    </div>
                  </div>
                </div>
                <Separator />
                <CardWell className="space-y-1 p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">APCA Lc Score</p>
                  <p className={cn('text-4xl font-black tabular-nums transition-colors duration-(--duration-base)', absLc >= 60 ? 'text-success' : absLc >= 25 ? 'text-warning' : 'text-destructive')}>
                    {absLc.toFixed(1)}
                  </p>
                  <p className="font-mono text-sm text-muted-foreground">
                    {lc > 0 ? '+ BoW (dark on light)' : lc < 0 ? '− WoB (light on dark)' : '—'}
                  </p>
                </CardWell>
                <LcScaleBar lc={lc} />
              </div>
              <div className="min-w-0 space-y-3">
                <span className="text-sm font-semibold text-muted-foreground">Live preview — all type-scale steps simultaneously:</span>
                <TextPreview fg={fg} bg={bg} lc={lc} />
                <CardWell className="p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">APCA minimum Lc by font size</p>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="pb-1.5 text-left font-medium">Size</th>
                        <th className="pb-1.5 text-center font-medium">Normal (400)</th>
                        <th className="pb-1.5 text-center font-medium">Bold (700)</th>
                        <th className="pb-1.5 text-center font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {FONT_SIZE_GATES.map(({ size, w400, w700 }) => {
                        const passNormal = absLc >= w400;
                        const passBold = absLc >= w700;
                        return (
                          <tr key={size}>
                            <td className="py-1.5 font-mono text-xs text-foreground">{size}</td>
                            <td className="py-1.5 text-center">
                              <span className={cn('font-mono text-xs', passNormal ? 'text-success' : 'text-muted-foreground/50')}>≥{w400}</span>
                            </td>
                            <td className="py-1.5 text-center">
                              <span className={cn('font-mono text-xs', passBold ? 'text-success' : 'text-muted-foreground/50')}>≥{w700}</span>
                            </td>
                            <td className="py-1.5 text-center">
                              <Badge tone={passNormal ? 'success' : passBold ? 'warning' : 'destructive'} size="sm">
                                {passNormal ? '✓ All' : passBold ? 'Bold only' : '✗ Fail'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardWell>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4 — Semantic token audit */}
        <Card>
          <CardHeader>
            <CardTitle>Semantic Token Pair Audit</CardTitle>
            <CardDescription>Lc verification for all semantic color pairs in both light and dark mode.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Token Pair</th>
                    <th className="pb-2 text-left font-medium">Usage</th>
                    <th className="pb-2 text-center font-medium">Light Lc</th>
                    <th className="pb-2 text-center font-medium">Dark Lc</th>
                    <th className="pb-2 text-center font-medium">Gate</th>
                    <th className="pb-2 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {SEMANTIC_PAIRS.map((pair) => {
                    const lightLc = Math.abs(apcaContrast(oklchToSrgb(pair.lightFg), oklchToSrgb(pair.lightBg)));
                    const darkLc = Math.abs(apcaContrast(oklchToSrgb(pair.darkFg), oklchToSrgb(pair.darkBg)));
                    const lightPass = lightLc >= pair.target;
                    const darkPass = darkLc >= pair.target;
                    const allPass = lightPass && darkPass;
                    return (
                      <tr key={pair.name} className="align-middle">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="size-5 shrink-0 rounded border border-border"
                              style={{ background: `linear-gradient(135deg, ${formatOklch(pair.lightFg)} 50%, ${formatOklch(pair.lightBg)} 50%)` }}
                              title={`Light: ${formatOklch(pair.lightFg)} on ${formatOklch(pair.lightBg)} · Dark: ${formatOklch(pair.darkFg)} on ${formatOklch(pair.darkBg)}`} />
                            <div className="flex flex-col">
                              <code className="font-mono text-xs text-foreground">{pair.name}</code>
                              <span className="font-mono text-[9px] text-muted-foreground select-all">
                                L: {formatOklch(pair.lightFg)} · D: {formatOklch(pair.darkFg)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-sm text-muted-foreground">{pair.usage}</td>
                        <td className="py-2.5 text-center">
                          <span className={cn('font-mono text-sm font-bold', lightPass ? 'text-success' : 'text-destructive')}>{lightLc.toFixed(1)}</span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={cn('font-mono text-sm font-bold', darkPass ? 'text-success' : 'text-destructive')}>{darkLc.toFixed(1)}</span>
                        </td>
                        <td className="py-2.5 text-center font-mono text-xs text-muted-foreground">≥ Lc {pair.target}</td>
                        <td className="py-2.5 text-center">
                          <Badge tone={allPass ? 'success' : !lightPass && !darkPass ? 'destructive' : 'warning'} size="sm">
                            {allPass ? 'Both ✓' : !lightPass && !darkPass ? 'Both ✗' : lightPass ? 'Light ✓' : 'Dark ✓'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Values are design-intent approximations — runtime values may differ slightly due to{' '}
              <code>color-mix()</code> blending on semantic tokens.
            </p>
          </CardContent>
        </Card>

        {/* 5 — Inverse APCA: Color Derivation */}
        <Card>
          <CardHeader>
            <CardTitle>Inverse APCA — Color Derivation</CardTitle>
            <CardDescription>
              <code>foregroundFor(bg, targetLc)</code> takes a native OKLCH background token and
              binary-searches the lightness axis for the{' '}
              <em>least extreme</em> neutral foreground that meets targetLc by construction.
              Anchor and result stay in the same OKLCH pipeline — no hex approximation involved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Anchor Background (OKLCH design-system token)</Label>
                  <div className="flex flex-wrap gap-2">
                    {OKLCH_ANCHORS.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => setAnchorLabel(a.label as AnchorLabel)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition-colors duration-(--duration-base) ease-fluid',
                          anchorLabel === a.label ? 'border-primary bg-primary text-primary-foreground font-semibold' : 'border-border text-foreground state-hover',
                        )}
                      >
                        <span className="inline-flex size-3 shrink-0 rounded-full border border-border/50" style={{ backgroundColor: a.css }} />
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <CardWell className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 shrink-0 rounded-lg border border-border" style={{ backgroundColor: anchor.css }} />
                      <div className="min-w-0 space-y-0.5">
                        <code className="block font-mono text-xs text-foreground">{anchor.token}</code>
                        <code className="block font-mono text-xs text-muted-foreground">{anchor.css}</code>
                        <p className="text-xs text-muted-foreground">L = {anchor.l} · c = {anchor.c} · h = {anchor.h}°</p>
                      </div>
                    </div>
                  </CardWell>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Target Lc</Label>
                  <SegmentedPicker
                    aria-label="Derivation target Lc"
                    options={['25', '45', '60', '75']}
                    value={String(deriveTargetLc)}
                    onChange={(v) => setDeriveTargetLc(Number(v))}
                    labels={{ '25': 'Lc 25', '45': 'Lc 45', '60': 'Lc 60', '75': 'Lc 75' }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {deriveTargetLc >= 60 ? 'Gate: body text minimum' : deriveTargetLc >= 25 ? 'Gate: UI chrome minimum' : 'Decorative only'}
                  </p>
                </div>

                {derivedFg && (
                  <CardWell className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Derived foreground</span>
                      <Badge tone={derivedFg.reachedTarget ? 'success' : 'destructive'} size="sm">
                        {derivedFg.reachedTarget ? `Lc ${derivedFg.lc.toFixed(1)} ✓` : 'Unreachable — surface too mid-tone'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div
                        className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-border text-2xl font-black"
                        style={{ backgroundColor: anchor.css, color: derivedFg.oklch }}
                      >
                        Aa
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">Foreground CSS value:</p>
                        <code className="block break-all font-mono text-xs text-foreground">{derivedFg.oklch}</code>
                        <p className="text-xs text-muted-foreground">
                          L = {derivedFg.l.toFixed(4)} · neutral (c=0) · {derivedFg.l < 0.5 ? 'dark side ⬇' : 'light side ⬆'}
                        </p>
                      </div>
                    </div>
                    <LcScaleBar lc={derivedFg.lc} />
                  </CardWell>
                )}
              </div>

              {/* Algorithm panel */}
              <CardWell className="h-fit space-y-4 p-4">
                <p className="text-sm font-semibold text-foreground">Algorithm — 4 steps</p>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  {[
                    {
                      t: 'Convert anchor',
                      b: 'OKLCH token passed to foregroundFor as { l, c, h }. The library handles all internal math.',
                    },
                    {
                      t: 'Resolve polarity',
                      b: 'Compare |Lc| capacity at L=0 (black fg) vs L=1 (white fg) against this anchor. The side with higher capacity wins — correct for mid-tones where a naïve L > 0.5 rule would fail.',
                    },
                    {
                      t: 'Binary search',
                      b: 'Bisect the OKLCH L axis in 48 iterations at c=0 (neutral grey). Converges to the least-extreme L meeting targetLc — avoids pure black/white eye strain.',
                    },
                    {
                      t: 'Result',
                      b: 'Returns { oklch, l, lc, reachedTarget }. lc is always |Lc| (absolute). Drop oklch directly into a CSS token.',
                    },
                  ].map(({ t, b }, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {i + 1}
                      </span>
                      <span><strong className="text-foreground">{t}:</strong>{' '}{b}</span>
                    </li>
                  ))}
                </ol>
                <Separator />
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-foreground">API</p>
                  <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                    {`import { foregroundFor } from '@pumni/ui/lib/apca';\n\nconst fg = foregroundFor(\n  bg,  // { l, c, h } — native OKLCH\n  ${deriveTargetLc},   // target Lc\n  { polarity: 'auto' }\n);\n// → { oklch, l, lc, reachedTarget }`}
                  </pre>
                </div>
              </CardWell>
            </div>
          </CardContent>
        </Card>

      </div>
    </ShowcaseSection>
  );
}
