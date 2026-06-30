import { Skeleton } from '@pumni/ui/feedback';

/**
 * Instant fallback for navigations within the (app) group. The `(app)` layout
 * (sidebar + topbar) persists across navigation, so this only fills the main
 * content region — the router shows it the moment a link is clicked while the
 * next segment streams in, instead of holding on the previous page.
 */
export default function AppSegmentLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-28" aria-busy>
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <Skeleton className="h-44 w-full rounded-xl" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
