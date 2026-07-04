import * as React from 'react';
import { toast } from 'sonner';
import { AlertCircleIcon, AlertTriangleIcon, CheckCircle2Icon, InfoIcon } from 'lucide-react';
import {
  Badge,
  Banner,
  KbdChip,
  PingDot,
  Skeleton,
  Spinner,
  Progress,
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  Marker,
  MarkerContent,
} from '@pumni/ui/feedback';
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
                <span className="font-mono text-xs text-muted-foreground">sm</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Spinner size="md" />
                <span className="font-mono text-xs text-muted-foreground">md</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Spinner size="lg" />
                <span className="font-mono text-xs text-muted-foreground">lg</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Spinner aria-label="Loading data" />
              <span className="text-sm text-muted-foreground">
                Standalone — pass <code>aria-label</code> so the status role announces itself.
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
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

        {/* Progress Bars */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Indicators</CardTitle>
            <CardDescription>
              Status indicators showing the progress of long-running operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Downloading Asset Pack</span>
                <span>45%</span>
              </div>
              <Progress value={45} />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Database Migration</span>
                <span>80%</span>
              </div>
              <Progress value={80} />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Process Complete</span>
                <span>100%</span>
              </div>
              <Progress value={100} />
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
              <span className="text-xs font-semibold text-muted-foreground">
                Compact size (horizontal row)
              </span>
              <div className="space-y-2">
                <Banner
                  tone="warning"
                  size="compact"
                  icon={AlertTriangleIcon}
                  title="No host available. Playback is paused."
                  action={
                    <Button
                      size="xs"
                      variant="outline"
                      className="border-warning/20 bg-background text-warning hover:bg-warning/20"
                    >
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
              <span className="text-xs font-semibold text-muted-foreground">
                Block size (vertical layout)
              </span>
              <div className="grid gap-4 sm:grid-cols-2">
                <Banner
                  tone="error"
                  size="block"
                  icon={AlertCircleIcon}
                  title="Connection Failure"
                  description="Failed to re-authenticate with the database. Please check your credentials."
                  action={
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => toast.error('Retrying database connection...')}
                    >
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
        <ChatBubblesCard />
      </div>
    </ShowcaseSection>
  );
}

/**
 * A Bubble whose hover react button toggles an attached BubbleReactions badge
 * (Messenger-style), spreading any BubbleGroup-injected `shape` through to Bubble.
 */
function DemoBubble({
  id,
  time,
  reacted,
  onToggleReaction,
  variant,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Bubble> & {
  id: string;
  time: string;
  reacted: Record<string, string>;
  onToggleReaction: (id: string) => void;
}) {
  const emoji = reacted[id];
  return (
    <Bubble
      variant={variant}
      className={[emoji && 'mb-2', className].filter(Boolean).join(' ') || undefined}
      {...rest}
    >
      <BubbleContent timeLabel={time} onReact={() => onToggleReaction(id)}>
        {children}
      </BubbleContent>
      {emoji ? (
        <BubbleReactions
          align={variant === 'primary' ? 'start' : 'end'}
          aria-label={`Cảm xúc ${emoji}`}
        >
          <span>{emoji}</span>
        </BubbleReactions>
      ) : null}
    </Bubble>
  );
}

function ChatBubblesCard() {
  // Reaction badges attached per bubble; one starts reacted to show the resting state.
  const [reacted, setReacted] = React.useState<Record<string, string>>({ 'them-3': '👍' });
  const toggle = (id: string) =>
    setReacted((prev) => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: '❤️' };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat Message Bubbles</CardTitle>
        <CardDescription>
          Conversation clusters with shape-grouping (first/middle/last/single). Hover a single
          bubble to reveal its timestamp; its react button toggles an attached reaction badge.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-0">
        {/* Me: consecutive cluster — BubbleGroup auto-tightens the inner corners */}
        <Message align="end">
          <MessageAvatar>
            <Avatar className="size-8">
              <AvatarImage
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
                alt="@me"
              />
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <BubbleGroup>
              <DemoBubble
                id="me-1"
                variant="primary"
                time="4:54 PM"
                reacted={reacted}
                onToggleReaction={toggle}
              >
                Deploying to prod real quick.
              </DemoBubble>
              <DemoBubble
                id="me-2"
                variant="primary"
                time="4:55 PM"
                reacted={reacted}
                onToggleReaction={toggle}
              >
                It&apos;s a one-line change.
              </DemoBubble>
            </BubbleGroup>
            <MessageFooter className="mt-1 text-xs text-muted-foreground">Delivered</MessageFooter>
          </MessageContent>
        </Message>

        {/* Oliver: standalone bubble stays fully rounded (shape single) */}
        <Message>
          <MessageAvatar>
            <Avatar className="size-8">
              <AvatarImage
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
                alt="@rabbit"
              />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <DemoBubble
              id="them-1"
              variant="muted"
              time="4:55 PM"
              reacted={reacted}
              onToggleReaction={toggle}
            >
              It&apos;s 4:55 PM. On a Friday.
            </DemoBubble>
          </MessageContent>
        </Message>

        {/* Oliver: consecutive cluster; the last bubble starts with a reaction */}
        <Message>
          <MessageAvatar>
            <Avatar className="size-8">
              <AvatarImage
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
                alt="@rabbit"
              />
              <AvatarFallback>R</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <BubbleGroup>
              <DemoBubble
                id="them-2"
                variant="muted"
                time="4:56 PM"
                reacted={reacted}
                onToggleReaction={toggle}
              >
                It&apos;s always a one-line change 😭.
              </DemoBubble>
              <DemoBubble
                id="them-3"
                variant="muted"
                time="4:56 PM"
                reacted={reacted}
                onToggleReaction={toggle}
              >
                Alright, let me take a look.
              </DemoBubble>
            </BubbleGroup>
          </MessageContent>
        </Message>

        {/* Typing Marker */}
        <Marker role="status" className="pl-10">
          <MarkerContent className="shimmer">
            <span className="font-semibold text-muted-foreground">Oliver</span> is typing...
          </MarkerContent>
        </Marker>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Consecutive bubbles cluster with tightened inner corners. Hover a bubble to reveal its
          timestamp and react button, or tap to toggle on mobile.
        </p>
      </CardContent>
    </Card>
  );
}
