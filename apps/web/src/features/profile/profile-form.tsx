"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { profileSchema, type ProfileInput } from "@pumni/validators";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateProfile } from "./actions";
import { Button, Input } from "@pumni/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@pumni/ui";

type ProfileFormProps = {
  defaultValues: {
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: defaultValues.username || "",
      fullName: defaultValues.fullName || "",
      avatarUrl: defaultValues.avatarUrl || "",
    },
  });

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
    },
    onError: (error, _variables, context) => {
      if (context) {
        form.reset(context.previousValues, { keepTouched: true });
      }

      toast.error(error.message || "Failed to update profile.");
    },
  });

  const onSubmit = async (data: ProfileInput) => {
    updateProfileMutation.mutate(data);
  };

  const isPending = updateProfileMutation.isPending;

  return (
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

            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/avatar.png"
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
  );
}
