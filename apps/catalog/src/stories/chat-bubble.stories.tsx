import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
  MessageGroup,
} from '@pumni/ui/feedback';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@pumni/ui/layout';

const meta = {
  title: 'Feedback / Bubble',
  component: Bubble,
} satisfies Meta<typeof Bubble>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Conversation: Story = {
  render: () => (
    <div className="w-[450px] space-y-4 rounded-xl border border-border p-4 bg-background flex flex-col">
      <Message align="start">
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarFallback>OL</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted" shape="single">
            <BubbleContent timeLabel="10:00">
              Hi there! How is the design system modernization going?
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      <MessageGroup>
        <Message align="end">
          <MessageAvatar>
            <Avatar className="size-8">
              <AvatarFallback>ME</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="primary" shape="first">
              <BubbleContent timeLabel="10:01">
                Going great! We migrated all the tokens to use light-dark() functions.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message align="end">
          <MessageAvatar />
          <MessageContent>
            <Bubble variant="primary" shape="last">
              <BubbleContent timeLabel="10:01">
                And now we are adding Storybook coverage for everything.
              </BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>

      <Message align="start">
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarFallback>OL</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted" shape="single">
            <BubbleContent timeLabel="10:02">
              Awesome, that makes visual testing much easier!
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="w-[450px] space-y-4 rounded-xl border border-border p-4 bg-background flex flex-col">
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Size: xs (Default - 12px)</span>
        <Bubble variant="muted" shape="single" align="start">
          <BubbleContent size="xs" timeLabel="10:00">
            This is the default size (xs), optimized for compact sidebars.
          </BubbleContent>
        </Bubble>
      </div>
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Size: sm (14px)</span>
        <Bubble variant="muted" shape="single" align="start">
          <BubbleContent size="sm" timeLabel="10:00">
            This is the larger size (sm), providing enhanced readability for full chat features.
          </BubbleContent>
        </Bubble>
      </div>
    </div>
  ),
};

export const RawContent: Story = {
  render: () => (
    <div className="w-[450px] space-y-4 rounded-xl border border-border p-4 bg-background flex flex-col">
      <Bubble variant="muted" shape="single" align="start">
        <BubbleContent timeLabel="10:04">
          Here is the document we talked about:
        </BubbleContent>
      </Bubble>
      <Bubble variant="muted" shape="single" align="start">
        <BubbleContent raw timeLabel="10:05">
          <div className="rounded-xl overflow-hidden border border-border max-w-[240px] bg-card hover:bg-accent/30 transition-colors cursor-pointer">
            <div className="h-24 bg-primary/5 flex flex-col items-center justify-center text-primary border-b border-border">
              <span className="text-xl font-bold">PDF</span>
              <span className="text-[10px] text-muted-foreground">1.4 MB</span>
            </div>
            <div className="p-2 text-[11px] font-medium truncate">design-guidelines.pdf</div>
          </div>
        </BubbleContent>
      </Bubble>
      <Bubble variant="primary" shape="single" align="end">
        <BubbleContent timeLabel="10:06">
          Thanks, I'll take a look at it now!
        </BubbleContent>
      </Bubble>
    </div>
  ),
};

export const CompoundDemo: Story = {
  render: () => (
    <div className="flex w-[450px] flex-col gap-4 py-6 px-4 border border-border rounded-xl bg-background">
      {/* Message 1: Me */}
      <Message align="end">
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Me" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="primary">
            <BubbleContent>Hey there! what&apos;s up?</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      {/* Message 2 Group: Oliver */}
      <MessageGroup>
        <Message align="start">
          <MessageAvatar>
            <Avatar className="size-8">
              <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="Oliver" />
              <AvatarFallback>OL</AvatarFallback>
            </Avatar>
          </MessageAvatar>
          <MessageContent>
            <Bubble variant="muted" shape="first">
              <BubbleContent>Hey! Want to see chat bubbles?</BubbleContent>
            </Bubble>
          </MessageContent>
        </Message>
        <Message align="start">
          <MessageAvatar />
          <MessageContent>
            <Bubble variant="muted" shape="last">
              <BubbleContent>
                I can group messages, switch sides, and keep the whole thread easy to scan.
              </BubbleContent>
              <BubbleReactions role="img" aria-label="Reaction: thumbs up" align="end">
                <span>👍</span>
              </BubbleReactions>
            </Bubble>
          </MessageContent>
        </Message>
      </MessageGroup>

      {/* Message 3: Me */}
      <Message align="end">
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Me" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="primary">
            <BubbleContent>Sure. Hit me with your best demo.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>

      {/* Message 4: Oliver */}
      <Message align="start">
        <MessageAvatar>
          <Avatar className="size-8">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="Oliver" />
            <AvatarFallback>OL</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="muted">
            <BubbleContent>
              Yes. You are reading a demo that is demoing itself. Very meta. Very on-brand.
            </BubbleContent>
            <BubbleReactions
              role="img"
              aria-label="Reactions: thumbs up, fire, eyes, and 2 more"
              align="end"
            >
              <span>👍</span>
              <span>🔥</span>
              <span>👀</span>
              <span>+2</span>
            </BubbleReactions>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  ),
};

export const RadixUIMockup: StoryObj = {
  render: () => {
    // Exact simulation from user screenshot
    return (
      <div className="flex flex-col w-[500px] bg-black text-white p-6 rounded-2xl border border-neutral-800 font-sans select-none">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
          <div className="flex gap-4 text-sm font-medium text-neutral-400">
            <button className="hover:text-white transition-colors cursor-pointer">Base UI</button>
            <button className="text-white border-b-2 border-white pb-4 -mb-4.5 cursor-pointer">Radix UI</button>
          </div>
          <div className="text-neutral-500 hover:text-white transition-colors cursor-pointer">
            {/* Small logo placeholder */}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="flex flex-col gap-4 py-4 min-h-[350px]">
          {/* Message 1: Me (Right) */}
          <Message align="end">
            <MessageAvatar>
              <Avatar className="size-8">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Me" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble variant="primary">
                <BubbleContent className="rounded-3xl">Deploying to prod real quick.</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>

          {/* Message 2: Oliver (Left) */}
          <Message align="start">
            <MessageAvatar>
              <Avatar className="size-8">
                <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="Oliver" />
                <AvatarFallback>OL</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble variant="muted">
                <BubbleContent className="rounded-3xl">It's 4:55 PM. On a Friday.</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>

          {/* Message 3: Me (Right) */}
          <Message align="end">
            <MessageAvatar>
              <Avatar className="size-8">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Me" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble variant="primary">
                <BubbleContent className="rounded-3xl">It's a one-line change.</BubbleContent>
              </Bubble>
              <MessageFooter className="text-[10px] text-neutral-500 font-normal mt-1">Delivered</MessageFooter>
            </MessageContent>
          </Message>

          {/* Message 4: Me (Right, Gray variant, no avatar) */}
          <Message align="end" className="pr-10">
            <MessageContent>
              <Bubble variant="muted" align="end">
                <BubbleContent className="rounded-3xl">It's always a one-line change 🤷‍♀️.</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>

          {/* Message 5: Oliver (Left) */}
          <Message align="start">
            <MessageAvatar>
              <Avatar className="size-8">
                <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="Oliver" />
                <AvatarFallback>OL</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent className="relative">
              <Bubble variant="muted">
                <BubbleContent className="rounded-3xl">Alright, let's take a look.</BubbleContent>
                <BubbleReactions align="end">
                  <span>👍</span>
                </BubbleReactions>
              </Bubble>
            </MessageContent>
          </Message>

          {/* Typing Indicator */}
          <div className="text-xs text-neutral-500 font-normal mt-2 pl-10">
            <span className="font-semibold text-neutral-400">Oliver</span> is typing...
          </div>
        </div>
      </div>
    );
  },
};

