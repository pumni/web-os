'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

import { Badge } from '@pumni/ui/feedback';
import { Button, Slider } from '@pumni/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardWell,
} from '@pumni/ui/layout';
import { apcaContrast } from '@pumni/ui/lib/apca';
import { oklchToSrgb } from '@pumni/ui/lib/oklch';
import {
  Check,
  Code,
  Compass,
  Contrast,
  Copy,
  Info,
  Layers,
  Moon,
  Palette,
  RotateCcw,
  Sliders,
  Sparkles,
  Sunset,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AMBIENT_PRESETS,
  BACKDROP_PRESETS,
  GlassBackdrop,
  type AmbientPreset,
  type BackdropStyle,
} from './glass-2026-primitives';

/**
 * Glass Playground — rewritten exclusively from glassmorphism-card-laboratory.
 *
 * Faithful adaptation of the Lab's architecture:
 *   • OKLCH glass fill with alpha
 *   • backdrop-filter: blur + saturate + brightness (3-knob)
 *   • Relative OKLCH border: oklch(from var(--glass) calc(l ± delta) c h / alpha)
 *   • Diagonal reflection overlay (Lab: "Shiny diagonal reflection line")
 *   • Volumetric drop shadow: 0 25px 60px -15px
 *   • APCA Lc + WCAG 2.x dual contrast display
 *   • 4 tabs: Tấm Kính / Thị Giác / Mỹ Thuật / Vũ Đạo (fusing sandbox)
 *   • CSS + Tailwind v4 reactive code exporter
 */

/* ───── APCA helpers (sRGB 0-1 triple) ───── */
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

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép ${label}!`);
}

/* ───── APCA recommendation (matching Lab's getApcaRecommendation) ───── */
interface ApcaRec {
  rating: string;
  minFont: string;
  useCase: string;
}
function getApcaRec(Lc: number): ApcaRec {
  const abs = Math.abs(Lc);
  if (abs >= 90) return { rating: 'Perfect (Lc ≥ 90)', minFont: '≥ 14px (Normal / Weight 400)', useCase: 'Fluent text / Body columns (Highly readable)' };
  if (abs >= 75) return { rating: 'Excellent (Lc ≥ 75)', minFont: '≥ 16px (Normal) or ≥ 14px (Bold)', useCase: 'Fluent body / standard reading text' };
  if (abs >= 60) return { rating: 'Good (Lc ≥ 60)', minFont: '≥ 18px (Normal) or ≥ 16px (Bold)', useCase: 'Subheadings, user interface widgets, smaller captions' };
  if (abs >= 45) return { rating: 'Large Text Only (Lc ≥ 45)', minFont: '≥ 24px (Normal) or ≥ 18px (Bold)', useCase: 'Large titles, headlines, call-to-actions' };
  if (abs >= 30) return { rating: 'Graphics & UI Elements Only (Lc ≥ 30)', minFont: '≥ 36px (Normal) or heavy graphic elements', useCase: 'Disabled text, placeholder overlays, thick lines' };
  return { rating: 'Insufficient Contrast (Lc < 30)', minFont: 'Not recommended for any readable text', useCase: 'Decorative lines, spacers, backgrounds only' };
}

/* ═══════════ MAIN COMPONENT ═══════════ */

export function GlassPlayground() {
  /* ── Tab & backdrop state ── */
  const [activeTab, setActiveTab] = React.useState<'surface' | 'text' | 'details' | 'sandbox'>('surface');
  const [backdropStyle, setBackdropStyle] = React.useState<BackdropStyle>('orbs');
  const [selectedPreset, setSelectedPreset] = React.useState<AmbientPreset>(AMBIENT_PRESETS[0]!);
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  /* ── Glass surface OKLCH (Lab defaults = "Kính Tối" / dark default since playground renders on dark canvas) ── */
  const [glassL, setGlassL] = React.useState(0.18);
  const [glassC, setGlassC] = React.useState(0.02);
  const [glassH, setGlassH] = React.useState(240);
  const [glassA, setGlassA] = React.useState(0.40);

  /* ── Backdrop filter knobs (Lab "Kính Tối" defaults) ── */
  const [blur, setBlur] = React.useState(24);
  const [saturate, setSaturate] = React.useState(150);   // %
  const [brightness, setBrightness] = React.useState(85); // %

  /* ── Text OKLCH ── */
  const [textL, setTextL] = React.useState(0.95);
  const [textC, setTextC] = React.useState(0.01);
  const [textH, setTextH] = React.useState(240);
  const [fontWeight, setFontWeight] = React.useState<'300' | '400' | '600' | '800'>('400');
  const [fontSize, setFontSize] = React.useState(15);

  /* ── Border & shadow (details tab) ── */
  const [borderA, setBorderA] = React.useState(0.15);
  const [borderW, setBorderW] = React.useState(1);
  const [relativeBorder, setRelativeBorder] = React.useState(true);
  const [shadowA, setShadowA] = React.useState(0.25);

  /* ── Fusing sandbox ── */
  const [fusingDistance, setFusingDistance] = React.useState(120);

  /* ── Presets ── */
  function applyLightPreset() {
    setGlassL(0.96); setGlassC(0.01); setGlassH(250); setGlassA(0.20);
    setBlur(20); setSaturate(130); setBrightness(110);
    setTextL(0.12); setTextC(0.01); setTextH(250);
    setFontWeight('400'); setBorderA(0.35); setRelativeBorder(true);
  }
  function applyDarkPreset() {
    setGlassL(0.18); setGlassC(0.02); setGlassH(240); setGlassA(0.40);
    setBlur(24); setSaturate(150); setBrightness(85);
    setTextL(0.95); setTextC(0.01); setTextH(240);
    setFontWeight('400'); setBorderA(0.15); setRelativeBorder(true);
  }

  /* ── Copy handler ── */
  function handleCopy(code: string, type: string) {
    copyToClipboard(code, type);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  }

  /* ── Derived: border color (relative OKLCH syntax from Lab) ── */
  const lightnessDelta = glassL < 0.5 ? 0.15 : 0.12;
  const borderL = Math.min(1, glassL + lightnessDelta);
  const borderColorStr = relativeBorder
    ? `oklch(from var(--glass-color) calc(l + ${lightnessDelta.toFixed(2)}) c h / ${borderA})`
    : `oklch(1 0 0 / ${borderA})`;
  const borderColorRendered = relativeBorder
    ? `oklch(${borderL.toFixed(3)} ${glassC.toFixed(3)} ${glassH} / ${borderA})`
    : `oklch(1 0 0 / ${borderA})`;

  /* ── Derived: APCA + WCAG contrast ── */
  const glassSrgb = oklchToSrgb({ l: glassL, c: glassC, h: glassH });
  const textSrgb = oklchToSrgb({ l: textL, c: textC, h: textH });
  const ambientSrgb = from255(selectedPreset.rgb);
  const blendedBg = blendOver(glassSrgb, glassA, ambientSrgb);

  const apcaLc = Math.round(apcaContrast(textSrgb, blendedBg) * 10) / 10;
  const wcag = wcagRatio(textSrgb, blendedBg);
  const apcaRec = getApcaRec(apcaLc);
  const apcaAbs = Math.abs(apcaLc);

  /* ── CSS exporter string (matching Lab format exactly) ── */
  const cssCode = `:root {
  /* Dynamic OKLCH color system */
  --bg-ambient: rgb(${selectedPreset.rgb.r}, ${selectedPreset.rgb.g}, ${selectedPreset.rgb.b});
  --glass-color: oklch(${glassL.toFixed(3)} ${glassC.toFixed(3)} ${glassH.toFixed(0)});
  --glass-opacity: ${glassA.toFixed(2)};
  
  /* Relative border color (calculates border contrast relative to the card fill) */
  --glass-border: ${borderColorStr};
    
  --text-primary: oklch(${textL.toFixed(3)} ${textC.toFixed(3)} ${textH.toFixed(0)});
}

.liquid-glass-card {
  background-color: oklch(from var(--glass-color) l c h / var(--glass-opacity));
  border: ${borderW}px solid var(--glass-border);
  border-radius: 24px;
  
  /* Optical Glass Backdrops */
  backdrop-filter: blur(${blur}px) saturate(${saturate}%) brightness(${brightness}%);
  -webkit-backdrop-filter: blur(${blur}px) saturate(${saturate}%) brightness(${brightness}%);
  
  /* Volumetric Drop Shadow */
  box-shadow: 0 25px 60px -15px oklch(0% 0 0 / ${(shadowA * 100).toFixed(0)}%);
}

/* Shiny diagonal reflection line (physical glass edge simulation) */
.liquid-glass-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(to top right, transparent, rgba(255,255,255,0.05), rgba(255,255,255,0.10));
  opacity: 0.6;
  pointer-events: none;
}`;

  const twCode = `<div className="
  /* Glass sheet base and relative OKLCH background */
  bg-[oklch(${glassL.toFixed(2)}_${glassC.toFixed(3)}_${glassH.toFixed(0)}/_${glassA.toFixed(2)})]
  
  /* Backdrop filters for optical dispersion */
  backdrop-blur-[${blur}px] backdrop-saturate-[${saturate}%] backdrop-brightness-[${brightness}%]
  
  /* Relative outline border */
  border-[${borderW}px] border-[oklch(${relativeBorder ? borderL.toFixed(2) : '1'}_${glassC.toFixed(3)}_${glassH.toFixed(0)}/_${borderA.toFixed(2)})]
  
  /* Volumetric elevation shadow */
  shadow-[0_25px_60px_-15px_rgba(0,0,0,${shadowA.toFixed(2)})]
  
  /* Decorative layout rules */
  rounded-3xl p-6 text-[oklch(${textL.toFixed(2)}_${textC.toFixed(3)}_${textH.toFixed(0)})]
">
  <h2 className="font-[${fontWeight}]">Liquid Glass Card</h2>
</div>`;

  /* ── Preview inline style (direct render — no CSS variables for the preview card) ── */
  const previewStyle: React.CSSProperties = {
    backgroundColor: `oklch(${glassL} ${glassC} ${glassH} / ${glassA})`,
    backdropFilter: `blur(${blur}px) saturate(${saturate}%) brightness(${brightness}%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturate}%) brightness(${brightness}%)`,
    borderWidth: `${borderW}px`,
    borderStyle: 'solid',
    borderColor: borderColorRendered,
    boxShadow: `0 25px 60px -15px rgba(0, 0, 0, ${shadowA})`,
    borderRadius: '32px',
  };

  const textStyle: React.CSSProperties = {
    color: `oklch(${textL} ${textC} ${textH})`,
  };

  /* ── Render ── */
  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">

      {/* ═══════ LEFT — CANVAS VIEWPORT (7 cols) ═══════ */}
      <section className="lg:col-span-7 flex flex-col gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="font-mono text-lg uppercase tracking-wider">
                  Glassmorphism Card Lab
                  <Badge tone="primary" size="sm" className="ml-2 align-middle text-[10px]">
                    OKLCH + APCA 3.0
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Phòng thí nghiệm tương tác mô phỏng kiến trúc kính Liquid Glass.
                </CardDescription>
              </div>
              {/* Background style switcher */}
              <div className="flex items-center gap-1 rounded-xl border bg-muted/30 p-1 text-xs">
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
              className="relative flex min-h-[460px] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/10 p-8 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]"
              style={{
                background: `linear-gradient(135deg, ${selectedPreset.gradientFrom}, ${selectedPreset.gradientVia}, ${selectedPreset.gradientTo})`,
              }}
            >
              <GlassBackdrop style={backdropStyle} preset={selectedPreset} />

              {activeTab !== 'sandbox' ? (
                /* GLASS CARD SPECIMEN */
                <div
                  className="relative w-full max-w-md overflow-hidden transition-all duration-300"
                  style={previewStyle}
                >
                  {/* Diagonal reflection overlay — Lab: "Shiny diagonal reflection line" */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-60"
                    style={{
                      background: 'linear-gradient(to top right, transparent, rgba(255,255,255,0.05), rgba(255,255,255,0.10))',
                      borderRadius: 'inherit',
                    }}
                  />

                  <div className="relative z-10 flex flex-col justify-between gap-8 p-8 lg:p-10">
                    {/* Card top bar */}
                    <div className="flex items-center justify-between">
                      <span
                        style={textStyle}
                        className="font-mono text-xs uppercase tracking-widest opacity-75"
                      >
                        Liquid Glass Specimen
                      </span>
                      <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
                    </div>

                    {/* Main text */}
                    <div className="space-y-3">
                      <h2
                        style={{ ...textStyle, fontWeight, fontSize: `${fontSize}px` }}
                        className="text-2xl leading-snug tracking-tight transition-all duration-200"
                      >
                        Sự tiến hóa của giao diện Web: Không gian màu OKLCH, và Tiêu chuẩn tương phản nhận thức APCA.
                      </h2>
                      <p style={textStyle} className="text-xs leading-relaxed opacity-80">
                        Bề mặt kính hiện đại không dùng HEX hay sRGB thô, mà tự động hóa tính toán tỷ lệ tương đối của viền, độ chói võng mạc thực và triệt tiêu lỗi Hue Shift.
                      </p>
                    </div>

                    {/* Footer status */}
                    <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[11px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-400">Fill Color Token</span>
                        <span style={textStyle} className="font-semibold uppercase">
                          oklch({glassL.toFixed(2)} {glassC.toFixed(2)} {glassH})
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-gray-400">APCA Rating</span>
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
                /* FUSING SANDBOX — CSS gooey filter simulation */
                <div className="relative flex w-full max-w-lg flex-col items-center justify-between rounded-3xl border border-white/5 bg-black/50 p-6 h-[360px]">
                  {/* SVG gooey filter */}
                  <svg className="absolute h-0 w-0 pointer-events-none" aria-hidden>
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

                  <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-900/40 px-2 py-1 text-xs text-purple-300">
                    <Sparkles className="size-3.5" />
                    Mô phỏng "Vũ đạo của kính" (Liquid Glass Merging)
                  </div>

                  <div className="relative flex-1 w-full mt-8 rounded-2xl bg-[#050309] flex items-center justify-center overflow-hidden">
                    <div className="absolute size-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
                    <div
                      className="relative flex w-full h-full items-center justify-center"
                      style={{ filter: 'url(#liquid-glass-goo)' }}
                    >
                      {/* Fixed cyan bubble */}
                      <div
                        className="absolute size-24 rounded-full"
                        style={{
                          backgroundColor: 'oklch(0.72 0.16 230)',
                          boxShadow: 'inset 0 0 15px rgba(255,255,255,0.5)',
                        }}
                      />
                      {/* Movable fuchsia bubble */}
                      <div
                        className="absolute size-20 rounded-full transition-transform duration-200 ease-out"
                        style={{
                          backgroundColor: 'oklch(0.65 0.22 330)',
                          boxShadow: 'inset 0 0 15px rgba(255,255,255,0.5)',
                          transform: `translateX(${fusingDistance - 100}px)`,
                        }}
                      />
                    </div>
                    {fusingDistance < 60 && (
                      <div className="absolute select-none pointer-events-none rounded-full border border-white/10 bg-black/60 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white text-center">
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
                      type="range" min="0" max="180" value={fusingDistance}
                      onChange={(e) => setFusingDistance(parseInt(e.target.value))}
                      className="w-full h-1.5 cursor-pointer rounded-lg bg-white/10 accent-purple-500"
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
                  Thay đổi chất nền bên dưới để tính toán tương phản APCA phản xạ động.
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

            {/* GENERATED CODE EXPORTER */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  <Code className="size-4 text-primary" />
                  MÃ NGUỒN LIÊN THÔNG (Reactive Exporter)
                </h3>
                <span className="font-mono text-[10px] text-muted-foreground">Tailwind v4 + Standard CSS</span>
              </div>

              <div className="space-y-3">
                {/* CSS */}
                <div>
                  <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-border bg-muted/30 px-4 py-2 font-mono text-[10px] text-muted-foreground">
                    <span>MODERN CSS (OKLCH STACK)</span>
                    <button
                      onClick={() => handleCopy(cssCode, 'css')}
                      className="flex items-center gap-1 transition hover:text-foreground"
                    >
                      {copiedText === 'css' ? (
                        <><Check className="size-3.5 text-emerald-400" /> Copied!</>
                      ) : (
                        <><Copy className="size-3.5" /> Copy Code</>
                      )}
                    </button>
                  </div>
                  <CardWell padding="none" className="rounded-t-none max-h-36 overflow-auto">
                    <pre className="p-4 font-mono text-[10px] leading-relaxed text-primary/80">
                      <code>{cssCode}</code>
                    </pre>
                  </CardWell>
                </div>

                {/* Tailwind */}
                <div>
                  <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-border bg-muted/30 px-4 py-2 font-mono text-[10px] text-muted-foreground">
                    <span>TAILWIND v4 UTILITIES</span>
                    <button
                      onClick={() => handleCopy(twCode, 'tw')}
                      className="flex items-center gap-1 transition hover:text-foreground"
                    >
                      {copiedText === 'tw' ? (
                        <><Check className="size-3.5 text-emerald-400" /> Copied!</>
                      ) : (
                        <><Copy className="size-3.5" /> Copy classes</>
                      )}
                    </button>
                  </div>
                  <CardWell padding="none" className="rounded-t-none max-h-28 overflow-auto">
                    <pre className="whitespace-pre-wrap p-4 font-mono text-[10px] leading-relaxed text-primary/80">
                      <code>{twCode}</code>
                    </pre>
                  </CardWell>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ═══════ RIGHT — CONTROLS (5 cols) ═══════ */}
      <aside className="lg:col-span-5 flex flex-col gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-0">
            {/* 4-tab switcher (matching Lab's tab structure) */}
            <div className="grid grid-cols-4 text-center text-xs font-mono border-b border-border">
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
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-6 p-6">

            {/* Preset reset buttons (all tabs except sandbox) */}
            {activeTab !== 'sandbox' && (
              <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-3 text-xs">
                <span className="font-medium text-muted-foreground">Chủ đề mẫu (Theme Preset)</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 px-2.5 text-[11px]"
                    onClick={applyLightPreset}
                  >
                    <Sunset className="size-3" /> Kính Sáng
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 gap-1 bg-purple-600 px-2.5 text-[11px] text-white hover:bg-purple-500"
                    onClick={applyDarkPreset}
                  >
                    <Moon className="size-3" /> Kính Tối
                  </Button>
                </div>
              </div>
            )}

            {/* ── TAB 1: TẤM KÍNH (Surface Matrix) ── */}
            {activeTab === 'surface' && (
              <div className="space-y-6">
                {/* OKLCH fill sliders */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
                    <span className="h-4 w-1.5 rounded-sm bg-primary" />
                    Độ phân cực OKLCH của Kính
                  </h3>
                  {[
                    { label: 'Lightness (L — Độ chói cảm nhận)', val: glassL, set: setGlassL, min: 0.01, max: 0.99, step: 0.01, fmt: (v: number) => v.toFixed(3), hint: 'Bảo đảm sự đồng nhất độ sáng tuyệt đối giữa các tông màu khác nhau.' },
                    { label: 'Chroma (C — Độ rực rỡ màu)', val: glassC, set: setGlassC, min: 0, max: 0.25, step: 0.005, fmt: (v: number) => v.toFixed(3), hint: 'Chroma tối đa của sRGB là ~0.25. Giữ mức thấp để đạt độ trong suốt chân thực.' },
                    { label: 'Hue (h — Góc màu sắc độ)', val: glassH, set: setGlassH, min: 0, max: 360, step: 1, fmt: (v: number) => `${v.toFixed(0)}°`, hint: '' },
                    { label: 'Glass Opacity (Độ trong suốt)', val: glassA, set: setGlassA, min: 0.05, max: 0.80, step: 0.01, fmt: (v: number) => `${(v * 100).toFixed(0)}%`, hint: '' },
                  ].map(({ label, val, set, min, max, step, fmt, hint }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-primary">{fmt(val)}</span>
                      </div>
                      <Slider min={min} max={max} step={step} value={[val]} onValueChange={(v) => set(v[0] ?? val)} />
                      {hint && <p className="text-[10px] text-muted-foreground/70">{hint}</p>}
                    </div>
                  ))}
                </div>

                {/* Backdrop filter sliders */}
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
                    <span className="h-4 w-1.5 rounded-sm bg-primary" />
                    Hiệu ứng Thủy tinh Quang học
                  </h3>
                  {[
                    { label: 'Backdrop Blur (Độ nhòe nền)', val: blur, set: setBlur, min: 0, max: 64, step: 1, fmt: (v: number) => `${v}px` },
                    { label: 'Backdrop Saturation (Độ bão hòa bồi đắp)', val: saturate, set: setSaturate, min: 100, max: 250, step: 5, fmt: (v: number) => `${v}%` },
                    { label: 'Backdrop Brightness (Độ sáng bù trừ)', val: brightness, set: setBrightness, min: 60, max: 150, step: 5, fmt: (v: number) => `${v}%` },
                  ].map(({ label, val, set, min, max, step, fmt }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-primary">{fmt(val)}</span>
                      </div>
                      <Slider min={min} max={max} step={step} value={[val]} onValueChange={(v) => set(v[0] ?? val)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB 2: THỊ GIÁC (Typography + APCA/WCAG) ── */}
            {activeTab === 'text' && (
              <div className="space-y-6">
                {/* Contrast scoreboard */}
                <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      <Contrast className="size-3.5 text-primary" /> Điểm Tương phản Thực tế
                    </h4>
                    <span className="font-mono text-[10px] text-muted-foreground">Nền: {selectedPreset.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* APCA */}
                    <div className="flex flex-col justify-between rounded-xl border border-purple-500/20 bg-purple-950/20 p-3">
                      <span className="font-mono text-[10px] font-semibold uppercase text-purple-300">APCA Standard (WCAG 3)</span>
                      <div className="my-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-3xl font-extrabold text-foreground">
                          {apcaLc > 0 ? `+${apcaLc}` : apcaLc}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">Lc</span>
                      </div>
                      <p className="font-sans text-[10px] leading-tight text-muted-foreground">
                        Tính theo độ nhạy quang phổ võng mạc và độ tràn sáng.
                      </p>
                    </div>
                    {/* WCAG 2 */}
                    <div className="flex flex-col justify-between rounded-xl border border-border bg-muted/10 p-3">
                      <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">WCAG 2.x Ratio (Tĩnh)</span>
                      <div className="my-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-3xl font-extrabold text-foreground">{wcag}:1</span>
                      </div>
                      <span className={cn('font-mono text-[10px] font-semibold', wcag >= 4.5 ? 'text-emerald-400' : 'text-amber-400')}>
                        {wcag >= 4.5 ? 'PASS (AA Standard)' : 'FAIL (< 4.5:1)'}
                      </span>
                    </div>
                  </div>

                  {/* APCA recommendation */}
                  <div className="space-y-1 border-t border-border pt-3.5">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Yêu cầu thiết kế APCA tương ứng:</span>
                    <div className="rounded-xl border border-purple-500/10 bg-purple-950/20 p-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-300">
                        <span className="size-1.5 rounded-full bg-purple-400" />
                        {apcaRec.rating}
                      </div>
                      <p className="mt-1 font-sans text-[11px] leading-relaxed text-muted-foreground">
                        <strong className="text-foreground">Kích cỡ font tối thiểu:</strong> {apcaRec.minFont}
                      </p>
                      <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                        <strong className="text-foreground">Ứng dụng:</strong> {apcaRec.useCase}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Text OKLCH sliders */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
                    <span className="h-4 w-1.5 rounded-sm bg-primary" />
                    Màu sắc & Kích thước Chữ (OKLCH)
                  </h3>
                  {[
                    { label: 'Lightness (L — Độ sáng chữ)', val: textL, set: setTextL, min: 0.01, max: 0.99, step: 0.01, fmt: (v: number) => v.toFixed(3) },
                    { label: 'Chroma (C — Độ rực rỡ màu chữ)', val: textC, set: setTextC, min: 0, max: 0.15, step: 0.005, fmt: (v: number) => v.toFixed(3) },
                    { label: 'Hue (h — Góc màu chữ)', val: textH, set: setTextH, min: 0, max: 360, step: 1, fmt: (v: number) => `${v.toFixed(0)}°` },
                    { label: 'Font Size (Kích thước chữ)', val: fontSize, set: setFontSize, min: 12, max: 28, step: 1, fmt: (v: number) => `${v}px` },
                  ].map(({ label, val, set, min, max, step, fmt }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-primary">{fmt(val)}</span>
                      </div>
                      <Slider min={min} max={max} step={step} value={[val]} onValueChange={(v) => set(v[0] ?? val)} />
                    </div>
                  ))}

                  {/* Font weight toggles */}
                  <div className="space-y-2">
                    <span className="block font-mono text-xs text-muted-foreground">Font Weight (Độ mảnh của chữ)</span>
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
                          {w === '300' ? 'Light' : w === '400' ? 'Normal' : w === '600' ? 'Medium' : 'Bold'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: MỸ THUẬT (Details: border, shadow, relative OKLCH) ── */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
                    <span className="h-4 w-1.5 rounded-sm bg-primary" />
                    Thiết lập Đường viền & Bóng đổ
                  </h3>

                  {/* Relative OKLCH border toggle — THE KEY FEATURE from Lab */}
                  <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="rel-border"
                          checked={relativeBorder}
                          onChange={(e) => setRelativeBorder(e.target.checked)}
                          className="size-4 rounded border-white/10 bg-black accent-purple-500"
                        />
                        <label htmlFor="rel-border" className="cursor-pointer select-none text-xs font-semibold text-foreground">
                          Relative OKLCH Border
                        </label>
                      </div>
                      <Badge tone="primary" size="sm" className="font-mono text-[9px]">Relative syntax</Badge>
                    </div>
                    <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                      Khi được bật, màu viền của kính sẽ được tính toán trực tiếp từ màu nền của tấm kính qua cú pháp relative màu của CSS:
                    </p>
                    <code className="mt-1 block rounded-lg bg-muted/40 p-2 font-mono text-[10px] text-primary">
                      oklch(from var(--glass) calc(l + {lightnessDelta.toFixed(2)}) c h / alpha)
                    </code>
                  </div>

                  {/* Border sliders */}
                  {[
                    { label: 'Border Width (Độ dày viền)', val: borderW, set: setBorderW, min: 0, max: 4, step: 0.5, fmt: (v: number) => `${v}px` },
                    { label: 'Border Opacity (Độ mờ của viền)', val: borderA, set: setBorderA, min: 0, max: 1, step: 0.05, fmt: (v: number) => `${(v * 100).toFixed(0)}%` },
                    { label: 'Drop Shadow Opacity (Bóng đổ 3D)', val: shadowA, set: setShadowA, min: 0, max: 0.6, step: 0.02, fmt: (v: number) => `${(v * 100).toFixed(0)}%` },
                  ].map(({ label, val, set, min, max, step, fmt }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-primary">{fmt(val)}</span>
                      </div>
                      <Slider min={min} max={max} step={step} value={[val]} onValueChange={(v) => set(v[0] ?? val)} />
                    </div>
                  ))}
                </div>

                {/* Educational box */}
                <div className="rounded-2xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-2">
                  <h4 className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
                    <Info className="size-3.5 text-primary" />
                    Cơ chế quang học Apple Liquid Glass
                  </h4>
                  <p className="font-sans text-[11px] leading-relaxed">
                    Apple quy định trong HIG: vật liệu kính chỉ dùng làm lớp dẫn đường (Navigation/Tab bar) bồng bềnh trên lớp nội dung cuộn bên dưới. Không bọc trực tiếp các khối văn bản chính dài vào kính mờ, nhằm bảo toàn phân cấp thông tin cao nhất.
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
                    Trong iOS 26 và macOS Tahoe, khi hai thành phần sở hữu vật liệu Liquid Glass di chuyển lại gần nhau, đường biên của chúng sẽ tự động tan chảy, hòa quyện (blend) và biến đổi mượt mà nhờ cơ chế{' '}
                    <code className="font-mono font-semibold text-purple-300">glassEffectID</code>.
                  </p>
                  <p className="font-sans leading-relaxed text-muted-foreground">
                    Trên nền tảng web, hiệu ứng hữu cơ này được tái lập nhờ sự kết hợp giữa thuộc tính lọc{' '}
                    <code className="font-mono text-purple-300">contrast()</code> siêu cao ở lớp chứa, và lớp phủ mờ{' '}
                    <code className="font-mono text-purple-300">blur()</code> sinh động bên trong các giọt kính.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/20 p-4 text-center font-mono text-xs text-muted-foreground">
                  Sử dụng thanh trượt bên cạnh cửa sổ Viewport để trải nghiệm sự hòa nhập chất lỏng tức thời!
                </div>

                {/* Fusing distance control in sidebar too */}
                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <span>Khoảng cách phân cực</span>
                    <span className="font-semibold text-foreground">{fusingDistance}px</span>
                  </div>
                  <input
                    type="range" min="0" max="180" value={fusingDistance}
                    onChange={(e) => setFusingDistance(parseInt(e.target.value))}
                    className="w-full h-1.5 cursor-pointer rounded-lg bg-muted accent-purple-500"
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
