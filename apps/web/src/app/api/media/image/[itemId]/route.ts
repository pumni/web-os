import { NextRequest } from "next/server";
import { getCurrentUser } from "@pumni/auth";
import { serverEnv } from "@pumni/env/server";
import { getJellyfinAuthHeaders, toDashedUuid } from "@pumni/jellyfin";

// Only forward a known-safe set of Jellyfin image params (avoid blindly
// proxying arbitrary query string to the upstream).
const ALLOWED_IMAGE_PARAMS = new Set([
  "fillWidth",
  "fillHeight",
  "width",
  "height",
  "quality",
  "tag",
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { itemId } = await params;
  const uuidRegex = /^[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}$/i;
  if (!uuidRegex.test(itemId)) {
    return new Response("Invalid Item ID", { status: 400 });
  }

  const searchParams = req.nextUrl.searchParams;
  const imageType = searchParams.get("type") || "Primary";

  if (!["Primary", "Backdrop", "Thumb", "Logo"].includes(imageType)) {
    return new Response("Invalid Image Type", { status: 400 });
  }

  const formattedId = toDashedUuid(itemId);

  const upstreamParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (ALLOWED_IMAGE_PARAMS.has(key)) upstreamParams.set(key, value);
  }

  const jellyfinUrl = `${serverEnv.JELLYFIN_URL}/Items/${formattedId}/Images/${imageType}?${upstreamParams.toString()}`;

  try {
    const response = await fetch(jellyfinUrl, {
      headers: getJellyfinAuthHeaders(),
    });

    if (!response.ok) {
      return new Response("Image not found", { status: response.status });
    }

    const headers = new Headers();
    headers.set("Content-Type", response.headers.get("Content-Type") || "image/jpeg");
    // Cache the image for 1 year
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Failed to proxy Jellyfin image:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
