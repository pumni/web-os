import { getCurrentProfile } from "@/features/profile/queries";
import { ProfileForm } from "@/features/profile/profile-form";

export default async function ProfileSettingsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your public profile information.</p>
      </div>

      <ProfileForm
        defaultValues={{
          username: profile.username,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
        }}
      />
    </div>
  );
}
