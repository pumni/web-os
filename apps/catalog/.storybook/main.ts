import type { StorybookConfig } from '@storybook/react-vite';

// Docs: https://storybook.js.org/docs/api/main-config/main-config
// In Storybook 10, essentials (toolbar, controls, actions, etc.) are built into
// the 'storybook' core package — no separate @storybook/addon-essentials needed.
const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
};

export default config;
