import { Skeleton } from "@pumni/ui";

export default function Loading() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="w-full max-w-md space-y-4 p-6">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  );
}
