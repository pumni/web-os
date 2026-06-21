'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import { updateProfile } from './actions';
import { extractStoragePath } from './utils';
import type { ProfileInput } from '@pumni/validators';
import type { UseFormReset, UseFormSetValue } from 'react-hook-form';

export type UseProfileMutationProps = {
  userId: string;
  initialAvatarUrl: string | null;
  resetForm: UseFormReset<ProfileInput>;
  setValueForm: UseFormSetValue<ProfileInput>;
};

export function useProfileMutation({
  userId,
  initialAvatarUrl,
  resetForm,
  setValueForm,
}: UseProfileMutationProps) {
  const router = useRouter();
  const [selectedFileBlob, setSelectedFileBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  // Revoke temp preview URL on cleanup
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const updateProfileMutation = useMutation<
    Awaited<ReturnType<typeof updateProfile>>,
    Error,
    ProfileInput,
    { previousValues: ProfileInput }
  >({
    mutationFn: async (data) => {
      const result = await updateProfile(data);
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    onMutate: (nextValues) => {
      const previousValues = {
        username: nextValues.username,
        fullName: nextValues.fullName,
        avatarUrl: previewUrl,
      };
      resetForm(nextValues, { keepTouched: true });
      return { previousValues };
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      router.refresh();
    },
    onError: (error, _variables, context) => {
      if (context) {
        resetForm(context.previousValues, { keepTouched: true });
        setPreviewUrl(context.previousValues.avatarUrl || null);
      }
      toast.error(error.message || 'Failed to update profile.');
    },
  });

  const handleCropConfirm = useCallback(
    (blob: Blob) => {
      setSelectedFileBlob(blob);
      const tempUrl = URL.createObjectURL(blob);
      setPreviewUrl(tempUrl);
      setValueForm('avatarUrl', tempUrl);
    },
    [setValueForm],
  );

  const handleRemoveAvatar = useCallback(() => {
    setSelectedFileBlob(null);
    setPreviewUrl(null);
    setValueForm('avatarUrl', '');
  }, [setValueForm]);

  const onSubmit = useCallback(
    async (data: ProfileInput) => {
      setIsUploading(true);
      let finalAvatarUrl = data.avatarUrl;
      let oldFilePathToDelete: string | null = null;

      try {
        const supabase = createSupabaseBrowserClient();

        if (selectedFileBlob) {
          const fileName = `avatar-${Date.now()}.webp`;
          const filePath = `${userId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, selectedFileBlob, {
              contentType: 'image/webp',
              upsert: true,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          finalAvatarUrl = urlData.publicUrl;

          if (initialAvatarUrl) {
            oldFilePathToDelete = extractStoragePath(initialAvatarUrl);
          }
        } else if (previewUrl === null && initialAvatarUrl) {
          finalAvatarUrl = null;
          oldFilePathToDelete = extractStoragePath(initialAvatarUrl);
        }

        await updateProfileMutation.mutateAsync({
          ...data,
          avatarUrl: finalAvatarUrl,
        });

        if (oldFilePathToDelete) {
          await supabase.storage.from('avatars').remove([oldFilePathToDelete]);
        }

        setSelectedFileBlob(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save profile.');
        setPreviewUrl(data.avatarUrl || null);
      } finally {
        setIsUploading(false);
      }
    },
    [userId, initialAvatarUrl, previewUrl, selectedFileBlob, updateProfileMutation],
  );

  const isPending = updateProfileMutation.isPending || isUploading;

  return {
    previewUrl,
    isUploading,
    isPending,
    setSelectedFileBlob,
    setPreviewUrl,
    handleCropConfirm,
    handleRemoveAvatar,
    onSubmit,
  };
}
