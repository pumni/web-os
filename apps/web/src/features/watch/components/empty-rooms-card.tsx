import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

import { Button, Card, CardHeader, CardTitle, CardDescription } from '@pumni/ui';

export function EmptyRoomsCard() {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 py-10">
      <Clapperboard className="size-10 text-muted-foreground" />
      <CardHeader className="items-center text-center">
        <CardTitle className="text-lg">No rooms yet</CardTitle>
        <CardDescription>
          You haven&apos;t joined or created any watch rooms. Start your first room to get going.
        </CardDescription>
      </CardHeader>
      <Button asChild size="sm">
        <Link href="/watch">Start a new room</Link>
      </Button>
    </Card>
  );
}
