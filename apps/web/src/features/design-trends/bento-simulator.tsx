'use client';

import { cn } from '@/shared/lib/utils';
import * as React from 'react';

import { Badge } from '@pumni/ui/feedback';
import { Button } from '@pumni/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardWell,
  IconBadge,
} from '@pumni/ui/layout';
import { BentoGrid, BentoGridItem } from '@pumni/ui/os';
import {
  ChevronRight,
  Code,
  Copy,
  Gauge,
  Laptop,
  LayoutGrid,
  Palette,
  Smartphone,
  Sparkles,
  Tablet,
  Timer,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * BentoSimulator — a faithful, non-faked bento grid preview.
 *
 * The earlier version simulated tablet/mobile by hand-rolling per-item
 * `gridColumn: 'span N'` overrides. That fought the tier system (the inline
 * spans won and the `tier` prop became meaningless) and faked responsive
 * behaviour instead of exercising it. BentoGrid is now a **container-query**
 * grid (`@container/bento`), so this simulator's job got simpler: clamp the
 * preview viewport to a real width and the grid collapses 12 → 6 → 1 columns on
 * its own — the same code path production takes when nested in a sidebar,
 * dialog, or OS Window narrower than the viewport.
 *
 * `rowHeight` opts the grid into the bento math (`grid-auto-rows: minmax(Npx,
 * auto)`), so the `row-span-2` tiers (hero/feature) read as exactly twice a
 * metric row — the proportional "hộp cơm" ratios that distinguish a bento grid
 * from a generic CSS grid. The `auto` ceiling lets dense content (the full-width
 * log table) grow past the floor without clipping.
 */

type Breakpoint = 'desktop' | 'tablet' | 'mobile';

const bentoGridRecipeCode = `import { BentoGrid, BentoGridItem } from '@pumni/ui/os';

export default function MyBento() {
  return (
    <BentoGrid rowHeight={140}>
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

// Floor height of each implicit grid row (px). With it, row-span-2 tiers
// (hero/feature) span exactly two tracks — the proportional bento ratio.
const ROW_HEIGHT = 140;

// The preview viewport is clamped to a real width. Because BentoGrid is now a
// container-query (`@container/bento`), clamping its width directly drives
// the 1 → 6 → 12 column collapse — the SAME code path production takes when
// nested in a narrow sidebar/dialog. No faked per-item spans, no viewport
// tricks: this is the real container-query responsive behaviour.
const BREAKPOINT_MAX_WIDTH: Record<Breakpoint, string> = {
  desktop: '100%',
  tablet: '700px',
  mobile: '360px',
};

// Container-query class labels (mirror BentoGrid's internal breakpoints) so the
// badge teaches the real mechanism, not the legacy viewport variant.
const BREAKPOINT_BADGE: Record<Breakpoint, string> = {
  desktop: '@[64rem]/bento:grid-cols-12',
  tablet: '@[40rem]/bento:grid-cols-6',
  mobile: 'grid-cols-1',
};

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
              Bento Grid lấy cảm hứng từ hộp cơm Nhật Bản, chia không gian thành các ô chữ nhật tỉ
              lệ cân đối. Trong Pumni OS, <code>BentoGridItem</code> chỉ chịu layout (spanning) và
              render qua <code>Card</code> / <code>CardWell</code> — không tự hand-roll surface.
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
            <p className="type-caption text-muted-foreground italic">
              💡 Responsive: grid tự ép về 6 cột ở Tablet và xếp dọc 1 cột ở Mobile, bảo toàn nội
              dung. Ô <code>hero</code>/<code>feature</code> cao đúng 2 hàng metric nhờ{' '}
              <code>rowHeight</code>.
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
            <pre className="max-h-52 overflow-x-auto rounded-b-xl border-t bg-muted p-3 font-mono text-xs text-muted-foreground">
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
            {/* The preview viewport is a real width-clamped container, not a
                faked span override. BentoGrid's own cascade handles 12→6→1. */}
            <div
              className="mx-auto overflow-hidden rounded-xl border bg-background shadow-sm transition-[max-width] duration-(--duration-slower) ease-snappy"
              style={{ maxWidth: BREAKPOINT_MAX_WIDTH[simulatedBreakpoint] }}
            >
              {/* Viewport Address Bar Chrome */}
              <div className="flex items-center gap-2 border-b bg-muted px-4 py-2 text-xs text-muted-foreground">
                <div className="flex gap-1.5">
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                </div>
                <div className="mx-auto rounded-md border bg-background px-8 py-0.5 font-mono text-xs select-none">
                  pumni.os/dashboard?view={simulatedBreakpoint}
                </div>
              </div>

              {/* Simulated Page Content Area */}
              <div className="space-y-4 bg-muted p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground">
                    MẶT BẰNG GRID{' '}
                    <span className="font-mono text-xs text-foreground/60">
                      ({BREAKPOINT_BADGE[simulatedBreakpoint]})
                    </span>
                  </h4>
                  <Badge tone="neutral" size="sm">
                    {BREAKPOINT_BADGE[simulatedBreakpoint]}
                  </Badge>
                </div>

                {/* No per-item span overrides: tier + rowHeight drive layout. */}
                <BentoGrid rowHeight={ROW_HEIGHT}>
                  {/* HERO */}
                  <BentoGridItem
                    tier="hero"
                    icon={<Gauge className="size-4" />}
                    title="Thông số Hệ thống OS"
                    description="Báo cáo hiệu suất nhân CPU và tốc độ đọc ghi IO."
                  >
                    <CardWell padding="sm" radius="lg" className="my-1 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>V8 Engine Performance</span>
                        <span className="font-semibold text-primary">99.8%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                        <div className="h-full rounded-full bg-primary" style={{ width: '85%' }} />
                      </div>
                      <div className="flex justify-between gap-4 text-xs text-muted-foreground">
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
                        className="h-7 px-2 text-xs"
                        onClick={() => toast.info('Click sự kiện mẫu của Bento hero tile!')}
                      >
                        Chi tiết <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </BentoGridItem>

                  {/* FEATURE — spotlight variant demo */}
                  <BentoGridItem
                    tier="feature"
                    variant="spotlight"
                    icon={<Sparkles className="size-4" />}
                    title="Spotlight Hover Lift"
                    description="Card này minh họa radial-gradient chạy theo con trỏ chuột."
                  >
                    <CardWell padding="sm" radius="lg" className="my-2 text-center">
                      <p className="text-xs font-medium text-primary">Bản dùng thử Spotlight</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Rà chuột qua card để thấy đèn phát sáng.
                      </p>
                    </CardWell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Code className="size-3" />
                      <span>
                        Dùng <code>variant=&quot;spotlight&quot;</code>
                      </span>
                    </div>
                  </BentoGridItem>

                  {/* METRIC */}
                  <BentoGridItem
                    tier="metric"
                    ariaLabel={`${userCount.toLocaleString()} người dùng đang hoạt động`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="text-xs font-medium text-muted-foreground uppercase">
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
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Tải thực tế mỗi 4 giây
                      </div>
                    </div>
                  </BentoGridItem>

                  {/* METRIC — Accent Tonal controller */}
                  <BentoGridItem
                    tier="metric"
                    icon={<Palette className="size-4" />}
                    title="Accent Tonal"
                  >
                    <div className="my-1 flex gap-1.5">
                      {(
                        [
                          ['primary', 'bg-primary'],
                          ['chart', 'bg-chart'],
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
                              ? 'scale-110 ring-2 ring-ring ring-offset-2'
                              : 'scale-90 opacity-70',
                          )}
                          aria-label={`Đổi accent sang ${color}`}
                        />
                      ))}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      Hệ màu:{' '}
                      <span className="font-semibold text-foreground capitalize">
                        {accentColor}
                      </span>
                    </div>
                  </BentoGridItem>

                  {/* ACCENT — the 2-col CTA tier (completes all 5 tiers) */}
                  <BentoGridItem
                    tier="accent"
                    icon={<LayoutGrid className="size-4" />}
                    title="Quick Add"
                  >
                    <div className="flex flex-1 items-end">
                        <Button
                        size="xs"
                        variant="outline"
                        className="h-6 w-full px-2 text-xs"
                        onClick={() => toast.success('Đã thêm tile mẫu!')}
                      >
                        <Code className="size-3" /> + Tile
                      </Button>
                    </div>
                  </BentoGridItem>

                  {/* ACCENT — second shortcut tile */}
                  <BentoGridItem tier="accent" title="Export">
                    <div className="truncate text-xs text-muted-foreground">
                      Phím tắt bento · 2 cột
                    </div>
                  </BentoGridItem>

                  {/* FULL-WIDTH TABLE LOGS */}
                  <BentoGridItem
                    tier="full"
                    title="Full Tile (12-Col) — Bảng Nhật Ký"
                    description="Tự động trải rộng toàn trang ở mọi chế độ."
                  >
                    <div className="my-2 space-y-1 font-mono text-xs text-muted-foreground">
                      <div className="flex justify-between border-b border-border pb-0.5">
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
                <IconBadge size="sm" tone="primary-soft" aria-hidden>
                  <Sparkles className="size-3.5" />
                </IconBadge>
                Giải thích spanning:
              </h5>
              <p className="leading-relaxed text-muted-foreground">
                Khung xem trước được kẹp theo{' '}
                <strong className="text-foreground">chiều rộng thật</strong> của từng breakpoint. Vì{' '}
                <code>BentoGrid</code> giờ là grid theo{' '}
                <strong className="text-foreground">container query</strong> (
                <code>@container/bento</code>), nó tự thu 12 → 6 → 1 cột dựa trên chiều rộng của
                chính nó — y hệt khi đặt trong sidebar hay dialog hẹp ngoài production. Ô{' '}
                <code>hero</code>/<code>feature</code> cao đúng 2 lần <code>metric</code> nhờ{' '}
                <code>rowHeight={'{140}'}</code> tạo track cố định (bento math).
              </p>
            </CardWell>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
