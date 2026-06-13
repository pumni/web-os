"use server";

import { updateTag } from "next/cache";
import { requireUser } from "@pumni/auth";
import { createSupabaseServerClient } from "@pumni/supabase/server";
import { profileSchema, type ProfileInput } from "@pumni/validators";

export type UpdateProfileResult = { ok: true } | { ok: false; message: string };

export async function updateProfile(input: ProfileInput): Promise<UpdateProfileResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid profile data.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username || null,
      full_name: parsed.data.fullName || null,
      avatar_url: parsed.data.avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  // Synchronize auth user metadata so requireUser() returns updated data instantly
  const { error: authError } = await supabase.auth.updateUser({
    data: {
      avatar_url: parsed.data.avatarUrl || null,
      full_name: parsed.data.fullName || null,
    },
  });

  if (authError) {
    console.error("Failed to sync user metadata to auth:", authError.message);
  }

  updateTag(`profile:${user.id}`);

  return { ok: true };
}
