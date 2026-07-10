'use client';

import * as React from 'react';
import { Badge } from '@pumni/ui/feedback';
import { Button } from '@pumni/ui/form';
import { IconBadge, Separator } from '@pumni/ui/layout';
import { Layers, LayoutGrid, Sliders, Sparkles } from 'lucide-react';
import { GlassPlayground, BentoSimulator, DesignTrendsFooter } from '@/features/design-trends';

// ────────────────────────────────────────────────────────────────────────────
// Gold reference for the glassmorphism surface rule (ADR-0015).
//
// This page is the living teaching example for the rule ADR-0015 makes
// first-class: a glass surface (glass-panel / GlassSurface)
// only reads as glassmorphism when it has a colourful backdrop to refract.
// Every glass element below is wrapped in the canonical 2-blob backdrop
// (`--desktop-blob-primary` / `--desktop-blob-secondary`), and the page uses
// only semantic tokens + design-system primitives — no raw `rgba()`, no raw
// `backdrop-filter`, no raw Tailwind palette. The APCA readout proves the
// Lc 60 gate the design system enforces.
// ────────────────────────────────────────────────────────────────────────────

export default function DesignTrendsPage() {
  const [activeTab, setActiveTab] = React.useState<'all' | 'glass' | 'bento'>('all');

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-6">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 surface-raised md:p-8">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 size-64 rounded-full bg-primary/10 blur-3xl"
        />
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
              <h2 className="text-2xl font-bold tracking-tight">
                1. Hiệu Ứng Kính Mờ (Glassmorphism)
              </h2>
              <p className="text-sm text-muted-foreground">
                Mô hình 6 thành phần (ADR-0014) + kỷ luật backdrop (ADR-0015).
              </p>
            </div>
          </div>

          <GlassPlayground />
        </section>
      )}

      {activeTab === 'all' && <Separator className="my-8" />}

      {/* ── BENTO GRID ── */}
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

          <BentoSimulator />
        </section>
      )}

      {/* ── FOOTER GUIDELINE CHECKLIST ── */}
      <Separator className="my-8" />
      <DesignTrendsFooter />
    </div>
  );
}
