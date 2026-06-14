import "server-only";
import { NextRequest } from "next/server";
import { createSupabaseServiceRoleClient } from "@pumni/supabase/service-role";



export async function GET(request: NextRequest) {
  // Chặn truy cập công khai: chỉ Vercel Cron (kèm header bí mật) được gọi.
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const supabase = createSupabaseServiceRoleClient();
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("watch_rooms")
    .delete()
    .lt("last_active_at", cutoff);
  if (error) {
    console.error("watch cleanup failed", error);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
