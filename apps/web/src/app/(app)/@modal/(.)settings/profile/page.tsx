import { getCurrentProfile } from "@/features/profile/queries";
import { ProfileModal } from "./profile-modal";

export default async function ProfileSettingsModalPage() {
  const profile = await getCurrentProfile();

  return (
    <ProfileModal
      defaultValues={{
        id: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
      }}
    />
  );
}
