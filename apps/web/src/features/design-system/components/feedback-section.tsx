import * as React from 'react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
  Separator,
  Spinner,
} from '@pumni/ui';
import { ShowcaseSection } from './showcase-section';

export function FeedbackSection() {
  return (
    <ShowcaseSection
      id="feedback"
      title="Feedback"
      description="Visual signals: skeletons, toast notifications, separators, and status chips."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Skeleton Loaders */}
        <Card>
          <CardHeader>
            <CardTitle>Skeleton Loaders</CardTitle>
            <CardDescription>Loading states designed for content transitions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="grow space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Separator />
            <p className="text-xs font-semibold text-muted-foreground">Shimmer Variant</p>
            <div className="flex items-center gap-3">
              <Skeleton variant="shimmer" className="size-10 rounded-full" />
              <div className="grow space-y-2">
                <Skeleton variant="shimmer" className="h-4 w-3/5" />
                <Skeleton variant="shimmer" className="h-3 w-4/5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toasts */}
        <Card>
          <CardHeader>
            <CardTitle>Toast Alerts</CardTitle>
            <CardDescription>Global notifications spawned from app processes.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => toast.info('Workspace sync initiated.')}>
              Info
            </Button>
            <Button variant="outline" onClick={() => toast.success('Changes saved successfully.')}>
              Success
            </Button>
            <Button variant="outline" onClick={() => toast.warning('Low memory warning.')}>
              Warning
            </Button>
            <Button
              variant="destructive"
              onClick={() => toast.error('Database connection failed.')}
            >
              Error
            </Button>
          </CardContent>
        </Card>

        {/* Separator & Status badging */}
        <Card>
          <CardHeader>
            <CardTitle>Status Badges</CardTitle>
            <CardDescription>Inline indicators representing active states.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="success" pulse>
                Online
              </Badge>
              <Badge tone="warning" pulse>
                Syncing
              </Badge>
              <Badge tone="destructive" pulse>
                Alert
              </Badge>
              <Badge tone="neutral">Offline</Badge>
            </div>
            <Separator />
            <div className="flex h-8 items-center gap-2.5 text-sm">
              <span>Left Element</span>
              <Separator orientation="vertical" />
              <span>Middle Element</span>
              <Separator orientation="vertical" />
              <span>Right Element</span>
            </div>
          </CardContent>
        </Card>

        {/* Spinners */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Spinners</CardTitle>
            <CardDescription>
              Owned loading indicator replacing hand-rolled spin rings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <Spinner size="sm" />
                <span className="font-mono text-[10px] text-muted-foreground">sm</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Spinner size="md" />
                <span className="font-mono text-[10px] text-muted-foreground">md</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Spinner size="lg" />
                <span className="font-mono text-[10px] text-muted-foreground">lg</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Spinner aria-label="Loading data" />
              <span className="text-sm text-muted-foreground">
                Standalone — pass <code>aria-label</code> so the status role announces itself.
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Decorative by default (<code>aria-hidden</code>) when paired with a visible label.
              Reduced-motion shows a static icon.
            </p>
          </CardContent>
        </Card>
      </div>
    </ShowcaseSection>
  );
}
