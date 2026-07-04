import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatBubble } from '@pumni/ui/feedback';

const meta = {
  title: 'Feedback / ChatBubble',
  component: ChatBubble,
} satisfies Meta<typeof ChatBubble>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Conversation: Story = {
  render: () => (
    <div className="w-[450px] space-y-4 rounded-xl border border-border p-4 bg-background">
      <ChatBubble tone="them" shape="single" timeLabel="10:00">
        Hi there! How is the design system modernization going?
      </ChatBubble>
      <ChatBubble tone="me" shape="first" timeLabel="10:01">
        Going great! We migrated all the tokens to use light-dark() functions.
      </ChatBubble>
      <ChatBubble tone="me" shape="last" timeLabel="10:01">
        And now we are adding Storybook coverage for everything.
      </ChatBubble>
      <ChatBubble tone="them" shape="single" timeLabel="10:02">
        Awesome, that makes visual testing much easier!
      </ChatBubble>
    </div>
  ),
};
