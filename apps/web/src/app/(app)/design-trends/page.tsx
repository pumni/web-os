'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  Layers,
  LayoutGrid,
  Sliders,
  Eye,
  Cpu,
  Laptop,
  Tablet,
  Smartphone,
  CheckCircle2,
  Info,
  AlertTriangle,
  Code,
  Copy,
  Terminal,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Gauge,
  Activity,
  Zap,
  Timer,
  Check,
  MousePointerClick
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardWell,
  BentoGrid,
  BentoGridItem,
  GlassSurface,
  Button,
  Slider,
  Switch,
  Separator,
  IconBadge,
  Badge
} from '@pumni/ui';
import { cn } from '@/lib/utils';

// Helper to copy text to clipboard and show a success toast
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép code ${label} vào bộ nhớ tạm!`);
}

type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export default function DesignTrendsPage() {
  const [activeTab, setActiveTab] = React.useState<'all' | 'glass' | 'bento'>('all');

  // Glassmorphism Playground state
  const [blur, setBlur] = React.useState<number>(16);
  const [opacity, setOpacity] = React.useState<number>(0.35);
  const [saturation, setSaturation] = React.useState<number>(1.4);
  const [glow, setGlow] = React.useState<boolean>(false);
  const [sheen, setSheen] = React.useState<boolean>(true);
  const [showNested, setShowNested] = React.useState<boolean>(false);

  // Bento Breakpoint simulator state
  const [simulatedBreakpoint, setSimulatedBreakpoint] = React.useState<Breakpoint>('desktop');

  // Mock data/states for interactive bento elements
  const [userCount, setUserCount] = React.useState<number>(1420);
  const [accentColor, setAccentColor] = React.useState<string>('cyan');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Glassmorphism computed styles for preview
  const previewGlassStyle: React.CSSProperties = {
    backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blur}px) saturate(${saturation})`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundImage: sheen
      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 42%)'
      : 'none',
    boxShadow: glow
      ? 'var(--shadow-glass-glow), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
      : 'var(--shadow-glass), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
    transition: 'all 0.3s ease',
  };

  // Code snippets for copy
  const glassTailwindCode = `<!-- Glass Floating Panel (Tailwind v4 shorthand) -->
<div className="glass-panel rounded-xl p-6">
  <h3>Floating Glass Element</h3>
</div>`;

  const glassCSSCode = `.glass-custom-panel {
  background-color: var(--glass-tint); /* rgba(255, 255, 255, ${opacity}) */
  backdrop-filter: blur(${blur}px) saturate(${saturation});
  border: 1px solid var(--glass-edge);
  background-image: ${sheen ? 'linear-gradient(135deg, var(--glass-sheen), transparent 42%)' : 'none'};
  box-shadow:
    ${glow ? 'var(--shadow-glass-glow)' : 'var(--shadow-glass)'},
    inset 0 1px 0 0 var(--glass-highlight),
    inset 0 -1px 0 0 var(--glass-shadow-edge);
}`;

  const bentoGridRecipeCode = `import { BentoGrid, BentoGridItem } from '@pumni/ui';

export default function MyBento() {
  return (
    <BentoGrid columns={12}>
      <BentoGridItem tier="hero" title="Tiêu đề chính" description="Chi tiết..." />
      <BentoGridItem tier="feature" title="Tính năng" />
      <BentoGridItem tier="metric" title="1,420" description="Người dùng hoạt động" />
      <BentoGridItem tier="accent" title="Trình điều khiển" />
      <BentoGridItem tier="full" title="Bảng logs hệ thống" />
    </BentoGrid>
  );
}`;

  // Layout Spanning maps simulator (Desktop 12-col / Tablet 6-col / Mobile 1-col)
  const getSimulatedGridClass = (breakpoint: Breakpoint) => {
    switch (breakpoint) {
      case 'mobile':
        return 'grid grid-cols-1 gap-4 w-full max-w-sm mx-auto transition-all duration-500 ease-out';
      case 'tablet':
        return 'grid grid-cols-6 gap-4 w-full max-w-2xl mx-auto transition-all duration-500 ease-out';
      case 'desktop':
      default:
        return 'grid grid-cols-12 gap-4 w-full max-w-full transition-all duration-500 ease-out';
    }
  };

  const getSimulatedItemClass = (tier: string, breakpoint: Breakpoint) => {
    if (breakpoint === 'mobile') {
      return 'col-span-1';
    }
    if (breakpoint === 'tablet') {
      switch (tier) {
        case 'hero':
          return 'col-span-6 min-h-[220px]';
        case 'feature':
          return 'col-span-6 min-h-[200px]';
        case 'metric':
          return 'col-span-3 min-h-[120px]';
        case 'accent':
          return 'col-span-3 min-h-[120px]';
        case 'full':
          return 'col-span-6 min-h-[160px]';
        default:
          return 'col-span-3';
      }
    }
    // Desktop 12 columns
    switch (tier) {
      case 'hero':
        return 'col-span-6 row-span-2 min-h-[340px]';
      case 'feature':
        return 'col-span-4 row-span-2 min-h-[340px]';
      case 'metric':
        return 'col-span-3 min-h-[160px]';
      case 'accent':
        return 'col-span-2 min-h-[160px]';
      case 'full':
        return 'col-span-12 min-h-[180px]';
      default:
        return 'col-span-3';
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            <span>Hướng dẫn Thiết kế Pumni OS</span>
          </div>
          <h1 className="text-gradient-brand text-4xl font-extrabold tracking-tight sm:text-5xl">
            Xu Hướng Thiết Kế Cốt Lõi
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Khám phá sâu hơn về hai trụ cột trực quan tạo nên bản sắc của Pumni Web OS:{' '}
            <strong className="text-foreground">Glassmorphism</strong> (Hiệu ứng kính mờ cho các lớp nổi) và{' '}
            <strong className="text-foreground">Bento Grid</strong> (Cấu trúc phân ô trực quan 12 cột).
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">1. Hiệu Ứng Kính Mờ (Glassmorphism)</h2>
              <p className="text-sm text-muted-foreground">
                Thiết kế lớp phủ trong mờ theo mô hình 6 thành phần của Pumni OS (ADR-0014).
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: Theory & Rules */}
            <div className="space-y-6 lg:col-span-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quy Tắc Thiết Kế Kính (ADR-0012/0014)</CardTitle>
                  <CardDescription>Nguyên tắc phân tầng và tối ưu hóa phần cứng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <span className="flex size-2 rounded-full bg-primary" />
                      Chỉ dùng cho lớp nổi (Floating Layers)
                    </h4>
                    <p className="text-muted-foreground leading-relaxed pl-4">
                      Đặt kính ở các thành phần như Dialog, Popover, Dropdown, Topbar, Dock, OS Window/Titlebar.
                      Không bao giờ áp dụng cho các khối nền lớn hoặc card phẳng để bảo toàn hiệu năng.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <span className="flex size-2 rounded-full bg-primary" />
                      Mô hình 6 thành phần trực quan
                    </h4>
                    <ul className="list-disc pl-8 space-y-1 text-muted-foreground">
                      <li><strong>Tint:</strong> Lớp màu mờ chống chói (scrim).</li>
                      <li><strong>Blur + Saturation:</strong> Mờ nhòe kính kết hợp đẩy màu rực rỡ.</li>
                      <li><strong>Edge Highlight:</strong> Đường viền hairline tinh xảo bắt sáng.</li>
                      <li><strong>Diagonal Sheen:</strong> Ánh chéo nhẹ hướng 135° trang trí (không APCA).</li>
                      <li><strong>Drop Shadow:</strong> Đổ bóng định vị độ nổi thực sự.</li>
                      <li><strong>Opaque Fallback:</strong> Thay thế bằng nền đặc khi hệ thống giảm trong suốt.</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <span className="flex size-2 rounded-full bg-primary" />
                      Kỷ luật hiệu năng tối đa
                    </h4>
                    <p className="text-muted-foreground leading-relaxed pl-4">
                      Stack tối đa 2 lớp kính lồng nhau. Lớp kính thứ hai lồng vào tự động ẩn sheen đường chéo
                      để GPU không phải tính toán đè bộ lọc nén điểm ảnh.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Do & Don't table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="size-4 text-primary" />
                    Bảng đối chiếu thiết kế Kính
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y text-xs">
                    <div className="grid grid-cols-2 p-3 bg-muted/30 font-medium">
                      <div>Nên làm (Pumni OS)</div>
                      <div className="border-l pl-3">Không nên làm</div>
                    </div>
                    <div className="grid grid-cols-2 p-3">
                      <div className="text-emerald-500 flex items-start gap-1">
                        <Check className="size-3.5 shrink-0 mt-0.5" />
                        <span>Sử dụng <code>GlassSurface</code> hoặc utility <code>glass-panel</code></span>
                      </div>
                      <div className="border-l pl-3 text-destructive flex items-start gap-1">
                        <span className="font-bold">❌</span>
                        <span>Dùng raw <code>backdrop-blur-md</code> bừa bãi trong code TSX</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 p-3">
                      <div className="text-emerald-500 flex items-start gap-1">
                        <Check className="size-3.5 shrink-0 mt-0.5" />
                        <span>Giữ độ mờ mượt mà qua <code>backdrop-filter</code> trên thanh Topbar, Dock</span>
                      </div>
                      <div className="border-l pl-3 text-destructive flex items-start gap-1">
                        <span className="font-bold">❌</span>
                        <span>Dùng kính mờ cho toàn bộ nền ứng dụng hoặc các card chứa nội dung văn bản dài</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 p-3">
                      <div className="text-emerald-500 flex items-start gap-1">
                        <Check className="size-3.5 shrink-0 mt-0.5" />
                        <span>Tuân thủ APCA Lc 60 cho chữ, Lc 25 cho viền trên mặt kính để người dùng dễ đọc</span>
                      </div>
                      <div className="border-l pl-3 text-destructive flex items-start gap-1">
                        <span className="font-bold">❌</span>
                        <span>Đặt chữ mờ/nhạt màu đè lên kính không đủ tương phản làm mỏi mắt</span>
                      </div>
                    </div>
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
                      <CardDescription>Tự tay cấu hình mô phỏng kính và kiểm tra hiệu năng.</CardDescription>
                    </div>
                    <Badge variant="outline" className="animate-pulse">Live Preview</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Container with dynamic gradient moving backdrop */}
                  <div className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border p-8">
                    {/* The animated dynamic background */}
                    <div className="absolute inset-0 bg-slate-950">
                      <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-cyan-500/25 blur-3xl animate-pulse" />
                      <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
                      <div className="absolute top-1/2 left-1/3 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
                      
                      {/* Technical grids */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f615_1px,transparent_1px),linear-gradient(to_bottom,#3b82f615_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
                      <div className="absolute top-1/4 left-1/4 h-24 w-40 rounded-lg bg-linear-to-br from-amber-500 to-rose-500 opacity-60 blur-md transform rotate-12" />
                    </div>

                    {/* The Interactive Glass Card */}
                    <div className="relative z-10 w-full max-w-sm rounded-2xl" style={previewGlassStyle}>
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">Pumni OS Glass Element</span>
                          <span className="flex size-2 rounded-full bg-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Bản mô phỏng Kính</h3>
                        <p className="text-xs text-muted-foreground/90 leading-relaxed">
                          Nhìn kĩ cách viền catching-light sáng ở góc trên và đổ bóng bên dưới.
                          Nền động giúp bạn kiểm tra rõ hiệu ứng mờ nhòe kính (frosted blur).
                        </p>

                        {/* Nested stacking demo */}
                        {showNested && (
                          <div
                            className="mt-3 p-3 rounded-lg border border-white/10"
                            style={{
                              backgroundColor: `rgba(255, 255, 255, ${Math.min(opacity + 0.1, 0.9)})`,
                              backdropFilter: `blur(${blur}px)`,
                              WebkitBackdropFilter: `blur(${blur}px)`,
                              boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.1)',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">
                              <Cpu className="size-3" />
                              <span>LỚP KÍNH CON (STACKED LAYER 2)</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground/80 mt-1">
                              Tự động loại bỏ sheen đường chéo để bảo vệ FPS khỏi bộ xử lý đồ họa trùng lặp.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sliders and controls */}
                  <div className="grid gap-4 md:grid-cols-2 bg-muted/20 p-4 rounded-xl border border-border/60">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Độ mờ kính (Blur):</span>
                        <span className="font-mono text-primary">{blur}px</span>
                      </div>
                      <Slider
                        value={[blur]}
                        onValueChange={(val) => setBlur(val[0] ?? 16)}
                        min={0}
                        max={40}
                        step={1}
                      />

                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Độ đục nền (Opacity):</span>
                        <span className="font-mono text-primary">{(opacity * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[opacity * 100]}
                        onValueChange={(val) => setOpacity((val[0] ?? 35) / 100)}
                        min={10}
                        max={90}
                        step={5}
                      />

                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Bão hòa vibrancy (Saturate):</span>
                        <span className="font-mono text-primary">{saturation.toFixed(1)}x</span>
                      </div>
                      <Slider
                        value={[saturation * 10]}
                        onValueChange={(val) => setSaturation((val[0] ?? 14) / 10)}
                        min={10}
                        max={25}
                        step={1}
                      />
                    </div>

                    <div className="space-y-4 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label htmlFor="sheen-toggle" className="text-xs font-medium text-muted-foreground">Ánh bóng chéo (Diagonal Sheen)</label>
                          <p className="text-[10px] text-muted-foreground">Gia tăng cảm giác ánh sáng phản chiếu.</p>
                        </div>
                        <Switch id="sheen-toggle" checked={sheen} onCheckedChange={setSheen} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label htmlFor="glow-toggle" className="text-xs font-medium text-muted-foreground">Bóng tỏa phát sáng (Active Glow)</label>
                          <p className="text-[10px] text-muted-foreground">Độ đổ bóng sâu cho cửa sổ hoạt động.</p>
                        </div>
                        <Switch id="glow-toggle" checked={glow} onCheckedChange={setGlow} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label htmlFor="nested-toggle" className="text-xs font-medium text-muted-foreground">Mô phỏng kính lồng kính (Stack Layer)</label>
                          <p className="text-[10px] text-muted-foreground">Bật lớp kính con để kiểm nghiệm tối ưu.</p>
                        </div>
                        <Switch id="nested-toggle" checked={showNested} onCheckedChange={setShowNested} />
                      </div>
                    </div>
                  </div>

                  {/* Code displays */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                        <Code className="size-3.5" />
                        Mã cấu trúc CSS tương ứng
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(glassCSSCode, 'CSS Glass')}
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-3.5" />
                        <span>Sao chép CSS</span>
                      </Button>
                    </div>
                    <pre className="overflow-x-auto rounded-md bg-muted/60 p-3 text-xs font-mono border text-muted-foreground max-h-36">
                      <code>{glassCSSCode}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
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
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <LayoutGrid className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">2. Bố Cục Phân Ô (Bento Grid)</h2>
              <p className="text-sm text-muted-foreground">
                Giải pháp chia khung dữ liệu toán học 12 cột dựa trên phân cấp ô (Tiers) thay vì tailwind spans thủ công.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: Bento rules & Tiers definition */}
            <div className="space-y-6 lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bản Chất Của Bento Grid</CardTitle>
                  <CardDescription>Cơ chế layout-only thống nhất bề mặt giao diện.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-muted-foreground leading-relaxed">
                    Bento Grid lấy cảm hứng từ hộp cơm hộp Nhật Bản, chia cắt không gian hiển thị thành các ô chữ nhật
                    với tỉ lệ cân đối. Trong Pumni OS, <code>BentoGridItem</code> chỉ chịu trách nhiệm định dạng
                    layout (Spanning) và truyền tải dữ liệu vào các thẻ <code>Card</code> / <code>CardWell</code>.
                  </p>
                  <Separator />
                  <h4 className="font-semibold text-foreground">Hệ thống phân cấp Tiers mặc định (12 cột):</h4>
                  <div className="space-y-3 pt-1 text-xs">
                    <div className="flex justify-between border-b pb-1">
                      <span className="font-semibold text-primary">Tier hero</span>
                      <span className="text-muted-foreground">Chiếm 6 cột × 2 hàng</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="font-semibold text-primary">Tier feature</span>
                      <span className="text-muted-foreground">Chiếm 4 cột × 2 hàng</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="font-semibold text-primary">Tier metric</span>
                      <span className="text-muted-foreground">Chiếm 3 cột × 1 hàng</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="font-semibold text-primary">Tier accent</span>
                      <span className="text-muted-foreground">Chiếm 2 cột × 1 hàng</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="font-semibold text-primary">Tier full</span>
                      <span className="text-muted-foreground">Chiếm 12 cột (Full-width)</span>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-[11px] text-muted-foreground/80 italic">
                    💡 Quy tắc responsive: Grid tự động ép về 6 cột ở Tablet (dành cho metric/accent) và xếp dọc 1 cột ở Mobile để bảo toàn nội dung không bị bóp méo.
                  </p>
                </CardContent>
              </Card>

              {/* Code Recipe */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-1.5">
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
                  <pre className="overflow-x-auto rounded-b-xl bg-muted/60 p-3 text-[11px] font-mono border-t max-h-52 text-muted-foreground">
                    <code>{bentoGridRecipeCode}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Interactive Viewport Simulator */}
            <div className="space-y-6 lg:col-span-8">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-lg">Breakpoint Simulator</CardTitle>
                      <CardDescription>Mô phỏng Bento Grid co giãn thích ứng thiết bị.</CardDescription>
                    </div>

                    {/* Breakpoint Switcher */}
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted p-1">
                      <button
                        onClick={() => setSimulatedBreakpoint('desktop')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                          simulatedBreakpoint === 'desktop'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Laptop className="size-3.5" />
                        <span className="hidden sm:inline">Desktop</span>
                      </button>
                      <button
                        onClick={() => setSimulatedBreakpoint('tablet')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                          simulatedBreakpoint === 'tablet'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Tablet className="size-3.5" />
                        <span className="hidden sm:inline">Tablet</span>
                      </button>
                      <button
                        onClick={() => setSimulatedBreakpoint('mobile')}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                          simulatedBreakpoint === 'mobile'
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Smartphone className="size-3.5" />
                        <span className="hidden sm:inline">Mobile</span>
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="bg-muted/10 p-6 border-t">
                  {/* Simulated viewport screen chrome */}
                  <div className="mx-auto rounded-xl border bg-background shadow-lg overflow-hidden transition-all duration-500 ease-out"
                       style={{
                         maxWidth: simulatedBreakpoint === 'desktop' ? '100%' : simulatedBreakpoint === 'tablet' ? '700px' : '360px'
                       }}>
                    {/* Viewport Address Bar Chrome */}
                    <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                      <div className="flex gap-1.5">
                        <span className="size-2 rounded-full bg-border" />
                        <span className="size-2 rounded-full bg-border" />
                        <span className="size-2 rounded-full bg-border" />
                      </div>
                      <div className="mx-auto rounded-md bg-background px-8 py-0.5 border text-[10px] select-none font-mono">
                        pumni.os/dashboard?view={simulatedBreakpoint}
                      </div>
                    </div>

                    {/* Simulated Page Content Area */}
                    <div className="p-4 bg-background/50 space-y-4">
                      {/* Grid header info inside screen */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-muted-foreground">MẶT BẰNG GRID ({simulatedBreakpoint === 'desktop' ? '12 cột' : simulatedBreakpoint === 'tablet' ? '6 cột' : '1 cột'})</h4>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          {simulatedBreakpoint === 'desktop' ? 'lg:grid-cols-12' : simulatedBreakpoint === 'tablet' ? 'sm:grid-cols-6' : 'grid-cols-1'}
                        </Badge>
                      </div>

                      {/* Animated Bento Grid */}
                      <div className={getSimulatedGridClass(simulatedBreakpoint)}>
                        {/* ITEM 1: HERO */}
                        <div className={cn(
                          "relative rounded-xl border bg-card p-4 flex flex-col justify-between transition-all duration-300",
                          getSimulatedItemClass('hero', simulatedBreakpoint)
                        )}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <IconBadge size="sm"><Gauge className="size-3 text-primary" /></IconBadge>
                              <span>Hero Tile (6×2)</span>
                            </div>
                            <h4 className="text-sm font-bold mt-1">Thông số Hệ thống OS</h4>
                            <p className="text-[11px] text-muted-foreground">Báo cáo hiệu suất của nhân ảo CPU và tốc độ đọc ghi IO.</p>
                          </div>
                          
                          {/* Mini visual element */}
                          <div className="my-3 rounded-lg border bg-muted/30 p-2.5 space-y-2">
                            <div className="flex justify-between text-[10px]">
                              <span>V8 Engine Performance</span>
                              <span className="font-semibold text-primary">99.8%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '85%' }} />
                            </div>
                            <div className="flex gap-4 justify-between text-[9px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Zap className="size-3 text-amber-500" /> Compile time: 42ms</span>
                              <span className="flex items-center gap-1"><Timer className="size-3" /> TTFB: 8ms</span>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <Button size="xs" variant="outline" className="text-[10px] h-7 px-2" onClick={() => toast.info('Click sự kiện mẫu của Bento hero tile!')}>
                              Chi tiết <ChevronRight className="size-3" />
                            </Button>
                          </div>
                        </div>

                        {/* ITEM 2: FEATURE (with Spotlight indicator) */}
                        <div className={cn(
                          "rounded-xl border bg-card p-4 flex flex-col justify-between interactive-card card-spotlight transition-all duration-300",
                          getSimulatedItemClass('feature', simulatedBreakpoint)
                        )}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <IconBadge size="sm"><Sparkles className="size-3 text-primary" /></IconBadge>
                              <span>Feature Tile (4×2)</span>
                            </div>
                            <h4 className="text-sm font-bold mt-1">Spotlight Hover Lift</h4>
                            <p className="text-[11px] text-muted-foreground">Card này minh họa cho Spotlight radial-gradient chạy theo con trỏ chuột.</p>
                          </div>

                          <div className="my-2 rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-center text-[10px]">
                            <p className="text-primary font-medium">Bản dùng thử Spotlight</p>
                            <p className="text-muted-foreground text-[9px] mt-0.5">Rà chuột qua card để thấy đèn phát sáng rực rỡ.</p>
                          </div>

                          <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <Info className="size-3" />
                            <span>Vận dụng <code>CardSpotlight</code> component</span>
                          </div>
                        </div>

                        {/* ITEM 3: METRIC */}
                        <div className={cn(
                          "rounded-xl border bg-card p-4 flex flex-col justify-between transition-all duration-300",
                          getSimulatedItemClass('metric', simulatedBreakpoint)
                        )}>
                          <div className="flex justify-between items-start">
                            <div className="text-[10px] text-muted-foreground font-medium uppercase">Active Users</div>
                            <span className="flex size-1.5 rounded-full bg-emerald-500 animate-ping" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold tracking-tight">{userCount.toLocaleString()}</div>
                            <div className="text-[9px] text-muted-foreground mt-0.5">Tải thực tế mỗi 4 giây</div>
                          </div>
                        </div>

                        {/* ITEM 4: ACCENT CONTROLLER */}
                        <div className={cn(
                          "rounded-xl border bg-card p-4 flex flex-col justify-between transition-all duration-300",
                          getSimulatedItemClass('accent', simulatedBreakpoint)
                        )}>
                          <div className="text-[10px] text-muted-foreground font-medium">Accent Tonal</div>
                          <div className="flex gap-1.5 my-1">
                            {['cyan', 'violet', 'emerald'].map((color) => (
                              <button
                                key={color}
                                onClick={() => {
                                  setAccentColor(color);
                                  toast.success(`Đã đổi màu Accent bento sang ${color}!`);
                                }}
                                className={cn(
                                  "size-4 rounded-full border transition-all cursor-pointer",
                                  color === 'cyan' ? 'bg-cyan-500' : color === 'violet' ? 'bg-violet-500' : 'bg-emerald-500',
                                  accentColor === color ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'scale-90 opacity-70'
                                )}
                              />
                            ))}
                          </div>
                          <div className="text-[9px] text-muted-foreground truncate">
                            Hệ màu: <span className="font-semibold capitalize text-foreground">{accentColor}</span>
                          </div>
                        </div>

                        {/* ITEM 5: FULL-WIDTH TABLE LOGS */}
                        <div className={cn(
                          "rounded-xl border bg-card p-4 flex flex-col justify-between transition-all duration-300",
                          getSimulatedItemClass('full', simulatedBreakpoint)
                        )}>
                          <div className="flex items-center justify-between pb-1.5 border-b">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold">Full Tile (12-Col) — Bảng Nhật Ký Hoạt Động</h4>
                              <p className="text-[9px] text-muted-foreground">Tự động trải rộng toàn trang ở bất kỳ chế độ hiển thị nào.</p>
                            </div>
                            <Badge variant="outline" className="text-[9px]">SYSTEM LOGS</Badge>
                          </div>
                          
                          <div className="my-2 space-y-1 text-[10px] font-mono text-muted-foreground">
                            <div className="flex justify-between border-b pb-0.5">
                              <span>[14:52:10] GET /api/design-trends - 200 OK</span>
                              <span className="text-emerald-500">Rendered</span>
                            </div>
                            <div className="flex justify-between">
                              <span>[14:53:05] COMPILE - Build ID parsed successfully</span>
                              <span className="text-primary">Rust Compiler</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description below */}
                  <div className="mt-4 rounded-lg bg-muted/30 border p-4 space-y-2 text-xs">
                    <h5 className="font-bold flex items-center gap-1.5">
                      <Sliders className="size-3.5 text-primary" />
                      Giải thích hành vi Spanning:
                    </h5>
                    <p className="text-muted-foreground leading-relaxed">
                      Quan sát cách hệ thống co giãn: Khi chuyển sang <strong className="text-foreground">Tablet</strong>,
                      các ô <code>hero</code> và <code>feature</code> được hạ cấp chiếm trọn 6 cột để không làm nén chiều dọc,
                      trong khi <code>metric</code> và <code>accent</code> xếp gọn gàng thành các cặp nửa chiều rộng (3 cột).
                      Khi ở <strong className="text-foreground">Mobile</strong>, toàn bộ các ô chuyển sang 1 cột duy nhất xếp chồng.
                      Cách làm này tránh việc lập trình viên phải viết hàng tá class responsive rườm rà.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER GUIDELINE CHECKLIST ── */}
      <Separator className="my-8" />
      <Card className="bg-linear-to-r from-muted/30 via-primary/5 to-muted/30 border border-primary/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            <CardTitle className="text-lg">Kỷ Luật & Tiêu Chuẩn Visual Check</CardTitle>
          </div>
          <CardDescription>Trước khi đẩy thay đổi UI lên production, hãy tự đánh giá các tiêu chí sau.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-xs text-muted-foreground">
          <div className="space-y-2">
            <h5 className="font-bold text-foreground">1. Contrast APCA</h5>
            <p>Đảm bảo text trên nền Glassmorphism đạt tối thiểu Lc 60 (APCA) và viền đạt Lc 25. Không sử dụng tỷ lệ WCAG 2.x cũ.</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-foreground">2. Opacity Rule</h5>
            <p>Tuyệt đối không dùng opacity cho token bề mặt card như <code>bg-card/45</code>. Các card thường bắt buộc có màu đặc (solid Card).</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-foreground">3. Stacked Limit</h5>
            <p>Tránh lồng đè quá 2 cấp độ kính nổi. Vi phạm quy tắc này sẽ làm suy giảm tốc độ FPS đáng kể trên thiết bị di động.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
