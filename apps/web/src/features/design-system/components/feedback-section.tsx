import * as React from 'react';
import { toast } from 'sonner';
import { AlertCircleIcon, AlertTriangleIcon, CheckCircle2Icon, InfoIcon } from 'lucide-react';
import { Badge, Banner, ChatBubble, KbdChip, PingDot, Skeleton, Spinner } from '@pumni/ui/feedback';
import { Button } from '@pumni/ui/form';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Separator,
} from '@pumni/ui/layout';
import { ShowcaseSection } from './showcase-section';

export function FeedbackSection() {
  return (
    <ShowcaseSection
      id="feedback"
      title="Feedback & Identity"
      description="Visual signals and user identity layouts: skeletons, notifications, status badges, spinners, and avatars."
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
            <CardTitle>Status & Live Indicators</CardTitle>
            <CardDescription>Inline badges and live pulsing indicator dots.</CardDescription>
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <PingDot size="sm" />
                <span className="text-xs text-muted-foreground">sm dot</span>
              </div>
              <div className="flex items-center gap-1.5 text-success">
                <PingDot size="md" />
                <span className="text-xs font-semibold">md pulse</span>
              </div>
              <div className="flex items-center gap-1.5 text-destructive">
                <PingDot size="lg" pulse={false} />
                <span className="text-xs font-semibold">lg static</span>
              </div>
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

        {/* Avatars */}
        <Card>
          <CardHeader>
            <CardTitle>Avatars & Identity</CardTitle>
            <CardDescription>User profile assets and badge combinations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Avatar className="size-10">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                  alt="Jane"
                />
                <AvatarFallback>JN</AvatarFallback>
                <AvatarBadge className="size-3 border-2 border-background bg-success" />
              </Avatar>
              <Avatar className="size-8">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
            <Separator />
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-muted-foreground">
                Avatar Group
              </span>
              <AvatarGroup>
                <Avatar>
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                    alt="Jane"
                  />
                  <AvatarFallback>JN</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>PN</AvatarFallback>
                </Avatar>
                <AvatarGroupCount>+3</AvatarGroupCount>
              </AvatarGroup>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle>Keyboard Shortcuts</CardTitle>
            <CardDescription>
              Standardised keyboard shortcut chips using native elements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Neutral Tone</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Search command:</span>
                <KbdChip>⌘</KbdChip>
                <KbdChip>K</KbdChip>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Primary Tone</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Save preferences:</span>
                <KbdChip tone="primary">⌘</KbdChip>
                <KbdChip tone="primary">S</KbdChip>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced complex feedback sections */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Inline alert banners */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inline Status Banners</CardTitle>
            <CardDescription>
              Status notification bars with standard size and tone contracts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Compact size (horizontal row)</span>
              <div className="space-y-2">
                <Banner
                  tone="warning"
                  size="compact"
                  icon={AlertTriangleIcon}
                  title="No host available. Playback is paused."
                  action={
                    <Button size="xs" variant="outline" className="bg-background text-warning border-warning/20 hover:bg-warning/20">
                      Claim Host
                    </Button>
                  }
                />
                <Banner
                  tone="info"
                  size="compact"
                  icon={InfoIcon}
                  title="Sync connection established with room server clock."
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground">Block size (vertical layout)</span>
              <div className="grid gap-4 sm:grid-cols-2">
                <Banner
                  tone="error"
                  size="block"
                  icon={AlertCircleIcon}
                  title="Connection Failure"
                  description="Failed to re-authenticate with the database. Please check your credentials."
                  action={
                    <Button size="sm" variant="destructive" onClick={() => toast.error('Retrying database connection...')}>
                      Retry
                    </Button>
                  }
                />
                <Banner
                  tone="success"
                  size="block"
                  icon={CheckCircle2Icon}
                  title="Room Synced Successfully"
                  description="All followers are now anchored to the host's timeline. Playback latency is within 2.5ms."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat message bubbles */}
        <Card>
          <CardHeader>
            <CardTitle>Chat Message Bubbles</CardTitle>
            <CardDescription>
              Conversation clusters with shape-grouping (first/middle/last/single) and hover-reveal timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent className="group space-y-4 pt-0">
            {/* Incoming message cluster */}
            <div className="space-y-1">
              <div className="flex items-end gap-2.5">
                <div className="size-8 shrink-0" />
                <ChatBubble tone="them" shape="first" timestamp={Date.now() - 600000}>
                  Hey team, did we approve the new Next.js 16 layouts?
                </ChatBubble>
              </div>

              <div className="flex items-end gap-2.5">
                <div className="size-8 shrink-0" />
                <ChatBubble tone="them" shape="middle" timestamp={Date.now() - 580000}>
                  I want to make sure the view transition is applied correctly.
                </ChatBubble>
              </div>

              <div className="flex items-end gap-2.5">
                <Avatar className="size-8 shrink-0">
                  <AvatarImage
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                    alt="Jane"
                  />
                  <AvatarFallback>JN</AvatarFallback>
                </Avatar>
                <ChatBubble tone="them" shape="last" timestamp={Date.now() - 560000}>
                  Let me know if there's any feedback.
                </ChatBubble>
              </div>
            </div>

            {/* Outgoing message */}
            <div className="flex justify-end">
              <ChatBubble tone="me" shape="single" timestamp={Date.now() - 40000}>
                Yes Jane! The layout transition is approved and looks stunning.
              </ChatBubble>
            </div>

            {/* Single incoming message */}
            <div className="flex items-end gap-2.5">
              <Avatar className="size-8 shrink-0">
                <AvatarImage
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                  alt="Jane"
                />
                <AvatarFallback>JN</AvatarFallback>
              </Avatar>
              <ChatBubble tone="them" shape="single" timestamp={Date.now() - 10000}>
                Awesome! Testing with Playwright is now passing.
              </ChatBubble>
            </div>

            <p className="text-[10px] text-muted-foreground pt-2 text-center">
              Hover over bubbles to reveal timestamps (group-reveal).
            </p>
          </CardContent>
        </Card>
      </div>
    </ShowcaseSection>
  );
}
