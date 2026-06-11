"use client";

/**
 * ⚠️ TEST / TEMPORARY — REMOVE LATER ⚠️
 * ------------------------------------------------------------------
 * Fullscreen YouTube video shown on the landing page with a login
 * button in the top-right corner. This is a throwaway experiment, NOT
 * production UI. It is intentionally self-contained so it can be
 * deleted in one shot (see ./README.md for removal steps).
 *
 * Browser note: autoplay WITH sound is blocked until the user
 * interacts with the page. We attempt unmuted autoplay; if blocked we
 * fall back to muted playback and unmute on the first user gesture.
 * ------------------------------------------------------------------
 */

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signInAction, type AuthFormState } from "@/app/(public)/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const VIDEO_ID = "bp4_7T9J6Fg";

type YTPlayer = {
  playVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<YTNamespace> {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
  });
}

const initialState: AuthFormState = {};

export function LoginVideoTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [needsUnmute, setNeedsUnmute] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  useEffect(() => {
    let cancelled = false;

    const enableSound = () => {
      const player = playerRef.current;
      if (!player) return;
      player.unMute();
      player.setVolume(100);
      player.playVideo();
      setNeedsUnmute(false);
      removeGestureListeners();
    };

    const gestureEvents: Array<keyof DocumentEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    const removeGestureListeners = () => {
      for (const evt of gestureEvents) {
        document.removeEventListener(evt, enableSound);
      }
    };

    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      playerRef.current = new YT.Player(containerRef.current, {
        videoId: VIDEO_ID,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          mute: 0, // attempt sound immediately
          controls: 0,
          loop: 1,
          playlist: VIDEO_ID, // required for single-video loop
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            const player = playerRef.current;
            if (!player) return;
            player.unMute();
            player.setVolume(100);
            player.playVideo();

            // If the browser blocked unmuted autoplay, fall back to
            // muted playback and unmute on the first user gesture.
            window.setTimeout(() => {
              const p = playerRef.current;
              if (!p) return;
              const isPlaying = p.getPlayerState() === window.YT?.PlayerState.PLAYING;
              if (!isPlaying || p.isMuted()) {
                p.mute();
                p.playVideo();
                setNeedsUnmute(true);
                for (const evt of gestureEvents) {
                  document.addEventListener(evt, enableSound, { once: true });
                }
              }
            }, 1200);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      removeGestureListeners();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Fullscreen 16:9 "cover" wrapper — keeps the video edge-to-edge */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "100vw",
          height: "56.25vw",
          minWidth: "177.78vh",
          minHeight: "100vh",
          pointerEvents: "none",
        }}
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Top-right login button */}
      <div className="absolute right-4 top-4 z-20">
        <Button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="bg-white/90 text-black backdrop-blur hover:bg-white"
        >
          Đăng nhập
        </Button>
      </div>

      {/* "Bật tiếng" prompt when autoplay-with-sound was blocked */}
      {needsUnmute ? (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
          <Button
            type="button"
            onClick={() => {
              const player = playerRef.current;
              if (!player) return;
              player.unMute();
              player.setVolume(100);
              player.playVideo();
              setNeedsUnmute(false);
            }}
            className="bg-white/90 text-black backdrop-blur hover:bg-white"
          >
            🔊 Bật tiếng
          </Button>
        </div>
      ) : null}

      {/* Login modal — video keeps playing behind it */}
      {loginOpen ? (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setLoginOpen(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <Card className="border-neutral-800 bg-neutral-900/80 text-white backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription className="text-neutral-400">
                  Enter your credentials to access the OS dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={formAction} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-neutral-300">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      required
                      disabled={pending}
                      className="border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 focus-visible:ring-neutral-700"
                    />
                    {state.errors?.email?.[0] ? (
                      <p className="text-sm text-red-400">{state.errors.email[0]}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium text-neutral-300">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-neutral-400 transition-colors hover:text-white"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type="password"
                      autoComplete="current-password"
                      minLength={8}
                      required
                      disabled={pending}
                      className="border-neutral-800 bg-neutral-950 text-white placeholder-neutral-500 focus-visible:ring-neutral-700"
                    />
                    {state.errors?.password?.[0] ? (
                      <p className="text-sm text-red-400">{state.errors.password[0]}</p>
                    ) : null}
                  </div>

                  {state.message ? (
                    <p className="text-sm text-red-400" aria-live="polite">
                      {state.message}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={pending}
                    className="w-full bg-white text-black transition-colors hover:bg-neutral-200"
                  >
                    {pending ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-center gap-1 border-t border-neutral-800/50 py-4 text-sm text-neutral-400">
                <span>Don&apos;t have an account?</span>
                <Link href="/sign-up" className="font-medium text-white hover:underline">
                  Sign Up
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
