/**
 * Calm, near-flat app backdrop: the neutral page colour with a couple of very
 * faint static brand glows near the top (styles in
 * `@pumni/ui/styles/desktop.css`). Decorative only (aria-hidden).
 */
export function DesktopBackground() {
  return <div aria-hidden className="os-desktop" />;
}
