import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconBadge,
} from '@pumni/ui/layout';

const meta = {
  title: 'Layout / Card',
  component: Card,
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;

const variants = ['solid', 'inset'] as const;

export const Variants: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
      {variants.map((variant) => (
        <Card key={variant} variant={variant}>
          <CardHeader>
            <CardTitle>{variant} card</CardTitle>
            <CardDescription>
              Solid surfaces are structural; inset is the recessed well.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <IconBadge>
              <Sparkles aria-hidden />
            </IconBadge>
            <span className="type-body text-muted-foreground">Surface variant “{variant}”.</span>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

export const IconBadgeTones: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(['primary-soft', 'raised', 'muted'] as const).map((tone) => (
        <IconBadge key={tone} tone={tone}>
          <Sparkles aria-hidden />
        </IconBadge>
      ))}
    </div>
  ),
};
