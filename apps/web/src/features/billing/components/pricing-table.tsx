import 'server-only';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardWell } from '@pumni/ui/layout';
import { Button } from '@pumni/ui/form';
import { getEntitlements, getPlans } from '../queries';
import { CheckoutButton } from './checkout-button';
import { Check } from 'lucide-react';

interface PricingTableProps {
  interval?: 'monthly' | 'yearly';
}

export async function PricingTable({ interval = 'monthly' }: PricingTableProps) {
  const entitlements = await getEntitlements();
  const currentTier = entitlements.tier;

  const plansList = await getPlans();

  const prices = {
    free: { monthly: 0, yearly: 0 },
    pro: { monthly: 5, yearly: 48 },
    max: { monthly: 15, yearly: 144 },
  };

  const planFeatures = {
    free: [
      'Phát video thời gian thực',
      'Đồng bộ hóa độ trễ thấp',
      'Hỗ trợ YouTube & Link trực tiếp',
    ],
    pro: [
      'Tất cả tính năng của gói Free',
      'Phòng hoạt động đồng thời nhiều hơn',
      'Giới hạn thành viên lớn hơn',
      'Độ ưu tiên truyền tải cao',
    ],
    max: [
      'Tất cả tính năng của gói Pro',
      'Không giới hạn số lượng phòng hoạt động',
      'Không giới hạn thành viên trong phòng',
      'Hỗ trợ kỹ thuật 24/7 chuyên biệt',
    ],
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plansList.map((plan) => {
        const tier = plan.tier as 'free' | 'pro' | 'max';
        const price = prices[tier][interval];
        const isCurrent = currentTier === tier;
        const features = planFeatures[tier];

        return (
          <Card key={tier} className={`relative flex flex-col justify-between ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
            {isCurrent && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-2xs font-semibold uppercase text-primary-foreground shadow-sm shadow-primary/20">
                Gói hiện tại
              </span>
            )}
            <CardHeader>
              <CardTitle className="capitalize text-lg font-bold">{tier}</CardTitle>
              <CardDescription>
                {tier === 'free'
                  ? 'Trải nghiệm xem chung cơ bản cùng bạn bè.'
                  : tier === 'pro'
                  ? 'Dành cho nhóm bạn và cộng đồng nhỏ.'
                  : 'Không giới hạn tính năng và thành viên.'}
              </CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-tight">${price}</span>
                <span className="text-sm text-muted-foreground">/{interval === 'monthly' ? 'tháng' : 'năm'}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <CardWell className="p-4 rounded-md mb-6">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-3 tracking-wide">
                  Thông số giới hạn
                </div>
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Số phòng tối đa:</span>
                    <span className="font-bold text-foreground">
                      {plan.max_active_rooms ?? 'Không giới hạn'}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Thành viên mỗi phòng:</span>
                    <span className="font-bold text-foreground">
                      {plan.max_room_members ?? 'Không giới hạn'}
                    </span>
                  </li>
                </ul>
              </CardWell>

              <ul className="space-y-2.5 text-xs text-muted-foreground">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="size-3.5 text-primary shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-6">
              {tier === 'free' ? (
                <Button variant="outline" className="w-full text-xs" disabled>
                  Mặc định
                </Button>
              ) : (
                <CheckoutButton tier={tier} interval={interval} currentTier={currentTier} />
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
