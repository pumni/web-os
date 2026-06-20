'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Badge,
  BentoGrid,
  BentoGridItem,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardWell,
} from '@pumni/ui';
import {
  ChevronRight,
  Code,
  Copy,
  Gauge,
  Laptop,
  Palette,
  Sliders,
  Smartphone,
  Sparkles,
  Tablet,
  Timer,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

type Breakpoint = 'desktop' | 'tablet' | 'mobile';

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

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép ${label} vào bộ nhớ tạm!`);
}

export function BentoSimulator() {
  const [simulatedBreakpoint, setSimulatedBreakpoint] = React.useState<Breakpoint>('desktop');
  const [userCount, setUserCount] = React.useState<number>(1420);
  const [accentColor, setAccentColor] = React.useState<string>('primary');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setUserCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const simulatedMaxWidth =
    simulatedBreakpoint === 'desktop' ? '100%' : simulatedBreakpoint === 'tablet' ? '700px' : '360px';
  
  const gridColumns = simulatedBreakpoint === 'desktop' ? 12 : simulatedBreakpoint === 'tablet' ? 6 : 1;

  const simulatedGridStyle =
    simulatedBreakpoint === 'tablet'
      ? { gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }
      : simulatedBreakpoint === 'mobile'
        ? { gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' }
        : undefined;

  const getSimulatedItemStyle = (tier: 'hero' | 'feature' | 'metric' | 'accent' | 'full') => {
    if (simulatedBreakpoint === 'desktop') return undefined;
    if (simulatedBreakpoint === 'mobile') {
      return { gridColumn: 'span 1 / span 1', gridRow: 'auto' };
    }
    switch (tier) {
      case 'hero':
        return { gridColumn: 'span 6 / span 6' };
      case 'feature':
        return { gridColumn: 'span 6 / span 6' };
      case 'metric':
        return { gridColumn: 'span 3 / span 3' };
      case 'accent':
        return { gridColumn: 'span 2 / span 2' };
      case 'full':
        return { gridColumn: 'span 6 / span 6' };
      default:
        return undefined;
    }
  };

  return (
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
            <hr className="border-border" />
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
            <hr className="border-border" />
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

      {/* Right Column: Interactive Viewport Simulator */}
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

              {/* Simulated Page Content Area */}
              <div className="bg-muted/20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground">
                    MẶT BẰNG GRID ({gridColumns} cột)
                  </h4>
                  <Badge tone="neutral" size="sm">
                    {gridColumns === 12 ? 'lg:grid-cols-12' : gridColumns === 6 ? 'sm:grid-cols-6' : 'grid-cols-1'}
                  </Badge>
                </div>

                <BentoGrid columns={12} style={simulatedGridStyle}>
                  {/* HERO */}
                  <BentoGridItem
                    tier="hero"
                    style={getSimulatedItemStyle('hero')}
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

                  {/* FEATURE */}
                  <BentoGridItem
                    tier="feature"
                    variant="spotlight"
                    icon={<Sparkles className="size-4 text-primary" />}
                    title="Spotlight Hover Lift"
                    description="Card này minh họa radial-gradient chạy theo con trỏ chuột."
                    minHeight={340}
                    style={getSimulatedItemStyle('feature')}
                  >
                    <div className="my-2 rounded-lg border border-primary/10 bg-primary/5 p-2.5 text-center text-[10px]">
                      <p className="font-medium text-primary">Bản dùng thử Spotlight</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        Rà chuột qua card để thấy đèn phát sáng.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Code className="size-3" />
                      <span>
                        Dùng <code>CardSpotlight</code> wrapper
                      </span>
                    </div>
                  </BentoGridItem>

                  {/* METRIC */}
                  <BentoGridItem
                    tier="metric"
                    style={getSimulatedItemStyle('metric')}
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
                    tier="metric"
                    style={getSimulatedItemStyle('metric')}
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
                    style={getSimulatedItemStyle('full')}
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
                <code>hero</code> và <code>feature</code> hạ cấp chiếm trọn 6 cột, còn các ô{' '}
                <code>metric</code> xếp gọn nửa chiều rộng (3 cột). Ở{' '}
                <strong className="text-foreground">Mobile</strong>, toàn bộ xếp chồng 1 cột. Không cần
                viết class responsive thủ công.
              </p>
            </CardWell>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
