import type { Story } from '@ladle/react';
import { Badge } from '@pumni/ui/feedback';

export default { title: 'Feedback / Badge' };

const tones = ['neutral', 'primary', 'success', 'warning', 'destructive'] as const;

export const Tones: Story = () => (
  <div className="flex flex-wrap items-center gap-2">
    {tones.map((tone) => (
      <Badge key={tone} tone={tone}>
        {tone}
      </Badge>
    ))}
  </div>
);

export const WithPulse: Story = () => (
  <Badge tone="success" pulse>
    Live
  </Badge>
);
