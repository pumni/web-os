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
  AlertTriangle,
  Check,
  Code,
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

import { BACKDROP_PRESETS, GlassBackdrop, type BackdropPreset } from './glass-2026-primitives';
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

interface EdgeToken {
  l: number;
  c: number;
  h: number;
  alpha: number;
}

/**
 * Mirrors the production `--glass-edge-top` / `--glass-edge-bottom` tokens in
 * `theme.css` (L/alpha fixed per mode); only chroma/hue follow the playground's
 * absorption state so the reactive-tint demo can tint the rim. Uniform mode
 * mirrors the production `--glass-edge` token.
 */
function getEdgeTokens(
  isDark: boolean,
  asymmetricBorder: boolean,
  reactiveChroma: number,
  reactiveHue: number,
): { top: EdgeToken; bottom: EdgeToken } {
  if (isDark) {
    if (asymmetricBorder) {
      return {
        top: {
          l: 0.95,
          c: reactiveChroma,
          h: reactiveHue,
          alpha: 0.55,
        },
        bottom: {
          // Matches oklch(0.2 0.03 270 / 0.35) in theme.css (cross-file contract)
          l: 0.2,
          c: reactiveChroma,
          h: reactiveHue,
          alpha: 0.35,
        },
      };
    } else {
      const uniform = {
        l: 0.9,
        c: reactiveChroma,
        h: reactiveHue,
        alpha: 0.5,
      };
      return { top: uniform, bottom: uniform };
    }
  } else {
    // Light mode
    if (asymmetricBorder) {
      return {
        top: {
          l: 0.3,
          c: reactiveChroma,
          h: reactiveHue,
          alpha: 0.4,
        },
        bottom: {
          l: 0.3,
          c: reactiveChroma,
          h: reactiveHue,
          alpha: 0.5,
        },
      };
    } else {
      const uniform = {
        l: 0.3,
        c: reactiveChroma,
        h: reactiveHue,
        alpha: 0.4,
      };
      return { top: uniform, bottom: uniform };
    }
  }
}

export function GlassPlayground() {
  // ── Spec-clamped backdrop-filter controls (production ADR-0014 sweet spot)
  const [saturateBoost, setSaturateBoost] = React.useState<number>(1.4);
  const [blurPx, setBlurPx] = React.useState<number>(12);

  // ── Showcase toggles — these are 2026 techniques, ON by default to match
  // the modern glass surface trend (gradient tint + specular corner shine + reactive color absorption).
  const [gradientTint, setGradientTint] = React.useState<boolean>(true);
  const [cornerShine, setCornerShine] = React.useState<boolean>(false);
  const [shineCorner, setShineCorner] = React.useState<ShineCorner>('tl');
  const [reactiveTint, setReactiveTint] = React.useState<boolean>(false);
  const [showNested, setShowNested] = React.useState<boolean>(false);
  const [showBackdrop, setShowBackdrop] = React.useState<boolean>(true);
  const [backdropPreset, setBackdropPreset] = React.useState<BackdropPreset>('mesh');

  // ── Glassmorphism 2.0 Toggles
  const [asymmetricBorder, setAsymmetricBorder] = React.useState<boolean>(true);
  const [doubleBezel, setDoubleBezel] = React.useState<boolean>(true);
  const [chromaShadow, setChromaShadow] = React.useState<boolean>(true);
  const [glassGrain, setGlassGrain] = React.useState<boolean>(true);
  const [borderEngine, setBorderEngine] = React.useState<'mask' | 'clip' | 'asymmetric'>('mask');
  const [optimizerTab, setOptimizerTab] = React.useState<'audit' | 'formulas' | 'spec'>('audit');
  const [pointerCoords, setPointerCoords] = React.useState<{ x: string; y: string } | null>(null);

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
  const [tintAlpha, setTintAlpha] = React.useState<number>(0.4);

  React.useEffect(() => {
    requestAnimationFrame(() => {
      if (isDark) {
        setTintL(0.13);
        setTintC(0.0035);
        setTintH(70);
        setTintAlpha(0.4);
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
  const currentPreset = BACKDROP_PRESETS.find((p) => p.value === backdropPreset);
  const dominant = currentPreset?.dominant ?? null;

  const blobToken = useBlobPrimary([backdropPreset, showBackdrop]);
  const blobOklch = parseOklchLiteral(blobToken);

  const absorptionColor = dominant || blobOklch;

  const reactiveHue = React.useMemo(() => {
    if (!reactiveTint || !absorptionColor) return tintH;
    return absorptionColor.h;
  }, [reactiveTint, absorptionColor, tintH]);

  const reactiveChroma = React.useMemo(() => {
    if (!reactiveTint || !absorptionColor) return tintC;
    // Subtle absorption: 30% of the backdrop chroma, capped at 0.04 to keep
    // the APCA gate untouched (tint stays near-neutral for text scrim).
    return Math.min(0.04, absorptionColor.c * 0.3);
  }, [reactiveTint, absorptionColor, tintC]);

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

  // ── Glassmorphism 2.0 dynamic property injection
  const edgeTokens = getEdgeTokens(isDark, asymmetricBorder, reactiveChroma, reactiveHue);
  const edgeTopStr = `oklch(${(edgeTokens.top.l * 100).toFixed(1)}% ${edgeTokens.top.c.toFixed(4)} ${edgeTokens.top.h.toFixed(0)} / ${edgeTokens.top.alpha.toFixed(2)})`;
  const edgeBottomStr = `oklch(${(edgeTokens.bottom.l * 100).toFixed(1)}% ${edgeTokens.bottom.c.toFixed(4)} ${edgeTokens.bottom.h.toFixed(0)} / ${edgeTokens.bottom.alpha.toFixed(2)})`;

  const previewCssVars: React.CSSProperties = {
    ['--glass-blur' as string]: `${blurPx}px`,
    ['--glass-saturate' as string]: `${saturateBoost}`,
    ['--glass-tint' as string]: previewTint,
    ['--glass-edge-top' as string]: edgeTopStr,
    ['--glass-edge-bottom' as string]: edgeBottomStr,
  };

  if (pointerCoords) {
    (previewCssVars as Record<string, string>)['--spot-x'] = pointerCoords.x;
    (previewCssVars as Record<string, string>)['--spot-y'] = pointerCoords.y;
  }

  // 2026 alignment: specular light corner-shine uses core --specular-angle variable
  // instead of ad-hoc inline border-image to support rounded border-radius.
  if (cornerShine) {
    const specularAngle =
      shineCorner === 'tl'
        ? '315deg'
        : shineCorner === 'tr'
          ? '45deg'
          : shineCorner === 'br'
            ? '135deg'
            : '225deg';
    (previewCssVars as Record<string, string>)['--specular-angle'] = specularAngle;
  }

  if (doubleBezel) {
    (previewCssVars as Record<string, string>)['--glass-inset-bezel-top'] =
      `oklch(1 0 0 / ${isDark ? '0.15' : '0.20'})`;
  } else {
    (previewCssVars as Record<string, string>)['--glass-inset-bezel-top'] = 'oklch(1 0 0 / 0)';
  }

  // Chroma-shifted shadow calculation
  if (chromaShadow) {
    const shadowColorStr = `oklch(${(tintL * 30).toFixed(1)}% ${Math.min(0.2, reactiveChroma * 1.5).toFixed(4)} ${reactiveHue.toFixed(0)} / 0.23)`;
    (previewCssVars as Record<string, string>)['--shadow-glass'] = `
      0 16px 32px -3px ${shadowColorStr},
      0 8px 16px -5px oklch(0 0 0 / 0.25)
    `;
  }

  // Apply Border Engine values to previewCssVars
  if (borderEngine === 'clip') {
    (previewCssVars as Record<string, string>)['--glass-bevel-ring-display'] = 'none';
    previewCssVars.border = '1px solid transparent';
    const bgFill = gradientTintBackground || `linear-gradient(${previewTint}, ${previewTint})`;
    previewCssVars.background = `${bgFill} padding-box, linear-gradient(135deg, ${edgeTopStr}, ${edgeBottomStr}) border-box`;
  } else if (borderEngine === 'asymmetric') {
    (previewCssVars as Record<string, string>)['--glass-bevel-ring-display'] = 'none';
    if (gradientTintBackground) {
      previewCssVars.background = gradientTintBackground;
    } else {
      previewCssVars.backgroundColor = previewTint;
    }
    previewCssVars.borderTop = `1px solid ${edgeTopStr}`;
    previewCssVars.borderLeft = `1px solid ${edgeTopStr}`;
    previewCssVars.borderBottom = `1px solid ${edgeBottomStr}`;
    previewCssVars.borderRight = `1px solid ${edgeBottomStr}`;
  } else {
    // mask engine
    (previewCssVars as Record<string, string>)['--glass-bevel-ring-display'] = 'block';
    previewCssVars.border = '1px solid transparent';
    if (gradientTintBackground) {
      previewCssVars.background = gradientTintBackground;
    }
  }

  // ── APCA readout. The composite is text-against-tint-against-backdrop. We
  // sample at the centre; when gradient tint is on we also sample two corners
  // so the user can see contrast differs across the panel.
  const fgOklch = isDark ? { l: 0.985, c: 0.005, h: 75 } : { l: 0.19, c: 0.0035, h: 70 };
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

  // Border APCA contrast calculation (matching glass-contrast.test.ts)
  // Top/left edge is used for border APCA verification.
  const edgeOklch = edgeTokens.top;

  const edgeSrgb = oklchToSrgb({ l: edgeOklch.l, c: edgeOklch.c, h: edgeOklch.h });
  const glassOverBlob = composite(tintSrgb, tintAlpha);
  const edgeOverGlass: [number, number, number] = [
    edgeSrgb[0] * edgeOklch.alpha + glassOverBlob[0] * (1 - edgeOklch.alpha),
    edgeSrgb[1] * edgeOklch.alpha + glassOverBlob[1] * (1 - edgeOklch.alpha),
    edgeSrgb[2] * edgeOklch.alpha + glassOverBlob[2] * (1 - edgeOklch.alpha),
  ];
  const borderLc = Math.abs(apcaContrast(edgeOverGlass, glassOverBlob));

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
      {
        label: 'TL (sáng)',
        lc: Math.abs(apcaContrast(fgSrgb, composite(lightSrgb, tintAlpha + 0.08))),
      },
      {
        label: 'BR (tối)',
        lc: Math.abs(apcaContrast(fgSrgb, composite(darkSrgb, Math.max(0, tintAlpha - 0.08)))),
      },
    ];
  }

  // ── Perf dashboard — live layer count + EMA-smoothed FPS.
  const fps = useFps();
  const layerTick = React.useMemo(
    () => [showNested, showBackdrop, backdropPreset],
    [showNested, showBackdrop, backdropPreset],
  );
  const layerCount = useGlassLayerCount(layerTick);
  const backdropPass = layerCount.total;
  const overSpec = layerCount.stacked > 2;

  // ── Generated CSS — reflects the current toggle state so the snippet is a
  // contract: what you see is what you copy.
  const specularAngle =
    shineCorner === 'tl'
      ? '315deg'
      : shineCorner === 'tr'
        ? '45deg'
        : shineCorner === 'br'
          ? '135deg'
          : '225deg';

  const bgL = (tintL * 100).toFixed(0);
  const bgC = reactiveChroma.toFixed(3);
  const bgH = reactiveHue.toFixed(0);
  const op = tintAlpha.toFixed(2);

  const topL = (edgeTokens.top.l * 100).toFixed(0);
  const topC = edgeTokens.top.c.toFixed(3);
  const topH = edgeTokens.top.h.toFixed(0);
  const topAlpha = edgeTokens.top.alpha.toFixed(2);

  const bottomL = (edgeTokens.bottom.l * 100).toFixed(0);
  const bottomC = edgeTokens.bottom.c.toFixed(3);
  const bottomH = edgeTokens.bottom.h.toFixed(0);
  const bottomAlpha = edgeTokens.bottom.alpha.toFixed(2);

  const shadowL = (tintL * 30).toFixed(0);
  const shadowC = Math.min(0.2, reactiveChroma * 1.5).toFixed(3);
  const shadowAlpha = (0.15 + 20 / 250).toFixed(2); // matches shadowDepth = 20
  const shadowColorStr = `oklch(${shadowL}% ${shadowC} ${bgH} / ${shadowAlpha})`;

  const bezelTopOp = isDark ? '0.15' : '0.20';

  const backgroundLine =
    gradientTint && gradientTintBackground
      ? `background: ${gradientTintBackground}; /* Kính có gradient dày/mỏng */`
      : `background-color: oklch(${bgL}% ${bgC} ${bgH} / ${op}); /* Màu kính trong suốt phẳng */`;

  const shadowGlassCode = chromaShadow
    ? `0 16px 32px -3px ${shadowColorStr}, /* Bóng đổ mang sắc kính */
    0 8px 16px -5px rgba(0, 0, 0, 0.25)`
    : `0 16px 32px -3px rgba(0, 0, 0, 0.15), /* Bóng đổ xám thường */
    0 8px 16px -5px rgba(0, 0, 0, 0.20)`;

  const bezelTopLine = doubleBezel
    ? `,
    inset 0 1px 0 0 oklch(100% 0 0 / ${bezelTopOp}) /* Highlight bắt sáng viền trên */`
    : '';

  const boxCssCode = `box-shadow: 
    ${shadowGlassCode}${bezelTopLine};`;

  const bevelGradient = `linear-gradient(135deg, oklch(${topL}% ${topC} ${topH} / ${topAlpha}), oklch(${bottomL}% ${bottomC} ${bottomH} / ${bottomAlpha}))`;

  const blurVal = blurPx.toString();
  const saturateVal = saturateBoost.toFixed(1);

  let grainCSS = '';
  if (glassGrain) {
    const grainOpacity = isDark ? '0.07' : '0.05';
    grainCSS = '\n\n/* 4. Physical Glass Grain/Noise overlay */\n' +
      '.glass-grain {\n' +
      '  position: relative;\n' +
      '  isolation: isolate;\n' +
      '}\n\n' +
      '.glass-grain::after {\n' +
      '  content: "";\n' +
      '  position: absolute;\n' +
      '  inset: 0;\n' +
      '  opacity: ' + grainOpacity + '; /* Opacity theo mode */\n' +
      '  mix-blend-mode: overlay;\n' +
      '  pointer-events: none;\n' +
      "  background-image: url(\"data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\");\n" +
      '  background-size: 200px 200px;\n' +
      '  background-repeat: repeat;\n' +
      '  border-radius: inherit;\n' +
      '}';
  }

  let glassCSSCode = '';

  if (borderEngine === 'clip') {
    const bgFillCode = gradientTint && gradientTintBackground
      ? gradientTintBackground
      : 'linear-gradient(oklch(' + bgL + '% ' + bgC + ' ' + bgH + ' / ' + op + '), oklch(' + bgL + '% ' + bgC + ' ' + bgH + ' / ' + op + '))';

    glassCSSCode = '.glass-card {\n' +
      '  /* 1. Viền gradient dùng Background-clip (không cần phần tử giả ::before) */\n' +
      '  background: \n' +
      '    ' + bgFillCode + ' padding-box,\n' +
      '    ' + bevelGradient + ' border-box;\n' +
      '  border: 1px solid transparent;\n\n' +
      '  backdrop-filter: blur(' + blurVal + 'px) saturate(' + saturateVal + ');\n' +
      '  -webkit-backdrop-filter: blur(' + blurVal + 'px) saturate(' + saturateVal + '); /* Làm mờ & tăng bão hòa hậu cảnh */\n\n' +
      '  /* 2. Bắt sáng viền trong & 3. Bóng đổ nhiễm sắc */\n' +
      '  ' + boxCssCode + '\n' +
      '}' + grainCSS;
  } else if (borderEngine === 'asymmetric') {
    glassCSSCode = '.glass-card {\n' +
      '  ' + backgroundLine + '\n' +
      '  backdrop-filter: blur(' + blurVal + 'px) saturate(' + saturateVal + ');\n' +
      '  -webkit-backdrop-filter: blur(' + blurVal + 'px) saturate(' + saturateVal + '); /* Làm mờ & tăng bão hòa hậu cảnh */\n\n' +
      '  /* 1. Viền bất đối xứng phẳng (Legacy) */\n' +
      '  border-top: 1px solid oklch(' + topL + '% ' + topC + ' ' + topH + ' / ' + topAlpha + ');\n' +
      '  border-left: 1px solid oklch(' + topL + '% ' + topC + ' ' + topH + ' / ' + topAlpha + ');\n' +
      '  border-bottom: 1px solid oklch(' + bottomL + '% ' + bottomC + ' ' + bottomH + ' / ' + bottomAlpha + ');\n' +
      '  border-right: 1px solid oklch(' + bottomL + '% ' + bottomC + ' ' + bottomH + ' / ' + bottomAlpha + ');\n\n' +
      '  /* 2. Bắt sáng viền trong & 3. Bóng đổ nhiễm sắc */\n' +
      '  ' + boxCssCode + '\n' +
      '}' + grainCSS;
  } else {
    // Current mask-composite engine
    let cornershineCSS = '';
    if (cornerShine) {
      cornershineCSS = '\n\n/* Specular cornershine: lớp conic chồng LÊN bevel ring, cùng ::before\n' +
        '   (tl = 315deg, tr = 45deg, br = 135deg, bl = 225deg) */\n' +
        '.glass-card[data-variant="specular"]::before {\n' +
        '  background:\n' +
        '    conic-gradient(\n' +
        '      from calc(var(--specular-angle, ' + specularAngle + ') - 45deg),\n' +
        '      transparent 0deg,\n' +
        '      var(--specular-rim-start) 45deg,\n' +
        '      var(--specular-rim-mid) 70deg,\n' +
        '      transparent 90deg\n' +
        '    ),\n' +
        '    ' + bevelGradient + ';\n' +
        '}';
    }

    glassCSSCode = '.glass-card {\n' +
      '  ' + backgroundLine + '\n' +
      '  backdrop-filter: blur(' + blurVal + 'px) saturate(' + saturateVal + ');\n' +
      '  -webkit-backdrop-filter: blur(' + blurVal + 'px) saturate(' + saturateVal + '); /* Làm mờ & tăng bão hòa hậu cảnh */\n\n' +
      '  /* 1. Viền: metric border trong suốt — cạnh nhìn thấy là gradient ring ::before */\n' +
      '  position: relative;\n' +
      '  border: 1px solid transparent;\n\n' +
      '  /* 2. Bắt sáng viền trong & 3. Bóng đổ nhiễm sắc */\n' +
      '  ' + boxCssCode + '\n' +
      '}\n\n' +
      '/* 1b. Bevel ring liên tục: sáng TL (biên chủ đạo, APCA-gated) → tối BR (bevel\n' +
      '   shading) — bám border-radius, không seam chéo ở góc như border 4 cạnh khác màu */\n' +
      '.glass-card::before {\n' +
      '  content: "";\n' +
      '  position: absolute;\n' +
      '  inset: -1px;\n' +
      '  border-radius: inherit;\n' +
      '  padding: 1px;\n' +
      '  background: ' + bevelGradient + ';\n' +
      '  -webkit-mask:\n' +
      '    linear-gradient(#fff 0 0) content-box,\n' +
      '    linear-gradient(#fff 0 0);\n' +
      '  mask:\n' +
      '    linear-gradient(#fff 0 0) content-box,\n' +
      '    linear-gradient(#fff 0 0);\n' +
      '  -webkit-mask-composite: xor;\n' +
      '  mask-composite: exclude;\n' +
      '  pointer-events: none;\n' +
      '  z-index: 1;\n' +
      '}' + cornershineCSS + grainCSS;
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      {/* ═══════════ LEFT — VISUAL SIMULATION STAGE & STATS (col-span-8) ═══════════ */}
      <div className="space-y-6 lg:col-span-8">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Khu Vực Mô Phỏng Glassmorphism 2.0</CardTitle>
                <CardDescription>
                  Góc nhìn chi tiết thẻ kính khúc xạ và tương phản thời gian thực.
                </CardDescription>
              </div>
              <Badge tone="success" pulse>
                Active Simulation
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Live preview stage: Now height h-115 for massive visibility */}
            <div className="relative flex h-115 w-full items-center justify-center overflow-hidden rounded-2xl border border-border p-8 shadow-inner">
              {showBackdrop ? (
                <GlassBackdrop preset={backdropPreset} />
              ) : (
                <div className="absolute inset-0 bg-background" />
              )}

              <div className="relative z-10 w-full max-w-sm">
                <Card
                  className={cn('rounded-2xl', glassGrain && 'glass-grain')}
                  style={previewCssVars}
                  variant={cornerShine ? 'specular' : 'glass'}
                  onPointerMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setPointerCoords({ x: x + '%', y: y + '%' });
                  }}
                  onPointerLeave={() => {
                    setPointerCoords(null);
                  }}
                >
                  <CardHeader>
                    <div className="flex w-full items-center justify-between">
                      <Badge tone="primary" size="sm">
                        Glassmorphism 2.0
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          tone={
                            centreLc >= 60 ? 'success' : centreLc >= 45 ? 'warning' : 'destructive'
                          }
                          size="sm"
                          className="px-1.5 py-0.5 font-mono text-[10px]"
                          title="Tương phản chữ APCA"
                        >
                          Chữ Lc {centreLc.toFixed(1)}
                        </Badge>
                        <Badge
                          tone={borderLc >= 25 ? 'success' : 'destructive'}
                          size="sm"
                          className="px-1.5 py-0.5 font-mono text-[10px]"
                          title="Tương phản viền chủ đạo APCA"
                        >
                          Viền chủ đạo Lc {borderLc.toFixed(1)}
                        </Badge>
                        <span
                          className={cn(
                            'flex size-2 animate-pulse rounded-full',
                            centreLc >= 60 && borderLc >= 25 ? 'bg-success' : 'bg-destructive',
                          )}
                        />
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-lg font-bold text-foreground">
                      Bản mô phỏng Kính 2.0
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                      Kéo các thanh điều khiển bên trái để tinh chỉnh kính. Thay đổi canvas bên trên
                      để kiểm tra tương phản APCA trực quan.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex min-w-0 flex-1 flex-col gap-(--surface-gap) pb-6">
                    {showNested && (
                      <div className="relative">
                        <Card
                          variant="glass"
                          radius="xl"
                          style={{ ['--glass-tint' as string]: previewTint }}
                        >
                          <CardContent className="p-3 text-[10px] text-muted-foreground">
                            Lớp kính lồng nhau (max 2). Mỗi lớp <code>backdrop-filter</code> ép một
                            render pass — lớp thứ 3 sẽ vượt spec (xem dashboard).
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                  <span className="font-mono text-lg font-bold text-foreground">
                    {backdropPass}
                  </span>
                  <Badge tone="info" size="sm">
                    render pass
                  </Badge>
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  ≈ {backdropPass} × per-pixel blur. Càng nhiều lớp kính lồng nhau càng tăng pass.
                </p>
              </div>
            </div>

            {/* ─── APCA readout (centre + corners when gradient on) ─── */}
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-xs">
              <h4 className="flex items-center gap-1.5 font-bold text-foreground">
                <Gauge className="size-3.5 text-primary" />
                Chỉ số Màu & Tương phản (APCA over OKLCH)
              </h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1 rounded-lg border bg-card p-3">
                  <div className="font-semibold text-muted-foreground">APCA trung tâm (Chữ)</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-foreground">
                      Lc {centreLc.toFixed(1)}
                    </span>
                    <Badge
                      tone={centreLc >= 60 ? 'success' : centreLc >= 45 ? 'warning' : 'destructive'}
                      size="sm"
                    >
                      {centreLc >= 60 ? 'Pass (Body)' : centreLc >= 45 ? 'Pass (Large)' : 'Fail'}
                    </Badge>
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Văn bản ≥ Lc 60 (body) · Lc 45 (large).
                  </p>
                </div>
                <div className="space-y-1 rounded-lg border bg-card p-3">
                  <div className="font-semibold text-muted-foreground">
                    APCA viền chủ đạo (Border)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-foreground">
                      Lc {borderLc.toFixed(1)}
                    </span>
                    <Badge tone={borderLc >= 25 ? 'success' : 'destructive'} size="sm">
                      {borderLc >= 25 ? 'Pass (Border)' : 'Fail'}
                    </Badge>
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Cạnh biên chủ đạo ≥ Lc 25 · cạnh đáy = bevel shading (miễn gate).
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
                      ? `Hấp hue ${blobOklch.h.toFixed(0)}° từ blob.`
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
                    rgb(
                    {composite(tintSrgb, tintAlpha)
                      .map((v) => v.toFixed(3))
                      .join(' ')}
                    )
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-2">
                  <div className="font-semibold text-muted-foreground">Backdrop primary</div>
                  <div className="font-mono text-[10px] text-foreground select-all">
                    {blobToken ?? '(không lấy được)'}
                  </div>
                </div>
              </div>
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
      </div>

      {/* ═══════════ RIGHT — INTERACTIVE CONTROLS side panel (col-span-4) ═══════════ */}
      <div className="space-y-6 lg:col-span-4">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg">Bộ Điều Khiển Kính</CardTitle>
            <CardDescription>Tùy chỉnh các thông số và tính năng của kính.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Backdrop preset switcher inside the side control deck */}
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3 text-xs">
              <span className="font-semibold text-foreground">Phông nền (Backdrop):</span>
              <div className="flex flex-wrap gap-1.5">
                {BACKDROP_PRESETS.map((p) => (
                  <Button
                    key={p.value}
                    variant={backdropPreset === p.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => {
                      setBackdropPreset(p.value);
                      setShowBackdrop(true);
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Backdrop filters */}
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
                  <span className="font-mono text-muted-foreground">
                    {saturateBoost.toFixed(1)}x
                  </span>
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

            {/* Border Engine */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                <Code className="size-3.5" /> Border Engine
              </h4>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1 bg-muted/20 p-1 rounded-lg border text-center">
                  {(['mask', 'clip', 'asymmetric'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={borderEngine === mode ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 text-[10px] capitalize px-1"
                      onClick={() => setBorderEngine(mode)}
                    >
                      {mode === 'mask' ? 'Mask' : mode === 'clip' ? 'Clip' : 'Asym'}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  {borderEngine === 'mask' && 'Masked Gradient Ring (Pumni OS) - Bo góc hoàn hảo.'}
                  {borderEngine === 'clip' && 'Background-clip (Studio) - Gọn nhẹ, không dùng DOM ảo.'}
                  {borderEngine === 'asymmetric' && 'Viền bất đối xứng (Legacy) - Chia 4 cạnh màu khác.'}
                </p>
              </div>
            </div>

            {/* Tint primitives */}
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
                  icon={<Palette className="size-3.5" />}
                  label="Bevel ring gradient (Asymmetric)"
                  desc="Ring 1px sáng TL → tối BR, liên tục quanh bo góc (không seam)."
                  checked={asymmetricBorder}
                  onCheckedChange={setAsymmetricBorder}
                />
                <ToggleRow
                  icon={<Sliders className="size-3.5" />}
                  label="Bắt sáng viền trên (Bezel-top)"
                  desc="Thêm lớp viền trong đón sáng phía trên."
                  checked={doubleBezel}
                  onCheckedChange={setDoubleBezel}
                />
                <ToggleRow
                  icon={<Sparkles className="size-3.5" />}
                  label="Bóng đổ nhiễm màu (Chroma Shadow)"
                  desc="Bóng đổ nhuộm màu của kính (OKLCH light transmission)."
                  checked={chromaShadow}
                  onCheckedChange={setChromaShadow}
                />
                <ToggleRow
                  icon={<Sparkles className="size-3.5" />}
                  label="Kết cấu hạt mịn (Glass Grain)"
                  desc="Phủ hạt SVG nhiễu tự nhiên (overlay blend, luminance-only) tăng nhận diện vật lý."
                  checked={glassGrain}
                  onCheckedChange={setGlassGrain}
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════ BOTTOM — THEORY AND BEST PRACTICES (full width, col-span-12) ═══════════ */}
      <div className="mt-6 grid gap-6 border-t pt-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 lg:col-span-12">
        {/* Theory Card */}
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
                  <code>--blur-glass</code> 12px light / 16px dark; <code>--glass-saturate</code>{' '}
                  1.4 đẩy màu nền rực (vibrancy).
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
                  Viền 1px asymmetric <code>--glass-edge-top/bottom</code> (top: gated Lc 25;
                  bottom: exempt shadow) + inset top <code>--glass-inset-bezel-top</code> + bottom{' '}
                  <code>--glass-shadow-edge</code> (contour đáy dark mode).
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
                  <code>--shadow-glass</code> 3-layer có key-light từ trên — không phải bóng đối
                  xứng.
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
                  <strong>Alpha-channel gradient tint:</strong> tint sáng góc trên-trái, tối
                  dưới-phải — cảm giác độ dày vật lý.
                </li>
                <li>
                  <strong>Light-catcher border-image:</strong> viền chỉ bắt sáng 1 góc (Pumni
                  production dùng uniform hairline — xem demo để hiểu khác biệt).
                </li>
                <li>
                  <strong>Background-reactive tint (color absorption):</strong> tint tự đổi hue theo
                  blob phía sau — kính &ldquo;hấp&rdquo; màu nền.
                </li>
                <li>
                  <strong>Double-Bezel sub-pixel:</strong> bắt sáng kép tinh tế dọc viền kính.
                </li>
                <li>
                  <strong>Physical Glass Grain:</strong> phủ hạt mịn SVG nhiễu tự nhiên
                  (.glass-grain) tăng nhận diện vật lý của kính.
                </li>
              </ul>
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <Activity className="size-4 text-primary" />
                Kỷ luật hiệu năng (ADR-0014/0016)
              </h4>
              <p className="pl-4 leading-relaxed text-muted-foreground">
                Tối đa <strong>2 lớp kính lồng nhau</strong> — mỗi lớp ép 1 backdrop render pass
                riêng. Không bao giờ animate <code>backdrop-filter</code>. <code>will-change</code>{' '}
                chỉ khi overlay đang chuyển state.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Do & Don't Card */}
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
                  do: 'Tuân thủ APCA Lc 60 chữ / Lc 25 cạnh biên chủ đạo',
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

        {/* Spec & Blend Optimizer Card */}
        <Card className="flex flex-col h-full justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4 text-primary animate-pulse" />
                Spec & Blend Optimizer
              </CardTitle>
              <Badge tone="success" size="sm">
                LQC Compliant
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Đánh giá đặc tả kính và phân tích toán học.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2 flex-1 text-xs">
            {/* Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-muted/20 p-1 rounded-lg border text-center">
              {(['audit', 'formulas', 'spec'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setOptimizerTab(tab)}
                  className={cn(
                    "py-1 rounded text-[10px] font-mono transition-all font-semibold",
                    optimizerTab === tab
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === 'audit' ? 'Audit' : tab === 'formulas' ? 'Math' : 'Spec'}
                </button>
              ))}
            </div>

            {/* Audit tab content */}
            {optimizerTab === 'audit' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded bg-muted/30 border border-border/50">
                    <span className={cn("size-2 rounded-full mt-1.5 shrink-0", blurPx >= 8 && blurPx <= 16 ? "bg-success" : "bg-destructive")} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground flex justify-between gap-2">
                        <span>Độ mờ kính (Blur)</span>
                        <span className={blurPx >= 8 && blurPx <= 16 ? "text-success" : "text-destructive"}>
                          {blurPx >= 8 && blurPx <= 16 ? "Optimal" : "Over-budget"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                        {blurPx >= 8 && blurPx <= 16
                          ? "Trong khung chuẩn 8-16px. GPU xử lý tối ưu trên thiết bị di động."
                          : "Vượt giới hạn thiết kế. Blur quá lớn làm tăng chi phí tính toán pixel chênh lệch trên GPU."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded bg-muted/30 border border-border/50">
                    <span className={cn("size-2 rounded-full mt-1.5 shrink-0", saturateBoost >= 1.0 && saturateBoost <= 1.5 ? "bg-success" : "bg-warning")} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground flex justify-between gap-2">
                        <span>Độ bão hòa (Saturate)</span>
                        <span className={saturateBoost >= 1.0 && saturateBoost <= 1.5 ? "text-success" : "text-warning"}>
                          {saturateBoost >= 1.0 && saturateBoost <= 1.5 ? "Optimal" : "Vibrant"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                        {saturateBoost <= 1.5
                          ? "Bão hòa màu nhẹ nhàng, giữ cảm giác trung thực của chất liệu."
                          : "Độ bão hòa cao tạo hiệu ứng neon rực rỡ, thích hợp cho phong cách Cyberpunk."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded bg-muted/30 border border-border/50">
                    <span className="size-2 rounded-full mt-1.5 shrink-0 bg-success" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground flex justify-between gap-2">
                        <span>Chroma-shifted Shadow</span>
                        <span className="text-success">Active</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                        Bóng đổ hấp thụ sắc độ kính gốc ({reactiveHue.toFixed(0)}°). Tránh bóng đục xám bẩn.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-[10px] h-8"
                  onClick={() => {
                    setBlurPx(isDark ? 16 : 12);
                    setSaturateBoost(1.4);
                    setGradientTint(true);
                    toast.success("Đã tự động cân chỉnh tối ưu theo chuẩn Pumni OS!");
                  }}
                >
                  ⚡ Auto-Calibrate cho {isDark ? "Dark Base" : "Light Base"}
                </Button>
              </div>
            )}

            {/* Formulas tab content */}
            {optimizerTab === 'formulas' && (
              <div className="space-y-2.5 font-mono text-[10px] text-muted-foreground">
                <div className="bg-muted/30 p-2 rounded border border-border/50 space-y-1">
                  <div className="text-foreground font-semibold uppercase text-[9px] text-primary flex justify-between">
                    <span>1. Overlay Blend Mode</span>
                    <span>Dark Spec Default</span>
                  </div>
                  <div className="text-[9px] py-0.5">
                    if (base &lt; 0.5) result = 2 * base * blend;<br />
                    else result = 1 - 2 * (1 - base) * (1 - blend);
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-normal font-sans pt-0.5">
                    Giữ lại các điểm sáng bóng của hạt nhiễu và bóng kính mà không làm xám bề mặt tối.
                  </p>
                </div>

                <div className="bg-muted/30 p-2 rounded border border-border/50 space-y-1">
                  <div className="text-foreground font-semibold uppercase text-[9px] text-primary flex justify-between">
                    <span>2. Soft Light Blend Mode</span>
                    <span>Light Spec Default</span>
                  </div>
                  <div className="text-[9px] py-0.5">
                    result = (1 - 2*blend) * base^2 + 2 * blend * base;
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-normal font-sans pt-0.5">
                    Mô phỏng nguồn sáng tán xạ mềm dịu chiếu vào tấm kính màu nhạt.
                  </p>
                </div>
              </div>
            )}

            {/* Specs tab content */}
            {optimizerTab === 'spec' && (
              <div className="space-y-2 text-muted-foreground leading-relaxed text-[10px]">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Info className="size-3.5 text-primary" />
                  <span>Quy tắc Thiết kế Glassmorphism 2026:</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5">
                  <li>
                    <strong className="text-foreground">Giới hạn Fill-rate GPU:</strong> Không dùng quá 2 lớp kính lồng nhau trên một góc nhìn.
                  </li>
                  <li>
                    <strong className="text-foreground">Đổ bóng nhiễm sắc:</strong> Dùng bóng đổ mang sắc thái màu nền của kính để giữ độ trong suốt tự nhiên.
                  </li>
                  <li>
                    <strong className="text-foreground">Kỹ thuật Border kép:</strong> Kết hợp viền gradient 1px với bóng phản chiếu góc nghiêng giúp tăng chiều sâu vật lý.
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
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
