'use client';

import { createSupabaseBrowserClient } from '@pumni/supabase/browser';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, type ReactNode } from 'react';

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (token && !posthog.__loaded) {
      posthog.init(token, {
        api_host: host,
        person_profiles: 'identified_only',
        capture_pageview: true, // Auto track page views
        loaded: (ph) => {
          if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            ph.debug();
          }
        },
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <PostHogAuthTracker />
      {children}
    </PHProvider>
  );
}

function PostHogAuthTracker() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email,
        });
      }
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email,
        });
      } else if (event === 'SIGNED_OUT') {
        posthog.reset();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
