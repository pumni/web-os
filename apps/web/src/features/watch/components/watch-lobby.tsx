"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button, Input, Label,
  Tabs, TabsContent, TabsList, TabsTrigger,
  motion, useReducedMotion, recipes,
} from "@pumni/ui";
import { createRoom, joinByCode } from "../actions";
import { toast } from "sonner";
import { Clapperboard, LogIn, Sparkles } from "lucide-react";


export function WatchLobby() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Create room form state
  const [sourceType, setSourceType] = useState<"youtube" | "url">("youtube");
  const [sourceRef, setSourceRef] = useState("");

  // Join room form state
  const [joinCode, setJoinCode] = useState("");

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceRef.trim()) {
      toast.error("Vui lòng nhập link hoặc ID video.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createRoom({ sourceType, sourceRef });
        if (res.ok) {
          toast.success("Tạo phòng thành công!");
          router.push(`/watch/${res.data.roomId}` as Route);
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error("Có lỗi xảy ra khi tạo phòng.");
        console.error(err);
      }
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error("Vui lòng nhập mã phòng.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await joinByCode(joinCode);
        if (res.ok) {
          toast.success("Tham gia phòng thành công!");
          router.push(`/watch/${res.data.roomId}` as Route);
        } else {
          toast.error(res.message);
        }
      } catch (err) {
        toast.error("Có lỗi xảy ra khi tìm phòng.");
        console.error(err);
      }
    });
  };


  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      {...(shouldReduceMotion ? {} : recipes.fadeRise)}
      className="w-full max-w-md mx-auto flex flex-col gap-6"
    >
      {/* Hero Header */}
      <div className="flex flex-col items-center text-center gap-3 select-none">
        {/* Glow icon with pulse ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute size-16 rounded-full bg-primary/20 motion-safe:animate-pulse" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/30 text-primary shadow-sm shadow-primary/20">
            <Clapperboard className="size-7" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-gradient-brand">
            Watch Together
          </h1>
          <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed">
            Xem video cùng bạn bè theo thời gian thực.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Hỗ trợ YouTube và link video trực tiếp.
          </p>
        </div>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="create">Tạo Phòng Mới</TabsTrigger>
          <TabsTrigger value="join">Tham Gia Phòng</TabsTrigger>
        </TabsList>

        {/* Create Room Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </span>
                Tạo phòng phát
              </CardTitle>
              <CardDescription>
                Chọn nguồn phát và nhập đường dẫn video để khởi tạo phòng xem chung.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="source-type" className="text-xs font-medium">Nguồn video</Label>
                  <Tabs
                    value={sourceType}
                    onValueChange={(val) => setSourceType(val as "youtube" | "url")}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 w-full h-8 p-0.5 bg-muted">
                      <TabsTrigger value="youtube" className="text-xs h-7">YouTube</TabsTrigger>
                      <TabsTrigger value="url" className="text-xs h-7">Direct URL (MP4/HLS)</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="source-ref" className="text-xs font-medium">
                    {sourceType === "youtube" ? "Link hoặc ID video YouTube" : "Link video trực tiếp"}
                  </Label>
                  <Input
                    id="source-ref"
                    placeholder={
                      sourceType === "youtube"
                        ? "https://www.youtube.com/watch?v=..."
                        : "https://example.com/video.mp4"
                    }
                    value={sourceRef}
                    onChange={(e) => setSourceRef(e.target.value)}
                    disabled={isPending}
                    required
                  />
                  <p className="text-xs text-muted-foreground/70 select-none">
                    {sourceType === "youtube"
                      ? "Dán full link YouTube hoặc chỉ mã ID 11 ký tự."
                      : "Hỗ trợ link video MP4 hoặc luồng HLS (.m3u8)."}
                  </p>
                </div>

                <Button type="submit" disabled={isPending} className="w-full mt-1">
                  {isPending ? "Đang xử lý..." : "Khởi tạo phòng"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Join Room Tab */}
        <TabsContent value="join">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <LogIn className="size-4" />
                </span>
                Tham gia bằng mã
              </CardTitle>
              <CardDescription>
                Nhập mã phòng gồm 6 ký tự để tham gia cùng bạn bè.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="join-code" className="text-xs font-medium">Mã phòng (Join Code)</Label>
                  <Input
                    id="join-code"
                    placeholder="VD: ABCD23"
                    className="text-center font-mono text-lg uppercase tracking-[0.35em] h-12"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    disabled={isPending}
                    required
                  />
                  <p className="text-xs text-muted-foreground/70 text-center select-none">
                    Mã phòng do người tạo phòng cung cấp.
                  </p>
                </div>

                <Button type="submit" disabled={isPending} className="w-full mt-1">
                  {isPending ? "Đang kết nối..." : "Tham gia phòng"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
