import { clientEnvSchema } from "./client-schema";
import { z } from "zod";

export const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Server-side base URL of Jellyfin (may be the internal/tailnet address).
  JELLYFIN_URL: z.string().url(),
  // Admin API key — SERVER-ONLY. Used only for library browsing; never sent to
  // the browser. The browser instead receives a scoped, low-privilege user
  // AccessToken minted from JELLYFIN_USER/JELLYFIN_PASSWORD below.
  JELLYFIN_API_KEY: z.string().min(1),
  // Dedicated low-privilege Jellyfin user (library read-only). The server
  // authenticates as this user to mint the AccessToken handed to the player.
  JELLYFIN_USER: z.string().min(1),
  JELLYFIN_PASSWORD: z.string().min(1),
});
