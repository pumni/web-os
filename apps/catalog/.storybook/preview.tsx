import '../src/styles/globals.css';
import * as React from 'react';
import type { Preview } from '@storybook/react';
import { PersonalizationProvider } from '@pumni/ui/identity';

// Docs: https://storybook.js.org/docs/essentials/toolbars-and-globals
// Docs: https://storybook.js.org/docs/writing-stories/decorators#global-decorators
const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      React.useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }, [theme]);

      return (
        <PersonalizationProvider>
          <div className="min-h-screen bg-background p-8 text-foreground">
            <Story />
          </div>
        </PersonalizationProvider>
      );
    },
  ],
};

export default preview;
