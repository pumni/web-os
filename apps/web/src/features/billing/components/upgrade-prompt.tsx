'use client';

import { ShieldAlert, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@pumni/ui/form';
import { createCheckoutSession } from '../actions';
import { toast } from 'sonner';

interface UpgradePromptProps {
  title?: string;
  message?: string;
  tier?: string;
}

export function UpgradePrompt({
  title = 'Yêu cầu nâng cấp gói',
  message = 'Bạn đã đạt giới hạn của tài khoản. Hãy nâng cấp gói dịch vụ để mở khóa thêm giới hạn.',
  tier = 'pro',
}: UpgradePromptProps) {
  const [isPending, setIsPending] = useState(false);

  const handleUpgrade = async () => {
    setIsPending(true);
    try {
      const res = await createCheckoutSession({ tier: tier as 'pro' | 'max', interval: 'monthly' });
      if (res.ok) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.message);
        setIsPending(false);
      }
    } catch (err) {
      toast.error('Không thể khởi tạo phiên thanh toán.');
      console.error(err);
      setIsPending(false);
    }
  };

  return (
    <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 flex flex-col gap-3">
      <div className="flex gap-2.5 text-warning">
        <ShieldAlert className="size-5 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold leading-none">{title}</span>
          <span className="text-xs text-muted-foreground leading-normal">
            {message}
          </span>
        </div>
      </div>
      <Button
        type="button"
        onClick={handleUpgrade}
        disabled={isPending}
        variant="outline"
        className="w-full flex items-center justify-center gap-1.5 border-primary/30 text-primary hover:bg-primary/5 text-xs h-9"
      >
        <Zap className="size-3.5 fill-primary text-primary" />
        {isPending ? 'Đang chuẩn bị thanh toán...' : 'Nâng cấp gói dịch vụ'}
      </Button>
    </div>
  );
}
