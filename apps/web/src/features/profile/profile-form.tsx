"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { profileSchema, type ProfileInput } from "@pumni/validators";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateProfile } from "./actions";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@pumni/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@pumni/ui";
import { createSupabaseBrowserClient } from "@pumni/supabase/browser";
import { Camera, Loader2, Trash2 } from "lucide-react";
import Cropper from "react-easy-crop";
import { cropAvatar, extractStoragePath } from "./utils";

type ProfileFormProps = {
  defaultValues: {
    id: string;
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const router = useRouter();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: defaultValues.username || "",
      fullName: defaultValues.fullName || "",
      avatarUrl: defaultValues.avatarUrl || "",
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFileBlob, setSelectedFileBlob] = React.useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(defaultValues.avatarUrl);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  // Cropper states
  const [rawFile, setRawFile] = React.useState<File | null>(null);
  const [rawFileUrl, setRawFileUrl] = React.useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = React.useState(false);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<any>(null);
  const [isCropProcessing, setIsCropProcessing] = React.useState(false);

  React.useEffect(() => {
    if (rawFile) {
      const url = URL.createObjectURL(rawFile);
      setRawFileUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setRawFileUrl(null);
    }
  }, [rawFile]);

  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  React.useEffect(() => {
    if (!isCropOpen && !rawFile) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isCropOpen, rawFile]);

  const updateProfileMutation = useMutation<
    Awaited<ReturnType<typeof updateProfile>>,
    Error,
    ProfileInput,
    { previousValues: ProfileInput }
  >({
    mutationFn: async (data) => {
      const result = await updateProfile(data);

      if (!result.ok) {
        throw new Error(result.message);
      }

      return result;
    },
    onMutate: (nextValues) => {
      const previousValues = form.getValues();
      form.reset(nextValues, { keepTouched: true });

      return { previousValues };
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      router.refresh();
    },
    onError: (error, _variables, context) => {
      if (context) {
        form.reset(context.previousValues, { keepTouched: true });
        setPreviewUrl(context.previousValues.avatarUrl || null);
      }

      toast.error(error.message || "Failed to update profile.");
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image.");
      return;
    }

    setRawFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropOpen(true);
  };

  const handleRemoveAvatar = () => {
    setSelectedFileBlob(null);
    setPreviewUrl(null);
    form.setValue("avatarUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isPending) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isPending) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("File must be an image.");
      return;
    }

    setRawFile(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropOpen(true);
  };

  const handleCropConfirm = async () => {
    if (!rawFile || !croppedAreaPixels) return;
    setIsCropProcessing(true);
    try {
      const croppedBlob = await cropAvatar(rawFile, croppedAreaPixels);
      setSelectedFileBlob(croppedBlob);

      const tempUrl = URL.createObjectURL(croppedBlob);
      setPreviewUrl(tempUrl);
      form.setValue("avatarUrl", tempUrl);

      setIsCropOpen(false);
      setRawFile(null);
    } catch {
      toast.error("Failed to crop image.");
    } finally {
      setIsCropProcessing(false);
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    setIsUploading(true);
    let finalAvatarUrl = data.avatarUrl;
    let oldFilePathToDelete: string | null = null;

    try {
      const supabase = createSupabaseBrowserClient();

      if (selectedFileBlob) {
        const fileExt = "webp";
        const fileName = `avatar-${Date.now()}.${fileExt}`;
        const filePath = `${defaultValues.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedFileBlob, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        finalAvatarUrl = urlData.publicUrl;

        if (defaultValues.avatarUrl) {
          oldFilePathToDelete = extractStoragePath(defaultValues.avatarUrl);
        }
      } else if (previewUrl === null && defaultValues.avatarUrl) {
        finalAvatarUrl = null;
        oldFilePathToDelete = extractStoragePath(defaultValues.avatarUrl);
      }

      await updateProfileMutation.mutateAsync({
        ...data,
        avatarUrl: finalAvatarUrl,
      });

      // DB update succeeded! Clean up old files from storage
      if (oldFilePathToDelete) {
        await supabase.storage.from("avatars").remove([oldFilePathToDelete]);
      }

      setSelectedFileBlob(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile.");
      setPreviewUrl(data.avatarUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = updateProfileMutation.isPending || isUploading;
  const fullName = form.watch("fullName") || defaultValues.fullName || "";
  const initial = fullName ? fullName[0]?.toUpperCase() : "U";

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Profile Information</CardTitle>
          <CardDescription>Update your public username and display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="avatarUrl"
                render={() => (
                  <FormItem className="flex flex-col items-start gap-4 space-y-0 pb-2">
                    <FormLabel className="text-foreground">Profile Picture</FormLabel>
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted transition-all duration-200 hover:opacity-90",
                          isDragging && "border-primary bg-primary/10 ring-2 ring-primary/20 scale-105"
                        )}
                        onClick={handleAvatarClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <Avatar className="h-full w-full select-none rounded-full">
                          <AvatarImage src={previewUrl || undefined} alt={fullName || "User"} className="object-cover" />
                          <AvatarFallback className="text-xl font-semibold">{initial}</AvatarFallback>
                        </Avatar>

                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-overlay/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                          <Camera className="h-5 w-5 text-white" />
                          <span className="mt-1 text-[10px] font-medium text-white">Change</span>
                        </div>

                        {isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-overlay/60 backdrop-blur-[1px]">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isPending}
                            onClick={handleAvatarClick}
                          >
                            Upload new picture
                          </Button>
                          {previewUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={isPending}
                              onClick={handleRemoveAvatar}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          JPG, GIF or PNG. Max size of 5MB. Crop and adjust to WebP 256x256.
                        </p>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isPending}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="username"
                        disabled={isPending}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Full Name"
                        disabled={isPending}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
            <DialogTitle className="text-xl">Crop Profile Picture</DialogTitle>
            <DialogDescription className="max-w-md leading-6">
              Drag the image to pan and use the slider to zoom.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="relative h-64 w-full overflow-hidden rounded-md border border-border bg-neutral-900">
              {rawFileUrl && (
                <Cropper
                  image={rawFileUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                />
              )}
            </div>
            <div className="space-y-1.5 py-4">
              <label htmlFor="zoom-slider" className="text-xs font-medium text-muted-foreground">Zoom</label>
              <input
                id="zoom-slider"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border bg-card/40 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCropOpen(false);
                setRawFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCropConfirm}
              disabled={isCropProcessing}
            >
              {isCropProcessing ? "Applying..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
