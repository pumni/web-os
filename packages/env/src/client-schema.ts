import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  // Public HTTPS base URL of the Jellyfin server, exposed over Tailscale Serve
  // (`<host>.<tailnet>.ts.net`) or Funnel. Safe to expose: it is only a hostname
  // the browser connects to directly for HLS streaming — no secret.
  NEXT_PUBLIC_JELLYFIN_URL: z.string().url(),
});
