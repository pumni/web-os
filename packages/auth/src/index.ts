import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@pumni/supabase/server";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
});

export const verifySession = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return {
    isAuth: true,
    userId: user.id,
    user,
  };
});

export async function requireUser() {
  const { user } = await verifySession();

  return user;
}
