import { getCurrentUser } from "@pumni/auth";
import { redirect } from "next/navigation";
// ⚠️ TEST / TEMPORARY — fullscreen YouTube video experiment. Remove later;
// see apps/web/src/components/test/README.md to restore the landing page.
import { LoginVideoTest } from "@/components/test/login-video-test";

export default async function LandingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginVideoTest />;
}
