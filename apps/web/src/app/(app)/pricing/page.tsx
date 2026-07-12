import { Suspense } from 'react';
import { PricingTable } from '@/features/billing';
import { Button } from '@pumni/ui/form';
import Link from 'next/link';
import type { Route } from 'next';
import { PostHogPageTracker } from '@/shared/components/posthog-page-tracker';

export const metadata = {
  title: 'Bảng giá - Pumni Web OS',
  description: 'Bảng giá dịch vụ và các gói nâng cấp thành viên của Pumni Web OS.',
};

interface PricingPageProps {
  searchParams: Promise<{
    interval?: 'monthly' | 'yearly';
  }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const { interval = 'monthly' } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-16 space-y-8">
      <PostHogPageTracker eventName="pricing_page_viewed" />
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Bảng giá dịch vụ Pumni
        </h1>
        <p className="mx-auto max-w-xl text-sm md:text-base text-muted-foreground">
          Chọn gói dịch vụ phù hợp nhất để thỏa sức xem chung video không giới hạn cùng bạn bè.
        </p>

        <div className="inline-flex items-center gap-2 rounded-full border border-border p-1 bg-muted/50 mt-4 select-none">
          <Link href={'/pricing?interval=monthly' as Route} replace>
            <Button
              variant={interval === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full text-xs h-8 px-4"
            >
              Hàng tháng
            </Button>
          </Link>
          <Link href={'/pricing?interval=yearly' as Route} replace>
            <Button
              variant={interval === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full text-xs h-8 px-4"
            >
              Hàng năm (Tiết kiệm 20%)
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-12 text-sm text-muted-foreground">Đang tải bảng giá...</div>}>
        <PricingTable interval={interval} />
      </Suspense>
    </div>
  );
}
