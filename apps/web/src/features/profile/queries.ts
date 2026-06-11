import { requireUser } from "@pumni/auth";
import { createSupabaseServerClient } from "@pumni/supabase/server";

export async function getCurrentProfile() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    // If user registration trigger was slow or not completed, we return a fallback profile
    if (error.code === "PGRST116") {
      return {
        id: user.id,
        username: null,
        full_name: user.user_metadata["full_name"] || null,
        avatar_url: user.user_metadata["avatar_url"] || null,
      };
    }
    throw new Error(error.message);
  }

  return data;
}
