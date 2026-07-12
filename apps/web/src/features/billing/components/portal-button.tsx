'use client';

import { useState } from 'react';
import { Button } from '@pumni/ui/form';
import { createPortalSession } from '../actions';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

interface PortalButtonProps {
  tier: string;
}

export function PortalButton({ tier }: PortalButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const isFree = tier === 'free';

  const handlePortal = async () => {
    if (isFree) return;
    setIsPending(true);
    try {
      const res = await createPortalSession();
      if (res.ok) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.message);
        setIsPending(false);
      }
    } catch (err) {
      toast.error('Không thể mở cổng quản lý tài khoản.');
      console.error(err);
      setIsPending(false);
    }
  };

  if (isFree) {
    return null;
  }

  return (
    <Button
      onClick={handlePortal}
      disabled={isPending}
      variant="outline"
      className="flex items-center justify-center gap-1.5"
    >
      <CreditCard className="size-4" />
      {isPending ? 'Đang tải cổng quản lý...' : 'Quản lý đăng ký (Polar)'}
    </Button>
  );
}
