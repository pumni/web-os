'use server';

import { updateTag } from 'next/cache';
import { requireUser } from '@pumni/auth';
import { createSupabaseServerClient } from '@pumni/supabase/server';
import { profileSchema, type ProfileInput } from '@pumni/validators';
import { actionFailure } from '../../shared/lib/action-result';
import { withRateLimit } from '../../shared/lib/rate-limit';
import { recordAuditEvent } from '../../shared/lib/audit';

export type UpdateProfileResult = { ok: true } | { ok: false; message: string };

export async function updateProfile(input: ProfileInput): Promise<UpdateProfileResult> {
  const user = await requireUser();
  return withRateLimit(`profile:${user.id}`, async () => {
    const parsed = profileSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        message: 'Invalid profile data.',
      };
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        username: parsed.data.username || null,
        full_name: parsed.data.fullName || null,
        avatar_url: parsed.data.avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      return actionFailure(error, 'Không thể cập nhật thông tin cá nhân. Vui lòng thử lại sau.');
    }

    // Synchronize auth user metadata so requireUser() returns updated data instantly
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        avatar_url: parsed.data.avatarUrl || null,
        full_name: parsed.data.fullName || null,
      },
    });

    if (authError) {
      console.error('Failed to sync user metadata to auth:', authError.message);
    }

    updateTag(`profile:${user.id}`);

    await recordAuditEvent({
      actorId: user.id,
      action: 'profile.updated',
      entityType: 'profile',
      entityId: user.id,
      metadata: {
        username: parsed.data.username || null,
        fullName: parsed.data.fullName || null,
      },
    });

    return { ok: true };
  });
}
