'use server';

import 'server-only';
import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import { getPolarClient, productIdFor } from './polar';
import { serverEnv } from '@pumni/env/server';
import { type ActionResult, actionFailure, parseActionInput } from '../../shared/lib/action-result';
import { withRateLimit } from '../../shared/lib/rate-limit';
import { checkoutSchema, type CheckoutInput } from '@pumni/validators';
import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';
import { captureServerEvent } from '../../shared/lib/analytics';

export async function createCheckoutSession(
  input: CheckoutInput
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireUser();
    const reqHeaders = await headers();
    const ip = reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;

    const parsed = parseActionInput(
      checkoutSchema,
      input,
      'Dữ liệu thanh toán không hợp lệ.'
    );
    if (!parsed.ok) return parsed;

    const rateLimitResult = await withRateLimit(`billing:${user.id}`, async () => {
      return Sentry.withServerActionInstrumentation(
        'createCheckoutSession',
        {
          headers: reqHeaders,
          recordResponse: true,
        },
        async () => {
          const { tier, interval } = parsed.data;
          const userId = user.id;

          const supabase = await createSupabaseServerClient();
          const { data: customer } = await supabase
            .from('billing_customers')
            .select('provider_customer_id')
            .eq('user_id', userId)
            .maybeSingle();

          const polar = getPolarClient();
          const appUrl = serverEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

          await captureServerEvent(userId, 'checkout_started', {
            tier,
            interval,
          });

          const checkout = await polar.checkouts.create({
            products: [productIdFor(tier, interval)],
            externalCustomerId: userId,
            customerId: customer?.provider_customer_id || undefined,
            successUrl: `${appUrl}/settings/account?checkout=success`,
            metadata: { userId },
            customerEmail: user.email || undefined,
            customerIpAddress: ip,
          });

          if (!checkout.url) {
            throw new Error('Polar did not return a checkout URL.');
          }

          return { ok: true as const, data: { url: checkout.url } };
        }
      );
    });

    return rateLimitResult;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    Sentry.captureException(error);
    return actionFailure(error, 'Không thể khởi tạo phiên thanh toán. Vui lòng thử lại sau.');
  }
}

export async function createPortalSession(): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireUser();
    const reqHeaders = await headers();

    const rateLimitResult = await withRateLimit(`billing:${user.id}`, async () => {
      return Sentry.withServerActionInstrumentation(
        'createPortalSession',
        {
          headers: reqHeaders,
          recordResponse: true,
        },
        async () => {
          const userId = user.id;

          const supabase = await createSupabaseServerClient();
          const { data: customer, error: customerError } = await supabase
            .from('billing_customers')
            .select('provider_customer_id')
            .eq('user_id', userId)
            .maybeSingle();

          if (customerError || !customer?.provider_customer_id) {
            const errorMsg = `No billing customer found for user ${userId}`;
            console.error(errorMsg, customerError);
            Sentry.captureMessage(errorMsg, 'warning');
            return {
              ok: false as const,
              message: 'Bạn chưa có thông tin đăng ký thanh toán. Vui lòng đăng ký gói dịch vụ trước.',
            };
          }

          const polar = getPolarClient();
          const session = await polar.customerSessions.create({
            customerId: customer.provider_customer_id,
          });

          if (!session.customerPortalUrl) {
            throw new Error('Polar did not return a customer portal URL.');
          }

          return { ok: true as const, data: { url: session.customerPortalUrl } };
        }
      );
    });

    return rateLimitResult;
  } catch (error) {
    console.error('Failed to create customer portal session:', error);
    Sentry.captureException(error);
    return actionFailure(error, 'Không thể truy cập trang quản lý thanh toán. Vui lòng thử lại sau.');
  }
}
