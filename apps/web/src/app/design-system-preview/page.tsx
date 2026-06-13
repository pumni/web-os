import { notFound } from "next/navigation";

import { DesignSystemShowcase } from "@/app/(app)/design-system/showcase";

/**
 * Public, isolated render of the design-system showcase used purely as a stable
 * target for Playwright visual-regression snapshots. It lives OUTSIDE the `(app)`
 * route group so it is not behind `requireUser()`. Hidden in production unless a
 * screenshot run explicitly opts in via `ENABLE_DESIGN_PREVIEW=1`.
 */
export default function DesignSystemPreviewPage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DESIGN_PREVIEW !== "1") {
    notFound();
  }

  return (
    <main data-testid="showcase-root" className="mx-auto w-full max-w-7xl p-6">
      <DesignSystemShowcase />
    </main>
  );
}
