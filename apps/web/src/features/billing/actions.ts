'use server';

import 'server-only';
import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BillingDatabase } from './db-types';
import { getPolarClient, productIdFor } from './polar';
import { serverEnv } from '@pumni/env/server';
import { type ActionResult, actionFailure } from '@/shared/lib/action-result';
import type { Interval } from './types';
import * as Sentry from '@sentry/nextjs';

export async function createCheckoutSession(
  tier: 'pro' | 'max',
  interval: Interval
): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireUser();
    const userId = user.id;

    const supabase = (await createSupabaseServerClient()) as unknown as SupabaseClient<BillingDatabase>;
    const { data: customer } = await supabase
      .from('billing_customers')
      .select('provider_customer_id')
      .eq('user_id', userId)
      .single();

    const polar = getPolarClient();
    const appUrl = serverEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const checkout = await polar.checkouts.create({
      products: [productIdFor(tier, interval)],
      externalCustomerId: userId,
      customerId: customer?.provider_customer_id || undefined,
      successUrl: `${appUrl}/settings/account?checkout=success`,
      metadata: { userId },
      customerEmail: user.email || undefined,
    });

    if (!checkout.url) {
      throw new Error('Polar did not return a checkout URL.');
    }

    return { ok: true, data: { url: checkout.url } };
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    Sentry.captureException(error);
    return actionFailure(error, 'Không thể khởi tạo phiên thanh toán. Vui lòng thử lại sau.');
  }
}

export async function createPortalSession(): Promise<ActionResult<{ url: string }>> {
  try {
    const user = await requireUser();
    const userId = user.id;

    const supabase = (await createSupabaseServerClient()) as unknown as SupabaseClient<BillingDatabase>;
    const { data: customer, error: customerError } = await supabase
      .from('billing_customers')
      .select('provider_customer_id')
      .eq('user_id', userId)
      .single();

    if (customerError || !customer?.provider_customer_id) {
      const errorMsg = `No billing customer found for user ${userId}`;
      console.error(errorMsg, customerError);
      Sentry.captureMessage(errorMsg, 'warning');
      return {
        ok: false,
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

    return { ok: true, data: { url: session.customerPortalUrl } };
  } catch (error) {
    console.error('Failed to create customer portal session:', error);
    Sentry.captureException(error);
    return actionFailure(error, 'Không thể truy cập trang quản lý thanh toán. Vui lòng thử lại sau.');
  }
}
