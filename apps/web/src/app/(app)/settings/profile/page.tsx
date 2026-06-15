import { Suspense } from "react";
import { getCurrentProfile } from "@/features/profile/queries";
import { ProfileForm } from "@/features/profile/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from "@pumni/ui";

export default function ProfileSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your public profile information.</p>
      </div>

      <Suspense fallback={<ProfileFormSkeleton />}>
        <ProfileFormContainer />
      </Suspense>
    </div>
  );
}

async function ProfileFormContainer() {
  const profile = await getCurrentProfile();

  return (
    <ProfileForm
      defaultValues={{
        id: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
      }}
    />
  );
}

function ProfileFormSkeleton() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Profile Information</CardTitle>
        <CardDescription>Update your public username and display name.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  );
}
