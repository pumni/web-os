import { Skeleton } from '@pumni/ui/feedback';

export default function Loading() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="w-full max-w-md space-y-4 p-6">
        <Skeleton className="h-8 w-62.5" />
        <Skeleton className="h-4 w-50" />
        <Skeleton className="h-50 w-full" />
      </div>
    </div>
  );
}
