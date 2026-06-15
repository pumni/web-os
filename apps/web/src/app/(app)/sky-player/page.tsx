import type { Metadata } from 'next';
import { SkyPlayerIntro } from '@/features/sky-player/sky-player-intro';

export const metadata: Metadata = {
  title: 'Sky Player - Automatic PC Music Sheet Player',
  description:
    'Sky Player is a Textual TUI music sheet player for Sky: Children of the Light on Windows. Fuzzy song search, keyboard shortcuts, Sky Music compatibility, and open-source releases.',
};

export default function SkyPlayerPage() {
  return <SkyPlayerIntro />;
}
