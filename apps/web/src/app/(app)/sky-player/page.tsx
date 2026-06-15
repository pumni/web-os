import type { Metadata } from 'next';
import { SkyPlayerIntro } from '@/features/sky-player/sky-player-intro';

export const metadata: Metadata = {
  title: 'Sky Player - Automatic PC Music Sheet Player',
  description:
    'Download Sky Player, an open-source PC music sheet player for Sky: Children of the Light.',
};

export default function SkyPlayerPage() {
  return <SkyPlayerIntro />;
}
