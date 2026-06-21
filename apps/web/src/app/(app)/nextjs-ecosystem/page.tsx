import type { Metadata } from 'next';
import {
  BookOpen,
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
  AlertTriangle,
  RefreshCw,
  Terminal,
  ArrowRightLeft,
  Lock,
  HardDrive,
  Eye,
  Wrench,
  Layers,
} from 'lucide-react';
import { Card, CardContent, Separator, cn } from '@pumni/ui';
import { EcosystemSectionNav } from './section-nav';

export const metadata: Metadata = {
  title: 'Next.js 16.2.9 Ecosystem',
  description:
    'Phân tích chuyên sâu về hệ sinh thái Next.js 16.2.9 LTS — Proxy, Explicit Caching, Turbopack, React Compiler, AI Integration, Build Adapters & Production Warnings.',
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
  variant?: 'default' | 'highlight' | 'warning' | 'info';
}) {
  const variants = {
    default: 'border border-border',
    highlight: 'border border-border bg-primary/10',
    warning: 'border border-border bg-warning/10',
    info: 'border border-border bg-accent',
  };
  return (
    <div className={`space-y-2 rounded-md ${variants[variant]} p-3`}>
      <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}

// ── Callout / blockquote ──
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-primary bg-muted px-4 py-3 text-muted-foreground italic">
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
    {
      version: 'v16.2.9',
      label: 'Next.js 16.2.9',
      date: 'LTS — Active',
      status: 'active' as const,
    },
  ];

  return (
    <div className="relative flex w-full items-start justify-between">
      {/* Gradient timeline line */}
      <div className="absolute inset-x-4 top-5 h-0.5 rounded-full bg-linear-to-r from-border via-border to-primary/40" />

      {milestones.map((m) => (
        <div key={m.version} className="relative z-10 flex flex-col items-center gap-2 text-center">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-(--duration-base)',
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
          Báo cáo nghiên cứu chuyên sâu về kiến trúc, hiệu năng và hệ sinh thái của phiên bản LTS —
          từ Explicit Caching, Turbopack, AI Agent Integration đến cảnh báo sản xuất.
        </p>

        {/* ── Key Metrics Bar ── */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value="900%" label="Server Fast Refresh compile time" icon={Timer} />
          <StatCard value="25–60%" label="giảm thời gian RSC deserialization" icon={Bug} />
          <StatCard value="9,000+" label="E2E tests chuẩn hóa Adapters" icon={TestTubes} />
          <StatCard value="100%" label="AI Agent accuracy với AGENTS.md" icon={Gauge} />
        </div>
      </div>

      {/* ── Sticky Section Nav ── */}
      <EcosystemSectionNav />

      {/* ══════════════════════════════════════
          SECTION 1: TỔNG QUAN
          ══════════════════════════════════════ */}
      <SectionAnchor id="overview" />
      <section className="space-y-6">
        <SectionHeader
          icon={BookOpen}
          title="Bối Cảnh Phiên Bản & Chu Kỳ Sống (LTS)"
          description="Next.js 14 đã EOL từ 10/2025. Next.js 15 sẽ EOL vào 21/10/2026. Phiên bản 16.2.9 là nhánh LTS chiến lược, tương thích React 19.2 và Node.js ≥ 20.9.0."
        />

        <Card>
          <CardContent className="space-y-4 pt-6">
            <LTSTimeline />
            <Separator />
            <div className="space-y-2 text-base">
              <p>
                Next.js 16.2.9 đánh dấu một cột mốc kiến trúc — thiết lập hệ thống với caching tường
                minh, tối ưu hóa triệt để cho biên dịch Rust (Turbopack), và mang định hướng
                AI-native.
              </p>
              <p>
                Hệ thống yêu cầu Node.js tối thiểu 20.9.0 (LTS) và TypeScript 5.1.0, chính thức loại
                bỏ Node.js 18 để tận dụng GC tối ưu ở cấp độ V8 engine. Tất cả request-time API giờ
                là <strong>async Promises</strong> — đảm bảo thread-safety khi kết xuất máy chủ song
                song.
              </p>
            </div>

            <div className="space-y-3">
              <InfoBox label="Request Interceptor">
                <p>
                  <strong>proxy.ts</strong> thay thế middleware.ts — Reverse Proxy thuần túy trên
                  Node.js runtime, đảm nhiệm redirects, header manipulation và A/B testing. Xác thực
                  &amp; phân quyền chuyển hoàn toàn vào Server Components/Actions.
                </p>
              </InfoBox>
              <InfoBox label="Hạ tầng triển khai">
                <p>
                  <strong>Build Adapters API</strong> chuẩn hóa đa nền tảng — Vercel, Netlify, AWS,
                  Cloudflare, Google Cloud vận hành trên cùng bộ API công khai với 9.000+ E2E tests
                  xác minh.
                </p>
              </InfoBox>
              <InfoBox label="Linting">
                <p>
                  <code>next lint</code> đã loại bỏ. Chuyển sang <strong>Biome</strong> hoặc{' '}
                  <strong>ESLint Flat Config</strong> (v10) — Rust-based tools cho tốc độ cao.
                </p>
              </InfoBox>
              <InfoBox label="Kiểu tham số">
                <p>
                  <code>params</code> và <code>searchParams</code> giờ là{' '}
                  <strong>async Promises</strong> bắt buộc — nền tảng cho Partial Prerendering
                  (PPR).
                </p>
              </InfoBox>
            </div>

            <Separator />

            <h3 className="text-base font-semibold">Bảng Tổng Hợp Breaking Changes</h3>
            <p className="text-sm text-muted-foreground">
              Các thay đổi phá vỡ cấu trúc mã — yêu cầu di chuyển thủ công hoặc qua Codemod.
            </p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Thành Phần</th>
                    <th className="px-4 py-2 font-semibold">Trước 16.2.9</th>
                    <th className="px-4 py-2 font-semibold">16.2.9</th>
                    <th className="px-4 py-2 font-semibold">Ý Nghĩa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-2 font-medium">Request Interceptor</td>
                    <td className="px-4 py-2 text-muted-foreground">middleware.ts (Edge)</td>
                    <td className="px-4 py-2 text-muted-foreground">proxy.ts (Node.js)</td>
                    <td className="px-4 py-2 text-muted-foreground">Toàn bộ hệ sinh thái NPM</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Hạ tầng Deploy</td>
                    <td className="px-4 py-2 text-muted-foreground">Phụ thuộc Vercel Build</td>
                    <td className="px-4 py-2 text-muted-foreground">Build Adapters API</td>
                    <td className="px-4 py-2 text-muted-foreground">Platform-agnostic</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Linting</td>
                    <td className="px-4 py-2 text-muted-foreground">next lint tích hợp</td>
                    <td className="px-4 py-2 text-muted-foreground">Biome / ESLint CLI</td>
                    <td className="px-4 py-2 text-muted-foreground">Giảm complexity core</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">params / searchParams</td>
                    <td className="px-4 py-2 text-muted-foreground">Đồng bộ</td>
                    <td className="px-4 py-2 text-muted-foreground">Async Promises</td>
                    <td className="px-4 py-2 text-muted-foreground">Thread-safety, PPR</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Caching</td>
                    <td className="px-4 py-2 text-muted-foreground">Ngầm định (implicit)</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      &quot;use cache&quot; tường minh
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">Chống stale data</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">AMP</td>
                    <td className="px-4 py-2 text-muted-foreground">Tích hợp sẵn</td>
                    <td className="px-4 py-2 text-muted-foreground">Loại bỏ hoàn toàn</td>
                    <td className="px-4 py-2 text-muted-foreground">Giảm bloatware</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Node.js</td>
                    <td className="px-4 py-2 text-muted-foreground">18+ hỗ trợ</td>
                    <td className="px-4 py-2 text-muted-foreground">≥ 20.9.0 (LTS)</td>
                    <td className="px-4 py-2 text-muted-foreground">Tối ưu V8 GC</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Parallel Routes</td>
                    <td className="px-4 py-2 text-muted-foreground">Optional default</td>
                    <td className="px-4 py-2 text-muted-foreground">Bắt buộc default.js</td>
                    <td className="px-4 py-2 text-muted-foreground">Compile-time safety</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Conclusion */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-6">
          <h2 className="text-xl font-bold">Tổng Kết</h2>
          <p className="text-muted-foreground">
            Next.js 16.2.9 đánh dấu kỷ nguyên trưởng thành — nơi ranh giới giữa máy khách, biên mạng
            và máy chủ được xác định tường minh bằng kiến trúc toán học thay vì phép thử sai ngầm
            định. Với React Compiler, Turbopack, Explicit Caching, AI DevTools MCP và Build
            Adapters, nó trở thành công cụ công nghiệp hạng nặng, chấm dứt tình trạng độc quyền nền
            tảng.
          </p>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════
          SECTION 2: KIẾN TRÚC CỐT LÕI
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
              <div className="space-y-2 rounded-md border border-border bg-primary/10 p-4">
                <p className="text-sm font-semibold">Vai trò của proxy.ts</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>
                    Chỉ đảm nhiệm redirects dựa trên cookie, header manipulation, A/B testing.
                  </li>
                  <li>Chạy hoàn toàn trên Node.js runtime — toàn bộ hệ sinh thái NPM.</li>
                  <li>Xác thực &amp; phân quyền bắt buộc ở Server Components/Actions.</li>
                  <li>Môi trường thực thi duy nhất, có thể dự đoán được.</li>
                  <li>
                    Thiết lập kiến trúc &ldquo;defense in depth&rdquo; — tách biệt rõ giữa lớp mạng
                    và lớp logic nghiệp vụ.
                  </li>
                </ul>
              </div>
              <Callout>
                Mọi hàm truy cập dữ liệu cấp yêu cầu (<code>cookies()</code>, <code>headers()</code>
                , <code>draftMode()</code>, <code>params</code>, <code>searchParams</code>) giờ chỉ
                dùng qua <strong>await</strong> — nền tảng bắt buộc cho{' '}
                <strong>Partial Prerendering (PPR)</strong> hoạt động.
              </Callout>

              <Separator />

              <h3 className="text-base font-semibold">Kiến Trúc Bảo Mật Phân Tầng 2 Lớp</h3>
              <p className="text-muted-foreground">
                Với <code>proxy.ts</code> và Dynamic by Default, kiến trúc bảo mật được khuyến nghị
                tách thành <strong>Tầng Mạng (Proxy Layer)</strong> và{' '}
                <strong>Tầng Ứng dụng (App Layer)</strong>.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Tầng 1: Proxy Layer (Mạng)" variant="highlight">
                  <ul className="list-inside list-disc space-y-1">
                    <li>Redirect chưa đăng nhập, A/B testing.</li>
                    <li>Làm mới session — ghi đè token vào cookie.</li>
                    <li>Thiết lập CORS headers.</li>
                    <li>
                      <strong>Không chứa</strong> logic nghiệp vụ kết nối DB.
                    </li>
                  </ul>
                </InfoBox>
                <InfoBox label="Tầng 2: App Layer (Ứng dụng)" variant="info">
                  <ul className="list-inside list-disc space-y-1">
                    <li>RBAC phân quyền chi tiết, kiểm tra JWT.</li>
                    <li>Xác minh sở hữu dữ liệu (ownership).</li>
                    <li>Thực hiện tại Server Components / Actions.</li>
                    <li>
                      Dynamic by Default → <strong>luôn thực thi real-time</strong> mỗi request.
                    </li>
                  </ul>
                </InfoBox>
              </div>

              <CodeBlock
                code={`// proxy.ts — Tầng Mạng: chỉ kiểm tra session redirect
import { NextResponse } from 'next/server';

export default async function middleware(req: Request) {
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();

  if (!user && req.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── PPR & Static Shell ── */}
        <div>
          <SectionHeader
            icon={Layers}
            title="Partial Prerendering (PPR) & Static Shell"
            description="Khi cacheComponents: true, PPR là hành vi mặc định — tự tạo lớp vỏ tĩnh, render động qua Suspense holes."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                PPR vận hành song hành với Cache Components. Next.js 16.2.9 tự động tạo một
                <strong> &quot;lớp vỏ tĩnh&quot; (static HTML shell)</strong> chứa mọi nội dung
                không phụ thuộc vào dữ liệu yêu cầu cục bộ (navigation bars, headers, footers). Edge
                Network trả về ngay lớp vỏ tĩnh → TTFB cực thấp, nội dung dynamic được stream vào
                các lỗ hổng Suspense.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Tĩnh (Static)" variant="highlight">
                  <p>
                    Nội dung không đọc runtime API (<code>cookies()</code>, <code>headers()</code>,{' '}
                    <code>searchParams</code>, fetch không cache) → render trước tại build-time. Trả
                    về tức thì.
                  </p>
                </InfoBox>
                <InfoBox label="Động (Dynamic)" variant="info">
                  <p>
                    Bất kỳ đoạn code nào đọc runtime API → trở thành &quot;dynamic hole&quot;.{' '}
                    <strong>
                      Bắt buộc bao bọc trong <code>&lt;Suspense&gt;</code>
                    </strong>{' '}
                    để không phá vỡ lớp vỏ tĩnh của toàn trang.
                  </p>
                </InfoBox>
              </div>

              <InfoBox label="Ràng buộc Suspense" variant="warning">
                <p>
                  Nếu một hàm gọi <code>cookies()</code> ở trên cùng mà không nằm trong{' '}
                  <code>&lt;Suspense&gt;</code>, toàn bộ trang sẽ bị biến thành loading skeleton —
                  mất hoàn toàn lợi ích PPR. Dùng <code>next-browser ppr lock</code> để phát hiện
                  tình trạng này.
                </p>
              </InfoBox>

              <CodeBlock
                code={`// ✅ PPR đúng — dynamic được cô lập trong Suspense
export default async function Page() {
  return (
    <div>
      <Header />             {/* ← Static */}
      <Suspense fallback={<Skeleton />}>
        <Dashboard />        {/* ← Dynamic (đọc cookies()) */}
      </Suspense>
      <Footer />             {/* ← Static */}
    </div>
  );
}`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Build Adapters ── */}
        <div>
          <SectionHeader
            icon={Globe}
            title="Tính Khả Chuyển Nền Tảng & Build Adapters API"
            description="Khôi phục tính độc lập nền tảng thông qua API chuẩn hóa sau khi next build hoàn tất, dưới sự bảo trợ của Ecosystem Working Group."
          />

          <Card>
            <CardContent className="space-y-3 pt-6">
              <p>
                Sau <code>next build</code>, siêu dữ liệu đa hình (routes, cache rules, static
                assets) được xuất ra định dạng phiên bản hóa có kiểu dữ liệu chặt chẽ. Các nền tảng
                viết Adapter qua <code>modifyConfig</code> và <code>onBuildComplete</code>. Vercel,
                Netlify, AWS, Cloudflare, Google Cloud vận hành trên cùng bộ API công khai — đi kèm
                9.000+ E2E tests làm chuẩn xác minh.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <InfoBox label="Verified Adapter" variant="highlight">
                  <p>
                    Adapter phải open-source và vượt qua toàn bộ phổ kiểm thử 9.000+ test cases để
                    đạt chứng nhận.
                  </p>
                </InfoBox>
                <InfoBox label="Ecosystem Working Group" variant="highlight">
                  <p>
                    Vercel, Netlify, AWS, Cloudflare, Google Cloud — mọi nền tảng vận hành trên cùng
                    bộ API công khai, được bảo trợ bởi Ecosystem Working Group.
                  </p>
                </InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── System Changes ── */}
        <div>
          <SectionHeader
            icon={Settings}
            title="Thay Đổi Hành Vi & Cấu Hình Hệ Thống"
            description="Các thay đổi mặc định quan trọng trong 16.2.9 — ESLint, Output Dirs, Image Optimization, Lockfile và công cụ gỡ lỗi."
          />

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-3 md:grid-cols-2">
                <InfoBox label="ESLint">
                  <p>
                    <code>next lint</code> đã bị loại bỏ hoàn toàn. Chuyển sang{' '}
                    <strong>Biome</strong> hoặc <strong>ESLint Flat Config</strong> (v10) — trả
                    quyền kiểm soát cho công cụ chuyên dụng, tăng tốc qua Rust-based tools.
                  </p>
                </InfoBox>
                <InfoBox label="Output Dirs">
                  <p>
                    Thư mục riêng biệt cho <code>next dev</code> và <code>next build</code>, cho
                    phép thực thi đồng thời mà không xung đột lockfile.
                  </p>
                </InfoBox>
                <InfoBox label="Tối ưu Hình ảnh">
                  <p>
                    <code>minimumCacheTTL</code>: 60s → <strong>4 giờ</strong>.{' '}
                    <code>qualities: [75]</code>. <code>dangerouslyAllowLocalIP: false</code> chống
                    SSRF. Biến môi trường custom yêu cầu <code>images.localPatterns</code>{' '}
                    whitelist.
                  </p>
                </InfoBox>
                <InfoBox label="Lockfile & Gỡ lỗi">
                  <p>
                    Khóa phiên ngăn concurrent dev/build. <code>--inspect</code> cho{' '}
                    <code>next start</code>. Hydration Diff Indicator trực quan.
                  </p>
                </InfoBox>
              </div>

              <Separator />

              <h3 className="text-base font-semibold">Async Request APIs — Breaking Change</h3>
              <p className="text-muted-foreground">
                Mọi đối tượng giao tiếp mạng — <code>cookies()</code>, <code>headers()</code>,{' '}
                <code>params</code>, <code>searchParams</code> — giờ đây đều là{' '}
                <strong>Promise</strong>. Bắt buộc tiêu thụ qua <code>await</code> hoặc{' '}
                <code>React.use()</code>. Triết lý này dọn đường cho Suspense phi tuyến tính và giải
                phóng luồng chính.
              </p>

              <CodeBlock
                code={`// ❌ Next.js 15
export default function Page({ params }) {
  const { slug } = params;        // sync
  return <Post slug={slug} />;
}

// ✅ Next.js 16.2.9
export default async function Page({ params }: { params: Promise<{ slug: string }>) {
  const { slug } = await params;  // async Promise
  return <Post slug={slug} />;
}`}
              />

              <InfoBox label="Parallel Routes — strict">
                <p>
                  Mọi slot bắt buộc khai báo tệp <code>default.js</code> rõ ràng (dù chỉ{' '}
                  <code>return null</code>). Không khai báo → build thất bại ngay lập tức.
                </p>
              </InfoBox>
            </CardContent>
          </Card>
        </div>

        {/* ── React Compiler ── */}
        <div>
          <SectionHeader
            icon={Cpu}
            title="React Compiler 1.0 — Tự Động Hóa Bộ Nhớ"
            description='Tích hợp ổn định — thuật toán "Forget" tự động memoize tại build-time dựa trên escape analysis, loại bỏ useMemo/useCallback thủ công.'
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-base">
                Kích hoạt qua <code>reactCompiler: true</code> trong <code>next.config.ts</code>.
                Compiler thực hiện escape analysis tương tự cơ chế tối ưu V8 — nếu cấu trúc tuân thủ
                React Rules, tự động tiêm <code>useMemo</code> và <code>useCallback</code>
                tương đương ở cấp độ AST.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Hiệu quả" variant="highlight">
                  <p>
                    Giảm 20–40% re-renders trong analytics dashboards và danh sách dữ liệu thời gian
                    thực. Loại bỏ hoàn toàn dependency arrays viết tay.
                  </p>
                </InfoBox>
                <InfoBox label="Đánh đổi">
                  <p>
                    Build time tăng nhẹ — dịch chuyển gánh nặng tính toán từ runtime của người dùng
                    sang build-time.
                  </p>
                </InfoBox>
              </div>

              <CodeBlock
                code={`// next.config.ts
const nextConfig = {
  reactCompiler: true,
};

export default nextConfig;`}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════
          SECTION 3: BỘ NHỚ ĐỆM TƯỜNG MINH
          ══════════════════════════════════════ */}
      <SectionAnchor id="caching" />
      <section className="space-y-8">
        {/* ── Explicit Caching Overview ── */}
        <div>
          <SectionHeader
            icon={Database}
            title="Kiến Trúc Bộ Nhớ Đệm Tường Minh"
            description='Mọi route mặc định dynamic — caching chỉ xảy ra khi khai báo "use cache" tường minh. Nguyên lý cốt lõi: dữ liệu cũ không bao giờ được tải âm thầm.'
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Mặc định Dynamic" variant="highlight">
                  <p>
                    Mọi route mặc định <strong>dynamic</strong>. Không có caching ngầm định — dữ
                    liệu luôn được truy xuất tươi mới trừ khi khai báo tường minh.
                  </p>
                </InfoBox>
                <InfoBox label='Khai báo "use cache"' variant="highlight">
                  <ul className="list-inside list-disc space-y-1">
                    <li>Đặt ở đầu tệp, đầu hàm, hoặc inline trong async function.</li>
                    <li>
                      Khai báo qua <code>cacheComponents: true</code> trong next.config.ts.
                    </li>
                    <li>
                      Thay thế hoàn toàn <code>revalidate</code>, <code>fetchCache</code>,{' '}
                      <code>unstable_cache</code>.
                    </li>
                  </ul>
                </InfoBox>
              </div>

              <Callout>
                Nguyên lý cốt lõi: dữ liệu cũ (stale data) không bao giờ được tải âm thầm — mọi hành
                vi lưu trữ phải được khai báo tường minh bởi kỹ sư hệ thống.
              </Callout>
            </CardContent>
          </Card>
        </div>

        {/* ── Cache Keys & "use cache" ── */}
        <div>
          <SectionHeader
            icon={Lock}
            title='Thuật Toán Cache Key Của "use cache"'
            description="Cache key không phụ thuộc URL mà được tuần tự hóa dựa trên 3 tiêu chí khắt khe — đảm bảo tính nhất quán phiên bản mã."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <InfoBox label="1. Build ID" variant="info">
                  <p>
                    Chuỗi định danh duy nhất cho mỗi lần biên dịch. Khi deploy mới, toàn bộ bộ đệm
                    cũ lập tức bị vô hiệu hóa — đảm bảo tính nhất quán của phiên bản mã.
                  </p>
                </InfoBox>
                <InfoBox label="2. Function ID" variant="info">
                  <p>
                    Mã băm bảo mật (secure hash) định vị vị trí hàm và chữ ký tham số trong cơ sở
                    mã.
                  </p>
                </InfoBox>
                <InfoBox label="3. Đối số có thể tuần tự hóa" variant="info">
                  <p>
                    Tham số nguyên thủy (string, number), mảng, object, và kiểu phức tạp như{' '}
                    <code>Date</code>, <code>Map</code>, <code>Set</code>, <code>ArrayBuffer</code>{' '}
                    đều trở thành phần của khóa. Thay đổi bất kỳ thuộc tính nào → cache entry hoàn
                    toàn mới.
                  </p>
                </InfoBox>
              </div>

              <Callout>
                Nhờ sự cô lập này, Server Actions có thể truyền trực tiếp xuyên qua Server
                Components đã được cache mà không phá vỡ tính nguyên khối tĩnh của trang.
              </Callout>

              <CodeBlock
                code={`// "use cache" tại cấp file
"use cache";

async function getUser(id: string) {
  // Cache key = BuildID + FunctionID + { id }
  return fetch(\`/api/users/\${id}\`);
}

// "use cache" inline trong hàm
export async function getPost(slug: string) {
  "use cache";
  cacheLife('hours');
  // ...
}`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Private & Remote Cache ── */}
        <div>
          <SectionHeader
            icon={Eye}
            title="Bảo Mật & Phân Tán: Private & Remote Cache"
            description='Hai biến thể chiến lược cho compliance và multi-host: "use cache: private" và "use cache: remote".'
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              {/* ── 3-variant comparison table ── */}
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Chỉ thị</th>
                      <th className="px-3 py-2 font-semibold">Không gian Lưu trữ</th>
                      <th className="px-3 py-2 font-semibold">Phạm vi</th>
                      <th className="px-3 py-2 font-semibold">cookies()?</th>
                      <th className="px-3 py-2 font-semibold">Tình huống</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-3 py-2 font-medium">&quot;use cache&quot;</td>
                      <td className="px-3 py-2 text-muted-foreground">In-memory / Cache Handler</td>
                      <td className="px-3 py-2 text-muted-foreground">Toàn cục</td>
                      <td className="px-3 py-2 text-muted-foreground">❌ Truyền qua đối số</td>
                      <td className="px-3 py-2 text-muted-foreground">Blog, danh mục sản phẩm</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">&quot;use cache: remote&quot;</td>
                      <td className="px-3 py-2 text-muted-foreground">KV Store phân tán</td>
                      <td className="px-3 py-2 text-muted-foreground">Cross-instance</td>
                      <td className="px-3 py-2 text-muted-foreground">❌ Truyền qua đối số</td>
                      <td className="px-3 py-2 text-muted-foreground">Serverless, giảm DB load</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">&quot;use cache: private&quot;</td>
                      <td className="px-3 py-2 text-muted-foreground">Bộ nhớ trình duyệt</td>
                      <td className="px-3 py-2 text-muted-foreground">Theo session/user</td>
                      <td className="px-3 py-2 text-muted-foreground">✅ Đọc trực tiếp</td>
                      <td className="px-3 py-2 text-muted-foreground">Dashboard cá nhân, PII</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label='"use cache: remote" — Serverless' variant="highlight">
                  <p>
                    Bộ nhớ RAM serverless mang tính phù du — instance có thể tắt bất cứ lúc nào.{' '}
                    <code>&quot;use cache: remote&quot;</code> đẩy cache vào KV Store phân tán, giữ
                    cache hit rate cao bất chấp auto-scaling.
                  </p>
                </InfoBox>
                <InfoBox label='"use cache: private" — Zero-Trust' variant="highlight">
                  <p>
                    Dữ liệu <strong>tuyệt đối không lưu trên server hay CDN</strong>. Tận dụng
                    runtime prefetching trong bộ nhớ trình duyệt (≥ 30 giây). Kiến trúc{' '}
                    <strong>Zero-Trust Frontend</strong> bảo vệ PII.
                  </p>
                </InfoBox>
              </div>

              <CodeBlock
                code={`// Private cache — bảo vệ PII, không lưu server/CDN
"use cache: private";
async function getCart(userId: string) {
  const token = await cookies().get('session');
  // Dữ liệu chỉ nằm trong trình duyệt người dùng
}

// Remote cache — Redis cho multi-host deployments
"use cache: remote";
async function getInventory(productId: string) {
  cacheLife('max');
  // Chia sẻ cache xuyên suốt cluster
}`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── cacheLife Profiles ── */}
        <div>
          <SectionHeader
            icon={Timer}
            title="cacheLife() — Hồ Sơ Vòng Đời Bộ Đệm"
            description="3 giai đoạn độc lập: stale, revalidate, expire. Framework cung cấp sẵn các profile tối ưu cho từng nghiệp vụ."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                Thay vì chỉ thiết lập một mức TTL đơn giản, Next.js phân rã vòng đời cache thành
                <strong> 3 giai đoạn độc lập</strong>:
              </p>

              <div className="space-y-3">
                <InfoBox label="1. stale — Độ trễ trình duyệt" variant="info">
                  <p>
                    Thời gian client-side router được phép dùng lại nội dung trong bộ nhớ trình
                    duyệt mà không cần HTTP request. Truyền qua header{' '}
                    <code>x-nextjs-stale-time</code>. <strong>Stale tối thiểu: 30 giây</strong> (đảm
                    bảo prefetch không bị vỡ).
                  </p>
                </InfoBox>
                <InfoBox label="2. revalidate — Làm mới nền (SWR)" variant="info">
                  <p>
                    Hậu duệ ISR. Vượt mốc này → người dùng nhận data cũ ngay lập tức, máy chủ kích
                    hoạt tiến trình nền đồng bộ lại data mới và ghi đè cache.
                  </p>
                </InfoBox>
                <InfoBox label="3. expire — Giới hạn sinh tồn" variant="info">
                  <p>
                    Điểm chết tuyệt đối. Không ai truy cập để refresh → data bị xóa. Request kế tiếp
                    phải render lại đồng bộ từ đầu.
                  </p>
                </InfoBox>
              </div>

              <Separator />

              <h3 className="text-base font-semibold">Profile Tiêu Chuẩn</h3>
              <div className="grid gap-3 md:grid-cols-5">
                <InfoBox label="seconds">
                  <p>Dữ liệu realtime, không prerender.</p>
                </InfoBox>
                <InfoBox label="minutes">
                  <p>Luồng tin tức.</p>
                </InfoBox>
                <InfoBox label="hours">
                  <p>Tồn kho sản phẩm.</p>
                </InfoBox>
                <InfoBox label="days">
                  <p>Nội dung tĩnh như blog.</p>
                </InfoBox>
                <InfoBox label="max">
                  <p>Nội dung bất biến.</p>
                </InfoBox>
              </div>

              <CodeBlock
                code={`// Profile có điều kiện — linh hoạt theo trạng thái nội dung
async function getPost(slug: string) {
  "use cache";
  const post = await db.posts.findUnique({ where: { slug } });

  if (post.status === 'draft') {
    cacheLife('seconds');  // fresh liên tục khi đang soạn
  } else {
    cacheLife('days');     // tối ưu cache khi đã xuất bản
  }
  return post;
}`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Cache Lifecycle APIs ── */}
        <div>
          <SectionHeader
            icon={RefreshCw}
            title="Vòng Đời Tái Đánh Giá Dữ Liệu"
            description="revalidateTag(), updateTag(), refresh() — các API mới cho Server Actions và Stale-While-Revalidate."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <InfoBox label="updateTag() — Read-Your-Writes">
                  <p>
                    Dành riêng cho <strong>Server Actions</strong>. Xóa ngay cache cũ, buộc request
                    tiếp theo truy xuất dữ liệu mới nhất — đảm bảo UI hiển thị thông tin chính xác
                    ngay sau khi người dùng gửi form.
                  </p>
                </InfoBox>
                <InfoBox label="revalidateTag() — Stale-While-Revalidate">
                  <p>
                    <strong>Bắt buộc tham số thứ hai</strong> là cacheLife profile. Phục vụ phiên
                    bản cũ với tốc độ tối đa, đồng thời tái tạo HTML mới ở chế độ nền. Lý tưởng cho
                    Route Handlers kích hoạt qua webhook CMS.
                  </p>
                </InfoBox>
                <InfoBox label="refresh() — Client Router">
                  <p>
                    Làm mới tuyến đường máy khách mà <strong>không ảnh hưởng cache toàn cục</strong>
                    . Hữu dụng cho bộ đếm lượt xem real-time, thông báo — dữ liệu không liên quan
                    đến cấu trúc tĩnh.
                  </p>
                </InfoBox>
              </div>

              <CodeBlock
                code={`// Server Action: updateTag()
'use server';
export async function updateProfile(data: FormData) {
  await db.updateProfile(data);
  updateTag(\`profile:\${userId}\`); // ← Read-Your-Writes
}

// SWR với lifecycle profile
revalidateTag('posts', 'max'); // ← 2 tham số bắt buộc`}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════
          SECTION 4: TURBOPACK & HIỆU NĂNG
          ══════════════════════════════════════ */}
      <SectionAnchor id="performance" />
      <section className="space-y-8">
        {/* ── Turbopack Overview ── */}
        <div>
          <SectionHeader
            icon={Zap}
            title="Turbopack — Trình Đóng Gói Mặc Định"
            description="Turbopack (Rust) đảm nhận toàn bộ vòng đời dev và build. Không còn cần cờ --turbopack."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              {/* Server Fast Refresh */}
              <h3 className="text-base font-semibold">Server Fast Refresh — Cải Thiện 900%</h3>
              <p className="text-muted-foreground">
                Turbopack áp dụng <strong>fine-grained hot reloading</strong>: khi một module server
                thay đổi, chỉ nạp lại <strong>duy nhất module thực sự thay đổi</strong> — thay vì
                xóa toàn bộ <code>require.cache</code> cho cả chuỗi import.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <InfoBox label="Dev Startup" variant="highlight">
                  <p>
                    Khởi động dev server <strong>400% nhanh hơn</strong> trên cùng quy mô dự án lớn.
                  </p>
                </InfoBox>
                <InfoBox label="Compile Time" variant="highlight">
                  <p>
                    Giảm từ <strong>40ms → 2.7ms</strong> nội tại — cải thiện <strong>900%</strong>.
                  </p>
                </InfoBox>
                <InfoBox label="Bug Fixes" variant="highlight">
                  <p>
                    <strong>200+ fixes</strong> trong 16.2.9: Base38 hash, SRI, Web Worker origin,
                    tree-shaking dynamic imports.
                  </p>
                </InfoBox>
              </div>

              {/* SRI */}
              <Separator />
              <h3 className="text-base font-semibold">Subresource Integrity (SRI)</h3>
              <p className="text-muted-foreground">
                Giải quyết triệt để xung đột giữa CSP bảo mật và static caching. Turbopack tự động
                tính toán cryptographic hashes (sha256) cho tất cả JS files tại thời điểm biên dịch.
                Các hash này được đưa vào cấu hình CSP tĩnh — trình duyệt xác thực tính toàn vẹn mà
                không cần tạo nonce theo từng yêu cầu.{' '}
                <strong>Duy trì bảo mật cao nhất + hiệu suất truy xuất tĩnh siêu tốc.</strong>
              </p>

              {/* Web Worker & Tree Shaking */}
              <Separator />
              <h3 className="text-base font-semibold">Web Worker Origin & Tree Shaking</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Web Worker Origin Fix" variant="highlight">
                  <p>
                    Web Workers tải qua URL <code>blob://</code> dẫn đến{' '}
                    <code>location.origin</code> trống — phá hỏng <code>importScripts()</code>.
                    Turbopack chỉ định origin đúng, mở khóa hoàn toàn khả năng chạy WASM phân tán.
                  </p>
                </InfoBox>
                <InfoBox label="Tree Shaking Dynamic Imports" variant="highlight">
                  <p>
                    <code>
                      const &#123; targetExport &#125; = await import(&#39;./large-library&#39;)
                    </code>{' '}
                    được nội suy thành static import tương đương. Các exports không sử dụng bị loại
                    bỏ hoàn toàn khỏi bundle.
                  </p>
                </InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── RSC Deserialization ── */}
        <div>
          <SectionHeader
            icon={ArrowRightLeft}
            title="RSC Payload Deserialization — Quy Trình 2 Bước"
            description="Đóng góp trực tiếp vào lõi React: JSON.parse thuần C++ + recursive walk JS — giảm 25–60% thời gian render HTML."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                Độ trễ RSC payload không nằm ở payload size mà ở tốc độ giải mã JSON.
                Turbopack/React 16.2.9 áp dụng quy trình 2 bước tách biệt ranh giới C++ ↔ JS — triệt
                tiêu overhead boundary-crossing cho <strong>mỗi cặp key-value</strong>.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Bước 1: JSON.parse() thuần C++" variant="highlight">
                  <p>
                    Không chứa reviver — C++ xử lý chuỗi ở tốc độ phần cứng, không có
                    boundary-crossing overhead.
                  </p>
                </InfoBox>
                <InfoBox label="Bước 2: Recursive walk JS" variant="highlight">
                  <p>
                    Duyệt đệ quy bằng JavaScript thuần, có khả năng{' '}
                    <strong>short-circuiting</strong> các chuỗi đơn giản không cần biến đổi.
                  </p>
                </InfoBox>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Loại dữ liệu</th>
                      <th className="px-3 py-2 font-semibold">Trước (ms)</th>
                      <th className="px-3 py-2 font-semibold">16.2.9 (ms)</th>
                      <th className="px-3 py-2 font-semibold">Cải thiện</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-3 py-2 font-medium">Bảng dữ liệu (1,000 mục)</td>
                      <td className="px-3 py-2 text-muted-foreground">19</td>
                      <td className="px-3 py-2 text-muted-foreground">15</td>
                      <td className="px-3 py-2 font-medium text-primary">Nhanh hơn 26%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">Trang chủ Payload CMS</td>
                      <td className="px-3 py-2 text-muted-foreground">43</td>
                      <td className="px-3 py-2 text-muted-foreground">32</td>
                      <td className="px-3 py-2 font-medium text-primary">Nhanh hơn 34%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">Văn bản phong phú (Rich Text)</td>
                      <td className="px-3 py-2 text-muted-foreground">52</td>
                      <td className="px-3 py-2 text-muted-foreground">33</td>
                      <td className="px-3 py-2 font-medium text-primary">Nhanh hơn 60%</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-medium">Nested Suspense Boundaries</td>
                      <td className="px-3 py-2 text-muted-foreground">80</td>
                      <td className="px-3 py-2 text-muted-foreground">60</td>
                      <td className="px-3 py-2 font-medium text-primary">Nhanh hơn 33%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Callout>
                Kết quả: tốc độ giải mã RSC payload nhanh hơn lên tới <strong>350%</strong>, dịch
                trực tiếp thành khả năng kết xuất HTML tổng thể nhanh hơn{' '}
                <strong>xấp xỉ 50%</strong> trong ứng dụng thực tế.
              </Callout>
            </CardContent>
          </Card>
        </div>

        {/* ── ImageResponse ── */}
        <div>
          <SectionHeader
            icon={Activity}
            title="ImageResponse — Ảnh Open Graph Tối Ưu"
            description="Thiết kế lại thư viện sinh ảnh: nhanh gấp 2x ảnh cơ bản, 20x biểu đồ phức tạp."
          />

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Hiệu năng" variant="highlight">
                  <p>
                    <strong>2x nhanh hơn</strong> cho ảnh cơ bản, <strong>20x nhanh hơn</strong> cho
                    biểu đồ hoặc bố cục phức tạp (chart OG images).
                  </p>
                </InfoBox>
                <InfoBox label="CSS & SVG mở rộng" variant="highlight">
                  <ul className="list-inside list-disc space-y-1">
                    <li>Hỗ trợ inline CSS variables.</li>
                    <li>
                      <code>display: contents</code> trong SVG.
                    </li>
                    <li>
                      Font mặc định: Noto Sans → <strong>Geist Sans</strong>.
                    </li>
                  </ul>
                </InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── View Transitions ── */}
        <div>
          <SectionHeader
            icon={Activity}
            title="View Transitions API & Scroll Behavior"
            description="Hiệu ứng chuyển đổi mượt mà giống native app, kết hợp quản lý scroll và focus mới."
          />

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="View Transitions" variant="highlight">
                  <ul className="list-inside list-disc space-y-1">
                    <li>
                      <code>
                        &lt;Link transitionTypes=[&#123;&#39;slide-forward&#39;&#125;]&gt;
                      </code>{' '}
                      kết nối trực tiếp với <code>React.addTransitionType</code>.
                    </li>
                    <li>Cho phép kích hoạt CSS effects khác nhau dựa trên cấu trúc đường dẫn.</li>
                    <li>Mang lại cảm giác native app trên nền web.</li>
                  </ul>
                </InfoBox>
                <InfoBox label="Scroll Behavior Fix">
                  <ul className="list-inside list-disc space-y-1">
                    <li>Sử dụng React Fragment refs để blur phần tử kích hoạt trước đó.</li>
                    <li>Tránh nhảy đột ngột đến focusable element đầu tiên.</li>
                    <li>Quay về chuẩn cơ học điều hướng gốc của trình duyệt HTML.</li>
                  </ul>
                </InfoBox>
              </div>

              <CodeBlock
                code={`import { addTransitionType } from 'react';
<Link href="/blog" transitionTypes={['slide-in']}>Blog</Link>

// Đăng ký custom transition
addTransitionType('fade-scale');`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Routing & Prefetching ── */}
        <div>
          <SectionHeader
            icon={Route}
            title="Định Tuyến & Tìm Nạp Trước Thông Minh"
            description="Layout Deduplication, Incremental Prefetching và prefetchInlining — tối ưu băng thông."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Khử Trùng Lặp Layout">
                  <p>
                    50 liên kết có chung layout → chỉ tải <strong>đúng 1 lần</strong>. Next.js xác
                    định sự tương đồng router segments, giảm truyền tải theo cấp số nhân.
                  </p>
                </InfoBox>
                <InfoBox label="Tìm Nạp Trước Tăng Dần" variant="highlight">
                  <p>
                    <strong>Viewport-aware:</strong> chỉ lấy phần chưa có trong cache. Liên kết cuột
                    khỏi viewport → <strong>hủy ngay</strong> mạng. Hover → tái kích hoạt ưu tiên.
                  </p>
                </InfoBox>
              </div>

              <InfoBox label="prefetchInlining (experimental)">
                <p>
                  Đóng gói toàn bộ phân đoạn dữ liệu tuyến đường vào{' '}
                  <strong>một phản hồi mạng duy nhất</strong> — giảm số lượng gói tin TCP. Đánh đổi
                  chi tiết cache lấy băng thông thấp.
                </p>
              </InfoBox>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════
          SECTION 5: BẢO MẬT & VẬN HÀNH
          ══════════════════════════════════════ */}
      <SectionAnchor id="security" />
      <section className="space-y-8">
        {/* ── CVE & Defense ── */}
        <div>
          <SectionHeader
            icon={ShieldAlert}
            title="An Ninh Kiến Trúc & Mô Hình 3 Lớu Phòng Ngự"
            description="CVE đã vá, after() API cho tác vụ nền, và unstable_catchError() cho framework-aware error boundaries."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="CVE đã vá" variant="warning">
                  <ul className="list-inside list-disc space-y-1">
                    <li>
                      <strong>CVE-2026-23870</strong> (React2Shell): RCE trong RSC protocol.
                    </li>
                    <li>
                      <strong>CVE-2025-66478</strong>: DoS + auth bypass qua segment-prefetch URL.
                    </li>
                  </ul>
                </InfoBox>
                <InfoBox label="3 Lớu Phòng Ngự (Server Actions)" variant="highlight">
                  <ul className="list-inside list-disc space-y-1">
                    <li>
                      <strong>Identity</strong> — kiểm tra danh tính qua session.
                    </li>
                    <li>
                      <strong>Ownership</strong> — xác thực quyền sở hữu tài nguyên.
                    </li>
                    <li>
                      <strong>Input Validation</strong> — thẩm định qua Zod.
                    </li>
                  </ul>
                </InfoBox>
              </div>

              <Callout>
                Phó thác an toàn cho <code>proxy.ts</code> được xem là thực tiễn lỗi thời. Mỗi
                Server Action phải triển khai 3 lớp phòng ngự độc lập.
              </Callout>
            </CardContent>
          </Card>
        </div>

        {/* ── after() API ── */}
        <div>
          <SectionHeader
            icon={HardDrive}
            title="API after() — Tác Vụ Nền Không Chặn TTFB"
            description="Post-Response Task Scheduling cho logging, analytics, đồng bộ hệ thống — tích hợp sâu với vòng đời React."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                <code>after()</code> lên lịch callback thực thi <strong>sau khi</strong> máy chủ đã
                gửi toàn bộ HTML/RSC stream đến trình duyệt — không ảnh hưởng TTFB. Khác với{' '}
                <code>waitUntil()</code> cấp thấp, nó tích hợp với vòng đời React và vẫn tiếp tục
                chạy ngay cả khi <code>notFound()</code> hay <code>redirect()</code> được gọi giữa
                chừng.
              </p>

              <InfoBox label="Ràng buộc nghiêm ngặt" variant="warning">
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Server Component tĩnh / PPR:</strong> Không gọi trực tiếp{' '}
                    <code>cookies()</code>, <code>headers()</code> bên trong closure{' '}
                    <code>after()</code> — sẽ kích hoạt ở build-time hoặc revalidate, không có
                    request context.
                  </li>
                  <li>
                    <strong>Giải pháp:</strong> Đọc request info vào biến cục bộ{' '}
                    <strong>trước</strong>, sau đó dùng biến đó bên trong <code>after()</code>.
                  </li>
                  <li>
                    <strong>Route Handlers / proxy.ts:</strong> Có thể gọi tự do{' '}
                    <code>headers()</code>, <code>cookies()</code> bên trong <code>after()</code>.
                  </li>
                </ul>
              </InfoBox>

              <CodeBlock
                code={`import { after } from 'next/server';

// ✅ Server Component — đọc trước, dùng sau
export default async function Page() {
  const token = await cookies().get('session');

  after(async () => {
    // token đã được đọc ở ngoài — an toàn
    await analytics.track({ token: token?.value });
  });

  return <h1>Hello</h1>;
}

// ✅ Route Handler — tự do truy cập
export async function PUT(req: Request) {
  after(async () => {
    const h = await headers(); // ← OK trong Route Handler
    await logRequest(h);
  });
}`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── unstable_catchError() ── */}
        <div>
          <SectionHeader
            icon={ShieldAlert}
            title="unstable_catchError() — Error Boundary Nhận Biết Framework"
            description="Tạo ranh giới lỗi framework-aware ở bất kỳ cấp độ component nào — giải quyết triệt để xung đột với redirect/notFound."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                <code>error.tsx</code> bị giới hạn ở cấp route segment. Các thư viện{' '}
                <code>react-error-boundary</code> tiêu chuẩn không nhận biết được digest tokens nội
                bộ của Next.js — chúng bắt gọn lệnh <code>redirect()</code> và vô tình thay thế
                trang cần chuyển hướng bằng giao diện cảnh báo lỗi.{' '}
                <code>unstable_catchError()</code> giải quyết triệt để xung đột này.
              </p>

              <div className="space-y-3">
                <InfoBox label="1. Dung nạp luồng điều hướng" variant="highlight">
                  <p>
                    Mọi lỗi sinh ra từ logic nội bộ Next.js (<code>redirect()</code>,{' '}
                    <code>notFound()</code>, <code>unauthorized()</code>) đi xuyên qua ranh giới lỗi
                    này một cách an toàn.
                  </p>
                </InfoBox>
                <InfoBox label="2. Khôi phục dựa trên server data" variant="highlight">
                  <p>
                    <code>unstable_retry()</code> buộc Next.js re-fetch dữ liệu và re-render Server
                    Component trên máy chủ — then chốt khi microservices tạm thời quá tải.
                  </p>
                </InfoBox>
                <InfoBox label="3. Server-rendered fallback">
                  <p>
                    Giao diện lỗi được cấp dữ liệu trực tiếp từ máy chủ trước khi gửi về client —
                    duy trì trải nghiệm liền mạch.
                  </p>
                </InfoBox>
              </div>

              <CodeBlock
                code={`import { unstable_catchError } from 'next/server';

function MyComponent() {
  const { data, error } = unstable_catchError(
    () => fetchUserData(userId),
    (err) => ({ data: null, error: err }),
  );

  if (error) {
    // Server-rendered fallback — redirect vẫn hoạt động xuyên qua
    return <FallbackError error={error} />;
  }

  return <UserCard user={data} />;
}`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Production Debugging ── */}
        <div>
          <SectionHeader
            icon={FlaskConical}
            title="Gỡ Lỗi Sản Xuất: next start --inspect"
            description="Đính kèm Chrome DevTools vào máy chủ production — CPU profiling và heap snapshots trực tiếp."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                Next.js 16.2.9 mở khóa cổng gỡ lỗi Node.js cho <code>next start</code>. Kỹ sư vận
                hành sử dụng Chrome DevTools để lập hồ sơ CPU và kết xuất heap ngay trên
                staging/production — hỗ trợ phân lập memory leak trực quan.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="next start --inspect" variant="highlight">
                  <p>
                    Mở cổng gỡ lỗi Node.js → Chrome DevTools. CPU profiling + heap snapshots trực
                    tiếp trên staging/production.
                  </p>
                </InfoBox>
                <InfoBox label="Memory Monitoring" variant="info">
                  <p>
                    Biến môi trường <code>--experimental-debug-memory-usage</code> +{' '}
                    <code>--heap-prof</code> từ Node.js để theo dõi cache leak và unbounded growth.
                  </p>
                </InfoBox>
              </div>

              <InfoBox label="Khuyến nghị SRE cho Standalone + Cache" variant="warning">
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Hạn chế</strong> luồng dữ liệu proxy cho upstream fetches bên trong bộ
                    đệm nội bộ.
                  </li>
                  <li>
                    <strong>Kubernetes / PM2</strong> — graceful restart theo lịch khi RSS vượt
                    ngưỡng an toàn.
                  </li>
                  <li>
                    <strong>Theo dõi</strong> getItemsLru key length accounting — Issue #94890.
                  </li>
                </ul>
              </InfoBox>
            </CardContent>
          </Card>
        </div>

        {/* ── Production Warnings ── */}
        <div>
          <SectionHeader
            icon={AlertTriangle}
            title="Cảnh Báo Sản Xuất — Rủi Ro & Lỗi Chưa Khắc Phục"
            description="Dù mang mác LTS, 16.2.9 vẫn tiềm ẩn các lỗ hổng bộ nhớ và lỗi hệ thống cần biết để xây dựng dự phòng."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <InfoBox label="1. OOM — output: standalone + Cache Components" variant="warning">
                  <p>
                    <strong>Memory Leak nghiêm trọng</strong> trên Docker/Kubernetes. ArrayBuffer và
                    WriteWrap bị GC bỏ qua. FinalizationRegistry thiếu giới hạn dung lượng cho
                    negative-cache entries trên LRU Cache → bộ nhớ V8 tăng theo cấp số nhân đến khi
                    sập dịch vụ. Bản vá #88577, #89040 đã phê duyệt canary nhưng{' '}
                    <strong>chưa vào 16.2.x stable</strong>.
                  </p>
                </InfoBox>

                <InfoBox label="2. Turbopack Dev — Unbounded RAM/CPU" variant="warning">
                  <p>
                    <code>next dev</code> tiêu thụ RAM lên đến <strong>16GB</strong>, CPU chiếm dụng{' '}
                    <strong>300%+ ngay cả khi idle</strong>. File watcher rơi vào vòng lặp vĩnh viễn
                    ở denied paths. Theo dõi bằng <code>--experimental-debug-memory-usage</code> +{' '}
                    <code>--heap-prof</code> từ Node.js.
                  </p>
                </InfoBox>

                <InfoBox label="3. Duplicate Fizz IDs — PPR Stream" variant="warning">
                  <p>
                    Khi luồng network bị gián đoạn trong PPR, HTML sinh ra chứa{' '}
                    <code>id=&quot;S:3&quot;</code> trùng lặp. React 19 dùng{' '}
                    <code>$RC(&quot;B:x&quot;,&quot;S:x&quot;)</code> qua{' '}
                    <code>getElementById</code> để swap — ID trùng → nội dung Static/Client
                    Components bị hoán đổi sai, phá hỏng hoàn toàn giao diện.
                  </p>
                </InfoBox>

                <InfoBox label="4. Intermittent 404s" variant="warning">
                  <p>
                    Ứng dụng trả về 404 ngẫu nhiên cho tuyến đường tồn tại sau{' '}
                    <code>next/link</code> hoặc reload cục bộ. Chỉ giải quyết bằng hard refresh —
                    cho thấy gián đoạn đồng bộ trong router nội bộ hoặc loading boundaries.
                  </p>
                </InfoBox>

                <InfoBox label="5. LRU Key Length Accounting (Issue #94890)" variant="warning">
                  <p>
                    <code>getItemsLru</code> bỏ sót độ dài URL key trong tính toán size → heap
                    retention quá mức trong long-lived servers. Giám sát RSS và thiết lập graceful
                    restart thresholds.
                  </p>
                </InfoBox>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ══════════════════════════════════════
          SECTION 6: AI & TOOLING
          ══════════════════════════════════════ */}
      <SectionAnchor id="ai-strategy" />
      <section className="space-y-8">
        {/* ── AGENTS.md ── */}
        <div>
          <SectionHeader
            icon={FlaskConical}
            title="AGENTS.md — Framework Được Thiết Kế Cho AI Agent"
            description="Tài liệu framework đóng gói trong NPM + chỉ thị bắt buộc cho mọi AI Agent — đạt 100% accuracy trên bộ evals của Vercel."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                AGENTS.md là tệp chỉ thị đặt tại thư mục gốc dự án, hướng dẫn AI Agent đọc bộ tài
                liệu cục bộ (<code>node_modules/next/dist/docs/</code>) trước khi viết code — đảm
                bảo agent sử dụng đúng API của 16.2.9 (ví dụ: <code>&quot;use cache&quot;</code>{' '}
                thay vì
                <code>export const revalidate</code>).
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="create-next-app" variant="highlight">
                  <p>
                    Tự động khởi tạo <code>AGENTS.md</code> tại thư mục gốc — chỉ thị AI Agent phải
                    đọc bộ tài liệu cục bộ trước khi viết code.
                  </p>
                </InfoBox>
                <InfoBox label="Kết quả đo lường" variant="highlight">
                  <p>
                    Always-available context nâng tỷ lệ hoàn thành tác vụ chính xác lên{' '}
                    <strong>100%</strong> trên bộ evals của Vercel.
                  </p>
                </InfoBox>
              </div>

              <Callout>
                Next.js trở thành framework đầu tiên được thiết kế nguyên bản cho kỷ nguyên lập
                trình bằng trợ lý tự động (Agent-Driven Development).
              </Callout>
            </CardContent>
          </Card>
        </div>

        {/* ── MCP & DevTools ── */}
        <div>
          <SectionHeader
            icon={Terminal}
            title="MCP DevTools, Browser Forwarding & next-browser"
            description="Đường ống hai chiều giữa dev server và AI Agent — lỗi trình duyệt, PPR analysis, headless interaction."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-3 md:grid-cols-3">
                <InfoBox label="Browser Log Forwarding" variant="highlight">
                  <p>
                    <code>logging.browserToTerminal</code> — tự động chuyển hướng lỗi client về
                    Terminal. AI nhận live feedback loop để tự sửa lỗi.
                  </p>
                </InfoBox>
                <InfoBox label="Dev Server Lock File" variant="info">
                  <p>
                    <code>.next/dev/lock</code> ngăn Agent tạo thêm tiến trình dev server khi đã có
                    trên cổng 3000.
                  </p>
                </InfoBox>
                <InfoBox label="MCP Server" variant="highlight">
                  <p>
                    <code>.mcp.json</code> + <code>next-devtools-mcp</code>: get_errors, get_logs,
                    get_page_metadata, browser_eval, bundle.analyze.
                  </p>
                </InfoBox>
              </div>

              <Separator />

              <h3 className="text-base font-semibold">@vercel/next-browser — CLI cho AI Agent</h3>
              <p className="text-muted-foreground">
                CLI thử nghiệm cung cấp persistent Chromium headless session — thay vì AI điều hướng
                mù quáng, <code>next-browser</code> trả về cấu trúc phân tích thuần văn bản.
              </p>

              <InfoBox label="Ví dụ: PPR Analysis" variant="highlight">
                <p>
                  <code>next-browser ppr lock</code> phong tỏa mô hình hiển thị, sau đó{' '}
                  <code>next-browser tree</code> trả về:{' '}
                  <em>
                    &quot;1 dynamic hole, 1 static blocked by: getVisitorCount at
                    app/blog/[slug]/page.tsx:5&quot;
                  </em>
                  . AI Agent lập tức suy luận hàm <code>getVisitorCount</code> đã vỡ shell → tự động
                  bao bọc bằng <code>&lt;Suspense&gt;</code>.
                </p>
              </InfoBox>
            </CardContent>
          </Card>
        </div>

        {/* ── Codemod & Tooling ── */}
        <div>
          <SectionHeader
            icon={Wrench}
            title="Codemod, Typegen & Công Cụ Tự Động Hóa"
            description="Công cụ chính thức để duy trì codebase chuẩn 16.2.9 — tự động tái cấu trúc, tạo types, và kiểm tra lỗi."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <InfoBox label="Codemod" variant="highlight">
                  <p>
                    <code>npx @next/codemod@canary upgrade latest</code> — tự động di chuyển cấu
                    hình sang Turbopack, gỡ bỏ tiền tố <code>unstable_</code> cho các API đã ổn định
                    (<code>cacheLife</code>, <code>cacheTag</code>).
                  </p>
                </InfoBox>

                <InfoBox label="npx next typegen" variant="info">
                  <p>
                    Tái tạo <code>PageProps</code> và <code>RouteContext</code> types.{' '}
                    <code>params</code> và <code>searchParams</code> là Promise bắt buộc. Không
                    handcraft các interfaces này — chúng sẽ drift.
                  </p>
                </InfoBox>

                <InfoBox label="Error Boundaries" variant="info">
                  <p>
                    Sử dụng <code>unstable_catchError()</code> cho framework-aware error boundaries
                    — đảm bảo <code>redirect()</code>, <code>notFound()</code>,{' '}
                    <code>unauthorized()</code> hoạt động xuyên qua ranh giới lỗi.
                  </p>
                </InfoBox>

                <InfoBox label="CI/CD + AI Integration" variant="highlight">
                  <p>
                    Phân phối <code>AGENTS.md</code> xuyên suốt Monorepo. Tích hợp{' '}
                    <code>next-browser</code> tests vào PR reviews — tự động phát hiện static shell
                    leakages.
                  </p>
                </InfoBox>
              </div>

              <CodeBlock
                code={`# Công cụ chuẩn 16.2.9
npx @next/codemod@canary upgrade latest   # Codemod tự động
npx next typegen                          # Tái tạo types

# Kiểm tra chất lượng
bun run typecheck
bun run lint
bun run test
bun run build`}
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Ecosystem Partners ── */}
        <div>
          <SectionHeader
            icon={Database}
            title="Hệ Sinh Thái Mở Rộng: ORMs, Auth, Tailwind v4"
            description="Tích hợp sâu với Prisma v7, Drizzle, Auth.js v5, Better Auth, Clerk và Tailwind CSS v4 — cùng điểm lưu ý với Turbopack."
          />

          <Card>
            <CardContent className="space-y-4 pt-6">
              <InfoBox label="Lớp Dữ Liệu">
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Prisma v7:</strong> Kiến trúc driver-adapters. Cần{' '}
                    <code>serverExternalPackages: [&#39;@prisma/client&#39;, &#39;pg&#39;]</code>{' '}
                    cho Turbopack.
                  </li>
                  <li>
                    <strong>Drizzle ORM:</strong> ESM native, tương thích hoàn hảo Turbopack.{' '}
                    <code>__drizzle_migrations</code> bảo toàn bảng cái khi di chuyển provider.
                  </li>
                </ul>
              </InfoBox>

              <InfoBox label="Xác Thực & Phân Quyền">
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>Auth.js v5:</strong> Split config pattern qua{' '}
                    <code>auth.config.ts</code> — cô lập Prisma Adapter ở server routes.
                  </li>
                  <li>
                    <strong>Better Auth:</strong> 100% quyền sở hữu session tables — ưu việt cho
                    B2B/SaaS.
                  </li>
                  <li>
                    <strong>Clerk:</strong> Tích hợp nhanh nhất nhưng rủi ro vendor lock-in.
                  </li>
                </ul>
              </InfoBox>

              <InfoBox label="Tailwind CSS v4 + Turbopack">
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    <strong>CSS-Native Config:</strong> Token khai báo qua <code>@theme</code>,
                    không cần file JS.
                  </li>
                  <li>
                    <strong>Core Rust Engine:</strong> Biên dịch 5x nhanh, khởi động dưới 100ms.
                  </li>
                  <li>
                    <strong>Cảnh báo:</strong> JIT scanner đôi khi bỏ sót arbitrary value classes (
                    <code>h-[80vh]</code>, <code>z-[100]</code>). Workaround: React Inline Styles +{' '}
                    <code>@source &quot;tailwind-safelist.txt&quot;</code>.
                  </li>
                </ul>
              </InfoBox>

              <CodeBlock
                code={`// next.config.ts — Prisma + Turbopack
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'pg'],
};

// auth.config.ts — Auth.js v5 split config
export const authConfig = {
  providers: [/* ... */],
  // DB adapter isolated in server-only routes
};`}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
