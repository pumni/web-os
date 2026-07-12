'use client';

import { useState } from 'react';
import { Button } from '@pumni/ui/form';
import { createCheckoutSession } from '../actions';
import { toast } from 'sonner';
import { Zap } from 'lucide-react';

interface CheckoutButtonProps {
  tier: 'pro' | 'max';
  interval: 'monthly' | 'yearly';
  currentTier?: string;
}

export function CheckoutButton({ tier, interval, currentTier }: CheckoutButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const isCurrent = currentTier === tier;

  const handleCheckout = async () => {
    if (isCurrent) return;
    setIsPending(true);
    try {
      const res = await createCheckoutSession({ tier, interval });
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
    <Button
      onClick={handleCheckout}
      disabled={isPending || isCurrent}
      variant={isCurrent ? 'outline' : 'default'}
      className="w-full flex items-center justify-center gap-1.5"
    >
      <Zap className="size-4 fill-current" />
      {isCurrent ? 'Đang sử dụng' : isPending ? 'Đang chuyển hướng...' : 'Nâng cấp ngay'}
    </Button>
  );
}
