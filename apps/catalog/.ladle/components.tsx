import '../src/styles/globals.css';

import * as React from 'react';
import type { GlobalProvider } from '@ladle/react';
import { PersonalizationProvider } from '@pumni/ui/identity';

/**
 * Wraps every story with the real token cascade. Ladle's built-in theme toggle
 * (toolbar) drives our `.dark` class — next-themes is not present here, so we
 * reflect Ladle's `globalState.theme` onto <html> the same way next-themes would.
 * `PersonalizationProvider` supplies accent / glass / density (see the
 * Personalization playground story to switch them live).
 */
export const Provider: GlobalProvider = ({ children, globalState }) => {
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', globalState.theme === 'dark');
  }, [globalState.theme]);

  return (
    <PersonalizationProvider>
      <div className="min-h-screen bg-background p-8 text-foreground">{children}</div>
    </PersonalizationProvider>
  );
};
