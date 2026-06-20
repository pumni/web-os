// lib utilities
export { cn } from './lib/cn';
export { withViewTransition } from './lib/view-transition';
export {
  duration,
  easing,
  motionTokens,
  pressScale,
  recipes,
  staggerBase,
  transition,
} from './lib/motion';
// Centralise motion presence orchestration so apps don't add their own `motion`
// dependency (single version, clean package boundary).
export { AnimatePresence, motion, useReducedMotion } from 'motion/react';
export {
  apcaContrast,
  apcaLuminance,
  backgroundFor,
  foregroundFor,
  type ContrastColorOptions,
  type ContrastColorResult,
  type Polarity,
} from './lib/apca';
export { clamp01, formatOklch, oklchToSrgb, parseOklch, type Oklch } from './lib/oklch';

// form — inputs, controls, and form scaffolding
export { Button, buttonVariants } from './components/form/button';
export { SubmitButton } from './components/form/submit-button';
export { Input, inputVariants } from './components/form/input';
export { Label } from './components/form/label';
export { Checkbox } from './components/form/checkbox';
export { Switch } from './components/form/switch';
export { Slider } from './components/form/slider';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './components/form/select';
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from './components/form/form';
export { AuthField } from './components/form/auth-field';
export { SegmentedPicker } from './components/form/segmented-picker';

// overlay — floating / portaled layers
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './components/overlay/dialog';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './components/overlay/sheet';
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './components/overlay/popover';
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './components/overlay/dropdown-menu';
export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './components/overlay/context-menu';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/overlay/tooltip';
export { CommandPalette, type CommandItem } from './components/overlay/command-palette';

// layout — structural & presentational primitives
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
} from './components/layout/card';
export { CardSpotlight } from './components/layout/card-spotlight';
export { CardWell, cardWellVariants } from './components/layout/card-well';
export { IconBadge, iconBadgeVariants } from './components/layout/icon-badge';
export { Separator } from './components/layout/separator';
export { ScrollArea, ScrollBar } from './components/layout/scroll-area';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/layout/tabs';
export {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from './components/layout/avatar';
export { Highlight } from './components/layout/highlight';

// feedback — transient status
export { Badge, badgeVariants } from './components/feedback/badge';
export { Skeleton, skeletonVariants } from './components/feedback/skeleton';
export { Toaster } from './components/feedback/sonner';

// identity — Pumni brand tier (glass, personalization)
export { GlassSurface, glassSurfaceVariants } from './components/identity/glass-surface';
export {
  ACCENTS,
  type Accent,
  type Density,
  DENSITIES,
  type GlassLevel,
  GLASS_LEVELS,
  PersonalizationProvider,
  PersonalizationScript,
  usePersonalization,
} from './components/identity/personalization-provider';

// os — desktop shell
export { BentoGrid, BentoGridItem, type BentoTier } from './components/os/bento-grid';
export { Dock, DockItem } from './components/os/dock';
export { Window } from './components/os/window';
