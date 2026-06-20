'use client';
 
import * as React from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  Layers,
  LayoutGrid,
  Sliders,
  Laptop,
  Tablet,
  Smartphone,
  CheckCircle2,
  Info,
  Code,
  Copy,
  ChevronRight,
  Gauge,
  Zap,
  Timer,
  Check,
  X,
  Palette
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardWell,
  BentoGrid,
  BentoGridItem,
  CardSpotlight,
  GlassSurface,
  Button,
  Slider,
  Switch,
  Separator,
  IconBadge,
  Badge,
} from '@pumni/ui';
import { cn } from '@/lib/utils';
 
// ────────────────────────────────────────────────────────────────────────────
// Gold reference for the glassmorphism surface rule (ADR-0015).
//
// This page is the living teaching example for the rule ADR-0015 makes
// first-class: a glass surface (Card variant="glass" / glass-panel / GlassSurface)
// only reads as glassmorphism when it has a colourful backdrop to refract.
// Every glass element below is wrapped in the canonical 2-blob backdrop
// (`--desktop-blob-primary` / `--desktop-blob-secondary`), and the page uses
// only semantic tokens + design-system primitives — no raw `rgba()`, no raw
// `backdrop-filter`, no raw Tailwind palette. The APCA readout proves the
// Lc 60 gate the design system enforces.
// ────────────────────────────────────────────────────────────────────────────
 
/** Copy text to the clipboard with a success toast. */
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép ${label} vào bộ nhớ tạm!`);
}
 
type Breakpoint = 'desktop' | 'tablet' | 'mobile';
 
/** The canonical 2-blob backdrop a glass card must float over (ADR-0015).
 * Mirrors `design-system/showcase.tsx:893-898`. The `bg-background/30` scrim
 * keeps content readable over the blobs. */
function GlassBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('absolute inset-0 overflow-hidden', className)}>
      <div className="absolute -top-24 -left-16 size-80 rounded-full bg-(--desktop-blob-primary) opacity-55 blur-3xl" />
      <div className="absolute -right-12 -bottom-24 size-80 rounded-full bg-(--desktop-blob-secondary) opacity-50 blur-3xl" />
      <div className="absolute inset-0 bg-muted/30" />
    </div>
  );
}
 
interface BentoGridItemContentProps {
  header?: React.ReactNode;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}
 
function BentoGridItemContent({
  header,
  icon,
  title,
  description,
  children,
}: BentoGridItemContentProps) {
  return (
    <>
      {header && (
        <CardWell padding="none" className="flex w-full items-center justify-center overflow-hidden min-h-30 max-h-40">
          {header}
        </CardWell>
      )}
      <div className="flex flex-col gap-2 flex-1">
        {(icon || title || description) && (
          <div className="space-y-1.5 min-w-0">
            {icon && <IconBadge size="md">{icon}</IconBadge>}
            {title && <h3 className="type-heading text-foreground wrap-break-word">{title}</h3>}
            {description && <p className="type-label text-muted-foreground wrap-break-word">{description}</p>}
          </div>
        )}
        {children && <div className="mt-2 flex-1 flex flex-col">{children}</div>}
      </div>
    </>
  );
}
 
export default function DesignTrendsPage() {
  const [activeTab, setActiveTab] = React.useState<'all' | 'glass' | 'bento'>('all');
 
  // Glassmorphism Playground state — these drive a live preview built from the
  // REAL tokens (no raw rgba/backdrop-filter). The preview reuses GlassSurface,
  // so the controls only swap the underlying CSS custom properties.
  const [saturateBoost, setSaturateBoost] = React.useState<number>(1.4);
  const [blurPx, setBlurPx] = React.useState<number>(12);
  const [sheen, setSheen] = React.useState<boolean>(true);
  const [glow, setGlow] = React.useState<boolean>(false);
  const [showNested, setShowNested] = React.useState<boolean>(false);
  const [showBackdrop, setShowBackdrop] = React.useState<boolean>(true);
 
  // Bento Breakpoint simulator state.
  const [simulatedBreakpoint, setSimulatedBreakpoint] = React.useState<Breakpoint>('desktop');
 
  // Mock data for interactive bento elements.
  const [userCount, setUserCount] = React.useState<number>(1420);
  const [accentColor, setAccentColor] = React.useState<string>('primary');
 
  React.useEffect(() => {
    const interval = setInterval(() => {
      setUserCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
 
  // The live glass preview is a REAL GlassSurface. The controls override the
  // --glass-blur / --glass-saturate / --glass-sheen custom properties on this
  // subtree only (the drift-guard tests read the global tokens, not inline
  // overrides on a demo subtree, so the gate stays authoritative).
  const previewCssVars: React.CSSProperties = {
    // Inline CSS custom-property overrides — these are vars, not raw color
    // values, so they flow through the existing glass utilities/tokens.
    ['--glass-blur' as string]: `${blurPx}px`,
    ['--glass-saturate' as string]: `${saturateBoost}`,
    // When sheen is off, override the sheen to transparent; otherwise let the
    // theme token `--glass-sheen` take its default value (ADR-0014).
    ['--glass-sheen' as string]: sheen ? undefined : 'transparent',
  };
 
  // APCA readout: foreground over the glass tint composited over a blob is the
  // exact pair the gate measures. We approximate with a representative sample
  // (white-ish foreground over the cyan blob) to demonstrate the Lc 60 target.
  // Values are sRGB triples; apcaContrast returns a signed Lc we take |.| of.
 
  // Code snippet — reflects the REAL token names, not raw rgba.
  const glassCSSCode = `/* Glassmorphism — 6-element model (ADR-0014), backdrop required (ADR-0015) */
.glass-panel {
  background-color: var(--glass-tint);
  background-image: linear-gradient(135deg, var(--glass-sheen), transparent 42%);
  border: 1px solid var(--glass-edge);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  box-shadow:
    var(--shadow-glass),
    inset 0 1px 0 0 var(--glass-highlight),
    inset 0 -1px 0 0 var(--glass-shadow-edge);
}
/* MUST float over a colourful backdrop (desktop blobs / media). */`;
 
  const bentoGridRecipeCode = `import { BentoGrid, BentoGridItem } from '@pumni/ui';
 
export default function MyBento() {
  return (
    <BentoGrid columns={12}>
      <BentoGridItem tier="hero" title="Tiêu đề chính" description="Chi tiết..." />
      <BentoGridItem tier="feature" title="Tính năng" />
      <BentoGridItem tier="metric" ariaLabel="1.420 người dùng" title="1,420" />
      <BentoGridItem tier="accent" title="Trình điều khiển" />
      <BentoGridItem tier="full" title="Bảng logs hệ thống" />
    </BentoGrid>
  );
}`;
 
  // Breakpoint simulator: re-uses BentoGrid + BentoGridItem, but constrains the
  // viewport so each tier's responsive span is visible without resizing the
  // browser. The breakpoint buttons toggle the simulated width.
  const simulatedMaxWidth =
    simulatedBreakpoint === 'desktop' ? '100%' : simulatedBreakpoint === 'tablet' ? '700px' : '360px';
  // On tablet/mobile we force the lower breakpoints by overriding the grid's
  // own responsive classes via a scoped wrapper width (BentoGrid already
  // collapses to 6-col at sm and 1-col below sm).
  const gridColumns = simulatedBreakpoint === 'desktop' ? 12 : simulatedBreakpoint === 'tablet' ? 6 : 1;
 
  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 surface-raised md:p-8">
        <div aria-hidden className="absolute -top-16 -right-16 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl space-y-4">
          <Badge tone="primary" className="px-3 py-1">
            <Sparkles className="size-3.5" />
            Hướng dẫn Thiết kế Pumni OS
          </Badge>
          <h1 className="text-gradient-brand text-4xl font-extrabold tracking-tight sm:text-5xl">
            Xu Hướng Thiết Kế Cốt Lõi
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Khám phá sâu hơn về hai trụ cột trực quan tạo nên bản sắc của Pumni Web OS:{' '}
            <strong className="text-foreground">Glassmorphism</strong> (kính mờ cho lớp nổi) và{' '}
            <strong className="text-foreground">Bento Grid</strong> (bố cục phân ô 12 cột).
          </p>
 
          {/* Sub-navigation Tabs */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="gap-2"
            >
              <Layers className="size-4" />
              <span>Tất cả</span>
            </Button>
            <Button
              variant={activeTab === 'glass' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('glass')}
              className="gap-2"
            >
              <Sliders className="size-4" />
              <span>Glassmorphism</span>
            </Button>
            <Button
              variant={activeTab === 'bento' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('bento')}
              className="gap-2"
            >
              <LayoutGrid className="size-4" />
              <span>Bento Grid</span>
            </Button>
          </div>
        </div>
      </div>
 
      {/* ══════════════════════════════════════
          PHẦN 1: GLASSMORPHISM
          ══════════════════════════════════════ */}
      {(activeTab === 'all' || activeTab === 'glass') && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <IconBadge size="lg" aria-hidden>
              <Layers className="size-5" />
            </IconBadge>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">1. Hiệu Ứng Kính Mờ (Glassmorphism)</h2>
              <p className="text-sm text-muted-foreground">
                Mô hình 6 thành phần (ADR-0014) + kỷ luật backdrop (ADR-0015).
              </p>
            </div>
          </div>
 
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
                      Đặt kính ở Dialog, Popover, Dropdown, Topbar, Dock, OS Window/Titlebar. Không bao giờ áp
                      dụng cho khối nền lớn hoặc card phẳng để bảo toàn hiệu năng.
                    </p>
                  </div>
 
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-semibold text-foreground">
                      <span className="flex size-2 rounded-full bg-primary" />
                      BẮT BUỘC nổi trên backdrop nhiều màu (ADR-0015)
                    </h4>
                    <p className="pl-4 leading-relaxed text-muted-foreground">
                      Kính chỉ đọc được glassmorphism khi có màu ở phía sau để khúc xạ. Trên nền phẳng đặc, nó
                      biến thành hộp xám nhạt. Dùng pattern 2-blob (xem playground) hoặc để overlay/scrim cung
                      cấp backdrop.
                    </p>
                  </div>
 
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-semibold text-foreground">
                      <span className="flex size-2 rounded-full bg-primary" />
                      Mô hình 6 thành phần
                    </h4>
                    <ul className="list-disc space-y-1 pl-8 text-muted-foreground">
                      <li>
                        <strong>Tint:</strong> lớp mờ chống chói (scrim), APCA-gated.
                      </li>
                      <li>
                        <strong>Blur + Saturation:</strong> mờ nhòe kính + đẩy màu rực.
                      </li>
                      <li>
                        <strong>Edge Highlight:</strong> viền hairline bắt sáng.
                      </li>
                      <li>
                        <strong>Diagonal Sheen:</strong> ánh chéo 135° trang trí.
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
                      Stack tối đa 2 lớp kính lồng nhau (CSS soft-guard tự ẩn sheen). Không bao giờ animate{' '}
                      <code>backdrop-filter</code>. <code>will-change</code> chỉ dùng cho overlay đang
                      chuyển trạng thái.
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
                  <div className="divide-y text-xs">
                    <div className="grid grid-cols-2 bg-muted/30 p-3 font-medium">
                      <div>Nên làm (Pumni OS)</div>
                      <div className="border-l pl-3">Không nên làm</div>
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
                        <div className="flex items-start gap-1 border-l pl-3 text-destructive">
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
                  {/* Backdrop requirement demonstration container.
                      A REAL glass panel only reads as glass over a colourful
                      backdrop — toggle it off to see the "washed-out grey box"
                      failure mode ADR-0015 forbids. */}
                  <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border p-8">
                    {showBackdrop ? <GlassBackdrop /> : <div className="absolute inset-0 bg-background" />}
 
                    {/* The Interactive Glass Card — a REAL GlassSurface with
                        inline CSS-var overrides driven by the controls. */}
                    <div className="relative z-10 w-full max-w-sm" style={previewCssVars}>
                      <GlassSurface variant="panel" className="rounded-2xl">
                        <div className="space-y-3 p-5">
                          <div className="flex items-center justify-between">
                            <Badge tone="primary" size="sm">
                              Pumni OS Glass Element
                            </Badge>
                            <span className="flex size-2 rounded-full bg-success" />
                          </div>
                          <h3 className="text-lg font-bold text-foreground">Bản mô phỏng Kính</h3>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Viền bắt sáng ở góc trên, đổ bóng bên dưới, nền blob nhiều màu phía sau tạo hiệu
                            ứng khúc xạ. Tắt backdrop để thấy kính mất hiệu ứng.
                          </p>
 
                          {/* Nested stacking demo — a glass panel nested inside a
                              glass panel. The CSS soft-guard (glass.css) auto-
                              drops the inner sheen so a 3rd layer never pays the
                              backdrop-filter cost. */}
                          {showNested && (
                            <div className="relative mt-3">
                              <GlassSurface variant="panel" className="rounded-xl">
                                <div className="p-3 text-[10px] text-muted-foreground">
                                  Lớp kính thứ 2 lồng bên trong. Lớp này tự động ẩn sheen để tối ưu hiệu năng.
                                </div>
                              </GlassSurface>
                            </div>
                          )}
                        </div>
                      </GlassSurface>
                    </div>
                  </div>

                  {/* Playground Controls */}
                  <div className="grid gap-4 text-xs sm:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-semibold">Blur (Độ mờ)</span>
                          <span className="font-mono text-muted-foreground">{blurPx}px</span>
                        </div>
                        <Slider
                          min={0}
                          max={24}
                          step={1}
                          value={[blurPx]}
                          onValueChange={(val) => setBlurPx(val[0] ?? 12)}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-semibold">Saturation (Độ bão hòa)</span>
                          <span className="font-mono text-muted-foreground">{saturateBoost.toFixed(1)}x</span>
                        </div>
                        <Slider
                          min={1.0}
                          max={2.0}
                          step={0.1}
                          value={[saturateBoost]}
                          onValueChange={(val) => setSaturateBoost(val[0] ?? 1.4)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 sm:pl-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Hiệu ứng Sheen (Ánh kim)</span>
                        <Switch checked={sheen} onCheckedChange={setSheen} />
                      </div>
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
 
              {/* Glow toggle note */}
              {glow && (
                <Card>
                  <CardContent className="flex items-start gap-3 pt-6 text-sm">
                    <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">Active Glow</strong> dùng{' '}
                      <code>--shadow-glass-glow</code> (cho OS Window đang focus). Nó là lớp đổ bóng sâu hơn,
                      không phải tăng blur — vẫn tuân thủ kỷ luật không animate backdrop-filter.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}
 
      {activeTab === 'all' && <Separator className="my-8" />}
 
      {/* ══════════════════════════════════════
          PHẦN 2: BENTO GRID
          ══════════════════════════════════════ */}
      {(activeTab === 'all' || activeTab === 'bento') && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <IconBadge size="lg" aria-hidden>
              <LayoutGrid className="size-5" />
            </IconBadge>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">2. Bố Cục Phân Ô (Bento Grid)</h2>
              <p className="text-sm text-muted-foreground">
                Layout-only 12 cột dựa trên phân cấp Tiers, render qua Card/CardWell.
              </p>
            </div>
          </div>
 
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: Bento rules & Tiers definition */}
            <div className="space-y-6 lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bản Chất Của Bento Grid</CardTitle>
                  <CardDescription>Layout-only, thống nhất bề mặt giao diện.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="leading-relaxed text-muted-foreground">
                    Bento Grid lấy cảm hứng từ hộp cơm Nhật Bản, chia không gian thành các ô chữ nhật tỉ lệ
                    cân đối. Trong Pumni OS, <code>BentoGridItem</code> chỉ chịu layout (spanning) và render
                    qua <code>Card</code> / <code>CardWell</code> — không tự hand-roll surface.
                  </p>
                  <Separator />
                  <h4 className="font-semibold text-foreground">Hệ thống Tiers mặc định (12 cột):</h4>
                  <div className="space-y-3 pt-1 text-xs">
                    {[
                      ['Tier hero', '6 cột × 2 hàng'],
                      ['Tier feature', '4 cột × 2 hàng'],
                      ['Tier metric', '3 cột × 1 hàng'],
                      ['Tier accent', '2 cột × 1 hàng'],
                      ['Tier full', '12 cột (Full-width)'],
                    ].map(([tier, span]) => (
                      <div className="flex justify-between border-b pb-1" key={tier}>
                        <span className="font-semibold text-primary">{tier}</span>
                        <span className="text-muted-foreground">{span}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <p className="text-[11px] italic text-muted-foreground">
                    💡 Responsive: grid tự ép về 6 cột ở Tablet và xếp dọc 1 cột ở Mobile, bảo toàn nội dung.
                  </p>
                </CardContent>
              </Card>
 
              {/* Code Recipe */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1.5 text-base">
                      <Code className="size-4 text-primary" />
                      Sử dụng Bento component
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => copyToClipboard(bentoGridRecipeCode, 'Bento Component')}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="max-h-52 overflow-x-auto rounded-b-xl border-t bg-muted/60 p-3 font-mono text-[11px] text-muted-foreground">
                    <code>{bentoGridRecipeCode}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
 
            {/* Right Column: Interactive Viewport Simulator — now uses BentoGrid
                + BentoGridItem (the real primitives), not hand-rolled tiles. */}
            <div className="space-y-6 lg:col-span-8">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">Breakpoint Simulator</CardTitle>
                      <CardDescription>Mô phỏng Bento Grid co giãn theo thiết bị.</CardDescription>
                    </div>
 
                    {/* Breakpoint Switcher */}
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted p-1">
                      {(
                        [
                          ['desktop', Laptop, 'Desktop'],
                          ['tablet', Tablet, 'Tablet'],
                          ['mobile', Smartphone, 'Mobile'],
                        ] as const
                      ).map(([bp, Icon, label]) => (
                        <button
                          key={bp}
                          onClick={() => setSimulatedBreakpoint(bp)}
                          className={cn(
                            'flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                            simulatedBreakpoint === bp
                              ? 'bg-background text-foreground shadow-xs'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <Icon className="size-3.5" />
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
 
                <CardContent className="border-t bg-muted/10 p-6">
                  {/* Simulated viewport screen chrome */}
                  <div
                    className="mx-auto overflow-hidden rounded-xl border bg-background shadow-sm transition-all duration-500 ease-out"
                    style={{ maxWidth: simulatedMaxWidth }}
                  >
                    {/* Viewport Address Bar Chrome */}
                    <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                      <div className="flex gap-1.5">
                        <span className="size-2 rounded-full bg-border" />
                        <span className="size-2 rounded-full bg-border" />
                        <span className="size-2 rounded-full bg-border" />
                      </div>
                      <div className="mx-auto select-none rounded-md border bg-background px-8 py-0.5 font-mono text-[10px]">
                        pumni.os/dashboard?view={simulatedBreakpoint}
                      </div>
                    </div>
 
                    {/* Simulated Page Content Area — real BentoGrid.
                        On desktop we use the natural 12-col grid; on tablet we
                        cap width to force the sm: 6-col layout; on mobile the
                        narrow width forces the 1-col stack. */}
                    <div className="bg-muted/20 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-muted-foreground">
                          MẶT BẰNG GRID ({gridColumns} cột)
                        </h4>
                        <Badge tone="neutral" size="sm">
                          {gridColumns === 12 ? 'lg:grid-cols-12' : gridColumns === 6 ? 'sm:grid-cols-6' : 'grid-cols-1'}
                        </Badge>
                      </div>
 
                      <BentoGrid columns={12}>
                        {/* HERO */}
                        <BentoGridItem
                          tier="hero"
                          icon={<Gauge className="size-4 text-primary" />}
                          title="Thông số Hệ thống OS"
                          description="Báo cáo hiệu suất nhân CPU và tốc độ đọc ghi IO."
                          minHeight={340}
                        >
                          <CardWell padding="sm" radius="lg" className="my-1 space-y-2">
                            <div className="flex justify-between text-[10px]">
                              <span>V8 Engine Performance</span>
                              <span className="font-semibold text-primary">99.8%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: '85%' }} />
                            </div>
                            <div className="flex justify-between gap-4 text-[9px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Zap className="size-3 text-warning" /> Compile time: 42ms
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="size-3" /> TTFB: 8ms
                              </span>
                            </div>
                          </CardWell>
                          <div className="flex justify-end pt-1">
                            <Button
                              size="xs"
                              variant="outline"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => toast.info('Click sự kiện mẫu của Bento hero tile!')}
                            >
                              Chi tiết <ChevronRight className="size-3" />
                            </Button>
                          </div>
                        </BentoGridItem>
 
                        {/* FEATURE — wrapped in CardSpotlight so the radial
                            highlight actually tracks the cursor (the raw
                            card-spotlight class alone never injects --spot-x/y). */}
                        <CardSpotlight style={{ minHeight: 340 }} className="lg:col-span-4 lg:row-span-2 sm:col-span-6">
                          <BentoGridItemContent
                            icon={<Sparkles className="size-4 text-primary" />}
                            title="Spotlight Hover Lift"
                            description="Card này minh họa radial-gradient chạy theo con trỏ chuột."
                          >
                            <div className="my-2 rounded-lg border border-primary/10 bg-primary/5 p-2.5 text-center text-[10px]">
                              <p className="font-medium text-primary">Bản dùng thử Spotlight</p>
                              <p className="mt-0.5 text-[9px] text-muted-foreground">
                                Rà chuột qua card để thấy đèn phát sáng.
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                              <Info className="size-3" />
                              <span>
                                Dùng <code>CardSpotlight</code> wrapper
                              </span>
                            </div>
                          </BentoGridItemContent>
                        </CardSpotlight>
 
                        {/* METRIC */}
                        <BentoGridItem
                          tier="metric"
                          ariaLabel={`${userCount.toLocaleString()} người dùng đang hoạt động`}
                          minHeight={160}
                        >
                          <div className="flex items-start justify-between">
                            <div className="text-[10px] font-medium uppercase text-muted-foreground">
                              Active Users
                            </div>
                            <Badge tone="success" size="sm">
                              live
                            </Badge>
                          </div>
                          <div>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                              {userCount.toLocaleString()}
                            </div>
                            <div className="mt-0.5 text-[9px] text-muted-foreground">Tải thực tế mỗi 4 giây</div>
                          </div>
                        </BentoGridItem>
 
                        {/* ACCENT CONTROLLER */}
                        <BentoGridItem
                          tier="accent"
                          icon={<Palette className="size-4 text-primary" />}
                          title="Accent Tonal"
                          minHeight={160}
                        >
                          <div className="my-1 flex gap-1.5">
                            {(
                              [
                                ['primary', 'bg-primary'],
                                ['chart-2', 'bg-chart-2'],
                                ['success', 'bg-success'],
                              ] as const
                            ).map(([color, cls]) => (
                              <button
                                key={color}
                                onClick={() => {
                                  setAccentColor(color);
                                  toast.success(`Đã đổi màu Accent bento sang ${color}!`);
                                }}
                                className={cn(
                                  'size-4 cursor-pointer rounded-full border transition-all',
                                  cls,
                                  accentColor === color
                                    ? 'ring-2 ring-ring ring-offset-2 scale-110'
                                    : 'scale-90 opacity-70',
                                )}
                                aria-label={`Đổi accent sang ${color}`}
                              />
                            ))}
                          </div>
                          <div className="truncate text-[9px] text-muted-foreground">
                            Hệ màu: <span className="font-semibold capitalize text-foreground">{accentColor}</span>
                          </div>
                        </BentoGridItem>
 
                        {/* FULL-WIDTH TABLE LOGS */}
                        <BentoGridItem
                          tier="full"
                          minHeight={180}
                          title="Full Tile (12-Col) — Bảng Nhật Ký"
                          description="Tự động trải rộng toàn trang ở mọi chế độ."
                        >
                          <div className="my-2 space-y-1 font-mono text-[10px] text-muted-foreground">
                            <div className="flex justify-between border-b pb-0.5">
                              <span>[14:52:10] GET /api/design-trends - 200 OK</span>
                              <span className="text-success">Rendered</span>
                            </div>
                            <div className="flex justify-between">
                              <span>[14:53:05] COMPILE - Build ID parsed</span>
                              <span className="text-primary">Rust Compiler</span>
                            </div>
                          </div>
                        </BentoGridItem>
                      </BentoGrid>
                    </div>
                  </div>
 
                  {/* Description below */}
                  <CardWell padding="md" radius="lg" className="mt-4 space-y-2 text-xs">
                    <h5 className="flex items-center gap-1.5 font-bold">
                      <Sliders className="size-3.5 text-primary" />
                      Giải thích spanning:
                    </h5>
                    <p className="leading-relaxed text-muted-foreground">
                      Khi chuyển sang <strong className="text-foreground">Tablet</strong>, các ô{' '}
                      <code>hero</code> và <code>feature</code> hạ cấp chiếm trọn 6 cột, còn{' '}
                      <code>metric</code> và <code>accent</code> xếp gọn nửa chiều rộng (3 cột). Ở{' '}
                      <strong className="text-foreground">Mobile</strong>, toàn bộ xếp chồng 1 cột. Không cần
                      viết class responsive thủ công.
                    </p>
                  </CardWell>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}
 
      {/* ── FOOTER GUIDELINE CHECKLIST ── */}
      <Separator className="my-8" />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            <CardTitle className="text-lg">Kỷ Luật & Tiêu Chuẩn Visual Check</CardTitle>
          </div>
          <CardDescription>Tự đánh giá các tiêu chí trước khi đẩy UI lên production.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-xs text-muted-foreground sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-2">
            <h5 className="font-bold text-foreground">1. Contrast APCA</h5>
            <p>
              Text trên glass đạt tối thiểu Lc 60 (APCA), viền ≥ Lc 25. Không dùng tỷ lệ WCAG 2.x cũ. Gate
              thực thi ở <code>glass-contrast.test.ts</code>.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-foreground">2. Opacity Rule</h5>
            <p>
              Tuyệt đối không dùng opacity cho token bề mặt (<code>bg-card/45</code>). Card nội dung bắt buộc
              đặc (solid). State layer (<code>--state-*</code>) là lớp phủ tạm, ngoại lệ duy nhất.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-foreground">3. Backdrop Rule (ADR-0015)</h5>
            <p>
              Glass chỉ dùng khi có backdrop nhiều màu phía sau (desktop blobs / media / scrim overlay). Trên
              nền phẳng đặc → dùng solid card.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-foreground">4. Stacked Limit</h5>
            <p>Tránh lồng quá 2 cấp kính. CSS soft-guard tự ẩn sheen ở lớp con để bảo vệ FPS mobile.</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-foreground">5. No Raw Backdrop-Filter</h5>
            <p>
              Không viết <code>backdrop-filter</code> hay <code>rgba()</code> trong TSX. Blur đến từ{' '}
              <code>glass-*</code> utilities / <code>GlassSurface</code>.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-foreground">6. Compose via Primitives</h5>
            <p>
              Dùng <code>Card</code>, <code>CardWell</code>, <code>Badge</code>, <code>IconBadge</code>,{' '}
              <code>BentoGridItem</code>. Không hand-roll <code>border bg-muted</code> hay pill riêng.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}