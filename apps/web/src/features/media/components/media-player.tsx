"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  MediaPlayer as VidstackPlayer,
  MediaProvider,
  Track,
  Captions,
  Gesture,
  PlayButton,
  MuteButton,
  FullscreenButton,
  Time,
  useMediaState,
  useMediaRemote,
  useMediaPlayer,
  useVideoQualityOptions,
  useCaptionOptions,
  isHLSProvider,
  type MediaPlayerInstance,
  type MediaProviderAdapter,
} from "@vidstack/react";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/default/captions.css";
import { Button, Slider, GlassSurface } from "@pumni/ui";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  RotateCcw,
  Settings,
  Subtitles,
  Activity,
  Check,
} from "lucide-react";
import { reportPlaybackProgress } from "../actions";

interface SubtitleTrack {
  index: number;
  language: string;
  label: string;
  url: string;
}

interface MediaInfo {
  container: string;
  videoCodec: string;
  audioCodec: string;
  originalWidth: number;
  originalHeight: number;
  originalBitrate: number;
  fps: number;
}

interface MediaPlayerProps {
  itemId: string;
  title: string;
  startPositionTicks?: number;
  /** Direct HLS master playlist URL (Tailscale), token already embedded. */
  src: string;
  subtitleTracks?: SubtitleTrack[];
  mediaInfo?: MediaInfo;
}

const TICKS_PER_SECOND = 10_000_000;

export function MediaPlayer({
  itemId,
  title,
  startPositionTicks = 0,
  src,
  subtitleTracks = [],
  mediaInfo,
}: MediaPlayerProps) {
  const router = useRouter();
  const player = React.useRef<MediaPlayerInstance>(null);

  // Prefer the locally bundled hls.js over Vidstack's CDN default so playback
  // works offline-of-CDN and is version-pinned.
  const onProviderChange = React.useCallback((provider: MediaProviderAdapter | null) => {
    if (isHLSProvider(provider)) {
      provider.library = () => import("hls.js");
    }
  }, []);

  return (
    <VidstackPlayer
      ref={player}
      src={{ src, type: "application/x-mpegurl" }}
      title={title}
      crossOrigin="anonymous"
      playsInline
      keyTarget="document"
      load="eager"
      onProviderChange={onProviderChange}
      className="relative w-full aspect-video overflow-hidden rounded-2xl border border-border/20 shadow-2xl group select-none"
    >
      <MediaProvider>
        {subtitleTracks.map((track) => (
          <Track
            key={`${track.index}-${track.language}`}
            src={track.url}
            kind="subtitles"
            label={track.label}
            language={track.language}
            type="vtt"
          />
        ))}
      </MediaProvider>

      <StartPositionGate startSeconds={startPositionTicks / TICKS_PER_SECOND} />
      <ProgressReporter itemId={itemId} title={title} />

      {/* Tap-to-toggle gestures over the video surface */}
      <Gesture
        className="absolute inset-0 z-0 block"
        event="pointerup"
        action="toggle:paused"
      />
      <Gesture
        className="absolute inset-0 z-0 block"
        event="dblpointerup"
        action="toggle:fullscreen"
      />

      {/* Renders the cues of the selected text track. Without this the tracks
          load and are selectable but nothing is drawn on screen. We pin the cue
          font-size since we don't use Vidstack's default layout (which is what
          normally sets the --overlay-height the stock calc depends on). */}
      <Captions
        className="vds-captions pointer-events-none absolute inset-0 z-10"
        style={{ "--media-cue-font-size": "clamp(0.95rem, 3.4vw, 1.7rem)" }}
      />

      <PlayerChrome
        title={title}
        mediaInfo={mediaInfo}
        subtitleTracks={subtitleTracks}
        onBack={() => router.push(`/media/${itemId}` as Route)}
      />
    </VidstackPlayer>
  );
}

/** Seeks to the saved resume position once, the first time playback is ready. */
function StartPositionGate({ startSeconds }: { startSeconds: number }) {
  const remote = useMediaRemote();
  const canPlay = useMediaState("canPlay");
  const duration = useMediaState("duration");
  const done = React.useRef(false);

  React.useEffect(() => {
    if (done.current || !canPlay || startSeconds <= 0) return;
    // Don't resume if we're within 5s of the end.
    if (duration > 0 && startSeconds < duration - 5) {
      remote.seek(startSeconds);
    }
    done.current = true;
  }, [canPlay, duration, startSeconds, remote]);

  return null;
}

/** Reports playback progress to Supabase every 10s while playing. */
function ProgressReporter({ itemId, title }: { itemId: string; title: string }) {
  const player = useMediaPlayer();
  const paused = useMediaState("paused");

  React.useEffect(() => {
    if (paused || !player) return;
    const id = setInterval(() => {
      const positionTicks = Math.round(player.state.currentTime * TICKS_PER_SECOND);
      const runtimeTicks = Math.round(player.state.duration * TICKS_PER_SECOND);
      if (positionTicks > 0 && runtimeTicks > 0) {
        reportPlaybackProgress({ itemId, positionTicks, runtimeTicks, title }).catch((err) =>
          console.error("Failed to report progress:", err)
        );
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [paused, player, itemId, title]);

  return null;
}

interface ChromeProps {
  title: string;
  mediaInfo?: MediaInfo;
  subtitleTracks: SubtitleTrack[];
  onBack: () => void;
}

function PlayerChrome({ title, mediaInfo, subtitleTracks, onBack }: ChromeProps) {
  const paused = useMediaState("paused");
  const muted = useMediaState("muted");
  const volume = useMediaState("volume");
  const fullscreen = useMediaState("fullscreen");
  const currentTime = useMediaState("currentTime");
  const duration = useMediaState("duration");
  const waiting = useMediaState("waiting");
  const controlsVisible = useMediaState("controlsVisible");
  const remote = useMediaRemote();

  const [activeMenu, setActiveMenu] = React.useState<"subtitles" | "quality" | null>(null);
  const [showStats, setShowStats] = React.useState(false);

  const chromeShown = controlsVisible || activeMenu !== null || showStats;

  const handleSeek = React.useCallback(
    (values: number[]) => {
      if (values[0] !== undefined) remote.seeking(values[0]);
    },
    [remote]
  );
  const handleSeekCommit = React.useCallback(
    (values: number[]) => {
      if (values[0] !== undefined) remote.seek(values[0]);
    },
    [remote]
  );
  const handleVolume = React.useCallback(
    (values: number[]) => {
      if (values[0] !== undefined) remote.changeVolume(values[0]);
    },
    [remote]
  );

  return (
    <>
      {/* Buffering spinner (while actively loading, not when paused) */}
      {waiting && !paused && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="size-12 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
        </div>
      )}

      {/* Center play indicator */}
      {paused && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex size-16 scale-90 items-center justify-center rounded-full bg-primary/80 text-primary-foreground shadow-lg backdrop-blur-sm">
            <Play className="size-8 translate-x-0.5 fill-current" />
          </div>
        </div>
      )}

      {showStats && <StatsOverlay mediaInfo={mediaInfo} />}

      {/* Top bar */}
      <div
        className={`absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-overlay to-transparent p-4 transition-opacity duration-[var(--duration-base)] ${
          chromeShown ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full text-primary-foreground hover:bg-primary-foreground/10"
          aria-label="Quay lại"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <span className="max-w-[70%] truncate text-sm font-medium text-primary-foreground">{title}</span>
        <div className="size-9" />
      </div>

      {/* Menus */}
      {chromeShown && activeMenu === "quality" && (
        <QualityMenu onClose={() => setActiveMenu(null)} />
      )}
      {chromeShown && activeMenu === "subtitles" && (
        <CaptionMenu onClose={() => setActiveMenu(null)} />
      )}

      {/* Bottom bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 flex flex-col gap-4 bg-gradient-to-t from-overlay via-overlay/60 to-transparent p-4 transition-opacity duration-[var(--duration-base)] ${
          chromeShown ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex w-full items-center gap-3">
          <span className="w-12 text-right font-mono text-xs text-primary-foreground/80">
            <Time type="current" />
          </span>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            onValueCommit={handleSeekCommit}
            className="flex-1"
            aria-label="Tua phim"
          />
          <span className="w-12 text-left font-mono text-xs text-primary-foreground/80">
            <Time type="duration" />
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlayButton className="inline-flex size-9 items-center justify-center rounded-full text-primary-foreground transition-colors hover:bg-primary-foreground/10">
              {paused ? (
                <Play className="size-5 fill-current" />
              ) : (
                <Pause className="size-5 fill-current" />
              )}
            </PlayButton>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => remote.seek(Math.max(0, currentTime - 10))}
              className="rounded-full text-primary-foreground hover:bg-primary-foreground/10"
              aria-label="Lùi 10 giây"
            >
              <RotateCcw className="size-4" />
            </Button>
            <div className="ml-2 flex items-center gap-2">
              <MuteButton className="inline-flex size-9 items-center justify-center rounded-full text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </MuteButton>
              <Slider
                value={[muted ? 0 : volume]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={handleVolume}
                className="w-20 opacity-80 transition-opacity hover:opacity-100"
                aria-label="Âm lượng"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStats((p) => !p)}
              className={`rounded-full hover:bg-primary-foreground/10 ${
                showStats ? "text-primary" : "text-primary-foreground"
              }`}
              aria-label="Thống kê kỹ thuật"
            >
              <Activity className="size-5" />
            </Button>
            {subtitleTracks.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveMenu((p) => (p === "subtitles" ? null : "subtitles"))}
                className={`rounded-full text-primary-foreground hover:bg-primary-foreground/10 ${
                  activeMenu === "subtitles" ? "text-primary" : ""
                }`}
                aria-label="Phụ đề"
              >
                <Subtitles className="size-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveMenu((p) => (p === "quality" ? null : "quality"))}
              className={`rounded-full text-primary-foreground hover:bg-primary-foreground/10 ${
                activeMenu === "quality" ? "text-primary" : ""
              }`}
              aria-label="Chất lượng"
            >
              <Settings className="size-5" />
            </Button>
            <FullscreenButton className="inline-flex size-9 items-center justify-center rounded-full text-primary-foreground transition-colors hover:bg-primary-foreground/10">
              {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </FullscreenButton>
          </div>
        </div>
      </div>
    </>
  );
}

function QualityMenu({ onClose }: { onClose: () => void }) {
  const options = useVideoQualityOptions({ auto: "Tự động (ABR)", sort: "descending" });

  return (
    <GlassSurface className="absolute bottom-20 right-16 z-30 flex w-52 flex-col gap-1 border border-border/40 bg-background/80 p-3 backdrop-blur-md">
      <h4 className="mb-1 border-b border-border/20 px-2 py-1 text-xs font-semibold text-foreground">
        Chất lượng phát
      </h4>
      <div className="flex max-h-60 flex-col gap-1 overflow-y-auto pr-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              option.select();
              onClose();
            }}
            className="flex items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <span>
              {option.label}
              {option.bitrateText ? ` · ${option.bitrateText}` : ""}
            </span>
            {option.selected && <Check className="size-3.5 shrink-0 text-primary" />}
          </button>
        ))}
      </div>
    </GlassSurface>
  );
}

function CaptionMenu({ onClose }: { onClose: () => void }) {
  const options = useCaptionOptions({ off: "Không có phụ đề" });

  return (
    <GlassSurface className="absolute bottom-20 right-24 z-30 flex max-h-60 w-52 flex-col gap-1 border border-border/40 bg-background/80 p-3 backdrop-blur-md">
      <h4 className="mb-1 shrink-0 border-b border-border/20 px-2 py-1 text-xs font-semibold text-foreground">
        Phụ đề
      </h4>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              option.select();
              onClose();
            }}
            className="flex items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <span className="mr-2 truncate">{option.label}</span>
            {option.selected && <Check className="size-3.5 shrink-0 text-primary" />}
          </button>
        ))}
      </div>
    </GlassSurface>
  );
}

function StatsOverlay({ mediaInfo }: { mediaInfo?: MediaInfo }) {
  const quality = useMediaState("quality");
  const currentTime = useMediaState("currentTime");
  const bufferedEnd = useMediaState("bufferedEnd");

  const bufferHealth = Math.max(0, bufferedEnd - currentTime).toFixed(1);
  const resolution = quality
    ? `${quality.width ?? 0}x${quality.height ?? 0}`
    : `${mediaInfo?.originalWidth ?? 0}x${mediaInfo?.originalHeight ?? 0}`;
  const bitrate = quality?.bitrate
    ? `${(quality.bitrate / 1_000_000).toFixed(1)} Mbps`
    : `${((mediaInfo?.originalBitrate ?? 0) / 1_000_000).toFixed(1)} Mbps`;

  return (
    <GlassSurface className="pointer-events-none absolute left-4 top-16 z-30 flex w-64 select-text flex-col gap-1.5 rounded-lg border border-border/30 bg-background/90 p-4 font-mono text-[10px] leading-tight text-foreground/90 backdrop-blur-md">
      <div className="mb-1 flex items-center gap-1.5 border-b border-border/20 pb-1 text-xs font-semibold text-primary">
        <Activity className="size-3.5" /> Thống kê kỹ thuật
      </div>
      <Row label="Trình phát" value="Vidstack (HLS)" />
      <Row label="Định dạng" value={mediaInfo?.container ?? "unknown"} />
      <Row label="Độ phân giải" value={resolution} />
      <Row label="Băng thông" value={bitrate} />
      <Row label="FPS" value={`${mediaInfo?.fps ?? 0} fps`} />
      <Row label="Codec" value={`${mediaInfo?.videoCodec} / ${mediaInfo?.audioCodec}`} />
      <Row label="Đệm (Buffer)" value={`${bufferHealth}s`} />
    </GlassSurface>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
