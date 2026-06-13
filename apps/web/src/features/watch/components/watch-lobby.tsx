"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger } from "@pumni/ui";
import { createRoom, joinByCode } from "../actions";
import { toast } from "sonner";
import { Clapperboard, LogIn, Plus } from "lucide-react";


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


  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-2 select-none">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
          <Clapperboard className="size-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Watch Together
        </h1>
        <p className="text-xs text-muted-foreground max-w-[280px]">
          Xem video cùng bạn bè theo thời gian thực. Hỗ trợ YouTube và các link video trực tiếp.
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="create">Tạo Phòng Mới</TabsTrigger>
          <TabsTrigger value="join">Tham Gia Phòng</TabsTrigger>
        </TabsList>

        {/* Create Room Tab */}
        <TabsContent value="create">
          <Card className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="size-4 text-primary" /> Tạo phòng phát
              </CardTitle>
              <CardDescription className="text-xs">
                Chọn nguồn phát và nhập đường dẫn video để khởi tạo phòng.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="source-type" className="text-xs">Nguồn video</Label>
                  <Tabs
                    value={sourceType}
                    onValueChange={(val) => setSourceType(val as "youtube" | "url")}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 w-full h-8 p-0.5 bg-muted/50">
                      <TabsTrigger value="youtube" className="text-xs h-7">YouTube</TabsTrigger>
                      <TabsTrigger value="url" className="text-xs h-7">Direct URL (MP4/HLS)</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="source-ref" className="text-xs">
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
                  <p className="text-[10px] text-muted-foreground select-none">
                    {sourceType === "youtube"
                      ? "Có thể dán full link YouTube hoặc chỉ cần mã ID 11 ký tự."
                      : "Hỗ trợ các link video MP4 thô hoặc luồng HLS (.m3u8)."}
                  </p>
                </div>

                <Button type="submit" disabled={isPending} className="w-full mt-2">
                  {isPending ? "Đang xử lý..." : "Khởi tạo phòng"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Join Room Tab */}
        <TabsContent value="join">
          <Card className="border border-border/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LogIn className="size-4 text-primary" /> Tham gia bằng mã
              </CardTitle>
              <CardDescription className="text-xs">
                Nhập mã phòng gồm 6 ký tự để tham gia cùng bạn bè.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinRoom} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="join-code" className="text-xs">Mã phòng (Join Code)</Label>
                  <Input
                    id="join-code"
                    placeholder="VD: ABCD23"
                    className="text-center font-mono uppercase tracking-wider"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>

                <Button type="submit" disabled={isPending} className="w-full mt-2">
                  {isPending ? "Đang kết nối..." : "Tham gia"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
