/**
 * Animated mesh-gradient wallpaper behind the OS shell. Decorative only
 * (aria-hidden); motion freezes under prefers-reduced-motion. Styles live in
 * `@pumni/ui/styles/desktop.css`.
 */
export function DesktopBackground() {
  return (
    <div aria-hidden className="os-desktop">
      <div className="os-blob os-blob-1" />
      <div className="os-blob os-blob-2" />
      <div className="os-blob os-blob-3" />
      <div className="os-blob os-blob-4" />
    </div>
  );
}
