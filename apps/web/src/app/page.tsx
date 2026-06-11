import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@pumni/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black p-6 text-white text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-400">
          Pumni Web OS
        </h1>
        <p className="text-lg sm:text-xl text-neutral-400 max-w-lg mx-auto">
          A modern, reusable monorepo SaaS starter foundation built with Next.js App Router, Bun workspaces, and Supabase SSR.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild className="bg-white text-black hover:bg-neutral-200">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="border-neutral-800 hover:bg-neutral-900 text-white">
            <Link href="/sign-up">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
