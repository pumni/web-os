// Re-exported so existing consumers (app-sidebar, mobile-nav, os-command) keep
// importing from './nav-items' unchanged. The real source is the registry,
// which derives this list from each page's co-located `nav.ts`.
export { navItems, type NavItem } from './nav-registry';
