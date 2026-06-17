import type { Metadata } from 'next';
import {
  BookOpen,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Zap,
  Globe,
  Activity,
  FlaskConical,
  Database,
  Route,
  Settings,
  Gauge,
  Bug,
  Timer,
  TestTubes,
  X,
  Check,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from '@pumni/ui';
import { SectionNav } from './section-nav';

export const metadata: Metadata = {
  title: 'Next.js 16.2.9 Ecosystem',
  description:
    'Phân tích chuyên sâu về hệ sinh thái Next.js 16.2.9 — LTS, Proxy, Caching, React Compiler, Turbopack, AI Integration & Build Adapters.',
};

// ──────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────
function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="scroll-mt-28" />;
}

// ── InfoBox variants ──
function InfoBox({
  label,
  children,
  variant = 'default',
}: {
  label: string;
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'before' | 'after';
}) {
  const variants = {
    default: 'border',
    highlight: 'border-primary/20 bg-primary/5',
    before: 'border-destructive/20 bg-destructive/5',
    after: 'border-emerald-500/20 bg-emerald-500/5',
  };
  return (
    <div className={`space-y-2 rounded-md ${variants[variant]} p-3`}>
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

// ── Callout / blockquote ──
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-4 border-primary/60 bg-muted/40 px-4 py-3 text-muted-foreground italic">
      {children}
    </blockquote>
  );
}

// ── Code block ──
function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-muted/60 px-3 py-2 text-sm">
      <code>{code}</code>
    </pre>
  );
}

// ── Stat card for metrics bar ──
function StatCard({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// ── Section header ──
function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="size-5 shrink-0 text-primary" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// ── LTS Timeline ──
function LTSTimeline() {
  const milestones = [
    { version: 'v14', label: 'Next.js 14', date: 'EOL 10/2025', status: 'eol' as const },
    { version: 'v15', label: 'Next.js 15', date: 'EOL 21/10/2026', status: 'eol' as const },
    { version: 'v16.2.9', label: 'Next.js 16.2.9', date: 'LTS — Active', status: 'active' as const },
  ];

  return (
    <div className="relative flex w-full items-start justify-between">
      {/* Gradient timeline line — invisible under nodes, visible between them */}
      <div className="absolute top-5 inset-x-4 h-[2px] rounded-full bg-gradient-to-r from-border via-border to-primary/40" />

      {milestones.map((m) => (
        <div key={m.version} className="relative z-10 flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200',
              m.status === 'active'
                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                : 'border-muted-foreground/30 bg-muted text-muted-foreground',
            )}
          >
            {m.version.split('.')[0]}
          </div>
          <div>
            <div className="text-sm font-semibold">{m.label}</div>
            <div
              className={cn(
                'text-xs',
                m.status === 'active' ? 'font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              {m.date}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────
// PAGE
// ──────────────────────────────────────────
export default function NextjsEcosystemPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6">
      {/* ── Hero ── */}
      <div className="space-y-4">
        <h1 className="text-gradient-brand text-3xl font-bold tracking-tight">
          Next.js 16.2.9 Ecosystem
        </h1>
        <p className="text-muted-foreground">
          Báo cáo nghiên cứu chuyên sâu về kiến trúc, hiệu năng và hệ sinh thái của
          phiên bản LTS ra mắt ngày 09/06/2026.
        </p>

        {/* ── Key Metrics Bar ── */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value="~400%" label="next dev nhanh hơn phiên bản cũ" icon={Gauge} />
          <StatCard value="200+" label="bug fixes cho Turbopack trong 16.2.9" icon={Bug} />
          <StatCard value="25–60%" label="giảm thời gian RSC render HTML" icon={Timer} />
          <StatCard value="9,000+" label="E2E tests chuẩn hóa cho Adapters" icon={TestTubes} />
        </div>
      </div>

      {/* ── Sticky Section Nav ── */}
      <SectionNav />

      {/* ══════════════════════════════════════
          SECTION: TỔNG QUAN
          ══════════════════════════════════════ */}
      <SectionAnchor id="overview" />
      <section className="space-y-6">
        <SectionHeader
          icon={BookOpen}
          title="Bối Cảnh Phiên Bản & Chu Kỳ Sống (LTS)"
          description="Next.js 14 đã EOL từ 10/2025. Next.js 15 sẽ EOL vào 21/10/2026. Phiên bản 16.2.9 là nhánh LTS chiến lược, tương thích React 19.2 và Node.js 20.9.0."
        />

        <Card>
          <CardContent className="space-y-4 pt-6">
            <LTSTimeline />
            <Separator />
            <div className="space-y-2 text-base">
              <p>
                Lịch sử phát triển Next.js tuân theo mô hình semantic versioning,
                với các bản phát hành chính đi kèm cam kết hỗ trợ bảo mật dài hạn
                (LTS). Phiên bản 16.2.9 hội tụ toàn bộ các bản vá bảo mật quan
                trọng từ đầu năm 2026 và cung cấp một nền tảng ổn định cho các tổ
                chức doanh nghiệp.
              </p>
              <p>
                Nhánh LTS 16.2.9 cho phép các nhóm kỹ sư nền tảng có đủ thời gian
                đại tu kiến trúc mà không lo API thay đổi đột ngột — yếu tố then
                chốt cho các hệ thống vận hành quan trọng.
              </p>
            </div>
            <Callout>
              Phiên bản 16.2.9 nổi lên như một bến đỗ an toàn và chiến lược cho
              các tổ chức doanh nghiệp, kế thừa các bản vá bảo mật quan trọng và
              cung cấp nền tảng ổn định tương thích React 19.2 và Node.js 20.9.0.
            </Callout>
          </CardContent>
        </Card>

        {/* Conclusion */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-6">
          <h2 className="text-xl font-bold">Tổng Kết</h2>
          <p className="text-muted-foreground">
            Next.js 16.2.9 đánh dấu kỷ nguyên trưởng thành — nơi ranh giới giữa
            máy khách, biên mạng và máy chủ được xác định tường minh bằng cấu
            trúc toán học thay vì phép thử sai ngầm định. Với React Compiler,
            Turbopack, Cache Components và AI DevTools MCP, nó trở thành công cụ
            công nghiệp hạng nặng. Build Adapters API khôi phục tính độc lập nền
            tảng, chấm dứt tình trạng độc quyền.
          </p>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════
          SECTION: KIẾN TRÚC LÕI
          ══════════════════════════════════════ */}
      <SectionAnchor id="architecture" />
      <section className="space-y-8">
        {/* ── Proxy vs Middleware ── */}
        <div>
          <SectionHeader
            icon={ShieldCheck}
            title="Kiến Trúc Mạng: Từ Middleware Sang Proxy"
            description="proxy.ts thay thế hoàn toàn middleware.ts với vai trò Reverse Proxy thuần túy trên Node.js runtime — thiết lập kiến trúc &ldquo;defense in depth&rdquo;."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <Tabs defaultValue="middleware">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="middleware" className="gap-1.5">
                    <X className="size-3.5 text-destructive" />
                    Before: middleware.ts
                  </TabsTrigger>
                  <TabsTrigger value="proxy" className="gap-1.5">
                    <Check className="size-3.5 text-emerald-500" />
                    After: proxy.ts
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="middleware" className="space-y-2 rounded-md border-destructive/20 bg-destructive/5 p-4">
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Dễ lạm dụng cho business logic, DB queries, phân quyền (RBAC).</li>
                    <li>Giới hạn thời gian thực thi tại Edge Runtime.</li>
                    <li>Rủi ro auth bypass nghiêm trọng do rò rỉ ranh giới bảo mật.</li>
                  </ul>
                </TabsContent>
                <TabsContent value="proxy" className="space-y-2 rounded-md border-emerald-500/20 bg-emerald-500/5 p-4">
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Chỉ đảm nhiệm redirects dựa trên cookie, header manipulation, A/B testing.</li>
                    <li>Hoạt động trên Node.js runtime thay vì Edge.</li>
                    <li>Xác thực &amp; phân quyền bắt buộc ở Server Components/Actions.</li>
                  </ul>
                </TabsContent>
              </Tabs>
              <Callout>
                Mọi hàm truy cập dữ liệu cấp yêu cầu (<code>cookies()</code>,{' '}
                <code>headers()</code>, <code>draftMode()</code>, <code>params</code>,{' '}
                <code>searchParams</code>) giờ chỉ dùng qua <strong>async</strong> —
                nền tảng bắt buộc để <strong>Partial Prerendering (PPR)</strong> hoạt động,
                phục vụ static shell ngay lập tức trong khi chờ dữ liệu cá nhân hóa.
              </Callout>
            </CardContent>
          </Card>
        </div>

        {/* ── Caching ── */}
        <div>
          <SectionHeader
            icon={Layers}
            title="Hệ Thống Bộ Nhớ Đệm Tường Minh"
            description='Chuyển từ caching ngầm định sang "opt-in" với "use cache", cacheLife() và khả năng mở rộng qua "use cache: remote".'
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Cơ chế cũ (Trước 16.x)" variant="before">
                  <ul className="list-inside list-disc space-y-1">
                    <li><code>export const revalidate = 3600</code> — cấu hình cấp phân đoạn.</li>
                    <li>Caching ngầm định qua <code>fetch()</code> tùy chỉnh.</li>
                    <li><code>dynamic = &quot;force-static&quot;</code> và <code>fetchCache</code> đã bị loại bỏ hoàn toàn.</li>
                    <li>Dễ dẫn đến dữ liệu kẹt cache không rõ nguyên nhân.</li>
                  </ul>
                </InfoBox>
                <InfoBox label="Kiến trúc mới (16.2.9)" variant="after">
                  <ul className="list-inside list-disc space-y-1">
                    <li>Mặc định <strong>dynamic</strong> cho mọi route.</li>
                    <li><code>&quot;use cache&quot;</code> ở cấp hàm hoặc cấp UI.</li>
                    <li>Compiler tự động tạo cache key từ arguments &amp; closures.</li>
                    <li><code>cacheLife()</code> profiles: <code>&apos;max&apos;</code>, <code>&apos;hours&apos;</code>, <code>&apos;days&apos;</code>.</li>
                    <li><code>&quot;use cache: remote&quot;</code> cho Redis — giải quyết hit rate thấp trong serverless đa máy chủ.</li>
                  </ul>
                </InfoBox>
              </div>

              <div className="space-y-3">
                <InfoBox label="updateTag() — read-your-own-writes">
                  <p>Thiết kế độc quyền cho Server Actions. Xóa ngay mục cache cũ khi người dùng gửi form, buộc request tiếp theo truy xuất dữ liệu mới nhất từ DB.</p>
                </InfoBox>
                <InfoBox label="revalidateTag() — Stale-While-Revalidate">
                  <p>Bắt buộc tham số thứ hai là cacheLife profile. Lý tưởng cho Route Handlers kích hoạt qua webhook từ CMS. Phục vụ phiên bản tĩnh cũ với tốc độ tối đa, đồng thời tái tạo HTML mới ở chế độ nền.</p>
                </InfoBox>
                <InfoBox label="refresh() — Client components">
                  <p>API mới cho client components, tải lại các thành phần bộ định tuyến khách mà không can thiệp vào tầng cache máy chủ.</p>
                </InfoBox>
              </div>

              <CodeBlock code={`// Old: implicit fetch caching
export const revalidate = 3600;

// New: explicit "use cache" with cacheLife
"use cache";
cacheLife('hours');

// Remote cache for multi-host deployments
"use cache: remote";
cacheLife('max');`} />
            </CardContent>
          </Card>
        </div>

        {/* ── React Compiler ── */}
        <div>
          <SectionHeader
            icon={Cpu}
            title="React Compiler &amp; Tự Động Hóa Bộ Nhớ"
            description='Tích hợp React Compiler (Babel transform) — thuật toán "Forget" tự động tối ưu useMemo/useCallback tại build-time dựa trên escape analysis.'
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-base">
                Kích hoạt qua <code>reactCompiler: true</code> trong <code>next.config.ts</code>.
                Thuật toán &ldquo;Forget&rdquo; thực hiện escape analysis tương tự cơ chế tối ưu
                cấp thấp của V8 engine. Nếu cấu trúc tuân thủ React Rules, compiler tự động tiêm{' '}
                <code>useMemo</code> và <code>useCallback</code> tương đương.
              </p>

              <Callout>
                Hệ quả: loại bỏ hoàn toàn dependency arrays viết tay — nguyên nhân cốt lõi gây ra
                infinite re-renders và memory leaks.
              </Callout>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Hiệu quả" variant="after">
                  <p>Giảm 20–40% re-renders trong analytics dashboards và danh sách dữ liệu thời gian thực.</p>
                </InfoBox>
                <InfoBox label="Đánh đổi">
                  <p>Build time tăng nhẹ — dịch chuyển gánh nặng tính toán từ runtime của người dùng sang build-time.</p>
                </InfoBox>
              </div>

              <CodeBlock code={`// next.config.ts
const nextConfig = {
  reactCompiler: true,
};

export default nextConfig;`} />
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════
          SECTION: HIỆU NĂNG
          ══════════════════════════════════════ */}
      <SectionAnchor id="performance" />
      <section className="space-y-8">
        {/* ── View Transitions ── */}
        <div>
          <SectionHeader
            icon={Activity}
            title="Đổi Mới Trải Nghiệm Giao Diện"
            description="View Transitions API nguyên bản với Shared Element Morphing và thành phần &lt;Activity&gt; duy trì trạng thái nền."
          />

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="View Transitions" variant="highlight">
                  <ul className="list-inside list-disc space-y-1">
                    <li><code>&lt;Link&gt;</code> hỗ trợ <code>transitionTypes</code> (<code>slide-forward</code>, <code>slide-back</code>).</li>
                    <li><code>&lt;ViewTransition name=&quot;id&quot; share=&quot;morph&quot;&gt;</code> cho Shared Element Morphing.</li>
                    <li>Trình duyệt tự động nội suy điểm ảnh, kích thước, vị trí qua <code>::view-transition-group</code> trong 400ms.</li>
                    <li>Mang lại cảm giác native app trên nền web.</li>
                  </ul>
                </InfoBox>
                <InfoBox label="&lt;Activity&gt;">
                  <ul className="list-inside list-disc space-y-1">
                    <li>Ẩn giao diện qua <code>display: none</code> thay vì unmount DOM.</li>
                    <li>Khi quay lại: form inputs, trạng thái biểu mẫu, vị trí cuộn được phục hồi ngay.</li>
                    <li>Yêu cầu thiết kế cleanup effects cẩn thận cho dialogs và dropdowns.</li>
                  </ul>
                </InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Turbopack & RSC ── */}
        <div>
          <SectionHeader
            icon={Zap}
            title="Turbopack &amp; Giải Mã RSC Payload"
            description="Turbopack (Rust) là trình đóng gói mặc định. Quy trình giải mã RSC Payload được tối ưu bằng quy trình 2 bước C++/JS — giảm 25–60% thời gian render HTML."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Turbopack" variant="highlight">
                  <ul className="list-inside list-disc space-y-1">
                    <li><strong>next dev</strong> nhanh hơn ~400% so với phiên bản cũ, ~87% so với 16.1.x.</li>
                    <li>Server Fast Refresh: chỉ thực thi lại module cụ thể, giảm 100% biên dịch lại toàn cục.</li>
                    <li>200+ bug fixes: Base38 hash, SRI, Web Worker origin, tree-shaking dynamic imports.</li>
                  </ul>
                </InfoBox>
                <InfoBox label="RSC Deserialization" variant="highlight">
                  <p>
                    <strong>Quy trình 2 bước đột phá:</strong> Trước đây, reviver callback của{' '}
                    <code>JSON.parse</code> buộc V8 nhảy C++ ↔ JS cho từng cặp key-value. Giải pháp mới:
                    dùng <code>JSON.parse()</code> thuần C++ tạo đối tượng gốc, rồi duyệt đệ quy JS xử lý nội suy.
                  </p>
                  <p className="mt-2">
                    Kết quả: Payload CMS rich text giảm từ <strong>52ms → 33ms</strong>.
                  </p>
                </InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Routing & Prefetching ── */}
        <div>
          <SectionHeader
            icon={Route}
            title="Định Tuyến &amp; Tìm Nạp Trước Thông Minh"
            description="Layout Deduplication và Incremental Prefetching — tối ưu băng thông và phản ứng thông minh với hành vi người dùng."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Khử Trùng Lặp Cấu Trúc">
                  <p>Khi duyệt danh sách 50 sản phẩm có chung layout nền, trình duyệt chỉ tải thành phần chia sẻ <strong>đúng một lần</strong> thay vì tải lại cho mỗi liên kết.</p>
                </InfoBox>
                <InfoBox label="Tìm Nạp Trước Tăng Dần" variant="highlight">
                  <p>Viewport-aware: chỉ lấy phân đoạn chưa có trong bộ đệm. Khi liên kết bị cuộn khỏi tầm nhìn, <strong>hủy ngay</strong> luồng mạng. Tiếp tục tìm nạp ưu tiên khi <strong>hover</strong>.</p>
                </InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════
          SECTION: BẢO MẬT & VẬN HÀNH
          ══════════════════════════════════════ */}
      <SectionAnchor id="security" />
      <section className="space-y-8">
        {/* ── Security & after() ── */}
        <div>
          <SectionHeader
            icon={ShieldAlert}
            title="An Ninh Kiến Trúc &amp; API after()"
            description="Củng cố bảo mật với các CVE đã vá, mô hình 3 lớp phòng ngự cho Server Actions, và API after() cho tác vụ nền không chặn TTFB."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="CVE đã vá" variant="before">
                  <ul className="list-inside list-disc space-y-1">
                    <li><strong>CVE-2026-23870</strong> (React2Shell): RCE trong RSC protocol.</li>
                    <li><strong>CVE-2025-66478</strong>: DoS + auth bypass qua segment-prefetch URL và dynamic route injection.</li>
                  </ul>
                </InfoBox>
                <InfoBox label="API after()" variant="after">
                  <ul className="list-inside list-disc space-y-1">
                    <li>Chạy background tasks sau khi HTML/stream đã gửi — không tăng TTFB.</li>
                    <li>Liên kết với RequestContext: vẫn truy cập được cookies và headers.</li>
                    <li>Kết hợp <code>&lt;Suspense&gt;</code> + PPR: giám sát quy mô lớn, tàng hình trước client.</li>
                  </ul>
                </InfoBox>
              </div>

              <Callout>
                Mỗi Server Action phải triển khai <strong>3 lớp phòng ngự</strong>:{' '}
                (1) Identity — kiểm tra danh tính qua phiên làm việc,{' '}
                (2) Ownership — xác thực quyền sở hữu tài nguyên,{' '}
                (3) Input Validation — thẩm định đầu vào qua Zod. Việc phó thác an toàn cho
                proxy.ts được xem là thực tiễn lỗi thời.
              </Callout>
            </CardContent>
          </Card>
        </div>

        {/* ── Build Adapters ── */}
        <div>
          <SectionHeader
            icon={Globe}
            title="Tính Khả Chuyển Nền Tảng &amp; Build Adapters API"
            description="Khôi phục tính độc lập nền tảng thông qua API chuẩn sau khi next build hoàn tất, dưới sự bảo trợ của Ecosystem Working Group."
          />

          <Card>
            <CardContent className="space-y-3 pt-6">
              <p>
                Sau <code>next build</code>, siêu dữ liệu đa hình (routes, cache
                rules, static assets) được xuất ra. Các nền tảng viết Adapter qua{' '}
                <code>modifyConfig</code> và <code>onBuildComplete</code>. Vercel
                cung cấp hơn 9.000 E2E tests làm chuẩn xác minh — adapter phải
                open-source và vượt qua toàn bộ phổ kiểm thử để đạt chứng nhận
                &quot;Verified Adapter&quot;.
              </p>
              <Callout>
                Ecosystem Working Group: Vercel, Netlify, AWS, Cloudflare, Google
                Cloud. Các nỗ lực như OpenNext trước đây phải reverse-engineer; giờ
                mọi thứ được chuẩn hóa công khai, đảm bảo PPR và revalidateTag hoạt
                động nhất quán trên mọi nền tảng.
              </Callout>
            </CardContent>
          </Card>
        </div>

        {/* ── System Changes ── */}
        <div>
          <SectionHeader
            icon={Settings}
            title="Thay Đổi Hành Vi &amp; Cấu Hình Hệ Thống"
            description="Các thay đổi mặc định quan trọng trong 16.2.9 — ESLint Flat Config, tối ưu hóa hình ảnh, lockfile, và công cụ gỡ lỗi."
          />

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-3 md:grid-cols-2">
                <InfoBox label="ESLint">
                  <p>Chuyển sang <strong>ESLint Flat Config</strong> (v10), loại bỏ kiến trúc xếp tầng cũ gây rò rỉ quy tắc kiểm định mã.</p>
                </InfoBox>
                <InfoBox label="Output Dirs">
                  <p>Thư mục riêng biệt cho <code>next dev</code> và <code>next build</code>, ngăn xung đột dữ liệu tĩnh/động.</p>
                </InfoBox>
                <InfoBox label="Tối ưu Hình ảnh">
                  <p><code>minimumCacheTTL</code>: 60s → <strong>4 giờ</strong>. <code>qualities: [75]</code>. <code>dangerouslyAllowLocalIP: false</code> (chống SSRF).</p>
                </InfoBox>
                <InfoBox label="Lockfile &amp; Gỡ lỗi">
                  <p>Khóa phiên ngăn concurrent dev/build. <code>--inspect</code> cho <code>next start</code>. Hydration Diff Indicator trực quan.</p>
                </InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════
          SECTION: HỆ SINH THÁI
          ══════════════════════════════════════ */}
      <SectionAnchor id="ecosystem" />
      <section className="space-y-8">
        {/* ── AI & MCP ── */}
        <div>
          <SectionHeader
            icon={FlaskConical}
            title="AI &amp; Model Context Protocol (MCP)"
            description="Next.js DevTools MCP tạo đường ống hai chiều giữa máy chủ phát triển và AI Trợ lý — biến AI thành một phần của quy trình runtime."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p>
                Thông qua <code>.mcp.json</code> và máy chủ <code>next-devtools-mcp</code> độc lập, AI có thể:
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <InfoBox label="get_errors / get_logs" variant="highlight">
                  <p>Luồng dữ liệu thời gian thực về lỗi biên dịch, dấu vết ngăn xếp. AI tự động đọc lỗi từ terminal và khắc phục.</p>
                </InfoBox>
                <InfoBox label="get_page_metadata" variant="highlight">
                  <p>Quét cấu trúc định tuyến, đánh giá rủi ro phân quyền Server Action, xác định ranh giới App Router/Pages Router.</p>
                </InfoBox>
                <InfoBox label="browser_eval / bundle.analyze" variant="highlight">
                  <p>Giả lập tương tác trình duyệt qua Playwright, đánh giá bundle size.</p>
                </InfoBox>
              </div>
              <Callout>
                Từ 16.2.9, <code>create-next-app</code> tự động sinh <code>AGENTS.md</code> —
                hướng dẫn AI tuân thủ quy ước Next.js 16 (dùng <code>proxy.ts</code>, bỏ API đồng bộ),
                chấm dứt tình trạng AI &ldquo;ảo giác&rdquo; code của Next.js 13 hay 14.
                Next.js trở thành khung phần mềm đầu tiên được thiết kế nguyên bản cho kỷ nguyên
                lập trình bằng trợ lý tự động.
              </Callout>
            </CardContent>
          </Card>
        </div>

        {/* ── ORMs, Auth, Tailwind ── */}
        <div>
          <SectionHeader
            icon={Database}
            title="Hệ Sinh Thái Mở Rộng: ORMs, Auth, Tailwind v4"
            description="Tích hợp sâu với Prisma v7, Drizzle ORM, Auth.js v5, Better Auth, Clerk và Tailwind CSS v4 — cùng những điểm cần lưu ý khi dùng chung với Turbopack."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <InfoBox label="Lớp Dữ Liệu">
                <ul className="list-inside list-disc space-y-1">
                  <li><strong>Prisma v7:</strong> Kiến trúc driver-adapters. Cần <code>serverExternalPackages: [&apos;@prisma/client&apos;, &apos;pg&apos;]</code> để tương thích Turbopack. Tích hợp Prisma Postgres qua Vercel Marketplace với Connection Pooling.</li>
                  <li><strong>Drizzle ORM:</strong> ESM native, tương thích hoàn hảo với Turbopack. <code>__drizzle_migrations</code> — cơ chế bảo toàn bảng cái khi di cư giữa các provider (Neon → Supabase).</li>
                </ul>
              </InfoBox>

              <InfoBox label="Xác Thực &amp; Phân Quyền">
                <ul className="list-inside list-disc space-y-1">
                  <li><strong>Auth.js v5:</strong> Split config pattern qua <code>auth.config.ts</code> — cô lập Prisma Adapter ở server routes.</li>
                  <li><strong>Better Auth:</strong> Trả 100% quyền sở hữu session tables cho chủ hạ tầng. Giải pháp ưu việt cho B2B/SaaS.</li>
                  <li><strong>Clerk:</strong> Tích hợp nhanh nhất nhưng mang rủi ro vendor lock-in.</li>
                  <li><strong>RBAC:</strong> Xây dựng hàm bảo vệ tĩnh <code>requireRole(&quot;ADMIN&quot;)</code>, áp đặt ở đầu mọi Server Action — không phụ thuộc proxy.ts.</li>
                </ul>
              </InfoBox>

              <InfoBox label="Tailwind CSS v4 &amp; Tương Thích Turbopack">
                <ul className="list-inside list-disc space-y-1">
                  <li><strong>CSS-Native Configuration:</strong> Token hệ thống khai báo qua <code>@theme</code> trong CSS toàn cục, không cần tệp JS.</li>
                  <li><strong>Core Rust Engine:</strong> Biên dịch nhanh hơn 5x, khởi động dưới 100ms.</li>
                  <li><strong>Cảnh báo:</strong> Trình quét JIT đôi khi bỏ lỡ arbitrary value classes (<code>h-[80vh]</code>, <code>z-[100]</code>) khi dùng với Turbopack. Workaround: React Inline Styles + <code>@source &quot;tailwind-safelist.txt&quot;</code>.</li>
                </ul>
              </InfoBox>

              <CodeBlock code={`// next.config.ts — Prisma + Turbopack
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'pg'],
};

// auth.config.ts — Auth.js v5 split config
export const authConfig = {
  providers: [/* ... */],
  // DB adapter isolated in server-only routes
};`} />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}