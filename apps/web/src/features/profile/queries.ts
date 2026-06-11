import { requireUser } from "@pumni/auth";
import { createSupabaseServiceRoleClient } from "@pumni/supabase/service-role";
import { cacheLife, cacheTag } from "next/cache";

type ProfileFallback = {
  fullName: string | null;
  avatarUrl: string | null;
};

export async function getCurrentProfile() {
  const user = await requireUser();

  return getProfileByUserId(user.id, {
    fullName:
      typeof user.user_metadata["full_name"] === "string" ? user.user_metadata["full_name"] : null,
    avatarUrl:
      typeof user.user_metadata["avatar_url"] === "string"
        ? user.user_metadata["avatar_url"]
        : null,
  });
}

async function getProfileByUserId(userId: string, fallback: ProfileFallback) {
  "use cache";

  cacheTag(`profile:${userId}`);
  cacheLife("minutes");

  // Service role bypasses RLS; userId must come from requireUser() and stay in this filter.
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", userId)
    .single();

  if (error) {
    // If user registration trigger was slow or not completed, we return a fallback profile
    if (error.code === "PGRST116") {
      return {
        id: userId,
        username: null,
        full_name: fallback.fullName,
        avatar_url: fallback.avatarUrl,
      };
    }
    throw new Error(error.message);
  }

  return data;
}
