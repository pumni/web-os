/**
 * Migrates all `@pumni/ui` barrel imports to subpath imports across the repo.
 *
 * Usage:  bun run scripts/migrate-subpath-imports.ts
 * Flags:  --check   dry-run, list files that would change, exit 1 if any
 *         --write   apply changes (default)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { readdirSync, statSync } from 'fs';

const WEB_SRC = resolve(import.meta.dirname, '..', '..', '..', 'apps', 'web', 'src');

const SYMBOL_TO_SUBPATH: Record<string, string> = {
  // form
  Button: './form', SubmitButton: './form', Input: './form', Label: './form',
  Checkbox: './form', Switch: './form', Slider: './form',
  Select: './form', SelectContent: './form', SelectGroup: './form',
  SelectItem: './form', SelectLabel: './form',
  SelectScrollDownButton: './form', SelectScrollUpButton: './form',
  SelectSeparator: './form', SelectTrigger: './form', SelectValue: './form',
  Form: './form', FormControl: './form', FormDescription: './form',
  FormField: './form', FormItem: './form', FormLabel: './form',
  FormMessage: './form', useFormField: './form',
  AuthField: './form', SegmentedPicker: './form',

  // overlay
  Dialog: './overlay', DialogClose: './overlay', DialogContent: './overlay',
  DialogDescription: './overlay', DialogFooter: './overlay',
  DialogHeader: './overlay', DialogOverlay: './overlay',
  DialogPortal: './overlay', DialogTitle: './overlay', DialogTrigger: './overlay',
  Sheet: './overlay', SheetClose: './overlay', SheetContent: './overlay',
  SheetDescription: './overlay', SheetFooter: './overlay',
  SheetHeader: './overlay', SheetTitle: './overlay', SheetTrigger: './overlay',
  Popover: './overlay', PopoverAnchor: './overlay', PopoverContent: './overlay',
  PopoverTrigger: './overlay',
  DropdownMenu: './overlay', DropdownMenuCheckboxItem: './overlay',
  DropdownMenuContent: './overlay', DropdownMenuGroup: './overlay',
  DropdownMenuItem: './overlay', DropdownMenuLabel: './overlay',
  DropdownMenuPortal: './overlay', DropdownMenuRadioGroup: './overlay',
  DropdownMenuRadioItem: './overlay', DropdownMenuSeparator: './overlay',
  DropdownMenuShortcut: './overlay', DropdownMenuSub: './overlay',
  DropdownMenuSubContent: './overlay', DropdownMenuSubTrigger: './overlay',
  DropdownMenuTrigger: './overlay',
  ContextMenu: './overlay', ContextMenuCheckboxItem: './overlay',
  ContextMenuContent: './overlay', ContextMenuGroup: './overlay',
  ContextMenuItem: './overlay', ContextMenuLabel: './overlay',
  ContextMenuPortal: './overlay', ContextMenuRadioGroup: './overlay',
  ContextMenuRadioItem: './overlay', ContextMenuSeparator: './overlay',
  ContextMenuShortcut: './overlay', ContextMenuSub: './overlay',
  ContextMenuSubContent: './overlay', ContextMenuSubTrigger: './overlay',
  ContextMenuTrigger: './overlay',
  Tooltip: './overlay', TooltipContent: './overlay',
  TooltipProvider: './overlay', TooltipTrigger: './overlay',
  CommandPalette: './overlay', CommandItem: './overlay',

  // layout
  Card: './layout', CardAction: './layout', CardContent: './layout',
  CardDescription: './layout', CardFooter: './layout', CardHeader: './layout',
  CardTitle: './layout', cardVariants: './layout', CardSpotlight: './layout',
  CardWell: './layout', cardWellVariants: './layout',
  IconBadge: './layout', iconBadgeVariants: './layout', Separator: './layout',
  ScrollArea: './layout', ScrollBar: './layout',
  Tabs: './layout', TabsContent: './layout', TabsList: './layout', TabsTrigger: './layout',
  Avatar: './layout', AvatarBadge: './layout', AvatarFallback: './layout',
  AvatarGroup: './layout', AvatarGroupCount: './layout', AvatarImage: './layout',
  Highlight: './layout', SectionHeading: './layout', SectionHeadingProps: './layout',

  // feedback
  Badge: './feedback', badgeVariants: './feedback', Banner: './feedback',
  ChatBubble: './feedback', chatBubbleVariants: './feedback', KbdChip: './feedback',
  PingDot: './feedback', pingDotVariants: './feedback',
  Skeleton: './feedback', skeletonVariants: './feedback',
  Spinner: './feedback', spinnerVariants: './feedback', Toaster: './feedback',

  // identity
  GlassSurface: './identity', glassSurfaceVariants: './identity',
  ACCENTS: './identity', Accent: './identity', Density: './identity',
  DENSITIES: './identity', GlassLevel: './identity', GLASS_LEVELS: './identity',
  PersonalizationProvider: './identity', PersonalizationScript: './identity',
  usePersonalization: './identity',

  // os
  BentoGrid: './os', BentoGridItem: './os', BentoTier: './os',
  Dock: './os', DockItem: './os', Window: './os',

  // lib
  cn: './lib/cn', withViewTransition: './lib/view-transition',
  AnimatePresence: './lib/motion-primitives', motion: './lib/motion-primitives',
  useReducedMotion: './lib/motion-primitives', MotionConfig: './lib/motion-primitives',
  apcaContrast: './lib/apca', apcaLuminance: './lib/apca',
  backgroundFor: './lib/apca', foregroundFor: './lib/apca',
  ContrastColorOptions: './lib/apca', ContrastColorResult: './lib/apca', Polarity: './lib/apca',
  clamp01: './lib/oklch', formatOklch: './lib/oklch',
  oklchToSrgb: './lib/oklch', parseOklch: './lib/oklch', Oklch: './lib/oklch',
  duration: './lib/motion', easing: './lib/motion',
  hoverLiftScale: './lib/motion', hoverLiftY: './lib/motion',
  entranceY: './lib/motion', entranceYLarge: './lib/motion',
  motionTokens: './lib/motion', parallaxRate: './lib/motion',
  pressScale: './lib/motion', recipes: './lib/motion',
  springs: './lib/motion', staggerBase: './lib/motion',
  staggerFast: './lib/motion', staggerSlow: './lib/motion', transition: './lib/motion',
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules') continue;
    if (statSync(full).isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

const RE_FROM_PUMNI = /from\s+['"]@pumni\/ui['"];?\s*$/;

function walkBackToOpenBrace(lines: string[], fromIdx: number): number | null {
  // fromIdx points to the line containing `} from '@pumni/ui'`
  // Walk backward to find the line starting with `import {` or `import type {`
  // The closing `}` in the current line means the `{` must be on a previous line
  // that starts with `import {`
  for (let i = fromIdx; i >= 0; i--) {
    if (/^import\s+(?:type\s+)?\{/.test(lines[i].trimStart())) return i;
    if (/^import\s/.test(lines[i].trimStart()) && !/^import\s+(?:type\s+)?\{/.test(lines[i].trimStart())) return null; // non-brace import found first
  }
  return null;
}

function parseBody(line: string): string[] {
  // Extract everything between { and }
  const m = /\{([\s\S]*)\}/.exec(line);
  if (!m) return [];
  return m[1].split(',').map(s => s.trim()).filter(Boolean);
}

function parseSpecs(body: string[], globalTypePrefix: boolean) {
  // Join all body parts and split by comma (handles trailing commas on each line)
  const all = body.join(' ').split(',').map(s => s.trim().replace(/,+$/, '')).filter(Boolean);
  return all.map(s => {
    const clean = s.replace(/\s+as\s+\w+$/, '').trim();
    const hasInlineType = clean.startsWith('type ');
    return { name: hasInlineType ? clean.slice(5).trim() : clean, typeOnly: globalTypePrefix || hasInlineType };
  });
}

function emitImportLines(groups: Map<string, { values: string[]; types: string[] }>): string[] {
  const lines: string[] = [];
  for (const [subpath, { values, types }] of groups) {
    const path = `@pumni/ui${subpath.replace(/^\.\//, '/')}`;
    if (values.length > 0 && types.length > 0) {
      lines.push(`import { ${values.join(', ')} } from '${path}';`);
      lines.push(`import type { ${types.join(', ')} } from '${path}';`);
    } else if (types.length > 0) {
      lines.push(`import type { ${types.join(', ')} } from '${path}';`);
    } else {
      lines.push(`import { ${values.join(', ')} } from '${path}';`);
    }
  }
  return lines;
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                      */
/* -------------------------------------------------------------------------- */

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');

  const files = collectTsFiles(WEB_SRC);
  let replacedCount = 0;
  let changedFiles = 0;

  for (const file of files) {
    const original = readFileSync(file, 'utf-8');
    const lines = original.split('\n');

    // Collect blocks by finding `from '@pumni/ui'` first
    const blocks: { start: number; end: number; body: string[]; typePrefix: boolean }[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (!RE_FROM_PUMNI.test(lines[i])) continue;

      const closeIdx = i;
      const line = lines[i];

      // Single-line: `import { x, y } from '@pumni/ui'` or `import type { X } from '@pumni/ui'`
      if (line.includes('{') && line.includes('}')) {
        const openIdx = walkBackToOpenBrace(lines, i);
        if (openIdx === null || openIdx !== i) continue; // must start and end on same line
        const isType = line.startsWith('import type ');
        const m = /\{([\s\S]*)\}/.exec(line);
        blocks.push({ start: i, end: i, body: m ? [m[1]] : [], typePrefix: isType });
        continue;
      }

      // Multi-line: separate `}` on this line, `import {` on a previous line
      const openIdx = walkBackToOpenBrace(lines, i);
      if (openIdx === null) continue;

      const isType = lines[openIdx].startsWith('import type ');

      // Collect body lines between open and close
      const bodyLines: string[] = [];
      const openLine = lines[openIdx].replace(/^import\s+(?:type\s+)?\{/, '').trim();
      if (openLine) bodyLines.push(openLine);

      for (let j = openIdx + 1; j < i; j++) {
        bodyLines.push(lines[j].trim());
      }

      const closeLine = lines[i].replace(/\}\s*from\s+['"]@pumni\/ui['"];?\s*$/, '').trim();
      if (closeLine) bodyLines.push(closeLine);

      blocks.push({ start: openIdx, end: i, body: bodyLines, typePrefix: isType });
    }

    if (blocks.length === 0) continue;

    // Process blocks in reverse
    const newLines = [...lines];
    let fileChanged = false;

    for (const block of blocks.reverse()) {
      const specs = parseSpecs(block.body, block.typePrefix);

      // Group by subpath
      const groups = new Map<string, { values: string[]; types: string[] }>();
      let unknown: string[] = [];

      for (const { name, typeOnly } of specs) {
        const subpath = SYMBOL_TO_SUBPATH[name];
        if (!subpath) {
          unknown.push(name);
          continue;
        }
        if (!groups.has(subpath)) groups.set(subpath, { values: [], types: [] });
        const entry = groups.get(subpath)!;
        if (typeOnly) entry.types.push(name);
        else entry.values.push(name);
      }

      if (unknown.length > 0) {
        console.warn(`  ⚠  ${file}: unknown symbols: ${unknown.join(', ')}`);
        // Keep original block in this case (don't modify)
        continue;
      }

      const importLines = emitImportLines(groups);
      newLines.splice(block.start, block.end - block.start + 1, ...importLines);
      replacedCount++;
      fileChanged = true;
    }

    if (fileChanged) {
      changedFiles++;
      const newContent = newLines.join('\n');
      if (!checkOnly) writeFileSync(file, newContent, 'utf-8');
    }
  }

  if (checkOnly && replacedCount > 0) {
    process.stderr.write(`${replacedCount} import(s) in ${changedFiles} file(s) would change. Run without --check to apply.\n`);
    process.exit(1);
  }

  process.stdout.write(`Checked ${files.length} files. ${replacedCount} import(s) replaced across ${changedFiles} file(s).\n`);
}

main();
