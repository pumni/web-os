import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@pumni/auth";
import { serverEnv } from "@pumni/env/server";
import { createSupabaseServerClient } from "@pumni/supabase/server";
import { getStreamingToken, toDashedUuid } from "@pumni/jellyfin";
import type { JellyfinMediaStream } from "@pumni/jellyfin";
import { getMediaDetail, getMediaPlaybackInfo, MediaPlayer } from "@/features/media";

interface PageProps {
  params: Promise<{
    itemId: string;
  }>;
}

export const unstable_instant = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { itemId } = await params;
    const item = await getMediaDetail(itemId);
    if (!item) {
      return {
        title: "Xem Phim - Cinema",
      };
    }
    return {
      title: `Đang phát: ${item.Name} - Cinema`,
    };
  } catch {
    return {
      title: "Xem Phim - Cinema",
    };
  }
}

export default async function WatchPage({ params }: PageProps) {
  const { itemId } = await params;
  const user = await requireUser();

  const item = await getMediaDetail(itemId);
  if (!item) {
    notFound();
  }

  // Retrieve Jellyfin playback info (server-side; small JSON).
  const playbackInfo = await getMediaPlaybackInfo(itemId);
  const mediaSource = playbackInfo?.MediaSources?.[0];
  const mediaSourceId = mediaSource?.Id || toDashedUuid(itemId);

  // Mint the scoped, low-privilege streaming token once, up front — both the
  // video (HLS) and subtitle tracks are fetched DIRECTLY from Jellyfin over
  // Tailscale with it, so no media bytes traverse Vercel.
  const { accessToken } = await getStreamingToken();
  const base = serverEnv.NEXT_PUBLIC_JELLYFIN_URL;
  const dashedId = toDashedUuid(itemId);

  // Filter for text-based subtitles (SRT, VTT, ASS, etc.). Burned-in/image
  // subtitles (pgssub/vobsub/dvdsub) can't render as <track> cues.
  const subtitleTracks = (mediaSource?.MediaStreams ?? [])
    .filter(
      (stream: JellyfinMediaStream) =>
        stream.Type === "Subtitle" &&
        stream.Codec !== "pgssub" &&
        stream.Codec !== "vobsub" &&
        stream.Codec !== "dvdsub"
    )
    .map((stream: JellyfinMediaStream) => ({
      index: stream.Index,
      language: stream.Language || "und",
      label: stream.DisplayTitle || stream.Language || `Track ${stream.Index}`,
      // Direct WebVTT straight from Jellyfin over Tailscale (no Vercel hop).
      url: `${base}/Videos/${dashedId}/${mediaSourceId}/Subtitles/${stream.Index}/0/Stream.vtt?api_key=${accessToken}`,
    }));

  // Technical details for the player's "stats" overlay.
  const videoStream = (mediaSource?.MediaStreams ?? []).find((s) => s.Type === "Video");
  const audioStream = (mediaSource?.MediaStreams ?? []).find((s) => s.Type === "Audio");

  const mediaInfo = {
    container: mediaSource?.Container || "unknown",
    videoCodec: videoStream?.Codec || "unknown",
    audioCodec: audioStream?.Codec || "unknown",
    originalWidth: videoStream?.Width || 0,
    originalHeight: videoStream?.Height || 0,
    originalBitrate: mediaSource?.Bitrate || 0,
    fps: videoStream?.AverageFrameRate || videoStream?.RealFrameRate || 0,
  };

  const supabase = await createSupabaseServerClient();
  const { data: watchHistory } = await supabase
    .from("media_watch_history")
    .select("position_ticks")
    .eq("user_id", user.id)
    .eq("jellyfin_item_id", itemId)
    .maybeSingle();

  const startPositionTicks = watchHistory?.position_ticks ?? 0;

  // Mint the scoped, low-privilege streaming token and build a DIRECT HLS URL
  // against the public Tailscale base. The browser streams segments straight
  // from Jellyfin — no video bytes traverse Vercel. The admin JELLYFIN_API_KEY
  // never leaves the server.
  // MPEG-TS HLS segments only carry H.264 video + AAC/MP3 audio. Advertising
  // exactly what the segment container supports lets Jellyfin remux (lossless,
  // cheap) when the source is already H.264/AAC, and transcode only otherwise —
  // claiming HEVC/Opus here would produce unplayable segments.
  const hlsParams = new URLSearchParams({
    api_key: accessToken,
    MediaSourceId: mediaSourceId,
    DeviceId: "pumni-web-os-browser",
    VideoCodec: "h264",
    AudioCodec: "aac,mp3",
    TranscodingMaxAudioChannels: "2",
    SegmentContainer: "ts",
    MinSegments: "1",
    BreakOnNonKeyFrames: "true",
  });
  const src = `${base}/Videos/${dashedId}/master.m3u8?${hlsParams.toString()}`;

  return (
    <div className="w-full max-w-5xl">
      <MediaPlayer
        itemId={itemId}
        title={item.Name}
        startPositionTicks={startPositionTicks}
        src={src}
        subtitleTracks={subtitleTracks}
        mediaInfo={mediaInfo}
      />
    </div>
  );
}
