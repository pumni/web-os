import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@pumni/ui/layout';

const meta = {
  title: 'Layout / Accordion',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-90">
      <Accordion type="single" collapsible defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            Yes. It adheres to the WAI-ARIA design pattern.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it styled with Tailwind?</AccordionTrigger>
          <AccordionContent>
            Yes. It uses Tailwind v4 tokens and classes.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
