import type { LucideIcon } from 'lucide-react';
import {
  Search,
  Command,
  SlidersHorizontal,
  FolderOpen,
} from 'lucide-react';

export const SKY_PLAYER_LINKS = {
  repo: 'https://github.com/pumni/Sky-Player',
  releases: 'https://github.com/pumni/Sky-Player/releases/latest',
  website: 'https://pumni.github.io/Sky-Player/',
  skyMusic: 'https://specy.github.io/skyMusic/',
} as const;

export const SKY_PLAYER_VERSION = 'v2.2.2';

export type Capability = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const CAPABILITIES: Capability[] = [
  {
    icon: Search,
    title: 'Fuzzy song picker',
    description:
      'Start typing to search by song name, use arrow keys to browse results, and press Enter to play.',
  },
  {
    icon: Command,
    title: 'Command palette',
    description:
      'Press / to open the palette — adjust timing profile, tempo, FPS, or theme without leaving the picker.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Playback controls',
    description:
      'Toggle dry-run, HUD detail, and telemetry. Simulates keyboard keypresses in real time while a song plays.',
  },
  {
    icon: FolderOpen,
    title: 'Drop-in library',
    description:
      'Save JSON, skysheet, or TXT files into the songs/ folder and press Ctrl+R to reload the song list.',
  },
];

export const RELEASE_INSTALL_STEPS = [
  'Go to the GitHub Releases page and download the latest Sky-Player.zip package.',
  'Extract the ZIP file anywhere on your Windows PC.',
  'Launch Sky: Children of the Light and open your instrument in-game.',
  'Double-click Sky-Player.exe inside the extracted folder to start playing.',
] as const;

export const SOURCE_INSTALL_STEPS = [
  'Install Python 3.11 or newer and the uv package manager.',
  'Clone the repository and run uv sync to install dependencies.',
  'Open Sky: Children of the Light first, then run uv run python src/main.py.',
  'Alternatively, use the quick script: .\\play.bat from the project root.',
] as const;

export type Shortcut = {
  keys: string[];
  label: string;
  description: string;
};

export const KEYBOARD_SHORTCUTS: Shortcut[] = [
  { keys: ['Type'], label: 'Search songs', description: 'Fuzzy-search the song list by name.' },
  { keys: ['↑', '↓'], label: 'Browse results', description: 'Move through matching songs.' },
  { keys: ['Enter'], label: 'Play song', description: 'Start playback for the selected song.' },
  { keys: ['/'], label: 'Command palette', description: 'Open timing, tempo, FPS, and theme options.' },
  { keys: ['p'], label: 'Timing profile', description: 'Cycle through timing profiles.' },
  { keys: ['t'], label: 'Tempo', description: 'Adjust playback tempo.' },
  { keys: ['f'], label: 'FPS', description: 'Change the playback frame rate.' },
  { keys: ['y'], label: 'Theme', description: 'Switch the TUI color theme.' },
  { keys: ['d'], label: 'Dry-run', description: 'Simulate playback without sending keypresses.' },
  { keys: ['h'], label: 'HUD detail', description: 'Toggle on-screen playback HUD.' },
  { keys: ['F3'], label: 'Telemetry', description: 'Show or hide timing telemetry.' },
  { keys: ['Ctrl', 'R'], label: 'Reload songs', description: 'Rescan the songs/ directory.' },
  { keys: ['q', 'Esc'], label: 'Quit', description: 'Exit the player.' },
];

export const SUPPORTED_FORMATS = [
  { ext: '.json', note: 'Structured key lists with timestamp offsets from Sky Music editors.' },
  { ext: '.skysheet', note: 'Native format built specifically for Sky: Children of the Light.' },
  { ext: '.txt', note: 'JSON-compatible plain-text song exports.' },
] as const;

export const ADD_SONGS_STEPS = [
  'Visit Sky Music Nightly and download a song in JSON, skysheet, or TXT format.',
  'Save the file inside the songs/ directory next to Sky-Player.exe or your source checkout.',
  'Press Ctrl+R in the song picker to reload the library.',
] as const;

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is Sky Player free?',
    answer:
      'Yes. Sky Player is open-source under the MIT License. Pre-built releases are free to download from GitHub, and the full source code is available for inspection or modification.',
  },
  {
    question: 'What terminal do I need?',
    answer:
      'Sky Player uses a Textual TUI interface and requires an ANSI-compatible terminal such as Windows Terminal or the VS Code integrated terminal. The standalone .exe bundles its own console window.',
  },
  {
    question: 'Does playback work while Sky is focused?',
    answer:
      'Yes — Sky Player sends simulated keyboard keypresses to the active window. Launch Sky first, equip your instrument, then start playback from the player. Use dry-run mode (d) to test timing without triggering notes in-game.',
  },
  {
    question: 'What are timing profiles and dry-run for?',
    answer:
      'Timing profiles adjust how keypresses are spaced to match in-game latency. Dry-run lets you preview a song\'s timing and HUD output without sending actual keystrokes — useful for calibration before a live performance.',
  },
  {
    question: 'Could this violate the game Terms of Service?',
    answer:
      'Automatically playing music sheets or using simulated keystrokes might violate Thatgamecompany\'s Terms of Service. Review the official Sky: Children of the Light rules and use this tool responsibly and at your own risk.',
  },
];
