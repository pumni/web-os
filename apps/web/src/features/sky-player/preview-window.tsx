'use client';

import * as React from 'react';
import Link from 'next/link';
import { Play, Pause, RefreshCw, Volume2, VolumeX } from 'lucide-react';

import {
  Window,
  Button,
  motion,
  recipes,
  useReducedMotion,
  cn,
} from '@pumni/ui';

// C Major scale frequencies for the 15-key grid
const NOTE_FREQS = [
  261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99,
  880.0, 987.77, 1046.5,
];

// Sky instrument key labels (row-major 3×5 grid)
const NOTE_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'W', 'E', 'R', 'T'];

// ── Song data ──────────────────────────────────────────────────────────────────

const DEMO_SONG = {
  name: 'Comedy',
  songNotes: [
    { time: 0, key: '1Key2' }, { time: 0, key: '1Key4' }, { time: 0, key: '1Key7' },
    { time: 654, key: '1Key1' }, { time: 654, key: '1Key3' }, { time: 654, key: '1Key8' },
    { time: 1308, key: '1Key3' }, { time: 1308, key: '1Key8' }, { time: 1308, key: '1Key10' },
    { time: 1962, key: '1Key9' }, { time: 2180, key: '1Key8' }, { time: 2289, key: '1Key9' },
    { time: 2507, key: '1Key8' }, { time: 2616, key: '1Key2' }, { time: 2616, key: '1Key7' }, { time: 2616, key: '1Key9' },
    { time: 2943, key: '1Key2' }, { time: 2943, key: '1Key7' },
    { time: 3270, key: '1Key9' }, { time: 3488, key: '1Key8' }, { time: 3597, key: '1Key9' },
    { time: 3815, key: '1Key8' }, { time: 3924, key: '1Key4' }, { time: 3924, key: '1Key7' }, { time: 3924, key: '1Key9' },
    { time: 4251, key: '1Key4' }, { time: 4251, key: '1Key7' },
    { time: 4578, key: '1Key5' }, { time: 4905, key: '1Key6' }, { time: 5232, key: '1Key7' },
    { time: 5559, key: '1Key4' }, { time: 5559, key: '1Key7' },
    { time: 5886, key: '1Key6' }, { time: 5886, key: '1Key8' },
    { time: 6213, key: '1Key7' }, { time: 6213, key: '1Key9' },
    { time: 6540, key: '1Key8' }, { time: 6540, key: '1Key10' },
    { time: 6867, key: '1Key11' }, { time: 7194, key: '1Key2' }, { time: 7194, key: '1Key6' }, { time: 7194, key: '1Key9' },
    { time: 7848, key: '1Key0' }, { time: 7848, key: '1Key3' }, { time: 7848, key: '1Key7' },
    { time: 8175, key: '1Key12' }, { time: 8502, key: '1Key6' }, { time: 8502, key: '1Key9' }, { time: 8502, key: '1Key11' },
    { time: 8829, key: '1Key6' }, { time: 8829, key: '1Key9' },
    { time: 9156, key: '1Key2' }, { time: 9156, key: '1Key5' }, { time: 9156, key: '1Key7' },
    { time: 9483, key: '1Key13' }, { time: 9810, key: '1Key14' }, { time: 10137, key: '1Key8' },
    { time: 10464, key: '1Key2' }, { time: 10464, key: '1Key4' }, { time: 10464, key: '1Key7' },
    { time: 11118, key: '2Key3' }, { time: 11118, key: '2Key6' }, { time: 11118, key: '2Key8' },
    { time: 11663, key: '2Key4' }, { time: 11772, key: '1Key11' },
    { time: 12099, key: '1Key12' }, { time: 12426, key: '1Key2' }, { time: 12426, key: '1Key7' }, { time: 12426, key: '1Key9' },
    { time: 12644, key: '1Key8' }, { time: 12971, key: '2Key7' },
    { time: 13080, key: '1Key7' }, { time: 13080, key: '1Key9' }, { time: 13080, key: '1Key12' },
    { time: 13734, key: '1Key6' }, { time: 13734, key: '1Key8' }, { time: 13734, key: '1Key11' },
    { time: 14388, key: '1Key2' }, { time: 14388, key: '1Key4' }, { time: 14388, key: '1Key9' },
    { time: 14824, key: '2Key1' }, { time: 15042, key: '1Key2' }, { time: 15042, key: '1Key4' }, { time: 15042, key: '1Key7' },
    { time: 15260, key: '1Key8' }, { time: 15478, key: '1Key9' },
    { time: 15696, key: '1Key0' }, { time: 15696, key: '1Key2' }, { time: 15696, key: '1Key7' },
    { time: 15914, key: '1Key5' },
    { time: 16895, key: '2Key1' }, { time: 16895, key: '2Key4' },
    { time: 17004, key: '1Key4' }, { time: 17004, key: '1Key6' }, { time: 17004, key: '1Key11' },
    { time: 17331, key: '1Key12' }, { time: 17658, key: '1Key14' },
    { time: 17985, key: '1Key6' }, { time: 17985, key: '1Key8' }, { time: 17985, key: '1Key13' },
    { time: 18639, key: '1Key12' }, { time: 18966, key: '1Key8' }, { time: 18966, key: '1Key11' },
    { time: 19184, key: '1Key12' }, { time: 19402, key: '1Key4' }, { time: 19402, key: '1Key8' }, { time: 19402, key: '1Key11' },
    { time: 20492, key: '1Key5' }, { time: 20492, key: '1Key8' }, { time: 20492, key: '1Key10' },
    { time: 20819, key: '1Key9' },
    { time: 21473, key: '2Key1' }, { time: 21473, key: '2Key3' },
    { time: 21800, key: '1Key1' }, { time: 21800, key: '1Key3' }, { time: 21800, key: '1Key8' },
    { time: 22127, key: '1Key11' },
    { time: 22781, key: '1Key8' }, { time: 23108, key: '1Key0' }, { time: 23108, key: '1Key2' }, { time: 23108, key: '1Key7' },
    { time: 23326, key: '1Key8' }, { time: 23435, key: '1Key9' },
    { time: 23653, key: '1Key8' }, { time: 23762, key: '1Key2' }, { time: 23762, key: '1Key7' }, { time: 23762, key: '1Key9' },
    { time: 24089, key: '1Key2' }, { time: 24089, key: '1Key7' },
    { time: 24416, key: '1Key9' }, { time: 24634, key: '1Key8' }, { time: 24743, key: '1Key9' },
    { time: 24961, key: '1Key8' }, { time: 25070, key: '1Key2' }, { time: 25070, key: '1Key7' }, { time: 25070, key: '1Key9' },
    { time: 25397, key: '1Key2' }, { time: 25397, key: '1Key7' },
    { time: 25724, key: '2Key0' }, { time: 25724, key: '2Key2' },
    { time: 26051, key: '1Key5' }, { time: 26269, key: '1Key6' }, { time: 26378, key: '1Key7' },
    { time: 26705, key: '1Key0' }, { time: 26705, key: '1Key2' }, { time: 26705, key: '1Key7' },
    { time: 27032, key: '1Key1' }, { time: 27032, key: '1Key3' }, { time: 27032, key: '1Key8' },
    { time: 27359, key: '1Key2' }, { time: 27359, key: '1Key4' }, { time: 27359, key: '1Key9' },
    { time: 27577, key: '1Key3' }, { time: 27577, key: '1Key5' }, { time: 27577, key: '1Key10' },
    { time: 28013, key: '1Key11' }, { time: 28231, key: '1Key2' }, { time: 28231, key: '1Key4' }, { time: 28231, key: '1Key9' },
    { time: 28994, key: '2Key0' },
    { time: 29103, key: '1Key0' }, { time: 29103, key: '1Key2' }, { time: 29103, key: '1Key7' },
    { time: 29430, key: '1Key12' }, { time: 29757, key: '1Key6' }, { time: 29757, key: '1Key8' }, { time: 29757, key: '1Key11' },
    { time: 30084, key: '1Key5' }, { time: 30084, key: '1Key7' }, { time: 30084, key: '1Key9' },
    { time: 30411, key: '1Key0' }, { time: 30411, key: '1Key2' }, { time: 30411, key: '1Key7' },
    { time: 30738, key: '1Key13' }, { time: 31065, key: '1Key14' },
    { time: 31392, key: '1Key1' }, { time: 31392, key: '1Key3' }, { time: 31392, key: '1Key8' },
    { time: 31719, key: '1Key0' }, { time: 31719, key: '1Key2' }, { time: 31719, key: '1Key7' },
    { time: 32264, key: '1Key8' },
    { time: 33027, key: '2Key1' }, { time: 33027, key: '2Key4' },
    { time: 33136, key: '1Key4' }, { time: 33136, key: '1Key6' }, { time: 33136, key: '1Key11' },
    { time: 33463, key: '1Key12' }, { time: 33790, key: '1Key0' }, { time: 33790, key: '1Key4' }, { time: 33790, key: '1Key9' },
    { time: 34008, key: '1Key8' }, { time: 34553, key: '1Key5' }, { time: 34553, key: '1Key9' }, { time: 34553, key: '1Key12' },
    { time: 35207, key: '1Key4' }, { time: 35207, key: '1Key7' }, { time: 35207, key: '1Key11' },
    { time: 35861, key: '1Key0' }, { time: 35861, key: '1Key5' }, { time: 35861, key: '1Key9' },
    { time: 36297, key: '2Key1' },
    { time: 36515, key: '1Key7' }, { time: 36733, key: '1Key8' },
    { time: 36951, key: '1Key9' }, { time: 37169, key: '1Key0' }, { time: 37169, key: '1Key5' }, { time: 37169, key: '1Key7' },
    { time: 37387, key: '1Key5' },
    { time: 38259, key: '2Key2' }, { time: 38259, key: '2Key4' },
    { time: 38368, key: '1Key4' }, { time: 38368, key: '1Key6' }, { time: 38368, key: '1Key11' },
    { time: 38695, key: '1Key12' }, { time: 39022, key: '1Key7' }, { time: 39022, key: '1Key9' }, { time: 39022, key: '1Key14' },
    { time: 39349, key: '1Key6' }, { time: 39349, key: '1Key8' }, { time: 39349, key: '1Key13' },
    { time: 40003, key: '1Key12' }, { time: 40330, key: '1Key4' }, { time: 40330, key: '1Key6' }, { time: 40330, key: '1Key11' },
    { time: 40548, key: '1Key12' }, { time: 40766, key: '1Key4' }, { time: 40766, key: '1Key6' }, { time: 40766, key: '1Key11' },
    { time: 41747, key: '2Key0' }, { time: 41747, key: '2Key3' },
    { time: 41856, key: '1Key3' }, { time: 41856, key: '1Key5' }, { time: 41856, key: '1Key10' },
    { time: 42183, key: '1Key9' },
    { time: 43164, key: '1Key7' }, { time: 43164, key: '1Key9' }, { time: 43164, key: '1Key12' },
    { time: 43491, key: '1Key11' }, { time: 44145, key: '1Key11' },
    { time: 44472, key: '1Key1' }, { time: 44472, key: '1Key3' }, { time: 44472, key: '1Key8' },
    { time: 44799, key: '1Key0' }, { time: 44799, key: '1Key2' }, { time: 44799, key: '1Key7' },
    { time: 45126, key: '2Key0' }, { time: 45126, key: '2Key5' },
    { time: 45780, key: '2Key1' }, { time: 45780, key: '2Key6' },
    { time: 46434, key: '1Key0' }, { time: 46434, key: '1Key2' }, { time: 46434, key: '1Key9' },
    { time: 46652, key: '1Key12' }, { time: 46870, key: '1Key11' },
    { time: 47088, key: '1Key9' }, { time: 47306, key: '1Key8' },
    { time: 47524, key: '1Key7' }, { time: 47742, key: '1Key0' }, { time: 47742, key: '1Key2' }, { time: 47742, key: '1Key9' },
    { time: 48396, key: '2Key2' }, { time: 48396, key: '2Key4' },
    { time: 49050, key: '1Key0' }, { time: 49050, key: '1Key4' }, { time: 49050, key: '1Key9' },
    { time: 49268, key: '1Key12' }, { time: 49486, key: '1Key13' },
    { time: 49704, key: '1Key14' }, { time: 49922, key: '1Key13' },
    { time: 50140, key: '1Key9' }, { time: 50358, key: '1Key5' }, { time: 50358, key: '1Key7' }, { time: 50358, key: '1Key12' },
    { time: 51012, key: '2Key0' }, { time: 51012, key: '2Key4' },
    { time: 51339, key: '1Key5' }, { time: 51339, key: '1Key7' }, { time: 51339, key: '1Key14' },
    { time: 51557, key: '1Key7' }, { time: 51557, key: '1Key14' },
    { time: 51666, key: '1Key7' }, { time: 51666, key: '1Key14' },
    { time: 51993, key: '1Key8' }, { time: 52320, key: '1Key9' },
    { time: 52647, key: '1Key0' }, { time: 52647, key: '1Key5' }, { time: 52647, key: '1Key7' },
    { time: 53628, key: '1Key0' }, { time: 53628, key: '1Key4' }, { time: 53628, key: '1Key11' },
    { time: 54282, key: '1Key0' }, { time: 54282, key: '1Key4' }, { time: 54282, key: '1Key11' },
    { time: 54609, key: '1Key7' }, { time: 54609, key: '1Key14' },
    { time: 54936, key: '1Key6' }, { time: 54936, key: '1Key13' },
    { time: 55263, key: '1Key0' }, { time: 55263, key: '1Key2' }, { time: 55263, key: '1Key7' }, { time: 55263, key: '1Key14' },
    { time: 56135, key: '2Key0' },
    { time: 56244, key: '1Key2' }, { time: 56244, key: '1Key4' }, { time: 56244, key: '1Key7' },
    { time: 56462, key: '1Key7' }, { time: 56571, key: '1Key7' },
    { time: 56789, key: '1Key0' }, { time: 56789, key: '1Key3' }, { time: 56789, key: '1Key8' },
    { time: 57116, key: '1Key0' }, { time: 57116, key: '1Key2' }, { time: 57116, key: '1Key7' },
    { time: 57443, key: '1Key5' }, { time: 57552, key: '1Key0' }, { time: 57552, key: '1Key2' }, { time: 57552, key: '1Key7' },
    { time: 57879, key: '1Key7' },
    { time: 58206, key: '1Key0' }, { time: 58206, key: '1Key3' }, { time: 58206, key: '1Key5' },
    { time: 58860, key: '1Key0' }, { time: 58860, key: '1Key4' }, { time: 58860, key: '1Key7' },
    { time: 59078, key: '1Key7' }, { time: 59187, key: '1Key7' },
    { time: 59405, key: '1Key0' }, { time: 59405, key: '1Key3' }, { time: 59405, key: '1Key8' },
    { time: 59732, key: '1Key7' }, { time: 60059, key: '1Key5' },
    { time: 60168, key: '1Key0' }, { time: 60168, key: '1Key4' }, { time: 60168, key: '1Key7' },
    { time: 60495, key: '1Key0' }, { time: 60495, key: '1Key4' }, { time: 60495, key: '1Key7' },
    { time: 60822, key: '1Key0' }, { time: 60822, key: '1Key5' },
    { time: 61476, key: '1Key2' }, { time: 61476, key: '1Key4' }, { time: 61476, key: '1Key9' },
    { time: 61694, key: '1Key9' }, { time: 61803, key: '1Key9' },
    { time: 62021, key: '1Key4' }, { time: 62021, key: '1Key8' }, { time: 62021, key: '1Key11' },
    { time: 62348, key: '1Key10' }, { time: 62675, key: '1Key10' },
    { time: 62784, key: '1Key2' }, { time: 62784, key: '1Key4' }, { time: 62784, key: '1Key9' },
    { time: 63111, key: '1Key8' }, { time: 63438, key: '1Key2' }, { time: 63438, key: '1Key7' }, { time: 63438, key: '1Key9' },
    { time: 64092, key: '1Key0' }, { time: 64092, key: '1Key2' }, { time: 64092, key: '1Key7' },
    { time: 64310, key: '1Key8' }, { time: 64528, key: '1Key9' },
    { time: 64746, key: '1Key3' }, { time: 64746, key: '1Key5' }, { time: 64746, key: '1Key10' },
    { time: 65400, key: '1Key0' }, { time: 65400, key: '1Key2' }, { time: 65400, key: '1Key9' },
    { time: 66054, key: '1Key3' }, { time: 66054, key: '1Key5' }, { time: 66054, key: '1Key10' },
    { time: 66381, key: '1Key11' }, { time: 66599, key: '1Key2' }, { time: 66599, key: '1Key4' }, { time: 66599, key: '1Key9' },
    { time: 66926, key: '1Key8' }, { time: 67035, key: '1Key7' },
    { time: 67253, key: '1Key0' }, { time: 67253, key: '1Key3' }, { time: 67253, key: '1Key8' },
    { time: 67580, key: '1Key7' }, { time: 67907, key: '1Key5' },
    { time: 68016, key: '1Key7' }, { time: 68343, key: '1Key0' }, { time: 68343, key: '1Key2' }, { time: 68343, key: '1Key7' },
    { time: 68670, key: '1Key0' }, { time: 68670, key: '1Key5' },
    { time: 69324, key: '1Key0' }, { time: 69324, key: '1Key3' }, { time: 69324, key: '1Key7' },
    { time: 69542, key: '1Key7' }, { time: 69651, key: '1Key7' },
    { time: 69869, key: '1Key0' }, { time: 69869, key: '1Key3' }, { time: 69869, key: '1Key8' },
    { time: 70196, key: '1Key7' }, { time: 70523, key: '1Key5' },
    { time: 70632, key: '1Key7' }, { time: 70959, key: '1Key0' }, { time: 70959, key: '1Key2' }, { time: 70959, key: '1Key7' },
    { time: 71286, key: '1Key0' }, { time: 71286, key: '1Key5' },
    { time: 71940, key: '1Key2' }, { time: 71940, key: '1Key4' }, { time: 71940, key: '1Key9' },
    { time: 72158, key: '1Key9' }, { time: 72267, key: '1Key9' },
    { time: 72485, key: '1Key6' }, { time: 72485, key: '1Key8' }, { time: 72485, key: '1Key11' },
    { time: 72812, key: '1Key10' }, { time: 73139, key: '1Key10' },
    { time: 73248, key: '1Key7' }, { time: 73248, key: '1Key9' },
    { time: 73575, key: '1Key8' }, { time: 73902, key: '1Key7' }, { time: 73902, key: '1Key9' },
    { time: 74556, key: '1Key2' }, { time: 74556, key: '1Key7' },
    { time: 74774, key: '1Key3' }, { time: 74774, key: '1Key8' },
    { time: 74992, key: '1Key4' }, { time: 74992, key: '1Key9' },
    { time: 75210, key: '1Key5' }, { time: 75210, key: '1Key8' }, { time: 75210, key: '1Key10' },
    { time: 75864, key: '1Key2' }, { time: 75864, key: '1Key4' }, { time: 75864, key: '1Key9' },
    { time: 76518, key: '1Key5' }, { time: 76518, key: '1Key7' }, { time: 76518, key: '1Key10' },
    { time: 76845, key: '1Key11' }, { time: 77063, key: '1Key2' }, { time: 77063, key: '1Key7' }, { time: 77063, key: '1Key9' },
    { time: 77499, key: '1Key12' }, { time: 77717, key: '1Key7' }, { time: 77717, key: '1Key9' }, { time: 77717, key: '1Key11' },
    { time: 78480, key: '1Key2' }, { time: 78480, key: '1Key4' },
    { time: 78698, key: '1Key3' }, { time: 78698, key: '1Key5' },
    { time: 78916, key: '1Key4' }, { time: 78916, key: '1Key6' },
    { time: 79134, key: '1Key5' }, { time: 79134, key: '1Key7' },
    { time: 79570, key: '1Key2' }, { time: 79788, key: '1Key2' },
    { time: 80224, key: '1Key5' },
    { time: 80442, key: '1Key0' }, { time: 80442, key: '1Key2' }, { time: 80442, key: '1Key4' },
    { time: 80878, key: '1Key5' },
    { time: 81532, key: '2Key0' }, { time: 81532, key: '2Key3' }, { time: 81532, key: '2Key7' },
    { time: 81750, key: '1Key2' }, { time: 81750, key: '1Key7' }, { time: 81750, key: '1Key11' },
    { time: 82186, key: '1Key1' }, { time: 82186, key: '1Key6' }, { time: 82186, key: '1Key10' },
    { time: 82622, key: '1Key7' }, { time: 83058, key: '1Key0' }, { time: 83058, key: '1Key4' }, { time: 83058, key: '1Key9' },
    { time: 84148, key: '2Key4' }, { time: 84148, key: '2Key11' },
    { time: 84366, key: '2Key8' }, { time: 84475, key: '2Key3' }, { time: 84475, key: '2Key10' },
    { time: 84911, key: '2Key2' }, { time: 84911, key: '2Key9' },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extract the column index (0–14) from a key string like "1Key7" or "2Key3". */
function parseNoteColumn(key: string): number {
  const match = key.match(/(\d*)Key(\d+)/);
  if (!match?.[2]) return -1;
  return parseInt(match[2], 10);
}

/** Format milliseconds to "m:ss" display. */
function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

type TimelineEntry = { time: number; column: number };

// ── Sub-components (extracted for React Compiler auto-memo) ────────────────

// Each key is its own component so the compiler can skip re-renders
// for keys whose `isActive` boolean hasn't changed. Previously all 15
// keys re-rendered every 100ms because activeNotes was a new Set each tick.
function NoteKey({
  label,
  isActive,
  onPlay,
  shouldReduce,
}: {
  label: string;
  isActive: boolean;
  onPlay: () => void;
  shouldReduce: boolean;
}) {
  const motionProps = shouldReduce
    ? {}
    : { ...recipes.hoverLift, ...recipes.pressScale };

  return (
    <motion.button
      type="button"
      {...motionProps}
      onClick={onPlay}
      className={cn(
        'relative aspect-square min-h-12 sm:min-h-0 rounded-xl border transition-[background-color,border-color,box-shadow] duration-(--duration-base) ease-fluid',
        isActive
          ? 'border-primary/30 bg-linear-to-br from-(--brand-gradient-from) to-(--brand-gradient-via) shadow-[0_0_20px_var(--primary)] scale-105 motion-safe:note-hit-glow'
          : 'border-border bg-muted hover:bg-muted/80',
      )}
      aria-label={`Note ${label}`}
    >
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-xs font-mono font-bold transition-colors duration-(--duration-base) ease-fluid',
          isActive ? 'text-primary-foreground scale-110' : 'text-muted-foreground',
        )}
      >
        {label}
      </span>
    </motion.button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type PreviewWindowProps = {
  className?: string;
  showLearnMore?: boolean;
  /** Subtle float animation for hero placement */
  elevated?: boolean;
};

// How long a note stays visually highlighted (ms)
const NOTE_HIGHLIGHT_MS = 300;

export function PreviewWindow({
  className,
  showLearnMore = false,
}: PreviewWindowProps) {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(true);
  // State for UI display — updated at throttled rate (~10fps)
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const startTimeRef = React.useRef<number | null>(null);
  const elapsedMsRef = React.useRef(0);
  const lastUiUpdateRef = React.useRef(0);
  const lastPlayedIdxRef = React.useRef(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  // Ref mirror of isMuted so the rAF loop reads it without isMuted in deps
  // — toggle mute no longer restarts the entire effect.
  const isMutedRef = React.useRef(true);
  const shouldReduce = useReducedMotion();

  // Keep ref in sync with state
  React.useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Pre-process song timeline: map key → column index, sorted by time
  const timeline = React.useMemo<TimelineEntry[]>(() => {
    return [...DEMO_SONG.songNotes]
      .map((note) => ({ time: note.time, column: parseNoteColumn(note.key) }))
      .filter((entry) => entry.column >= 0 && entry.column < 15)
      .sort((a, b) => a.time - b.time);
  }, []);

  // Total song duration (last note + highlight buffer)
  const totalDuration = React.useMemo(
    () => {
      const last = timeline[timeline.length - 1];
      return last ? last.time + NOTE_HIGHLIGHT_MS + 500 : 0;
    },
    [timeline],
  );

  // ── AudioContext cleanup on unmount ────────────────────────────────────────
  React.useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => { /* best-effort */ });
        audioContextRef.current = null;
      }
    };
  }, []);

  // ── Web Audio API sound engine ────────────────────────────────────────────
  const playSound = React.useCallback((index: number, volumeFactor = 1) => {
    if (typeof window === 'undefined') return;
    try {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(
        NOTE_FREQS[index % NOTE_FREQS.length] ?? 261.63,
        ctx.currentTime,
      );

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12 * volumeFactor, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (err) {
      console.warn('Could not play note audio:', err);
    }
  }, []);

  // ── Timeline playback loop ────────────────────────────────────────────────
  // NOTE: `isMuted` is NOT in deps — read via isMutedRef instead.
  // This prevents the effect from restarting every mute toggle.
  React.useEffect(() => {
    if (!isPlaying || timeline.length === 0) return;

    // Reset start time if resuming from beginning
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now() - elapsedMsRef.current;
    }

    let rafId: number;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current!;
      elapsedMsRef.current = elapsed;

      if (elapsed >= totalDuration) {
        setElapsedMs(totalDuration);
        elapsedMsRef.current = totalDuration;
        setIsPlaying(false);
        startTimeRef.current = null;
        lastPlayedIdxRef.current = 0;
        return;
      }

      // Throttle UI state updates to ~10fps (100ms interval)
      if (now - lastUiUpdateRef.current >= 100) {
        setElapsedMs(elapsed);
        lastUiUpdateRef.current = now;
      }

      // Advance through all due notes in one pass. Uses a local index to
      // guarantee loop termination (fixes the original infinite-loop bug).
      let idx = lastPlayedIdxRef.current;
      const dueColumns: number[] = [];
      while (idx < timeline.length) {
        const note = timeline[idx]!;
        if (note.time > elapsed) break;
        dueColumns.push(note.column);
        idx += 1;
      }
      lastPlayedIdxRef.current = idx;
      // Play every due note in the same frame so chords sound together.
      if (!isMutedRef.current) {
        for (const column of dueColumns) {
          playSound(column, 0.4);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, timeline, totalDuration, playSound]);

  // Reset playback state when stopping
  const handleStop = React.useCallback(() => {
    setIsPlaying(false);
    startTimeRef.current = null;
    elapsedMsRef.current = 0;
    lastPlayedIdxRef.current = 0;
  }, []);

  // Reset to beginning
  const handleReset = React.useCallback(() => {
    setElapsedMs(0);
    elapsedMsRef.current = 0;
    startTimeRef.current = null;
    lastPlayedIdxRef.current = 0;
    // Keep current isPlaying state — just restart from beginning
    if (isPlaying) {
      setIsPlaying(false);
      requestAnimationFrame(() => setIsPlaying(true));
    }
  }, [isPlaying]);

  // Resume playback
  const handlePlay = React.useCallback(() => {
    const currentElapsed = elapsedMsRef.current;
    if (currentElapsed >= totalDuration && totalDuration > 0) {
      setElapsedMs(0);
      elapsedMsRef.current = 0;
      lastPlayedIdxRef.current = 0;
      startTimeRef.current = null;
    } else if (startTimeRef.current === null) {
      startTimeRef.current = Date.now() - currentElapsed;
    }
    setIsPlaying(true);
  }, [totalDuration]);

  // Active notes: columns currently within their highlight window.
  // Computed as a Set for efficient lookup — but we spread it into
  // primitive booleans when passing to NoteKey props.
  const activeNotes = React.useMemo(() => {
    if (timeline.length === 0 || elapsedMs === 0) return new Set<number>();
    const active = new Set<number>();
    const windowStart = elapsedMs - NOTE_HIGHLIGHT_MS;
    // Binary search for first note >= windowStart, then scan forward
    let lo = 0;
    let hi = timeline.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (timeline[mid]!.time < windowStart) lo = mid + 1;
      else hi = mid - 1;
    }
    for (let i = lo; i < timeline.length; i++) {
      const entry = timeline[i]!;
      if (entry.time > elapsedMs) break;
      if (entry.time + NOTE_HIGHLIGHT_MS > elapsedMs) {
        active.add(entry.column);
      }
    }
    return active;
  }, [timeline, elapsedMs]);

  const progressPercent = totalDuration > 0 ? Math.min((elapsedMs / totalDuration) * 100, 100) : 0;

  // Stable handler reference — index is bound per NoteKey via closure in map
  const handleManualClick = React.useCallback((index: number) => {
    playSound(index, 0.8);
  }, [playSound]);

  return (
    <div className={cn('space-y-3 w-full flex flex-col', className)}>
      <Window
        title="Sky Player — Playback Preview"
        className="w-full shadow-raised transition-shadow duration-(--duration-base) hover:shadow-interactive-hover"
        onClose={() => handleStop()}
        onMinimize={() => handleStop()}
        onMaximize={() => handlePlay()}
      >
        <div className="flex flex-col justify-between gap-5">
          {/* Header: song title + controls */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="type-heading text-foreground">
                {DEMO_SONG.name}
              </h3>
              <p className="type-caption text-muted-foreground">
                {isPlaying ? `♪ Playing · ${formatTime(elapsedMs)}` : 'Paused'}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => (isPlaying ? handleStop() : handlePlay())}
                aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleReset}
                aria-label="Restart simulation"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Note grid: 3 rows of 5 — visual grouping via gap + separator */}
          <div
            className="grid grid-cols-5 gap-2 sm:gap-3 [grid-template-rows:repeat(3,auto)]"
            role="grid"
            aria-label="Interactive Sky Music keyboard"
          >
            {Array.from({ length: 15 }, (_, index) => (
              <NoteKey
                key={index}
                label={NOTE_LABELS[index] ?? ''}
                isActive={activeNotes.has(index)}
                onPlay={() => handleManualClick(index)}
                shouldReduce={shouldReduce ?? false}
              />
            ))}
          </div>

          {/* Progress bar — simple CSS transition, no AnimatePresence overhead */}
          <div className="space-y-2">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Playback progress"
            >
              <div
                className={cn(
                  'h-full rounded-full bg-linear-to-r from-(--brand-gradient-from) to-(--brand-gradient-via)',
                  'transition-[width] duration-(--duration-base) ease-fluid',
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between type-caption text-muted-foreground">
              <span>{formatTime(elapsedMs)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>
        </div>
      </Window>
      {showLearnMore ? (
        <p className="text-center text-caption text-muted-foreground">
          <Link
            href="/sky-player"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Learn more about Sky Player
          </Link>
        </p>
      ) : null}
    </div>
  );
}
