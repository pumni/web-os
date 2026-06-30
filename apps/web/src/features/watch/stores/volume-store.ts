import { create } from 'zustand';

const WATCH_PLAYER_VOLUME_STORAGE_KEY = 'pumni.watchPlayerVolume';
const DEFAULT_WATCH_PLAYER_VOLUME = 0.5;

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return DEFAULT_WATCH_PLAYER_VOLUME;
  return Math.max(0, Math.min(1, volume));
}

function readVolume(): number {
  if (typeof window === 'undefined') return DEFAULT_WATCH_PLAYER_VOLUME;
  const stored = window.localStorage.getItem(WATCH_PLAYER_VOLUME_STORAGE_KEY);
  if (stored === null) return DEFAULT_WATCH_PLAYER_VOLUME;
  return clampVolume(Number(stored));
}

function writeVolume(volume: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WATCH_PLAYER_VOLUME_STORAGE_KEY, clampVolume(volume).toString());
}

type VolumeState = {
  watchPlayerVolume: number;
  setWatchPlayerVolume: (volume: number) => void;
};

export const useWatchVolumeStore = create<VolumeState>((set) => ({
  watchPlayerVolume: readVolume(),
  setWatchPlayerVolume: (volume: number) => {
    const next = clampVolume(volume);
    writeVolume(next);
    set({ watchPlayerVolume: next });
  },
}));
