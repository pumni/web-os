/**
 * Cookie holding the desktop collapse preference. Read server-side so the rail
 * renders in its persisted state on first paint (zero hydration flash) and
 * written client-side on every toggle.
 */
export const SIDEBAR_COOKIE = 'pumni-sidebar';

/**
 * Shared sidebar width tokens. The rail width and the main content's left
 * padding must stay in lockstep, so both consume these classes from one place.
 */
export const SIDEBAR_WIDTH = {
  expanded: { rail: 'w-64', pad: 'lg:pl-64' },
  collapsed: { rail: 'w-[4.5rem]', pad: 'lg:pl-[4.5rem]' },
} as const;
