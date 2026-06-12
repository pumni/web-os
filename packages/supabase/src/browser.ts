import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@pumni/env/client";
import type { Database } from "./types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
