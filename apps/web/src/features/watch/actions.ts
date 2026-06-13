"use server";

import { requireUser } from "@pumni/auth";
import { createSupabaseServerClient } from "@pumni/supabase/server";
import { createRoomSchema, setSourceSchema, type CreateRoomInput, type SetSourceInput } from "@pumni/validators";
import { randomBytes } from "crypto";
import { extractYouTubeId, isValidHttpUrl } from "./sync-math";
import { revalidatePath } from "next/cache";

export type ActionResult<T = void> = 
  | { ok: true; data: T }
  | { ok: false; message: string };

function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    const val = bytes[i];
    if (val !== undefined) {
      code += chars[val % chars.length];
    }
  }
  return code;
}


export async function createRoom(input: CreateRoomInput): Promise<ActionResult<{ roomId: string; code: string }>> {
  const user = await requireUser();
  const parsed = createRoomSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Dữ liệu tạo phòng không hợp lệ." };
  }

  let sanitizedRef = parsed.data.sourceRef.trim();
  if (parsed.data.sourceType === "youtube") {
    const ytId = extractYouTubeId(sanitizedRef);
    if (!ytId) {
      return { ok: false, message: "Link hoặc ID video YouTube không hợp lệ." };
    }
    sanitizedRef = ytId;
  } else {
    if (!isValidHttpUrl(sanitizedRef)) {
      return { ok: false, message: "URL video trực tiếp không hợp lệ." };
    }
  }

  const supabase = await createSupabaseServerClient();

  // Retry logic for generating unique code
  let attempts = 0;
  while (attempts < 3) {
    const code = generateJoinCode();
    const { data, error } = await supabase
      .from("watch_rooms")
      .insert({
        code,
        host_id: user.id,
        source_type: parsed.data.sourceType,
        source_ref: sanitizedRef,
        is_playing: false,
        anchor_position: 0,
        playback_rate: 1,
        anchor_server_ts: new Date().toISOString(),
      })
      .select("id, code")
      .maybeSingle();

    if (!error && data) {
      revalidatePath("/watch");
      return { ok: true, data: { roomId: data.id, code: data.code } };
    }

    if (error && error.code !== "23505") { // 23505 is unique violation code in Postgres
      return { ok: false, message: error.message };
    }

    attempts++;
  }

  return { ok: false, message: "Không thể khởi tạo mã phòng độc nhất. Vui lòng thử lại." };
}

export async function setRoomSource(input: SetSourceInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = setSourceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Dữ liệu nguồn phát không hợp lệ." };
  }

  let sanitizedRef = parsed.data.sourceRef.trim();
  if (parsed.data.sourceType === "youtube") {
    const ytId = extractYouTubeId(sanitizedRef);
    if (!ytId) {
      return { ok: false, message: "Link hoặc ID video YouTube không hợp lệ." };
    }
    sanitizedRef = ytId;
  } else {
    if (!isValidHttpUrl(sanitizedRef)) {
      return { ok: false, message: "URL video trực tiếp không hợp lệ." };
    }
  }

  const supabase = await createSupabaseServerClient();

  // Enforce host boundary (also verified by RLS)
  const { data: room, error: fetchError } = await supabase
    .from("watch_rooms")
    .select("host_id")
    .eq("id", parsed.data.roomId)
    .maybeSingle();

  if (fetchError || !room) {
    return { ok: false, message: "Phòng không tồn tại." };
  }

  if (room.host_id !== user.id) {
    return { ok: false, message: "Chỉ quản phòng (host) mới có quyền đổi nguồn phát." };
  }

  const { error } = await supabase
    .from("watch_rooms")
    .update({
      source_type: parsed.data.sourceType,
      source_ref: sanitizedRef,
      is_playing: false,
      anchor_position: 0,
      playback_rate: 1,
      anchor_server_ts: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.roomId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/watch/${parsed.data.roomId}`);
  return { ok: true, data: undefined };
}

export async function deleteRoom(roomId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Check host owner
  const { data: room, error: fetchError } = await supabase
    .from("watch_rooms")
    .select("host_id")
    .eq("id", roomId)
    .maybeSingle();

  if (fetchError || !room) {
    return { ok: false, message: "Phòng không tồn tại." };
  }

  if (room.host_id !== user.id) {
    return { ok: false, message: "Chỉ quản phòng (host) mới có quyền xóa phòng." };
  }

  const { error } = await supabase
    .from("watch_rooms")
    .delete()
    .eq("id", roomId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/watch");
  revalidatePath(`/watch/${roomId}`);
  return { ok: true, data: undefined };
}

export async function joinByCode(code: string): Promise<ActionResult<{ roomId: string }>> {
  await requireUser();
  const supabase = await createSupabaseServerClient();
  const cleanCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from("watch_rooms")
    .select("id")
    .eq("code", cleanCode)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Mã phòng không tồn tại. Vui lòng kiểm tra lại." };
  }

  return { ok: true, data: { roomId: data.id } };
}
