/**
 * @pumni/watch — server-side public API barrel.
 *
 * Re-exports server-only modules (queries, actions, types) for Server
 * Components, route handlers, and Server Actions. The client components
 * (`WatchRoom`, `WatchLobby`, `RecentRoomsCard`) carry `'use client'` in
 * their own files; callers import them via direct subpath rather than from
 * this barrel, so the server-only boundary and client component boundary
 * stay separate.
 */

// fallow-ignore-file mixed-client-server-barrel -- barrel re-exports 'use client' components next to server-only modules for the page→client SSR flow; intentional split. See docs/conventions/feature-module.md §3.
export * from './queries';
export * from './actions';
export * from './types';
export { WatchRoom } from './components/watch-room';
export { WatchLobby } from './components/watch-lobby';
export { RecentRoomsCard } from './components/recent-rooms-card';
