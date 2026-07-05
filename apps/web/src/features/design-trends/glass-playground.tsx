'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

import { GlassSurface } from '@pumni/ui/identity';
import { Badge } from '@pumni/ui/feedback';
import { Button, Slider, Switch } from '@pumni/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardWell,
} from '@pumni/ui/layout';
import { apcaContrast } from '@pumni/ui/lib/apca';
import { formatOklch, oklchToSrgb } from '@pumni/ui/lib/oklch';
import {
  Activity,
  Check,
  Copy,
  Droplets,
  Gauge,
  Info,
  Layers,
  Palette,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  BACKDROP_PRESETS,
  GlassBackdrop,
  LiquidGlassCard,
  type BackdropPreset,
} from './glass-2026-primitives';
import { parseOklchLiteral, useBlobPrimary } from './use-blob-primary';
import { useFps, useGlassLayerCount } from './use-glass-perf';

/** Copy text to the clipboard with a success toast. */
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép ${label} vào bộ nhớ tạm!`);
}

/**
 * Production sweet-spot bounds (ADR-0012/0014/0016). Sliders clamp to these so
 * the playground can never teach a value the design system forbids — blur > 16px
 * or saturate > 1.8 raise mobile GPU cost for no perceptual gain (each glass
 * layer forces a separate backdrop render pass).
 */
const SPECS = {
  blur: { min: 8, max: 16, production: '12px (light) · 16px (dark)' },
  saturate: { min: 1.0, max: 1.8, production: '1.4' },
} as const;

/** In-spec confirmation badge — shows the slider is clamped to the production range. */
function SpecBadge() {
  return (
    <Badge tone="success" size="sm" className="gap-1 font-normal">
      <Check className="size-3" />
      Trong spec
    </Badge>
  );
}

/**
 * Corner options for the border-image corner-shine technique (Glassmorphism
 * 2.0 / 2026). The "shine" gradient only highlights one corner. Pumni
 * production uses a uniform hairline (ADR-0016 sheen removal); this demo
 * shows the alternative the design system deliberately rejected.
 *
 * Gradients are built via `formatOklch` (the colour-math formatter) so the
 * showcase never hand-writes a raw `oklch(...)` literal — the design-token
 * boundary forbids that in feature code, even for pure-white light effects.
 */
type ShineCorner = 'tl' | 'tr' | 'bl' | 'br';

const SHINE_CORNERS: ShineCorner[] = ['tl', 'tr', 'bl', 'br'];

function buildShineGradient(corner: ShineCorner): string {
  const bright = formatOklch({ l: 1, c: 0, h: 0 }, { alpha: 0.6, precision: 2 });
  const mid = formatOklch({ l: 1, c: 0, h: 0 }, { alpha: 0.05, precision: 2 });
  const angle: Record<ShineCorner, string> = {
    tl: '135deg',
    tr: '225deg',
    bl: '45deg',
    br: '315deg',
  };
  return `linear-gradient(${angle[corner]}, ${bright} 0%, ${mid} 30%, transparent 60%)`;
}

export function GlassPlayground() {
  // ── Spec-clamped backdrop-filter controls (production ADR-0014 sweet spot)
  const [saturateBoost, setSaturateBoost] = React.useState<number>(1.4);
  const [blurPx, setBlurPx] = React.useState<number>(12);

  // ── Showcase toggles — these are 2026 techniques, OFF by default to match
  // the production glass surface (which is a uniform hairline + flat tint).
  const [gradientTint, setGradientTint] = React.useState<boolean>(false);
  const [cornerShine, setCornerShine] = React.useState<boolean>(false);
  const [shineCorner, setShineCorner] = React.useState<ShineCorner>('tl');
  const [reactiveTint, setReactiveTint] = React.useState<boolean>(false);
  const [liquidGlass, setLiquidGlass] = React.useState<boolean>(false);
  const [showNested, setShowNested] = React.useState<boolean>(false);
  const [showBackdrop, setShowBackdrop] = React.useState<boolean>(true);
  const [backdropPreset, setBackdropPreset] = React.useState<BackdropPreset>('blob');

  // ── 2026 alignment — per-mode rim colour overrides. The production
  // `--glass-edge` (theme.css) is now mode-inverted: dark neutral-blue on
  // light, light neutral-violet on dark. These two toggles let the
  // playground reader *invert the inversion* and see why pure-white
  // fails — by injecting the legacy pure-white rim back, the APCA readout
  // collapses on light mode over a bright blob. A 2026 alignment teaching
  // tool, not a production option.
  const [rimLightOverride, setRimLightOverride] = React.useState<boolean>(false);
  const [rimDarkOverride, setRimDarkOverride] = React.useState<boolean>(false);

  // Theme sync — Pumni uses `class` strategy on <html>. The playground defaults
  // tint sliders per mode so the demo matches production when entering.
  const [isDark, setIsDark] = React.useState<boolean>(true);
  React.useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    const handle = requestAnimationFrame(sync);
    const observer = new MutationObserver(() => requestAnimationFrame(sync));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      cancelAnimationFrame(handle);
      observer.disconnect();
    };
  }, []);

  // ── Glass tint OKLCH primitives (Tier-1 demo — production Card always uses
  // the semantic `--glass-tint` token, never the primitives directly).
  const [tintL, setTintL] = React.useState<number>(0.13);
  const [tintC, setTintC] = React.useState<number>(0.0035);
  const [tintH, setTintH] = React.useState<number>(70);
  const [tintAlpha, setTintAlpha] = React.useState<number>(0.40);

  React.useEffect(() => {
    requestAnimationFrame(() => {
      if (isDark) {
        setTintL(0.13);
        setTintC(0.0035);
        setTintH(70);
        setTintAlpha(0.40);
      } else {
        setTintL(1.0);
        setTintC(0.0);
        setTintH(0);
        setTintAlpha(0.54);
      }
    });
  }, [isDark]);

  // ── Background-reactive tint: read live `--desktop-blob-primary` from the
  // cascade and rotate play tint hue toward it. This is the Glassmorphism 2.0
  // "color absorption" technique — the glass picks up the dominant hue of
  // whatever it floats over. Off = the static production tint.
  const blobToken = useBlobPrimary([backdropPreset, showBackdrop]);
  const blobOklch = parseOklchLiteral(blobToken);

  const reactiveHue = React.useMemo(() => {
    if (!reactiveTint || !blobOklch) return tintH;
    return blobOklch.h;
  }, [reactiveTint, blobOklch, tintH]);

  const reactiveChroma = React.useMemo(() => {
    if (!reactiveTint || !blobOklch) return tintC;
    // Subtle absorption: 30% of the backdrop chroma, capped at 0.04 to keep
    // the APCA gate untouched (tint stays near-neutral for text scrim).
    return Math.min(0.04, blobOklch.c * 0.3);
  }, [reactiveTint, blobOklch, tintC]);

  // ── Build the inline CSS variable injection. The preview only overrides the
  // glass tokens locally — production code goes through `glass.css` utilities.
  const previewTint = formatOklch(
    { l: tintL, c: reactiveChroma, h: reactiveHue },
    { alpha: tintAlpha },
  );

  // Gradient tint: when on, the tint is a linear-gradient from a lighter
  // top-left to a darker bottom-right, simulating physical glass thickness
  // (2026 alpha-channel gradient pillar). We emit it as a CSS background
  // shorthand so the glass still has a fill (not just a transparent overlay).
  const gradientTintBackground = React.useMemo(() => {
    if (!gradientTint) return undefined;
    const light = formatOklch(
      { l: Math.min(1, tintL + (isDark ? 0.05 : 0.0)), c: reactiveChroma, h: reactiveHue },
      { alpha: Math.min(1, tintAlpha + 0.08) },
    );
    const dark = formatOklch(
      { l: Math.max(0, tintL - (isDark ? 0.04 : 0.0)), c: reactiveChroma, h: reactiveHue },
      { alpha: Math.max(0, tintAlpha - 0.08) },
    );
    return `linear-gradient(135deg, ${light} 0%, ${dark} 100%)`;
  }, [gradientTint, tintL, tintAlpha, reactiveChroma, reactiveHue, isDark]);

  const previewCssVars: React.CSSProperties = {
    ['--glass-blur' as string]: `${blurPx}px`,
    ['--glass-saturate' as string]: `${saturateBoost}`,
    ['--glass-tint' as string]: previewTint,
  };
  if (gradientTintBackground) {
    previewCssVars.background = gradientTintBackground;
  }
  // Border-image corner-shine — emit BOTH the shorthand and the longhand so
  // React never sees them appear/disappear independently (which triggers the
  // "mixing shorthand and non-shorthand" rerender warning). When off we omit
  // both, letting the base `border: 1px solid var(--glass-edge)` of `glass-panel`
  // take over without conflict.
  if (cornerShine) {
    const shine = buildShineGradient(shineCorner);
    previewCssVars.borderImage = `${shine} 1`;
  }

  // ── 2026 rim colour override injection — when the toggle is on, inject
  // the legacy pure-white hairline back into the preview so the reader can
  // compare against the production mode-inverted token. The APCA readout
  // will drop below Lc 25 on light mode over a bright blob — the demo.
  if (rimLightOverride && !isDark) {
    (previewCssVars as Record<string, string>)['--glass-edge'] = 'oklch(1 0 0 / 0.45)';
  }
  if (rimDarkOverride && isDark) {
    (previewCssVars as Record<string, string>)['--glass-edge'] = 'oklch(1 0 0 / 0.14)';
  }

  // ── APCA readout. The composite is text-against-tint-against-backdrop. We
  // sample at the centre; when gradient tint is on we also sample two corners
  // so the user can see contrast differs across the panel.
  const fgOklch = isDark
    ? { l: 0.985, c: 0.005, h: 75 }
    : { l: 0.19, c: 0.0035, h: 70 };
  const blobSampleOklch = blobOklch ?? { l: 0.555, c: 0.115, h: 202 };
  const bgOklch = isDark ? { l: 0.13, c: 0.0035, h: 70 } : { l: 0.985, c: 0.005, h: 75 };

  const fgSrgb = oklchToSrgb(fgOklch);
  const blobSrgb = oklchToSrgb(blobSampleOklch);
  const underlyingBgSrgb = showBackdrop ? blobSrgb : oklchToSrgb(bgOklch);

  function composite(srgb: [number, number, number], alpha: number): [number, number, number] {
    return [
      srgb[0] * alpha + underlyingBgSrgb[0] * (1 - alpha),
      srgb[1] * alpha + underlyingBgSrgb[1] * (1 - alpha),
      srgb[2] * alpha + underlyingBgSrgb[2] * (1 - alpha),
    ];
  }
  const tintSrgb = oklchToSrgb({ l: tintL, c: reactiveChroma, h: reactiveHue });
  const centreLc = Math.abs(apcaContrast(fgSrgb, composite(tintSrgb, tintAlpha)));

  // Corner samples for gradient tint — uses the lighter / darker variants.
  let cornerSamples: { label: string; lc: number }[] | null = null;
  if (gradientTint && gradientTintBackground) {
    const lightSrgb = oklchToSrgb({
      l: Math.min(1, tintL + (isDark ? 0.05 : 0.0)),
      c: reactiveChroma,
      h: reactiveHue,
    });
    const darkSrgb = oklchToSrgb({
      l: Math.max(0, tintL - (isDark ? 0.04 : 0.0)),
      c: reactiveChroma,
      h: reactiveHue,
    });
    cornerSamples = [
      { label: 'TL (sáng)', lc: Math.abs(apcaContrast(fgSrgb, composite(lightSrgb, tintAlpha + 0.08))) },
      { label: 'BR (tối)', lc: Math.abs(apcaContrast(fgSrgb, composite(darkSrgb, Math.max(0, tintAlpha - 0.08)))) },
    ];
  }

  // ── Perf dashboard — live layer count + EMA-smoothed FPS.
  const fps = useFps();
  const layerTick = React.useMemo(
    () => [showNested, showBackdrop, backdropPreset, liquidGlass],
    [showNested, showBackdrop, backdropPreset, liquidGlass],
  );
  const layerCount = useGlassLayerCount(layerTick);
  const backdropPass = layerCount.total;
  const overSpec = layerCount.stacked > 2;

  // ── Generated CSS — reflects the current toggle state so the snippet is a
  // contract: what you see is what you copy.
  const specularAngle = shineCorner === 'tl' ? '0deg' : shineCorner === 'tr' ? '90deg' : shineCorner === 'br' ? '180deg' : '270deg';
  const glassCSSCode = `/* Glassmorphism 2.0 — 2026 showcase (ADR-0012/0014 base + 2026 amendments) */
.glass-panel {
  background-color: ${gradientTint ? gradientTintBackground ?? previewTint : 'var(--glass-tint)'};
  border: 1px solid var(--glass-edge);${cornerShine ? `
  /* Specular cornershine (directional rim): tl = 0deg, tr = 90deg, br = 180deg, bl = 270deg */
  --specular-angle: ${specularAngle};
  border-image: conic-gradient(
    from var(--specular-angle),
    var(--specular-rim-start) 0deg,
    var(--specular-rim-mid) 90deg,
    var(--specular-rim-end) 180deg
  ) 1;` : ''}
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  box-shadow:
    var(--shadow-glass),
    inset 0 1px 0 0 var(--surface-rim-top),
    inset 0 -1px 0 0 var(--glass-shadow-edge);
}${reactiveTint ? `
/* Background-reactive tint (2026 color absorption): rotate --glass-tint hue
   toward the dominant hue of the backdrop blob it floats over. */` : ''}${liquidGlass ? `
/* Liquid Glass refraction (2026): localised stronger blur at the cursor via
   a second masked backdrop-filter layer. */` : ''}
/* MUST float over a colourful backdrop (ADR-0012/0015). */`;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* ═══════════ LEFT — THEORY (nâng cấp lên 6 trụ cột 2026) ═══════════ */}
      <div className="space-y-6 lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Glassmorphism 2.0 — 6 trụ cột (2026)</CardTitle>
            <CardDescription>
              Mô hình 5 thành phần (ADR-0014) + 3 kỹ thuật 2026 mới (gradient tint, light-catcher,
              color-absorption).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ol className="space-y-2">
              <li className="space-y-1">
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    1
                  </span>
                  Tint (scrim chống chói, APCA-gated)
                </h4>
                <p className="pl-6 text-muted-foreground">
                  Lớp mờ không trong suốt hoàn toàn — verbatim <code>--glass-tint</code>, APCA-gated
                  Lc 60 cho văn bản.
                </p>
              </li>
              <li className="space-y-1">
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    2
                  </span>
                  Blur + Saturation (lensing 8–16px)
                </h4>
                <p className="pl-6 text-muted-foreground">
                  <code>--blur-glass</code> 12px light / 16px dark; <code>--glass-saturate</code> 1.4
                  đẩy màu nền rực (vibrancy).
                </p>
              </li>
              <li className="space-y-1">
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    3
                  </span>
                  Edge Highlight (structural + specular)
                </h4>
                <p className="pl-6 text-muted-foreground">
                  Viền 1px <code>--glass-edge</code> (white) + inset top <code>--surface-rim-top</code>{' '}
                  + bottom <code>--glass-shadow-edge</code> (contour đáy dark mode).
                </p>
              </li>
              <li className="space-y-1">
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    4
                  </span>
                  Drop Shadow (định vị độ nổi)
                </h4>
                <p className="pl-6 text-muted-foreground">
                  <code>--shadow-glass</code> 3-layer có key-light từ trên — không phải bóng đối xứng.
                </p>
              </li>
              <li className="space-y-1">
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    5
                  </span>
                  Opaque Fallback (a11y)
                </h4>
                <p className="pl-6 text-muted-foreground">
                  <code>prefers-reduced-transparency</code> / <code>@supports not</code> → đặc hoá{' '}
                  <code>--glass-fallback-bg</code> + <code>--border</code>.
                </p>
              </li>
            </ol>

            <div className="space-y-2 border-t border-border pt-3">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <Sparkles className="size-4 text-primary" />
                Kỹ thuật 2026 mới (showcase sidebar phải)
              </h4>
              <ul className="list-disc space-y-1 pl-8 text-muted-foreground">
                <li>
                  <strong>Alpha-channel gradient tint:</strong> tint sáng góc trên-trái, tối dưới-phải —
                  cảm giác độ dày vật lý.
                </li>
                <li>
                  <strong>Light-catcher border-image:</strong> viền chỉ bắt sáng 1 góc (Pumni production
                  dùng uniform hairline — xem demo để hiểu khác biệt).
                </li>
                <li>
                  <strong>Background-reactive tint (color absorption):</strong> tint tự đổi hue theo blob
                  phía sau — kính &ldquo;hấp&rdquo; màu nền.
                </li>
                <li>
                  <strong>Liquid Glass refraction:</strong> backdrop-filter mạnh hơn cục bộ tại con trỏ.
                </li>
              </ul>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <Activity className="size-4 text-primary" />
                Kỷ luật hiệu năng (ADR-0014/0016)
              </h4>
              <p className="pl-4 leading-relaxed text-muted-foreground">
                Tối đa <strong>2 lớp kính lồng nhau</strong> — mỗi lớp ép 1 backdrop render pass riêng.
                Không bao giờ animate <code>backdrop-filter</code>. <code>will-change</code> chỉ khi
                overlay đang chuyển state.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Do & Don't table — expanded with 2026 techniques */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-primary" />
              Bảng đối chiếu Kính 2.0
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border text-xs">
              <div className="grid grid-cols-2 bg-muted/30 p-3 font-medium">
                <div>Nên làm (Pumni OS)</div>
                <div className="border-l border-border pl-3">Không nên làm</div>
              </div>
              {[
                {
                  do: 'Dùng GlassSurface / Card variant="glass" nổi trên backdrop blob',
                  dont: 'Dùng raw backdrop-blur-md bừa bãi trong TSX',
                },
                {
                  do: 'Backdrop kính trên Topbar/Dock qua glass-bar',
                  dont: 'Kính cho toàn bộ nền app hoặc card text dài',
                },
                {
                  do: 'Tuân thủ APCA Lc 60 chữ / Lc 25 viền',
                  dont: 'Chữ mờ/nhạt đè kính không đủ tương phản',
                },
                {
                  do: 'Mode-inverted rim (2026 alignment) — light = dark neutral-blue, dark = light neutral-violet',
                  dont: 'Pure-white hairline cả 2 mode (composite với --glass-tint trắng = mất APCA)',
                },
                {
                  do: 'Corner-shine / variant="specular" cho hero/showcase card (≤1/surface)',
                  dont: 'Border-image corner-shine cho list card (visual noise + APCA fail)',
                },
                {
                  do: 'Reactive tint chỉ showcase — production dùng --glass-tint tĩnh',
                  dont: 'Mong muốn tint tự đổi hue ở app thật — phá vỡ APCA gate',
                },
              ].map((row, i) => (
                <div className="grid grid-cols-2 p-3" key={i}>
                  <div className="flex items-start gap-1 text-success">
                    <Check className="mt-0.5 size-3.5 shrink-0" />
                    <span>{row.do}</span>
                  </div>
                  <div className="flex items-start gap-1 border-l border-border pl-3 text-destructive">
                    <X className="mt-0.5 size-3.5 shrink-0" />
                    <span>{row.dont}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════ RIGHT — LIVE PLAYGROUND ═══════════ */}
      <div className="space-y-6 lg:col-span-7">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Interactive Playground 2.0</CardTitle>
                <CardDescription>
                  Mô phỏng Glassmorphism 2.0 — bật các kỹ thuật 2026 để so sánh.
                </CardDescription>
              </div>
              <Badge tone="success" pulse>
                Live Preview
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* ─── Live preview stage ─── */}
            <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border p-8">
              {showBackdrop ? (
                <GlassBackdrop preset={backdropPreset} />
              ) : (
                <div className="absolute inset-0 bg-background" />
              )}

              <div className="relative z-10 w-full max-w-sm">
                <LiquidGlassCard
                  enabled={liquidGlass}
                  className="rounded-2xl"
                  style={previewCssVars}
                  data-variant={cornerShine ? 'specular' : undefined}
                >
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <Badge tone="primary" size="sm">
                        Glassmorphism 2.0
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          tone={
                            centreLc >= 60 ? 'success' : centreLc >= 45 ? 'warning' : 'destructive'
                          }
                          size="sm"
                          className="font-mono"
                        >
                          APCA Lc {centreLc.toFixed(1)}
                        </Badge>
                        <span
                          className={cn(
                            'flex size-2 animate-pulse rounded-full',
                            centreLc >= 60
                              ? 'bg-success'
                              : centreLc >= 45
                                ? 'bg-warning'
                                : 'bg-destructive',
                          )}
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Bản mô phỏng Kính 2.0</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Bật các kỹ thuật 2026 ở thanh điều khiển để so sánh với production. Đổi backdrop
                      để thấy kính phản ứng khác.
                    </p>

                    {showNested && (
                      <div className="relative mt-3">
                        <GlassSurface
                          variant="panel"
                          radius="xl"
                          style={{ ['--glass-tint' as string]: previewTint }}
                        >
                          <div className="p-3 text-[10px] text-muted-foreground">
                            Lớp kính lồng nhau (max 2). Mỗi lớp <code>backdrop-filter</code> ép một render
                            pass — lớp thứ 3 sẽ vượt spec (xem dashboard).
                          </div>
                        </GlassSurface>
                      </div>
                    )}
                  </div>
                </LiquidGlassCard>
              </div>
            </div>

            {/* ─── Perf dashboard ─── */}
            <div
              className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 text-xs sm:grid-cols-3"
              aria-label="Performance dashboard"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                  <Gauge className="size-3.5" /> FPS
                </div>
                <div className="font-mono text-lg font-bold text-foreground">
                  {fps}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">/ 60</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                  <Layers className="size-3.5" /> Lớp kính
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-foreground">
                    {layerCount.total}
                  </span>
                  <Badge
                    tone={overSpec ? 'destructive' : layerCount.total > 1 ? 'warning' : 'success'}
                    size="sm"
                  >
                    {overSpec ? 'Vượt spec' : `${layerCount.stacked} lớp lồng`}
                  </Badge>
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Stack depth tối đa: <strong>{layerCount.stacked}</strong> · spec cap 2.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                  <Activity className="size-3.5" /> Backdrop pass
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-foreground">{backdropPass}</span>
                  <Badge tone="info" size="sm">
                    render pass
                  </Badge>
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  ≈ {backdropPass} × per-pixel blur. Liquid Glass thêm 1 pass cục bộ.
                </p>
              </div>
            </div>

            {/* ─── APCA readout (centre + corners when gradient on) ─── */}
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-xs">
              <h4 className="flex items-center gap-1.5 font-bold text-foreground">
                <Gauge className="size-3.5 text-primary" />
                Chỉ số Màu & Tương phản (APCA over OKLCH)
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 rounded-lg border bg-card p-3">
                  <div className="font-semibold text-muted-foreground">APCA trung tâm</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-foreground">
                      Lc {centreLc.toFixed(1)}
                    </span>
                    <Badge
                      tone={
                        centreLc >= 60 ? 'success' : centreLc >= 45 ? 'warning' : 'destructive'
                      }
                      size="sm"
                    >
                      {centreLc >= 60 ? 'Pass (Body)' : centreLc >= 45 ? 'Pass (Large)' : 'Fail'}
                    </Badge>
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Văn bản ≥ Lc 60 (body) · viền ≥ Lc 25.
                  </p>
                </div>
                <div className="space-y-1 rounded-lg border bg-card p-3">
                  <div className="font-semibold text-muted-foreground">OKLCH Tint</div>
                  <div className="font-mono font-medium text-foreground select-all">
                    {formatOklch(
                      { l: tintL, c: reactiveChroma, h: reactiveHue },
                      { precision: 3, alpha: tintAlpha },
                    )}
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    {reactiveTint && blobOklch
                      ? `Hấp hue ${blobOklch.h.toFixed(0)}° từ blob primary.`
                      : 'Tint tĩnh (production).'}
                  </p>
                </div>
              </div>
              {cornerSamples && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {cornerSamples.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between rounded-lg border bg-card p-2"
                    >
                      <span className="font-semibold text-muted-foreground">{s.label}</span>
                      <Badge
                        tone={s.lc >= 60 ? 'success' : s.lc >= 45 ? 'warning' : 'destructive'}
                        size="sm"
                        className="font-mono"
                      >
                        Lc {s.lc.toFixed(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border bg-card p-2">
                  <div className="font-semibold text-muted-foreground">Composite BG</div>
                  <div className="font-mono text-[10px] text-foreground select-all">
                    rgb({composite(tintSrgb, tintAlpha).map((v) => v.toFixed(3)).join(' ')})
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-2">
                  <div className="font-semibold text-muted-foreground">Backdrop primary</div>
                  <div className="font-mono text-[10px] text-foreground select-all">
                    {blobToken ?? '(không取 được)'}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Controls ─── */}
            <div className="grid gap-6 text-xs md:grid-cols-3">
              {/* Backdrop filters — production ADR-0014 sweet spot */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                  <Sliders className="size-3.5" /> Backdrop Filters
                  <SpecBadge />
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Blur</span>
                    <span className="font-mono text-muted-foreground">{blurPx}px</span>
                  </div>
                  <Slider
                    min={SPECS.blur.min}
                    max={SPECS.blur.max}
                    step={1}
                    value={[blurPx]}
                    onValueChange={(val) => setBlurPx(val[0] ?? 12)}
                  />
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Spec {SPECS.blur.min}–{SPECS.blur.max}px · production {SPECS.blur.production}.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Saturation</span>
                    <span className="font-mono text-muted-foreground">{saturateBoost.toFixed(1)}x</span>
                  </div>
                  <Slider
                    min={SPECS.saturate.min}
                    max={SPECS.saturate.max}
                    step={0.1}
                    value={[saturateBoost]}
                    onValueChange={(val) => setSaturateBoost(val[0] ?? 1.4)}
                  />
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Spec {SPECS.saturate.min.toFixed(1)}–{SPECS.saturate.max.toFixed(1)}x · production{' '}
                    {SPECS.saturate.production}.
                  </p>
                </div>
              </div>

              {/* Tint primitives + reactive toggle */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                  <Palette className="size-3.5" /> OKLCH Tint
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Lightness</span>
                    <span className="font-mono text-muted-foreground">{tintL.toFixed(3)}</span>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[tintL]}
                    onValueChange={(val) => setTintL(val[0] ?? (isDark ? 0.13 : 1.0))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Chroma</span>
                    <span className="font-mono text-muted-foreground">{tintC.toFixed(3)}</span>
                  </div>
                  <Slider
                    min={0}
                    max={0.2}
                    step={0.005}
                    value={[tintC]}
                    onValueChange={(val) => setTintC(val[0] ?? (isDark ? 0.02 : 0))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Hue</span>
                    <span className="font-mono text-muted-foreground">{tintH.toFixed(0)}°</span>
                  </div>
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[tintH]}
                    onValueChange={(val) => setTintH(val[0] ?? (isDark ? 260 : 0))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Tint opacity</span>
                    <span className="font-mono text-muted-foreground">
                      {(tintAlpha * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[tintAlpha]}
                    onValueChange={(val) => setTintAlpha(val[0] ?? (isDark ? 0.34 : 0.54))}
                  />
                </div>
              </div>

              {/* 2026 technique toggles */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                  <Sparkles className="size-3.5" /> Kỹ thuật 2026
                </h4>
                <div className="space-y-3">
                  <ToggleRow
                    icon={<Droplets className="size-3.5" />}
                    label="Gradient tint (alpha-channel)"
                    desc="Tint sáng TL, tối BR — độ dày vật lý."
                    checked={gradientTint}
                    onCheckedChange={setGradientTint}
                  />
                  <ToggleRow
                    icon={<Sparkles className="size-3.5" />}
                    label="Border-image corner-shine"
                    desc="Viền chỉ bắt sáng 1 góc (demo 2026)."
                    checked={cornerShine}
                    onCheckedChange={setCornerShine}
                  />
                  {cornerShine && (
                    <div className="flex gap-1 pl-1">
                      {SHINE_CORNERS.map((c) => (
                        <Button
                          key={c}
                          variant={shineCorner === c ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 px-2 text-[10px] uppercase"
                          onClick={() => setShineCorner(c)}
                        >
                          {c}
                        </Button>
                      ))}
                    </div>
                  )}
                  <ToggleRow
                    icon={<Activity className="size-3.5" />}
                    label="Background-reactive tint"
                    desc="Tint hấp hue của blob primary."
                    checked={reactiveTint}
                    onCheckedChange={setReactiveTint}
                  />
                  <ToggleRow
                    icon={<Droplets className="size-3.5" />}
                    label="Liquid Glass refraction"
                    desc="Blur mạnh hơn tại con trỏ (thêm 1 pass)."
                    checked={liquidGlass}
                    onCheckedChange={setLiquidGlass}
                  />
                  <ToggleRow
                    icon={<Layers className="size-3.5" />}
                    label="Nested stacking (lồng kính)"
                    desc="Thêm lớp thứ 2 — test spec cap."
                    checked={showNested}
                    onCheckedChange={setShowNested}
                  />
                  <ToggleRow
                    icon={<Layers className="size-3.5" />}
                    label="Hiển thị backdrop"
                    desc="Tắt để thấy kính biến thành hộp xám."
                    checked={showBackdrop}
                    onCheckedChange={setShowBackdrop}
                  />
                  <ToggleRow
                    icon={<Palette className="size-3.5" />}
                    label="Light mode legacy rim (white)"
                    desc="Chỉ dùng khi đang ở light — inject pure-white hairline legacy để thấy APCA tank."
                    checked={rimLightOverride}
                    onCheckedChange={setRimLightOverride}
                  />
                  <ToggleRow
                    icon={<Palette className="size-3.5" />}
                    label="Dark mode legacy rim (white)"
                    desc="Chỉ dùng khi đang ở dark — inject pure-white hairline legacy để thấy glow harsh."
                    checked={rimDarkOverride}
                    onCheckedChange={setRimDarkOverride}
                  />
                </div>
              </div>
            </div>

            {/* ─── Backdrop preset switcher ─── */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/20 p-3 text-xs">
              <span className="font-semibold text-foreground">Backdrop:</span>
              {BACKDROP_PRESETS.map((p) => (
                <Button
                  key={p.value}
                  variant={backdropPreset === p.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    setBackdropPreset(p.value);
                    setShowBackdrop(true);
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* ─── Generated CSS ─── */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Generated CSS</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => copyToClipboard(glassCSSCode, 'CSS Glass')}
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
              <CardWell padding="none" className="max-h-44 overflow-auto">
                <pre className="p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  <code>{glassCSSCode}</code>
                </pre>
              </CardWell>
            </div>
          </CardContent>
        </Card>

        {liquidGlass && (
          <Card>
            <CardContent className="flex items-start gap-3 pt-6 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Liquid Glass</strong> thêm một backdrop-filter
                cục bộ (masked circle theo con trỏ). Đây là kỹ thuật refraction 2026 — tăng 1 backdrop
                pass (xem dashboard), nên production chỉ dùng cho hero/showcase, không cho list card.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/** Compact toggle row with description, used by the 2026-technique column. */
function ToggleRow({
  icon,
  label,
  desc,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          {icon}
          {label}
        </div>
        <p className="text-[10px] leading-snug text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
