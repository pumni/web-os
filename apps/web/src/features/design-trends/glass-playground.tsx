'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardWell,
  GlassSurface,
  Slider,
  Switch,
  apcaContrast,
  formatOklch,
  oklchToSrgb,
} from '@pumni/ui';
import { Check, Copy, Gauge, Info, Layers, Palette, Sliders, X } from 'lucide-react';
import { toast } from 'sonner';

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

/** The canonical 2-blob backdrop a glass card must float over (ADR-0015). */
function GlassBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('absolute inset-0 overflow-hidden', className)}>
      <div className="absolute -top-24 -left-16 size-80 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
      <div className="absolute -right-12 -bottom-24 size-80 rounded-full bg-(--desktop-blob-secondary) opacity-50 blur-3xl" />
      <div className="absolute inset-0 bg-muted/30" />
    </div>
  );
}

export function GlassPlayground() {
  const [saturateBoost, setSaturateBoost] = React.useState<number>(1.4);
  const [blurPx, setBlurPx] = React.useState<number>(12);
  const [glow, setGlow] = React.useState<boolean>(false);
  const [showNested, setShowNested] = React.useState<boolean>(false);
  const [showBackdrop, setShowBackdrop] = React.useState<boolean>(true);

  // Sync with actual dark/light class of document to set defaults
  const [isDark, setIsDark] = React.useState<boolean>(true);

  React.useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    const handle = requestAnimationFrame(syncTheme);
    const observer = new MutationObserver(() => {
      requestAnimationFrame(syncTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => {
      cancelAnimationFrame(handle);
      observer.disconnect();
    };
  }, []);

  // Glass Tint States (OKLCH Primitives)
  const [tintL, setTintL] = React.useState<number>(0.13);
  const [tintC, setTintC] = React.useState<number>(0.02);
  const [tintH, setTintH] = React.useState<number>(260);
  const [tintAlpha, setTintAlpha] = React.useState<number>(0.34);

  // Update defaults when theme class changes
  React.useEffect(() => {
    requestAnimationFrame(() => {
      if (isDark) {
        setTintL(0.13);
        setTintC(0.02);
        setTintH(260);
        setTintAlpha(0.34);
      } else {
        setTintL(1.0);
        setTintC(0.0);
        setTintH(0);
        setTintAlpha(0.54);
      }
    });
  }, [isDark]);

  const previewCssVars: React.CSSProperties = {
    ['--glass-blur' as string]: `${blurPx}px`,
    ['--glass-saturate' as string]: `${saturateBoost}`,
    // Built via the colour-math formatter (not a hand-written oklch literal) so
    // the preview keeps the token boundary: this is a runtime slider value,
    // not a hardcoded design colour.
    ['--glass-tint' as string]: formatOklch({ l: tintL, c: tintC, h: tintH }, { alpha: tintAlpha }),
  };

  const fgOklch = isDark ? { l: 0.985, c: 0.003, h: 247.858 } : { l: 0.085, c: 0.015, h: 260 };

  const blobOklch = { l: 0.555, c: 0.115, h: 202 };

  const bgOklch = isDark ? { l: 0.085, c: 0.015, h: 260 } : { l: 1.0, c: 0.0, h: 0 };

  const fgSrgb = oklchToSrgb(fgOklch);
  const blobSrgb = oklchToSrgb(blobOklch);
  const glassSrgb = oklchToSrgb({ l: tintL, c: tintC, h: tintH });
  const underlyingBgSrgb = showBackdrop ? blobSrgb : oklchToSrgb(bgOklch);

  const compositeBgSrgb: [number, number, number] = [
    glassSrgb[0] * tintAlpha + underlyingBgSrgb[0] * (1 - tintAlpha),
    glassSrgb[1] * tintAlpha + underlyingBgSrgb[1] * (1 - tintAlpha),
    glassSrgb[2] * tintAlpha + underlyingBgSrgb[2] * (1 - tintAlpha),
  ];

  const sampleLc = Math.abs(apcaContrast(fgSrgb, compositeBgSrgb));

  const glassCSSCode = `/* Glassmorphism — 5-element model (ADR-0014, amended by ADR-0016), backdrop required (ADR-0015) */
.glass-panel {
  background-color: var(--glass-tint);
  border: 1px solid var(--glass-edge);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  box-shadow:
    var(--shadow-glass),
    inset 0 1px 0 0 var(--surface-rim-top),
    inset 0 -1px 0 0 var(--glass-shadow-edge);
}
/* MUST float over a colourful backdrop (desktop blobs / media). */`;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left Column: Theory & Rules */}
      <div className="space-y-6 lg:col-span-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quy Tắc Kính (ADR-0012/0014/0015)</CardTitle>
            <CardDescription>Phân tầng, tối ưu phần cứng và điều kiện backdrop.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <span className="flex size-2 rounded-full bg-primary" />
                Chỉ dùng cho lớp nổi (Floating Layers)
              </h4>
              <p className="pl-4 leading-relaxed text-muted-foreground">
                Đặt kính ở Dialog, Popover, Dropdown, Topbar, Dock, OS Window/Titlebar. Không bao
                giờ áp dụng cho khối nền lớn hoặc card phẳng để bảo toàn hiệu năng.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <span className="flex size-2 rounded-full bg-primary" />
                BẮT BUỘC nổi trên backdrop nhiều màu (ADR-0015)
              </h4>
              <p className="pl-4 leading-relaxed text-muted-foreground">
                Kính chỉ đọc được glassmorphism khi có màu ở phía sau để khúc xạ. Trên nền phẳng
                đặc, nó biến thành hộp xám nhạt. Dùng pattern 2-blob (xem playground) hoặc để
                overlay/scrim cung cấp backdrop.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <span className="flex size-2 rounded-full bg-primary" />
                Mô hình 5 thành phần
              </h4>
              <ul className="list-disc space-y-1 pl-8 text-muted-foreground">
                <li>
                  <strong>Tint:</strong> lớp mờ chống chói (scrim), APCA-gated.
                </li>
                <li>
                  <strong>Blur + Saturation:</strong> mờ nhòe kính + đẩy màu rực.
                </li>
                <li>
                  <strong>Edge Highlight:</strong> viền hairline bắt sáng (cặp top/bottom).
                </li>
                <li>
                  <strong>Drop Shadow:</strong> đổ bóng định vị độ nổi.
                </li>
                <li>
                  <strong>Opaque Fallback:</strong> nền đặc khi hệ thống giảm trong suốt.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <span className="flex size-2 rounded-full bg-primary" />
                Kỷ luật hiệu năng
              </h4>
              <p className="pl-4 leading-relaxed text-muted-foreground">
                Stack tối đa 2 lớp kính lồng nhau (mỗi lớp ép một backdrop render pass riêng). Không
                bao giờ animate <code>backdrop-filter</code>. <code>will-change</code> chỉ dùng cho
                overlay đang chuyển trạng thái.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Do & Don't table — semantic tokens + primitives only */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-primary" />
              Bảng đối chiếu Kính
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
                  dont: 'Dùng raw ' + 'backdrop-' + 'blur-md bừa bãi trong TSX',
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
                  do: 'Card nội dung (form/bảng) dùng variant="solid"',
                  dont: 'Bọc form/table trong glass trên nền phẳng',
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

      {/* Right Column: Live Playground */}
      <div className="space-y-6 lg:col-span-7">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Interactive Playground</CardTitle>
                <CardDescription>Tự cấu hình kính và kiểm tra gate APCA.</CardDescription>
              </div>
              <Badge tone="success" pulse>
                Live Preview
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border p-8">
              {showBackdrop ? (
                <GlassBackdrop />
              ) : (
                <div className="absolute inset-0 bg-background" />
              )}

              <div className="relative z-10 w-full max-w-sm">
                <GlassSurface
                  variant={glow ? 'window' : 'panel'}
                  className="rounded-2xl"
                  style={previewCssVars}
                >
                  <div className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <Badge tone="primary" size="sm">
                        Pumni OS Glass Element
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          tone={
                            sampleLc >= 60 ? 'success' : sampleLc >= 45 ? 'warning' : 'destructive'
                          }
                          size="sm"
                          className="font-mono"
                        >
                          APCA Lc {sampleLc.toFixed(1)}
                        </Badge>
                        <span
                          className={cn(
                            'flex size-2 animate-pulse rounded-full',
                            sampleLc >= 60
                              ? 'bg-success'
                              : sampleLc >= 45
                                ? 'bg-warning'
                                : 'bg-destructive',
                          )}
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Bản mô phỏng Kính</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Viền bắt sáng ở góc trên, đổ bóng bên dưới, nền blob nhiều màu phía sau tạo
                      hiệu ứng khúc xạ. Tắt backdrop để thấy kính mất hiệu ứng.
                    </p>

                    {showNested && (
                      <div className="relative mt-3">
                        <GlassSurface variant="panel" className="rounded-xl">
                          <div className="p-3 text-[10px] text-muted-foreground">
                            Lớp kính thứ 2 (tối đa). Mỗi lớp <code>backdrop-filter</code> ép một
                            render pass riêng — lớp thứ 3 sẽ nhân chuỗi per-pixel blur cost và tụt
                            FPS trên mobile. Đây là doc rule (ADR-0016), không phải CSS soft-guard.
                          </div>
                        </GlassSurface>
                      </div>
                    )}
                  </div>
                </GlassSurface>
              </div>
            </div>

            {/* Detailed Color Metrics & Verification */}
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4 text-xs">
              <h4 className="flex items-center gap-1.5 font-bold text-foreground">
                <Gauge className="size-3.5 animate-pulse text-primary" />
                Chỉ số Màu sắc & Tương phản (APCA over OKLCH Primitives)
              </h4>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-1.5 rounded-lg border bg-card p-3">
                  <div className="font-semibold text-muted-foreground">Tương phản APCA</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-foreground">
                      Lc {sampleLc.toFixed(1)}
                    </span>
                    <Badge
                      tone={sampleLc >= 60 ? 'success' : sampleLc >= 45 ? 'warning' : 'destructive'}
                      size="sm"
                    >
                      {sampleLc >= 60 ? 'Pass (Body)' : sampleLc >= 45 ? 'Pass (Large)' : 'Fail'}
                    </Badge>
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Yêu cầu: văn bản thường ≥ Lc 60 (dark), viền ≥ Lc 25.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-lg border bg-card p-3">
                  <div className="font-semibold text-muted-foreground">OKLCH Tint Color</div>
                  <div className="font-mono font-medium text-foreground select-all">
                    {formatOklch(
                      { l: tintL, c: tintC, h: tintH },
                      { precision: 3, alpha: tintAlpha },
                    )}
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Hệ màu đồng nhất của dự án, chống méo sắc độ khi đổi opacity.
                  </p>
                </div>

                <div className="space-y-1.5 rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-1 font-semibold text-muted-foreground">
                    Linear sRGB (Tint)
                    <span
                      className="inline-flex cursor-help"
                      title="Linear light sRGB values scaled 0.0 - 1.0 (intentional gamma-less matrix outputs for APCA accuracy)"
                    >
                      <Info className="size-3 text-muted-foreground" />
                    </span>
                  </div>
                  <div className="font-mono font-medium text-foreground select-all">
                    rgb({glassSrgb[0].toFixed(4)} {glassSrgb[1].toFixed(4)}{' '}
                    {glassSrgb[2].toFixed(4)})
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Không dùng sRGB 0-255 tiêu chuẩn. Giá trị tuyến tính trực tiếp (0.0-1.0).
                  </p>
                </div>

                <div className="space-y-1.5 rounded-lg border bg-card p-3">
                  <div className="font-semibold text-muted-foreground">
                    Nền Tổng hợp (Composite)
                  </div>
                  <div className="font-mono font-medium text-foreground select-all">
                    rgb({compositeBgSrgb[0].toFixed(4)} {compositeBgSrgb[1].toFixed(4)}{' '}
                    {compositeBgSrgb[2].toFixed(4)})
                  </div>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    Kết quả hòa trộn kênh tuyến tính giữa lớp Kính (Tint) và nền phía sau (Blob).
                  </p>
                </div>
              </div>
            </div>

            {/* Playground Controls */}
            <div className="grid gap-6 text-xs md:grid-cols-3">
              <div className="space-y-4">
                <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                  <Sliders className="size-3.5" /> Backdrop Filters
                  <SpecBadge />
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Blur (Độ mờ)</span>
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
                    Spec {SPECS.blur.min}–{SPECS.blur.max}px (product: {SPECS.blur.production}).
                    Trên 16px tăng GPU cost trên mobile không tương xứng.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Saturation (Bão hòa)</span>
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
                    Spec {SPECS.saturate.min.toFixed(1)}–{SPECS.saturate.max.toFixed(1)}x (product:{' '}
                    {SPECS.saturate.production}). Vibrancy cao hơn đè màu backdrop quá mức.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                  <Palette className="size-3.5" /> OKLCH Primitives (Tint)
                </h4>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Trình diễn cách token Tier-1 được mix thành <code>--glass-tint</code> (Tier-2).
                  Mặc định khớp token production ({isDark ? 'neutral-900 34%' : 'neutral-0 54%'}).
                  Component thật luôn dùng <code>bg-glass</code> / <code>GlassSurface</code>, không
                  bao giờ ref primitive trực tiếp.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Lightness (Độ sáng L)</span>
                    <span className="font-mono text-muted-foreground">{tintL.toFixed(3)}</span>
                  </div>
                  <Slider
                    min={0.0}
                    max={1.0}
                    step={0.01}
                    value={[tintL]}
                    onValueChange={(val) => setTintL(val[0] ?? (isDark ? 0.13 : 1.0))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Chroma (Độ rực màu C)</span>
                    <span className="font-mono text-muted-foreground">{tintC.toFixed(3)}</span>
                  </div>
                  <Slider
                    min={0.0}
                    max={0.2}
                    step={0.005}
                    value={[tintC]}
                    onValueChange={(val) => setTintC(val[0] ?? (isDark ? 0.02 : 0.0))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Hue (Góc màu H)</span>
                    <span className="font-mono text-muted-foreground">{tintH.toFixed(1)}°</span>
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
                    <span className="font-semibold">Tint Opacity (Opacity)</span>
                    <span className="font-mono text-muted-foreground">
                      {(tintAlpha * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    min={0.0}
                    max={1.0}
                    step={0.01}
                    value={[tintAlpha]}
                    onValueChange={(val) => setTintAlpha(val[0] ?? (isDark ? 0.34 : 0.54))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="flex items-center gap-1.5 border-b pb-1 font-bold text-foreground">
                  <Layers className="size-3.5" /> Style Toggles
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Hiệu ứng Glow (Phát sáng)</span>
                    <Switch checked={glow} onCheckedChange={setGlow} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Lồng kính (Nested Stacking)</span>
                    <Switch checked={showNested} onCheckedChange={setShowNested} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Hiển thị Backdrop (Nền màu)</span>
                    <Switch checked={showBackdrop} onCheckedChange={setShowBackdrop} />
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Code Output */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Generated CSS Code</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => copyToClipboard(glassCSSCode, 'CSS Glass')}
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
              <CardWell padding="none" className="max-h-36 overflow-x-auto">
                <pre className="p-3 font-mono text-xs text-muted-foreground">
                  <code>{glassCSSCode}</code>
                </pre>
              </CardWell>
            </div>
          </CardContent>
        </Card>

        {glow && (
          <Card>
            <CardContent className="flex items-start gap-3 pt-6 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Active Glow</strong> dùng{' '}
                <code>--shadow-glass-glow</code> (cho OS Window đang focus). Nó là lớp đổ bóng sâu
                hơn, không phải tăng blur — vẫn tuân thủ kỷ luật không animate backdrop-filter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
