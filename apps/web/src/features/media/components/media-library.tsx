"use client";

import * as React from "react";
import { Input, Tabs, TabsContent, TabsList, TabsTrigger, motion, useReducedMotion, recipes, GlassSurface } from "@pumni/ui";
import { Film, Play, Search, Heart, Tv, Info, Server, Network, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { Database } from "@pumni/supabase";
import { MediaCard } from "./media-card";
import type { JellyfinItem } from "../types";

type WatchHistoryRow = Database["public"]["Tables"]["media_watch_history"]["Row"];
type FavoriteRow = Database["public"]["Tables"]["media_favorites"]["Row"];

interface MediaLibraryProps {
  items: JellyfinItem[];
  resumeItems: WatchHistoryRow[]; // supabase media_watch_history rows
  favorites: FavoriteRow[]; // supabase media_favorites rows
  isJellyfinOnline: boolean;
  jellyfinUrl: string;
}

export function MediaLibrary({
  items,
  resumeItems,
  favorites,
  isJellyfinOnline,
  jellyfinUrl,
}: MediaLibraryProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("all");
  const isReducedMotion = useReducedMotion();
  const [tailscaleStatus, setTailscaleStatus] = React.useState<"checking" | "connected" | "disconnected">(
    jellyfinUrl ? "checking" : "disconnected"
  );

  React.useEffect(() => {
    if (!jellyfinUrl) return;

    let active = true;
    const checkTailscale = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const checkUrl = jellyfinUrl.endsWith("/")
          ? `${jellyfinUrl}System/Info/Public`
          : `${jellyfinUrl}/System/Info/Public`;

        const res = await fetch(checkUrl, {
          signal: controller.signal,
          mode: "cors",
        });
        clearTimeout(timeoutId);
        
        if (active) {
          if (res.ok) {
            setTailscaleStatus("connected");
          } else {
            setTailscaleStatus("disconnected");
          }
        }
      } catch {
        if (active) {
          setTailscaleStatus("disconnected");
        }
      }
    };

    checkTailscale();

    return () => {
      active = false;
    };
  }, [jellyfinUrl]);


  // Map watch history progress by item ID
  const progressMap = React.useMemo(() => {
    const map = new Map<string, { positionTicks: number; runtimeTicks: number }>();
    resumeItems.forEach((row) => {
      map.set(row.jellyfin_item_id, {
        positionTicks: Number(row.position_ticks),
        runtimeTicks: Number(row.runtime_ticks),
      });
    });
    return map;
  }, [resumeItems]);

  // Map favorites by item ID
  const favoritesSet = React.useMemo(() => {
    return new Set<string>(favorites.map((row) => row.jellyfin_item_id));
  }, [favorites]);

  // Filter items based on tab & search term
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const matchesSearch = item.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Genres?.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Tab filter
      if (activeTab === "movies") return item.Type === "Movie";
      if (activeTab === "series") return item.Type === "Series";
      if (activeTab === "favorites") return favoritesSet.has(item.Id);

      return true;
    });
  }, [items, searchTerm, activeTab, favoritesSet]);

  // Find which items from the library can be resumed
  const resumableLibraryItems = React.useMemo(() => {
    return items.filter((item) => progressMap.has(item.Id));
  }, [items, progressMap]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto p-4 md:p-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Film className="size-8 text-primary" /> Cinema
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Duyệt và phát trực tuyến phim & series từ máy chủ Jellyfin của bạn.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm phim, thể loại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full bg-background/50 border-input"
          />
        </div>
      </div>

      {/* Resume Watching Section */}
      {resumableLibraryItems.length > 0 && searchTerm === "" && activeTab === "all" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Play className="size-4 text-primary fill-current" /> Tiếp tục xem
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {resumableLibraryItems.slice(0, 6).map((item) => (
              <MediaCard
                key={`resume-${item.Id}`}
                item={item}
                progress={progressMap.get(item.Id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs list & Grid */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-background/40 border border-border/50">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="movies" className="flex items-center gap-1">
            <Film className="size-3.5" /> Phim
          </TabsTrigger>
          <TabsTrigger value="series" className="flex items-center gap-1">
            <Tv className="size-3.5" /> Series
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-1">
            <Heart className="size-3.5" /> Yêu thích
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 outline-none">
          {filteredItems.length > 0 ? (
            <motion.div
              {...(isReducedMotion ? {} : recipes.staggerContainer)}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {filteredItems.map((item) => (
                <motion.div
                  key={item.Id}
                  {...(isReducedMotion ? {} : recipes.staggerItem)}
                >
                  <MediaCard
                    item={item}
                    progress={progressMap.get(item.Id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl bg-background/20 backdrop-blur-xs">
              <Film className="size-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-semibold text-base text-foreground">Không tìm thấy kết quả</h3>
              <p className="text-muted-foreground text-sm max-w-xs mt-1">
                Thử tìm kiếm từ khóa khác hoặc chuyển danh mục hiển thị.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cinema Status & Guide Panel */}
      <GlassSurface className="p-6 md:p-8 flex flex-col gap-6 bg-background/30 border border-border/40 relative overflow-hidden backdrop-blur-md mt-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Info className="size-5 text-primary" /> Hướng dẫn & Trạng thái Rạp phim
            </h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              Cách thức hoạt động của rạp phim Pumni Web OS và chẩn đoán kết nối của bạn.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: How it works (Explanation) */}
          <div className="lg:col-span-7 flex flex-col gap-4 justify-between">
            <div className="space-y-3">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider opacity-70">
                Cách hoạt động
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pumni Cinema sử dụng kiến trúc kết nối trực tiếp (Direct-to-Client) từ trình duyệt của bạn tới máy chủ Jellyfin tại nhà qua mạng riêng ảo bảo mật <span className="text-primary font-medium">Tailscale VPN</span>.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Khi bạn phát phim, dòng dữ liệu video sẽ đi thẳng từ máy chủ gia đình tới thiết bị của bạn. Điều này tránh định tuyến qua Vercel, giúp loại bỏ hoàn toàn tình trạng bóp băng thông và không làm quá tải đường truyền của máy chủ Vercel (Hobby tier).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/20 border border-border/20">
                <div className="rounded-full p-1 bg-primary/10 text-primary mt-0.5 flex items-center justify-center size-5 shrink-0">
                  <span className="text-xs font-bold leading-none">1</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Bật Tailscale VPN</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Mạng lưới kết nối an toàn</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/20 border border-border/20">
                <div className="rounded-full p-1 bg-primary/10 text-primary mt-0.5 flex items-center justify-center size-5 shrink-0">
                  <span className="text-xs font-bold leading-none">2</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Truyền Trực Tiếp</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Không đi qua máy chủ trung gian</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-background/20 border border-border/20">
                <div className="rounded-full p-1 bg-primary/10 text-primary mt-0.5 flex items-center justify-center size-5 shrink-0">
                  <span className="text-xs font-bold leading-none">3</span>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Xem Không Giới Hạn</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Tải phim mượt mà, tốc độ tối đa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Connection Diagnostics */}
          <div className="lg:col-span-5 flex flex-col gap-4 p-4 rounded-xl bg-background/20 border border-border/30 backdrop-blur-xs justify-between">
            <div className="space-y-4">
              <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider opacity-70">
                Trạng thái kết nối
              </h3>

              {/* Jellyfin Server status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/20">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isJellyfinOnline ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                    <Server className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Máy chủ Jellyfin</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Kiểm tra bởi máy chủ</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isJellyfinOnline ? (
                    <>
                      <span className="text-xs font-medium text-success">Đang hoạt động</span>
                      <CheckCircle2 className="size-4 text-success" />
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-medium text-destructive">Mất kết nối</span>
                      <XCircle className="size-4 text-destructive" />
                    </>
                  )}
                </div>
              </div>

              {/* Client Tailscale status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/20">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tailscaleStatus === "connected"
                      ? "bg-success/15 text-success"
                      : tailscaleStatus === "checking"
                      ? "bg-primary/15 text-primary animate-pulse"
                      : "bg-warning/15 text-warning"
                  }`}>
                    <Network className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Đường truyền Tailscale</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Kiểm tra từ trình duyệt của bạn</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tailscaleStatus === "checking" && (
                    <>
                      <span className="text-xs font-medium text-muted-foreground">Đang kiểm tra...</span>
                      <div className="size-4 rounded-full border border-primary border-t-transparent animate-spin" />
                    </>
                  )}
                  {tailscaleStatus === "connected" && (
                    <>
                      <span className="text-xs font-medium text-success">Đã kết nối</span>
                      <CheckCircle2 className="size-4 text-success" />
                    </>
                  )}
                  {tailscaleStatus === "disconnected" && (
                    <>
                      <span className="text-xs font-medium text-warning">Chưa kết nối</span>
                      <AlertTriangle className="size-4 text-warning" />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Troubleshooting tips or success banner */}
            {tailscaleStatus === "disconnected" && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning leading-relaxed">
                <strong>Hướng dẫn:</strong> Có vẻ như bạn chưa kết nối tới mạng Tailscale. Vui lòng mở ứng dụng Tailscale trên thiết bị của bạn, đăng nhập tài khoản và kết nối tới mạng (tailnet) chung để tiếp cận máy chủ Jellyfin.
              </div>
            )}
            {tailscaleStatus === "connected" && isJellyfinOnline && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-xs text-success leading-relaxed">
                <strong>Sẵn sàng:</strong> Tuyệt vời! Bạn đã kết nối trực tiếp đến máy chủ Jellyfin thành công. Hãy chọn bộ phim yêu thích và thưởng thức ngay.
              </div>
            )}
            {tailscaleStatus === "connected" && !isJellyfinOnline && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning leading-relaxed">
                <strong>Chú ý:</strong> Đường truyền Tailscale của bạn ổn định, nhưng máy chủ Jellyfin hiện tại đang báo mất kết nối. Vui lòng kiểm tra lại trạng thái máy chủ phim ở nhà.
              </div>
            )}
          </div>
        </div>
      </GlassSurface>
    </div>
  );
}

