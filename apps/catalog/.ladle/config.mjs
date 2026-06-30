/**
 * Ladle config for the @pumni/ui component catalog.
 * @type {import('@ladle/react').UserConfig}
 */
export default {
  stories: 'src/**/*.stories.{ts,tsx}',
  addons: {
    // Ladle's theme toggle drives our `.dark` class (synced in .ladle/components.tsx).
    theme: { enabled: true, defaultState: 'light' },
    a11y: { enabled: true },
  },
};
