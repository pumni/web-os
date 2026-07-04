import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@pumni/ui/layout';

const meta = {
  title: 'Layout / Tabs',
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-90">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <div className="p-4 border rounded-b-lg border-t-0">
            Account settings and profile information.
          </div>
        </TabsContent>
        <TabsContent value="password">
          <div className="p-4 border rounded-b-lg border-t-0">
            Manage your login password and security settings.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ),
};
