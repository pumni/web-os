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
import { formatOklch, oklchToSrgb } from '@pumni/ui/lib/oklch';
import {
  Activity,
  Code,
  Copy,
  Gauge,
  Layers,
  Palette,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

import { BACKDROP_PRESETS, GlassBackdrop, type BackdropPreset } from './glass-2026-primitives';
import { useFps } from './use-glass-perf';

/** Copy text to the clipboard with a success toast. */
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép ${label} vào bộ nhớ tạm!`);
}

interface EdgeToken {
  l: number;
  c: number;
  h: number;
  alpha: number;
}

function getEdgeTokens(
  isDark: boolean,
  reactiveChroma: number,
  reactiveHue: number,
): { top: EdgeToken; bottom: EdgeToken } {
  if (isDark) {
    return {
      top: {
        l: 0.88,
        c: reactiveChroma,
        h: reactiveHue,
        alpha: 0.28,
      },
      bottom: {
        l: 0.2,
        c: reactiveChroma,
        h: reactiveHue,
        alpha: 0.15,
      },
    };
  } else {
    return {
      top: {
        l: 1.0,
        c: reactiveChroma,
        h: reactiveHue,
        alpha: 0.65,
      },
      bottom: {
        l: 0.4,
        c: reactiveChroma,
        h: reactiveHue,
        alpha: 0.14,
      },
    };
  }
}

export function GlassPlayground() {
  const [backdropPreset, setBackdropPreset] = React.useState<BackdropPreset>('mesh');
  const [borderEngine, setBorderEngine] = React.useState<'mask' | 'clip'>('mask');

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

  // ════════════════ MASK STYLE STATES (Pumni OS) ════════════════
  const [saturateBoost, setSaturateBoost] = React.useState<number>(1.4);
  const [blurPx, setBlurPx] = React.useState<number>(12);
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

  // ════════════════ CLIP STYLE STATES (Glassmorphism Studio) ════════════════
  const [bgLightness, setBgLightness] = React.useState<number>(12);
  const [bgChroma, setBgChroma] = React.useState<number>(0.02);
  const [bgHue, setBgHue] = React.useState<number>(240);
  const [opacity, setOpacity] = React.useState<number>(30);
  const [blur, setBlur] = React.useState<number>(16);
  const [borderOpacity, setBorderOpacity] = React.useState<number>(25);
  const [shadowDepth, setShadowDepth] = React.useState<number>(20);
  const [shadowSpread, setShadowSpread] = React.useState<number>(40);
  const [glassShine, setGlassShine] = React.useState<number>(20);
  const [noiseOpacity, setNoiseOpacity] = React.useState<number>(6);

  const applyStudioPreset = (type: 'premium-dark' | 'ios-light' | 'neon-cyber') => {
    if (type === 'premium-dark') {
      setBgLightness(12);
      setBgChroma(0.015);
      setBgHue(240);
      setOpacity(30);
      setBlur(20);
      setBorderOpacity(20);
      setShadowDepth(24);
      setShadowSpread(45);
      setNoiseOpacity(5);
      setGlassShine(15);
    } else if (type === 'ios-light') {
      setBgLightness(98);
      setBgChroma(0.01);
      setBgHue(210);
      setOpacity(65);
      setBlur(24);
      setBorderOpacity(40);
      setShadowDepth(16);
      setShadowSpread(35);
      setNoiseOpacity(3);
      setGlassShine(25);
    } else if (type === 'neon-cyber') {
      setBgLightness(16);
      setBgChroma(0.12);
      setBgHue(310);
      setOpacity(25);
      setBlur(12);
      setBorderOpacity(45);
      setShadowDepth(30);
      setShadowSpread(50);
      setNoiseOpacity(8);
      setGlassShine(35);
    }
  };

  // ════════════════ CSS VARIABLES CONSTRUCTORS ════════════════
  let previewCssVars: React.CSSProperties = {};
  let glassCSSCode = '';
  let centreLc = 0;

  const fgOklch = isDark ? { l: 0.985, c: 0.005, h: 75 } : { l: 0.19, c: 0.0035, h: 70 };
  const bgOklch = isDark ? { l: 0.13, c: 0.0035, h: 70 } : { l: 0.985, c: 0.005, h: 75 };
  const fgSrgb = oklchToSrgb(fgOklch);
  const underlyingBgSrgb = oklchToSrgb(bgOklch);

  function composite(srgb: [number, number, number], alpha: number): [number, number, number] {
    return [
      srgb[0] * alpha + underlyingBgSrgb[0] * (1 - alpha),
      srgb[1] * alpha + underlyingBgSrgb[1] * (1 - alpha),
      srgb[2] * alpha + underlyingBgSrgb[2] * (1 - alpha),
    ];
  }

  if (borderEngine === 'clip') {
    // Glassmorphism Studio Formulas
    const topLVal = Math.min(100, bgLightness + 12);
    const bottomLVal = Math.max(0, bgLightness - 10);
    const topAlphaVal = borderOpacity / 100;
    const bottomAlphaVal = (borderOpacity * 0.6) / 100;

    const edgeTopStrLocal = `oklch(${topLVal.toFixed(1)}% ${bgChroma.toFixed(4)} ${bgHue.toFixed(0)} / ${topAlphaVal.toFixed(2)})`;
    const edgeBottomStrLocal = `oklch(${bottomLVal.toFixed(1)}% ${bgChroma.toFixed(4)} ${bgHue.toFixed(0)} / ${bottomAlphaVal.toFixed(2)})`;

    const insetHighlight = bgLightness > 50
      ? `inset 0 1px 0 0 oklch(1 0 0 / ${((borderOpacity * 0.5) / 100).toFixed(3)}), inset 0 0 0 1px oklch(1 0 0 / ${((borderOpacity * 0.25) / 100).toFixed(3)})`
      : `inset 0 1px 0 0 oklch(1 0 0 / ${((borderOpacity * 0.4) / 100).toFixed(3)}), inset 0 0 0 0.5px oklch(1 0 0 / ${((borderOpacity * 0.15) / 100).toFixed(3)})`;

    const shadowColor = `oklch(${(bgLightness * 0.3).toFixed(1)}% ${Math.min(0.2, bgChroma * 1.5).toFixed(4)} ${bgHue.toFixed(0)} / ${(0.15 + shadowDepth / 250).toFixed(3)})`;
    const shadowVal = `0 ${shadowDepth / 2}px ${shadowSpread}px -3px ${shadowColor}, 0 ${shadowDepth / 4}px ${shadowSpread / 2}px -5px oklch(0 0 0 / 0.25), ${insetHighlight}`;

    const previewTintLocal = `oklch(${bgLightness}% ${bgChroma} ${bgHue} / ${opacity / 100})`;

    previewCssVars = {
      border: '1px solid transparent',
      background: `linear-gradient(${previewTintLocal}, ${previewTintLocal}) padding-box, linear-gradient(135deg, ${edgeTopStrLocal}, ${edgeBottomStrLocal}) border-box`,
      boxShadow: shadowVal,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
    };

    const tintSrgb = oklchToSrgb({ l: bgLightness / 100, c: bgChroma, h: bgHue });
    centreLc = Math.abs(apcaContrast(fgSrgb, composite(tintSrgb, opacity / 100)));

    // Construct Glassmorphism Studio Generated CSS Code
    const fillCode = 'linear-gradient(oklch(' + bgLightness + '% ' + bgChroma.toFixed(3) + ' ' + bgHue + ' / ' + (opacity / 100).toFixed(2) + '), oklch(' + bgLightness + '% ' + bgChroma.toFixed(3) + ' ' + bgHue + ' / ' + (opacity / 100).toFixed(2) + '))';
    const borderCode = 'linear-gradient(135deg, oklch(' + topLVal.toFixed(0) + '% ' + bgChroma.toFixed(3) + ' ' + bgHue + ' / ' + topAlphaVal.toFixed(2) + '), oklch(' + bottomLVal.toFixed(0) + '% ' + bgChroma.toFixed(3) + ' ' + bgHue + ' / ' + bottomAlphaVal.toFixed(2) + '))';
    const insetValCode = bgLightness > 50
      ? '    inset 0 1px 0 0 oklch(100% 0 0 / ' + ((borderOpacity * 0.5) / 100).toFixed(3) + '),\n    inset 0 0 0 1px oklch(100% 0 0 / ' + ((borderOpacity * 0.25) / 100).toFixed(3) + ')'
      : '    inset 0 1px 0 0 oklch(100% 0 0 / ' + ((borderOpacity * 0.4) / 100).toFixed(3) + '),\n    inset 0 0 0 0.5px oklch(100% 0 0 / ' + ((borderOpacity * 0.15) / 100).toFixed(3) + ')';
    const shadowColorCode = 'oklch(' + (bgLightness * 0.3).toFixed(0) + '% ' + Math.min(0.2, bgChroma * 1.5).toFixed(3) + ' ' + bgHue + ' / ' + (0.15 + shadowDepth / 250).toFixed(3) + ')';

    glassCSSCode = '.glass-card {\n' +
      '  /* 1. Nền kính & Viền dùng Background-clip */\n' +
      '  position: relative;\n' +
      '  overflow: hidden;\n' +
      '  background: \n' +
      '    ' + fillCode + ' padding-box,\n' +
      '    ' + borderCode + ' border-box;\n' +
      '  border: 1px solid transparent;\n' +
      '  border-radius: 16px;\n\n' +
      '  backdrop-filter: blur(' + blur + 'px);\n' +
      '  -webkit-backdrop-filter: blur(' + blur + 'px);\n\n' +
      '  /* 2. Double Bevel Inset & Shadows */\n' +
      '  box-shadow:\n' +
      '    0 ' + (shadowDepth / 2) + 'px ' + shadowSpread + 'px -3px ' + shadowColorCode + ',\n' +
      '    0 ' + (shadowDepth / 4) + 'px ' + (shadowSpread / 2) + 'px -5px oklch(0% 0 0 / 0.25),\n' +
      insetValCode + ';\n' +
      '  transform: translateZ(0);\n' +
      '}\n\n' +
      '/* 3. Specular Shine Overlay (Studio Glint) */\n' +
      '.glass-card::before {\n' +
      '  content: "";\n' +
      '  position: absolute;\n' +
      '  inset: 0;\n' +
      '  border-radius: inherit;\n' +
      '  background: linear-gradient(135deg, oklch(100% 0 0 / ' + (glassShine / 100).toFixed(2) + ') 0%, oklch(100% 0 0 / 0) 55%);\n' +
      '  pointer-events: none;\n' +
      '  z-index: 0;\n' +
      '}\n\n' +
      '/* 4. Micro-grain Noise Overlay (Studio Texture) */\n' +
      '.glass-card::after {\n' +
      '  content: "";\n' +
      '  position: absolute;\n' +
      '  inset: 0;\n' +
      '  border-radius: inherit;\n' +
      '  mix-blend-mode: overlay;\n' +
      '  opacity: ' + (noiseOpacity / 100).toFixed(2) + ';\n' +
      '  background-image: url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E");\n' +
      '  background-size: 180px 180px;\n' +
      '  pointer-events: none;\n' +
      '  z-index: 0;\n' +
      '}';
  } else {
    // Pumni OS Classic Mask Style
    const previewTint = formatOklch(
      { l: tintL, c: tintC, h: tintH },
      { alpha: tintAlpha },
    );
    const edgeTokens = getEdgeTokens(isDark, tintC, tintH);
    const edgeTopStrLocal = `oklch(${(edgeTokens.top.l * 100).toFixed(1)}% ${edgeTokens.top.c.toFixed(4)} ${edgeTokens.top.h.toFixed(0)} / ${edgeTokens.top.alpha.toFixed(2)})`;
    const edgeBottomStrLocal = `oklch(${(edgeTokens.bottom.l * 100).toFixed(1)}% ${edgeTokens.bottom.c.toFixed(4)} ${edgeTokens.bottom.h.toFixed(0)} / ${edgeTokens.bottom.alpha.toFixed(2)})`;

    previewCssVars = {
      ['--glass-blur' as string]: `${blurPx}px`,
      ['--glass-saturate' as string]: `${saturateBoost}`,
      ['--glass-tint' as string]: previewTint,
      ['--glass-edge-top' as string]: edgeTopStrLocal,
      ['--glass-edge-bottom' as string]: edgeBottomStrLocal,
      ['--glass-inset-bezel-top' as string]: `oklch(1 0 0 / ${isDark ? '0.08' : '0.20'})`,
      ['--glass-shadow-edge' as string]: isDark ? 'oklch(0 0 0 / 0.22)' : 'oklch(0 0 0 / 0)',
      ['--glass-bevel-ring-display' as string]: 'block',
      border: '1px solid transparent',
      background: previewTint,
    };

    const tintSrgb = oklchToSrgb({ l: tintL, c: tintC, h: tintH });
    centreLc = Math.abs(apcaContrast(fgSrgb, composite(tintSrgb, tintAlpha)));

    // Construct Pumni OS Mask Generated CSS Code
    const bgL = (tintL * 100).toFixed(0);
    const bgC = tintC.toFixed(3);
    const bgH = tintH.toFixed(0);
    const op = tintAlpha.toFixed(2);
    const topL = (edgeTokens.top.l * 100).toFixed(0);
    const topC = edgeTokens.top.c.toFixed(3);
    const topH = edgeTokens.top.h.toFixed(0);
    const topAlpha = edgeTokens.top.alpha.toFixed(2);
    const bottomL = (edgeTokens.bottom.l * 100).toFixed(0);
    const bottomC = edgeTokens.bottom.c.toFixed(3);
    const bottomH = edgeTokens.bottom.h.toFixed(0);
    const bottomAlpha = edgeTokens.bottom.alpha.toFixed(2);

    const borderCode = 'linear-gradient(135deg, oklch(' + topL + '% ' + topC + ' ' + topH + ' / ' + topAlpha + '), oklch(' + bottomL + '% ' + bottomC + ' ' + bottomH + ' / ' + bottomAlpha + '))';
    const bezelTopOp = isDark ? '0.08' : '0.20';
    const shadowEdgeCode = isDark ? '\n    inset 0 -1px 0 0 oklch(0% 0 0 / 0.22)' : '';

    glassCSSCode = '.glass-card {\n' +
      '  background: oklch(' + bgL + '% ' + bgC + ' ' + bgH + ' / ' + op + ');\n' +
      '  border: 1px solid transparent;\n' +
      '  border-radius: 16px;\n' +
      '  position: relative;\n\n' +
      '  backdrop-filter: blur(' + blurPx + 'px) saturate(' + saturateBoost.toFixed(1) + ');\n' +
      '  -webkit-backdrop-filter: blur(' + blurPx + 'px) saturate(' + saturateBoost.toFixed(1) + ');\n\n' +
      '  /* 2. Bắt sáng viền trong & Bóng đổ hệ thống */\n' +
      '  box-shadow:\n' +
      '    var(--shadow-glass),\n' +
      '    inset 0 1px 0 0 oklch(100% 0 0 / ' + bezelTopOp + ')' + shadowEdgeCode + ';\n' +
      '}\n\n' +
      '/* 1b. Bevel ring bằng Mask: sáng TL → tối BR — không bị seam chéo góc */\n' +
      '.glass-card::before {\n' +
      '  content: "";\n' +
      '  position: absolute;\n' +
      '  inset: -1px;\n' +
      '  border-radius: inherit;\n' +
      '  padding: 1px;\n' +
      '  background: ' + borderCode + ';\n' +
      '  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);\n' +
      '  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);\n' +
      '  -webkit-mask-composite: xor;\n' +
      '  mask-composite: exclude;\n' +
      '  pointer-events: none;\n' +
      '}';
  }

  const fps = useFps();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      {/* ═══════════ LEFT — VISUAL SIMULATION STAGE & STATS (col-span-8) ═══════════ */}
      <div className="space-y-6 lg:col-span-8">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Khu Vực Mô Phỏng Glassmorphism</CardTitle>
                <CardDescription>
                  So sánh trực quan hai cơ chế vẽ viền kính: Mask (Pumni OS) vs Clip (Studio).
                </CardDescription>
              </div>
              <Badge tone="success" pulse>
                Active Simulation
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="relative flex h-115 w-full items-center justify-center overflow-hidden rounded-2xl border border-border p-8 shadow-inner">
              <GlassBackdrop preset={backdropPreset} isDark={isDark} />

              <div className="relative z-10 w-full max-w-sm">
                <Card
                  className="rounded-2xl relative overflow-hidden"
                  style={previewCssVars}
                  variant={borderEngine === 'clip' ? 'glassSimple' : 'glass'}
                >
                  {borderEngine === 'clip' && (
                    <>
                      {/* Specular Shine Overlay (Studio Glint) */}
                      <div
                        className="absolute inset-0 pointer-events-none rounded-2xl z-0"
                        style={{
                          background: `linear-gradient(135deg, oklch(1 0 0 / ${(glassShine / 100).toFixed(2)}) 0%, oklch(1 0 0 / 0) 55%)`,
                        }}
                      />
                      {/* Micro-grain Noise Overlay (Studio Texture) */}
                      <div
                        className="absolute inset-0 pointer-events-none rounded-2xl z-0 animate-fade-in"
                        style={{
                          mixBlendMode: 'overlay',
                          opacity: noiseOpacity / 100,
                          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                          backgroundSize: '180px 180px',
                        }}
                      />
                    </>
                  )}
                  <CardHeader className="relative z-10">
                    <div className="flex w-full items-center justify-between">
                      <Badge tone="primary" size="sm">
                        {borderEngine === 'mask' ? 'Masked Border' : 'Background Clip'}
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
                        <span
                          className={cn(
                            'flex size-2 animate-pulse rounded-full',
                            centreLc >= 60 ? 'bg-success' : 'bg-destructive',
                          )}
                        />
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-lg font-bold text-foreground">
                      Bản mô phỏng Kính
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                      Kéo các thanh điều khiển bên phải để tinh chỉnh kính. Thay đổi phông nền phía sau
                      để quan sát hiện tượng khúc xạ ánh sáng.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Perf dashboard */}
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
                  <span className="font-mono text-lg font-bold text-foreground">1</span>
                  <Badge tone="success" size="sm">Optimal</Badge>
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Kính phẳng tiêu chuẩn · 1 lớp.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                  <Activity className="size-3.5" /> Backdrop pass
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-foreground">1</span>
                  <Badge tone="info" size="sm">render pass</Badge>
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  GPU render pass tối thiểu, không gây lag khi cuộn.
                </p>
              </div>
            </div>

            {/* APCA Readout */}
            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4 text-xs">
              <h4 className="flex items-center gap-1.5 font-bold text-foreground">
                <Gauge className="size-3.5 text-primary" />
                Chỉ số Màu & Tương phản (APCA over OKLCH)
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
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
                  <div className="font-semibold text-muted-foreground">OKLCH Tint</div>
                  <div className="font-mono font-medium text-foreground select-all">
                    {borderEngine === 'clip' ? (
                      formatOklch(
                        { l: bgLightness / 100, c: bgChroma, h: bgHue },
                        { precision: 3, alpha: opacity / 100 },
                      )
                    ) : (
                      formatOklch(
                        { l: tintL, c: tintC, h: tintH },
                        { precision: 3, alpha: tintAlpha },
                      )
                    )}
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Tông màu nền tĩnh của kính (Production).
                  </p>
                </div>
              </div>
            </div>

            {/* Generated CSS */}
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
            {/* Backdrop preset switcher */}
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3 text-xs">
              <span className="font-semibold text-foreground">Phông nền (Backdrop):</span>
              <div className="flex flex-wrap gap-1.5">
                {BACKDROP_PRESETS.map((p) => (
                  <Button
                    key={p.value}
                    variant={backdropPreset === p.value ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setBackdropPreset(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Border Engine selector */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                <Code className="size-3.5" /> Border Engine
              </h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1 bg-muted/20 p-1 rounded-lg border text-center">
                  {(['mask', 'clip'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={borderEngine === mode ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 text-[10px] capitalize px-1"
                      onClick={() => setBorderEngine(mode)}
                    >
                      {mode === 'mask' ? 'Mask' : 'Clip'}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  {borderEngine === 'mask' && 'Masked Gradient Ring (Pumni OS) - Bo góc hoàn hảo.'}
                  {borderEngine === 'clip' && 'Background-clip (Studio) - Gọn nhẹ, không dùng DOM ảo.'}
                </p>
              </div>
            </div>

            {/* ════════════════ DYNAMIC CONTROLS SWITCHING ════════════════ */}
            {borderEngine === 'mask' ? (
              // PUMNI OS CONTROLLER
              <div className="space-y-6 animate-fade-in">
                {/* Backdrop filters */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                    <Sliders className="size-3.5" /> Backdrop Filters
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Blur</span>
                      <span className="font-mono text-muted-foreground">{blurPx}px</span>
                    </div>
                    <Slider
                      min={4}
                      max={24}
                      step={1}
                      value={[blurPx]}
                      onValueChange={(val) => setBlurPx(val[0] ?? 12)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Saturation</span>
                      <span className="font-mono text-muted-foreground">
                        {saturateBoost.toFixed(1)}x
                      </span>
                    </div>
                    <Slider
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      value={[saturateBoost]}
                      onValueChange={(val) => setSaturateBoost(val[0] ?? 1.4)}
                    />
                  </div>
                </div>

                {/* Tint primitives */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                    <Palette className="size-3.5" /> OKLCH Tint (Pumni OS)
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
                      onValueChange={(val) => setTintL(val[0] ?? 0.13)}
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
                      onValueChange={(val) => setTintC(val[0] ?? 0.0035)}
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
                      onValueChange={(val) => setTintH(val[0] ?? 70)}
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
                      onValueChange={(val) => setTintAlpha(val[0] ?? 0.4)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // GLASSMORPHISM STUDIO CONTROLLER
              <div className="space-y-6 animate-fade-in">
                {/* Studio presets applicator */}
                <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3 text-xs">
                  <span className="font-semibold text-foreground">Studio Presets:</span>
                  <div className="grid grid-cols-3 gap-1">
                    <Button variant="outline" size="sm" className="h-7 px-1 text-[9px]" onClick={() => applyStudioPreset('premium-dark')}>
                      Premium Dark
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 px-1 text-[9px]" onClick={() => applyStudioPreset('ios-light')}>
                      iOS Light
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 px-1 text-[9px]" onClick={() => applyStudioPreset('neon-cyber')}>
                      Neon Cyber
                    </Button>
                  </div>
                </div>

                {/* Studio Backdrop filters */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                    <Sliders className="size-3.5" /> Studio Filters
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Blur Radius</span>
                      <span className="font-mono text-muted-foreground">{blur}px</span>
                    </div>
                    <Slider
                      min={0}
                      max={40}
                      step={1}
                      value={[blur]}
                      onValueChange={(val) => setBlur(val[0] ?? 16)}
                    />
                  </div>
                </div>

                {/* Studio Color & Opacity */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                    <Palette className="size-3.5" /> Studio Tint (OKLCH)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Lightness</span>
                      <span className="font-mono text-muted-foreground">{bgLightness}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[bgLightness]}
                      onValueChange={(val) => setBgLightness(val[0] ?? 12)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Chroma</span>
                      <span className="font-mono text-muted-foreground">{bgChroma.toFixed(3)}</span>
                    </div>
                    <Slider
                      min={0}
                      max={0.2}
                      step={0.005}
                      value={[bgChroma]}
                      onValueChange={(val) => setBgChroma(val[0] ?? 0.02)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Hue</span>
                      <span className="font-mono text-muted-foreground">{bgHue}°</span>
                    </div>
                    <Slider
                      min={0}
                      max={360}
                      step={1}
                      value={[bgHue]}
                      onValueChange={(val) => setBgHue(val[0] ?? 240)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Card Opacity</span>
                      <span className="font-mono text-muted-foreground">{opacity}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[opacity]}
                      onValueChange={(val) => setOpacity(val[0] ?? 30)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Border Opacity</span>
                      <span className="font-mono text-muted-foreground">{borderOpacity}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[borderOpacity]}
                      onValueChange={(val) => setBorderOpacity(val[0] ?? 25)}
                    />
                  </div>
                </div>

                {/* Studio Effects */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                    <Activity className="size-3.5" /> Studio Overlays & Shadows
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Specular Shine</span>
                      <span className="font-mono text-muted-foreground">{glassShine}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[glassShine]}
                      onValueChange={(val) => setGlassShine(val[0] ?? 20)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Noise Opacity</span>
                      <span className="font-mono text-muted-foreground">{noiseOpacity}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={20}
                      step={1}
                      value={[noiseOpacity]}
                      onValueChange={(val) => setNoiseOpacity(val[0] ?? 6)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Shadow Depth</span>
                      <span className="font-mono text-muted-foreground">{shadowDepth}px</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[shadowDepth]}
                      onValueChange={(val) => setShadowDepth(val[0] ?? 20)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Shadow Spread</span>
                      <span className="font-mono text-muted-foreground">{shadowSpread}px</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[shadowSpread]}
                      onValueChange={(val) => setShadowSpread(val[0] ?? 40)}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
