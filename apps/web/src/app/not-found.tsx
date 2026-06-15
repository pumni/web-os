import Link from 'next/link';
import { Button } from '@pumni/ui';

export default function NotFound() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
