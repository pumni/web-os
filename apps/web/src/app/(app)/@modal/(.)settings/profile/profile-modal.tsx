"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@pumni/ui";
import { ProfileForm } from "@/features/profile/profile-form";

type ProfileModalProps = {
  defaultValues: {
    id: string;
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export function ProfileModal({ defaultValues }: ProfileModalProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(true);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      router.back();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted">
          <DialogTitle className="text-xl">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public profile details here. Click save when you are done.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
          <ProfileForm defaultValues={defaultValues} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
