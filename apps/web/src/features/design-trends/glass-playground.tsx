'use client';

import { cn } from '@/shared/lib/utils';
import * as React from 'react';

import { Badge } from '@pumni/ui/feedback';
import { Button, Slider } from '@pumni/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pumni/ui/layout';
import { apcaContrast } from '@pumni/ui/lib/apca';
import { oklchToSrgb } from '@pumni/ui/lib/oklch';
import { Contrast, Info, Layers, Palette, Sliders, Sparkles } from 'lucide-react';

import {
  AMBIENT_PRESETS,
  BACKDROP_PRESETS,
  GlassBackdrop,
  type AmbientPreset,
  type BackdropStyle,
} from './glass-2026-primitives';

/**
 * Glass Playground — a live window onto the REAL Pumni OS production glass.
 *
 * This is NOT an inline reimplementation of glassmorphism: the specimen card
 * renders through the production `glass-panel` utility (`packages/ui` tokens),
 * so what you see here is exactly what a Dialog / OS window / popover shows in
 * the app — the deepened dark fill, the conic Fresnel rim, the drop shadow, the
 * a11y fallbacks. The controls let you (1) change the backdrop the glass floats
 * over, and (2) explore how a chosen text colour reads over the real glass via
 * live APCA / WCAG contrast. Glass parameters themselves are token-driven and
 * shown read-only — they are not sliders, because production glass is a system,
 * not a per-card knob.
 */

/* ── Production dark-glass constants (mirror packages/ui theme.css) ──
   Kept in sync with `--glass-fill` dark + `--glass-tint-readable` dark. Used to
   compute contrast of text over the real glass surface the specimen renders. */
const PROD_GLASS = {
  fill: { l: 0.15, c: 0.005, h: 70 },
  readableAlpha: 0.44,
  blur: 20,
  saturate: 150,
  brightness: 100,
} as const;

/* ───── APCA / WCAG helpers (sRGB 0-1 triple) ───── */
function toLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function wcagLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
function wcagRatio(a: [number, number, number], b: [number, number, number]): number {
  const l1 = wcagLuminance(a);
  const l2 = wcagLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}
/** Blend semi-transparent fg (0-1) over opaque bg (0-1). */
function blendOver(
  fg: [number, number, number],
  alpha: number,
  bg: [number, number, number],
): [number, number, number] {
  return [
    fg[0] * alpha + bg[0] * (1 - alpha),
    fg[1] * alpha + bg[1] * (1 - alpha),
    fg[2] * alpha + bg[2] * (1 - alpha),
  ];
}
/** RGB 0-255 → sRGB 0-1 triple. */
function from255(rgb: { r: number; g: number; b: number }): [number, number, number] {
  return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
}

interface PlaygroundSliderProps {
  label: string;
  val: number;
  set: (v: number) => void;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  hint?: string;
}

function PlaygroundSlider({ label, val, set, min, max, step, fmt, hint }: PlaygroundSliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-primary">{fmt(val)}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[val]}
        onValueChange={(v) => set(v[0] ?? val)}
      />
      {hint && <p className="text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

/* ───── APCA recommendation (Bronze Simple Mode use-case tiers) ───── */
interface ApcaRec {
  rating: string;
  minFont: string;
  useCase: string;
}
function getApcaRec(Lc: number): ApcaRec {
  const abs = Math.abs(Lc);
  if (abs >= 90)
    return {
      rating: 'Perfect (Lc ≥ 90)',
      minFont: '≥ 14px (Normal / Weight 400)',
      useCase: 'Fluent text / Body columns (Highly readable)',
    };
  if (abs >= 75)
    return {
      rating: 'Excellent (Lc ≥ 75)',
      minFont: '≥ 16px (Normal) or ≥ 14px (Bold)',
      useCase: 'Fluent body / standard reading text',
    };
  if (abs >= 60)
    return {
      rating: 'Good (Lc ≥ 60)',
      minFont: '≥ 18px (Normal) or ≥ 16px (Bold)',
      useCase: 'Subheadings, UI widgets, smaller captions (production gate)',
    };
  if (abs >= 45)
    return {
      rating: 'Large Text Only (Lc ≥ 45)',
      minFont: '≥ 24px (Normal) or ≥ 18px (Bold)',
      useCase: 'Large titles, headlines, call-to-actions',
    };
  if (abs >= 30)
    return {
      rating: 'Graphics & UI Elements Only (Lc ≥ 30)',
      minFont: '≥ 36px (Normal) or heavy graphic elements',
      useCase: 'Disabled text, placeholder overlays, thick lines',
    };
  return {
    rating: 'Insufficient Contrast (Lc < 30)',
    minFont: 'Not recommended for any readable text',
    useCase: 'Decorative lines, spacers, backgrounds only',
  };
}

/* ───── Read-only production token readout row ───── */
function TokenRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 font-mono text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

/* ═══════════ MAIN COMPONENT ═══════════ */

export function GlassPlayground() {
  const [activeTab, setActiveTab] = React.useState<'surface' | 'text' | 'details' | 'sandbox'>(
    'surface',
  );
  const [backdropStyle, setBackdropStyle] = React.useState<BackdropStyle>('orbs');
  const [selectedPreset, setSelectedPreset] = React.useState<AmbientPreset>(AMBIENT_PRESETS[0]!);

  /* ── Text OKLCH (the only glass parameter that stays interactive: how text
        reads over the real production glass) ── */
  const [textL, setTextL] = React.useState(0.95);
  const [textC, setTextC] = React.useState(0.01);
  const [textH, setTextH] = React.useState(240);
  const [fontWeight, setFontWeight] = React.useState<'300' | '400' | '600' | '800'>('400');
  const [fontSize, setFontSize] = React.useState(15);

  /* ── Fusing sandbox (independent CSS gooey toy) ── */
  const [fusingDistance, setFusingDistance] = React.useState(120);

  /* ── Derived: APCA + WCAG of the chosen text over the REAL production dark
        glass surface, composited over the selected ambient backdrop. ── */
  const glassSrgb = oklchToSrgb(PROD_GLASS.fill);
  const textSrgb = oklchToSrgb({ l: textL, c: textC, h: textH });
  const ambientSrgb = from255(selectedPreset.rgb);
  const blendedBg = blendOver(glassSrgb, PROD_GLASS.readableAlpha, ambientSrgb);

  const apcaLc = Math.round(apcaContrast(textSrgb, blendedBg) * 10) / 10;
  const wcag = wcagRatio(textSrgb, blendedBg);
  const apcaRec = getApcaRec(apcaLc);
  const apcaAbs = Math.abs(apcaLc);

  const textStyle: React.CSSProperties = { color: `oklch(${textL} ${textC} ${textH})` };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      {/* ═══════ LEFT — CANVAS VIEWPORT (7 cols) ═══════ */}
      <section className="flex flex-col gap-6 lg:col-span-7">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="font-mono text-lg tracking-wider uppercase">
                  Glass Production Preview
                  <Badge tone="primary" size="sm" className="ml-2 align-middle text-[10px]">
                    glass-panel
                  </Badge>
                  <Badge tone="success" size="sm" className="ml-2 align-middle text-[10px]">
                    Hệ thật
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Thẻ dưới đây render bằng utility <code className="font-mono">glass-panel</code>{' '}
                  production thật (token Pumni OS) — đúng những gì Dialog / cửa sổ OS / popover hiển
                  thị trong app. Đổi nền để xem kính trên các hậu cảnh khác nhau; chọn màu chữ để
                  soi độ tương phản APCA thực trên bề mặt kính thật.
                </CardDescription>
              </div>
              {/* Background style switcher */}
              <div className="flex items-center gap-1 rounded-xl border bg-field p-1 text-xs">
                {BACKDROP_PRESETS.map((p) => (
                  <Button
                    key={p.value}
                    variant={backdropStyle === p.value ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-2.5 text-[10px]"
                    onClick={() => setBackdropStyle(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* RENDERING STAGE */}
            <div
              className="relative flex min-h-115 w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 p-8 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"
              style={{
                background: `linear-gradient(135deg, ${selectedPreset.gradientFrom}, ${selectedPreset.gradientVia}, ${selectedPreset.gradientTo})`,
              }}
            >
              <GlassBackdrop style={backdropStyle} preset={selectedPreset} />

              {activeTab !== 'sandbox' ? (
                /* PRODUCTION GLASS SPECIMEN — real glass-panel utility */
                <div className="glass-panel relative w-full max-w-md rounded-3xl">
                  <div className="relative z-10 flex flex-col justify-between gap-8 p-8 lg:p-10">
                    {/* Card top bar */}
                    <div className="flex items-center justify-between">
                      <span
                        style={textStyle}
                        className="font-mono text-xs tracking-widest uppercase opacity-75"
                      >
                        Liquid Glass Specimen
                      </span>
                      <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
                    </div>

                    {/* Main text */}
                    <div className="space-y-3">
                      <h2
                        style={{ ...textStyle, fontWeight, fontSize: `${fontSize}px` }}
                        className="text-2xl leading-snug tracking-tight transition-all duration-(--duration-base)"
                      >
                        Sự tiến hóa của giao diện Web: Không gian màu OKLCH, và Tiêu chuẩn tương
                        phản nhận thức APCA.
                      </h2>
                      <p style={textStyle} className="text-xs leading-relaxed opacity-80">
                        Bề mặt kính production dùng token OKLCH có cổng APCA — không phải HEX/sRGB
                        thô. Viền là conic Fresnel (bắt sáng trên &gt; dưới &gt; hai bên),
                        delineator là drop shadow.
                      </p>
                    </div>

                    {/* Footer status */}
                    <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[11px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground">Fill token (dark)</span>
                        <span style={textStyle} className="font-semibold uppercase">
                          oklch({PROD_GLASS.fill.l} {PROD_GLASS.fill.c} {PROD_GLASS.fill.h} /{' '}
                          {PROD_GLASS.readableAlpha})
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-muted-foreground">APCA (text)</span>
                        <span
                          className={cn(
                            'font-bold uppercase',
                            apcaAbs >= 60 ? 'text-emerald-400' : 'text-amber-400',
                          )}
                        >
                          {apcaLc > 0 ? `+${apcaLc}` : apcaLc} Lc
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* FUSING SANDBOX — CSS gooey filter toy (independent of production glass) */
                <div className="relative flex h-90 w-full max-w-lg flex-col items-center justify-between rounded-3xl border border-white/5 bg-black/50 p-6">
                  <svg className="pointer-events-none absolute h-0 w-0" aria-hidden>
                    <defs>
                      <filter id="liquid-glass-goo">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
                        <feColorMatrix
                          in="blur"
                          mode="matrix"
                          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12"
                          result="goo"
                        />
                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                      </filter>
                    </defs>
                  </svg>

                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-900/40 px-2 py-1 text-xs text-purple-300">
                    <Sparkles className="size-3.5" />
                    Mô phỏng &quot;Vũ đạo của kính&quot; (Liquid Glass Merging)
                  </div>

                  <div className="relative mt-8 flex w-full flex-1 items-center justify-center overflow-hidden rounded-2xl bg-[#050309]">
                    <div className="pointer-events-none absolute size-32 rounded-full bg-purple-500/10 blur-2xl" />
                    <div
                      className="relative flex h-full w-full items-center justify-center"
                      style={{ filter: 'url(#liquid-glass-goo)' }}
                    >
                      <div
                        className="absolute size-24 rounded-full"
                        style={{
                          backgroundColor: 'oklch(0.72 0.16 230)',
                          boxShadow: 'inset 0 0 15px rgba(255,255,255,0.5)',
                        }}
                      />
                      <div
                        className="absolute size-20 rounded-full transition-transform duration-(--duration-base) ease-fluid"
                        style={{
                          backgroundColor: 'oklch(0.65 0.22 330)',
                          boxShadow: 'inset 0 0 15px rgba(255,255,255,0.5)',
                          transform: `translateX(${fusingDistance - 100}px)`,
                        }}
                      />
                    </div>
                    {fusingDistance < 60 && (
                      <div className="pointer-events-none absolute rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-center font-mono text-[10px] font-bold tracking-widest text-white uppercase select-none">
                        fusing dynamic
                      </div>
                    )}
                  </div>

                  <div className="z-10 mt-4 w-full space-y-1">
                    <div className="flex justify-between font-mono text-xs text-gray-400">
                      <span>Khoảng cách phân cực (Spacing)</span>
                      <span className="font-semibold text-white">{fusingDistance}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      value={fusingDistance}
                      onChange={(e) => setFusingDistance(parseInt(e.target.value))}
                      className="h-1.5 w-full cursor-pointer rounded-lg bg-white/10 accent-purple-500"
                    />
                    <p className="mt-1 text-center font-sans text-[10px] text-gray-400">
                      Kéo thanh trượt để mang hai màng kính lại gần nhau.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* AMBIENT PRESET SELECTOR */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="space-y-0.5">
                <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  <Palette className="size-3.5 text-primary" />
                  Môi trường màng Scrim nền (Ambient Backdrop)
                </span>
                <p className="text-xs text-muted-foreground">
                  Đổi hậu cảnh dưới kính để tính tương phản APCA phản xạ động của chữ.
                </p>
              </div>
              <div className="flex gap-2">
                {AMBIENT_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant={selectedPreset.id === preset.id ? 'default' : 'outline'}
                    size="sm"
                    className="h-auto flex-1 items-center gap-2 px-3 py-2 text-left text-[10px] sm:flex-initial"
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <span
                      className="size-3.5 shrink-0 rounded-full border border-white/25"
                      style={{
                        background: `linear-gradient(135deg, ${preset.gradientFrom}, ${preset.gradientVia})`,
                      }}
                    />
                    <span className="font-mono text-[10px] font-semibold">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ═══════ RIGHT — CONTROLS (5 cols) ═══════ */}
      <aside className="flex flex-col gap-6 lg:col-span-5">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-0">
            <div className="grid grid-cols-4 border-b border-border text-center font-mono text-xs">
              {(
                [
                  { id: 'surface', label: 'Tấm Kính', icon: Sliders },
                  { id: 'text', label: 'Thị Giác', icon: Contrast },
                  { id: 'details', label: 'Mỹ Thuật', icon: Layers },
                  { id: 'sandbox', label: 'Vũ Đạo', icon: Sparkles },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex flex-col items-center gap-1 border-b-2 py-3.5 transition-all',
                    activeTab === id
                      ? 'border-primary bg-primary/5 font-semibold text-foreground'
                      : 'border-transparent text-muted-foreground hover:bg-muted/20 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-6 p-6">
            {/* ── TAB 1: TẤM KÍNH — read-only production token readout ── */}
            {activeTab === 'surface' && (
              <div className="space-y-6">
                <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <h3 className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wider text-foreground uppercase">
                    <span className="h-4 w-1.5 rounded-sm bg-primary" />
                    Token kính production (chỉ đọc)
                  </h3>
                  <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                    Đây không phải slider: kính production là một hệ token, không phải núm chỉnh
                    từng thẻ. Các giá trị dưới đây là những gì{' '}
                    <code className="font-mono">glass-panel</code> dùng cho theme tối.
                  </p>
                  <div className="space-y-2 border-t border-border/60 pt-3">
                    <TokenRow
                      label="Fill (--glass-fill)"
                      value={`oklch(${PROD_GLASS.fill.l} ${PROD_GLASS.fill.c} ${PROD_GLASS.fill.h})`}
                    />
                    <TokenRow label="Readable alpha" value={`${PROD_GLASS.readableAlpha}`} />
                    <TokenRow label="Blur (--glass-blur)" value={`${PROD_GLASS.blur}px`} />
                    <TokenRow label="Saturate" value={`${PROD_GLASS.saturate}%`} />
                    <TokenRow label="Brightness" value={`${PROD_GLASS.brightness}%`} />
                    <TokenRow label="Rim" value="conic Fresnel (top>bottom>side)" />
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
                  <h4 className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
                    <Info className="size-3.5 text-primary" />
                    Muốn đổi kính?
                  </h4>
                  <p className="font-sans text-[11px] leading-relaxed">
                    Sửa token trong{' '}
                    <code className="font-mono">packages/ui/src/styles/theme.css</code> (một chỗ, cả
                    app đổi theo) — không chỉnh trực tiếp trên thẻ. Cường độ soft/strong qua
                    personalization chỉ đổi alpha + blur.
                  </p>
                </div>
              </div>
            )}

            {/* ── TAB 2: THỊ GIÁC — text colour over real glass + APCA/WCAG ── */}
            {activeTab === 'text' && (
              <div className="space-y-6">
                <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-mono text-xs tracking-wider text-muted-foreground uppercase">
                      <Contrast className="size-3.5 text-primary" /> Tương phản trên kính thật
                    </h4>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Nền: {selectedPreset.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col justify-between rounded-xl border border-purple-500/20 bg-purple-950/20 p-3">
                      <span className="font-mono text-[10px] font-semibold text-purple-300 uppercase">
                        APCA (WCAG 3)
                      </span>
                      <div className="my-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-3xl font-extrabold text-foreground">
                          {apcaLc > 0 ? `+${apcaLc}` : apcaLc}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">Lc</span>
                      </div>
                      <p className="font-sans text-[10px] leading-tight text-muted-foreground">
                        Chữ trên kính production, tổng hợp trên hậu cảnh đang chọn.
                      </p>
                    </div>
                    <div className="flex flex-col justify-between rounded-xl border border-border bg-muted/10 p-3">
                      <span className="font-mono text-[10px] font-semibold text-muted-foreground uppercase">
                        WCAG 2.x (tĩnh)
                      </span>
                      <div className="my-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-3xl font-extrabold text-foreground">
                          {wcag}:1
                        </span>
                      </div>
                      <span
                        className={cn(
                          'font-mono text-[10px] font-semibold',
                          wcag >= 4.5 ? 'text-emerald-400' : 'text-amber-400',
                        )}
                      >
                        {wcag >= 4.5 ? 'PASS (AA)' : 'FAIL (< 4.5:1)'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-border pt-3.5">
                    <span className="block font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                      Yêu cầu thiết kế APCA tương ứng:
                    </span>
                    <div className="rounded-xl border border-purple-500/10 bg-purple-950/20 p-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-300">
                        <span className="size-1.5 rounded-full bg-purple-400" />
                        {apcaRec.rating}
                      </div>
                      <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground">
                        <strong className="text-foreground">Kích cỡ font tối thiểu:</strong>{' '}
                        {apcaRec.minFont}
                      </p>
                      <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                        <strong className="text-foreground">Ứng dụng:</strong> {apcaRec.useCase}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wider text-foreground uppercase">
                    <span className="h-4 w-1.5 rounded-sm bg-primary" />
                    Màu sắc & Kích thước Chữ (OKLCH)
                  </h3>
                  {[
                    {
                      label: 'Lightness (L — Độ sáng chữ)',
                      val: textL,
                      set: setTextL,
                      min: 0.01,
                      max: 0.99,
                      step: 0.01,
                      fmt: (v: number) => v.toFixed(3),
                    },
                    {
                      label: 'Chroma (C — Độ rực rỡ màu chữ)',
                      val: textC,
                      set: setTextC,
                      min: 0,
                      max: 0.15,
                      step: 0.005,
                      fmt: (v: number) => v.toFixed(3),
                    },
                    {
                      label: 'Hue (h — Góc màu chữ)',
                      val: textH,
                      set: setTextH,
                      min: 0,
                      max: 360,
                      step: 1,
                      fmt: (v: number) => `${v.toFixed(0)}°`,
                    },
                    {
                      label: 'Font Size (Kích thước chữ)',
                      val: fontSize,
                      set: setFontSize,
                      min: 12,
                      max: 28,
                      step: 1,
                      fmt: (v: number) => `${v}px`,
                    },
                  ].map((item) => (
                    <PlaygroundSlider key={item.label} {...item} />
                  ))}

                  <div className="space-y-2">
                    <span className="block font-mono text-xs text-muted-foreground">
                      Font Weight (Độ mảnh của chữ)
                    </span>
                    <div className="grid grid-cols-4 gap-2 rounded-xl border border-border bg-muted/20 p-1 text-xs">
                      {(['300', '400', '600', '800'] as const).map((w) => (
                        <button
                          key={w}
                          onClick={() => setFontWeight(w)}
                          className={cn(
                            'rounded-lg py-1.5 font-mono transition',
                            fontWeight === w
                              ? 'border border-primary/30 bg-primary/30 font-bold text-foreground'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {w === '300'
                            ? 'Light'
                            : w === '400'
                              ? 'Normal'
                              : w === '600'
                                ? 'Medium'
                                : 'Bold'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: MỸ THUẬT — rim / edge doctrine explainer ── */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <h3 className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wider text-foreground uppercase">
                    <span className="h-4 w-1.5 rounded-sm bg-primary" />
                    Viền kính production (conic Fresnel)
                  </h3>
                  <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                    Viền là một vòng conic 1px được mask —{' '}
                    <strong className="text-foreground">bắt sáng</strong>, KHÔNG phải cổng tương
                    phản. Thứ tách panel khỏi nền là drop shadow. Alpha giảm dần theo Fresnel:
                  </p>
                  <div className="space-y-2 border-t border-border/60 pt-3">
                    <TokenRow label="Top (bắt sáng mạnh)" value="l+0.40 / α0.40 (dark)" />
                    <TokenRow label="Bottom (bắt sáng phụ)" value="l+0.24 / α0.22" />
                    <TokenRow label="Side (mờ nhất)" value="l+0.12 / α0.12" />
                    <TokenRow label="Model" value="tint lift-from-fill (Rim B)" />
                    <TokenRow label="Grain / noise" value="đã gỡ (clean)" />
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground">
                  <h4 className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
                    <Info className="size-3.5 text-primary" />
                    Cơ chế quang học Liquid Glass 2026
                  </h4>
                  <p className="font-sans text-[11px] leading-relaxed">
                    Kính chỉ là lớp dẫn đường bồng bềnh trên nội dung cuộn — không bọc trực tiếp
                    khối văn bản dài (đưa vào inset solid: DialogBody / CardWell). Bề mặt = blur +
                    tint + viền specular, không grain.
                  </p>
                </div>
              </div>
            )}

            {/* ── TAB 4: VŨ ĐẠO (Fusing sandbox info) ── */}
            {activeTab === 'sandbox' && (
              <div className="space-y-4">
                <div className="space-y-3 rounded-2xl border border-purple-500/20 bg-purple-950/20 p-5 text-xs">
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <Sparkles className="size-4 text-purple-400" />
                    Nguyên lý Sức căng Bề mặt Chất lỏng
                  </h4>
                  <p className="font-sans leading-relaxed text-muted-foreground">
                    Trong iOS 26 / macOS Tahoe, khi hai thành phần Liquid Glass lại gần nhau, biên
                    của chúng tan chảy và hòa quyện qua cơ chế{' '}
                    <code className="font-mono font-semibold text-purple-300">glassEffectID</code>.
                    Đây là mô phỏng web bằng bộ lọc gooey — một thí nghiệm riêng, không thuộc hệ
                    glass production.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <span>Khoảng cách phân cực</span>
                    <span className="font-semibold text-foreground">{fusingDistance}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={fusingDistance}
                    onChange={(e) => setFusingDistance(parseInt(e.target.value))}
                    className="h-1.5 w-full cursor-pointer rounded-lg bg-muted accent-purple-500"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
