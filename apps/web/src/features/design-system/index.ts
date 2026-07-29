/**
 * @pumni/design-system — public API barrel.
 *
 * The showcase routes under app/(app)/design-system consume these section
 * components through this barrel only; deep imports into ./components/* are
 * blocked by the feature-boundary firewall (apps/web/src/features/AGENTS.md).
 */

export { DesignSystemShowcase } from './components/showcase';
export { ShowcaseHeader } from './components/showcase-header';
export { FoundationsSection } from './components/foundations-section';
export { IdentitySection } from './components/identity-section';
export { ControlsSection } from './components/controls-section';
export { SurfacesSection } from './components/surfaces-section';
export { OverlaysSection } from './components/overlays-section';
export { FeedbackSection } from './components/feedback-section';
export { BentoSection } from './components/bento-section';
export { CardsSection } from './components/cards-section';
export { ApcaSection } from './components/apca-section';
export { MotionSection } from './components/motion-section';
