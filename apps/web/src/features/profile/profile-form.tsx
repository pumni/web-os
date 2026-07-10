'use client';

// fallow-ignore-file security-client-server-leak -- Intentional: Next.js Server Action import verified safe on client boundary

import * as React from 'react';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileInput } from '@pumni/validators';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@pumni/ui/layout';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  SubmitButton,
} from '@pumni/ui/form';
import { Spinner } from '@pumni/ui/feedback';
import { cn } from '@pumni/ui/lib/cn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pumni/ui/layout';
import { Camera, Trash2 } from 'lucide-react';
import { useProfileMutation } from './use-profile-mutation';

// Lazy-load the crop dialog — react-easy-crop is Canvas-heavy and not needed
// on initial page load (only when user clicks "Upload new picture").
const CropDialog = dynamic(() => import('./crop-dialog').then((m) => ({ default: m.CropDialog })), {
  ssr: false,
  loading: () => null,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfileFormProps = {
  defaultValues: {
    id: string;
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

/** Returns an error message if the file is invalid, or `null` if OK. */
function validateAvatarFile(file: File): string | null {
  if (file.size > MAX_AVATAR_BYTES) return 'File size must be less than 5MB.';
  if (!file.type.startsWith('image/')) return 'File must be an image.';
  return null;
}

// ---------------------------------------------------------------------------
// AvatarUpload — isolated avatar section with drag/drop + crop flow
// ---------------------------------------------------------------------------

interface AvatarUploadProps {
  previewUrl: string | null;
  fullName: string;
  isPending: boolean;
  onAvatarChange: (blob: Blob) => void;
  onAvatarRemove: () => void;
  onChangeClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelected: (file: File) => void;
  isUploading: boolean;
}

// fallow-ignore-next-line complexity -- Intentional: AvatarUpload is a self-contained widget coupling file-input, preview, remove, and upload-progress state; splitting would scatter tightly related UI logic
function AvatarUpload({
  previewUrl,
  fullName,
  isPending,
  onAvatarRemove,
  onChangeClick,
  fileInputRef,
  onFileSelected,
  isUploading,
}: AvatarUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const initial = fullName ? fullName[0]?.toUpperCase() : 'U';

  /** Validates a selected file and forwards it to the crop flow, or toasts an error. */
  const processSelectedFile = (file: File | undefined) => {
    if (!file) return;
    const err = validateAvatarFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    onFileSelected(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processSelectedFile(e.target.files?.[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isPending) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isPending) return;
    processSelectedFile(e.dataTransfer.files?.[0]);
  };

  return (
    <FormItem className="flex flex-col items-start gap-4 space-y-0 pb-2">
      <FormLabel className="text-foreground">Profile Picture</FormLabel>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-muted transition-all duration-(--duration-base) hover:opacity-90',
            isDragging && 'scale-105 border-primary bg-primary/10 ring-2 ring-primary/20',
          )}
          onClick={onChangeClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Avatar className="h-full w-full rounded-full select-none">
            <AvatarImage
              src={previewUrl || undefined}
              alt={fullName || 'User'}
              className="object-cover"
            />
            <AvatarFallback className="text-xl font-semibold">{initial}</AvatarFallback>
          </Avatar>

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-overlay opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-100">
            <Camera className="h-5 w-5" style={{ color: 'white' }} />
            <span className="mt-1 text-[10px] font-medium" style={{ color: 'white' }}>
              Change
            </span>
          </div>

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-overlay">
              <Spinner className="text-white" />
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
              onClick={onChangeClick}
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
                onClick={onAvatarRemove}
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
  );
}

// ---------------------------------------------------------------------------
// ProfileForm
// ---------------------------------------------------------------------------

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: defaultValues.username || '',
      fullName: defaultValues.fullName || '',
      avatarUrl: defaultValues.avatarUrl || '',
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Crop dialog file state
  const [rawFile, setRawFile] = React.useState<File | null>(null);
  const [rawFileUrl, setRawFileUrl] = React.useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = React.useState(false);
  const rawFileUrlRef = React.useRef<string | null>(null);

  // ---- Reactive watch for avatar fallback letter ----
  const watchedFullName = useWatch({ control: form.control, name: 'fullName' });
  const fullName = watchedFullName || defaultValues.fullName || '';

  // ---- Raw file → object URL (created synchronously in the callback) ----
  const revokeRawFileUrl = React.useCallback(() => {
    if (rawFileUrlRef.current) {
      URL.revokeObjectURL(rawFileUrlRef.current);
      rawFileUrlRef.current = null;
    }
  }, []);

  // ---- Cleanup on unmount ----
  React.useEffect(() => {
    return () => {
      revokeRawFileUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Clear file input when crop dialog closes without a file ----
  React.useEffect(() => {
    if (!isCropOpen && !rawFile) {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isCropOpen, rawFile]);

  // ---- Custom Hook for upload/mutation ----
  const {
    previewUrl,
    isUploading,
    isPending,
    handleCropConfirm: handleCropConfirmHook,
    handleRemoveAvatar: handleRemoveAvatarHook,
    onSubmit,
  } = useProfileMutation({
    userId: defaultValues.id,
    initialAvatarUrl: defaultValues.avatarUrl,
    resetForm: form.reset,
    setValueForm: form.setValue,
  });

  // ---- Callbacks ----
  const handleFileSelected = React.useCallback(
    (file: File) => {
      revokeRawFileUrl();
      const url = URL.createObjectURL(file);
      rawFileUrlRef.current = url;
      setRawFileUrl(url);
      setRawFile(file);
      setIsCropOpen(true);
    },
    [revokeRawFileUrl],
  );

  const handleCropConfirm = React.useCallback(
    (blob: Blob) => {
      handleCropConfirmHook(blob);
      setRawFile(null);
    },
    [handleCropConfirmHook],
  );

  const handleAvatarClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveAvatar = React.useCallback(() => {
    handleRemoveAvatarHook();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleRemoveAvatarHook]);

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
              {/* Avatar */}
              <FormField
                control={form.control}
                name="avatarUrl"
                render={() => (
                  <AvatarUpload
                    previewUrl={previewUrl}
                    fullName={fullName}
                    isPending={isPending}
                    onAvatarChange={handleCropConfirm}
                    onAvatarRemove={handleRemoveAvatar}
                    onChangeClick={handleAvatarClick}
                    fileInputRef={fileInputRef}
                    onFileSelected={handleFileSelected}
                    isUploading={isUploading}
                  />
                )}
              />

              {/* Username */}
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
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Full Name */}
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
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SubmitButton className="w-full sm:w-auto" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </SubmitButton>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Crop dialog — mounted separately to avoid re-rendering the form */}
      {rawFile && (
        <CropDialog
          open={isCropOpen}
          onOpenChange={setIsCropOpen}
          rawFile={rawFile}
          rawFileUrl={rawFileUrl}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}
