import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from '@pumni/ui/feedback';

const meta = {
  title: 'Feedback / Bubble',
  component: Bubble,
} satisfies Meta<typeof Bubble>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Conversation: Story = {
  render: () => (
    <div className="w-[450px] space-y-4 rounded-xl border border-border p-4 bg-background flex flex-col">
      <Bubble variant="muted" shape="single" align="start">
        <BubbleContent timeLabel="10:00">
          Hi there! How is the design system modernization going?
        </BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble variant="primary" shape="first" align="end">
          <BubbleContent timeLabel="10:01">
            Going great! We migrated all the tokens to use light-dark() functions.
          </BubbleContent>
        </Bubble>
        <Bubble variant="primary" shape="last" align="end">
          <BubbleContent timeLabel="10:01">
            And now we are adding Storybook coverage for everything.
          </BubbleContent>
        </Bubble>
      </BubbleGroup>
      <Bubble variant="muted" shape="single" align="start">
        <BubbleContent timeLabel="10:02">
          Awesome, that makes visual testing much easier!
        </BubbleContent>
      </Bubble>
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
    <div className="flex w-[450px] flex-col gap-6 py-6 px-4 border border-border rounded-xl bg-background">
      <Bubble align="end" variant="primary">
        <BubbleContent>Hey there! what&apos;s up?</BubbleContent>
      </Bubble>
      <BubbleGroup>
        <Bubble variant="muted">
          <BubbleContent>Hey! Want to see chat bubbles?</BubbleContent>
        </Bubble>
        <Bubble variant="muted">
          <BubbleContent>
            I can group messages, switch sides, and keep the whole thread easy
            to scan.
          </BubbleContent>
          <BubbleReactions role="img" aria-label="Reaction: thumbs up">
            <span>👍</span>
          </BubbleReactions>
        </Bubble>
      </BubbleGroup>
      <Bubble align="end" variant="primary">
        <BubbleContent>Sure. Hit me with your best demo.</BubbleContent>
      </Bubble>
      <Bubble variant="muted">
        <BubbleContent>
          Yes. You are reading a demo that is demoing itself. Very meta. Very
          on-brand.
        </BubbleContent>
        <BubbleReactions
          role="img"
          aria-label="Reactions: thumbs up, fire, eyes, and 2 more"
        >
          <span>👍</span>
          <span>🔥</span>
          <span>👀</span>
          <span>+2</span>
        </BubbleReactions>
      </Bubble>
    </div>
  ),
};
