import 'server-only';

/**
 * Server-side public API for the watch feature.
 *
 * Client components have an explicit `@/features/watch/client` entry point so
 * importing this module is always a server-boundary decision.
 */
export * from './queries';
export * from './actions';
export * from './types';
