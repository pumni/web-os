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
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from './components/avatar';
export { BentoGrid, BentoGridItem, type BentoTier } from './components/os/bento-grid';
export { Button, buttonVariants } from './components/button';
export { SubmitButton } from './components/submit-button';
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
} from './components/card';
export { CardSpotlight } from './components/card-spotlight';
export { Checkbox } from './components/checkbox';
export { CommandPalette, type CommandItem } from './components/command-palette';
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
} from './components/context-menu';
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
} from './components/dialog';
export { Dock, DockItem } from './components/os/dock';
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
} from './components/dropdown-menu';
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from './components/form';
export { AuthField } from './components/auth-field';
export { DensityPicker } from './components/density-picker';
export { GlassLevelPicker } from './components/glass-level-picker';
export { GlassSurface, glassSurfaceVariants } from './components/glass-surface';
export { Highlight } from './components/highlight';
export { Input, inputVariants } from './components/input';
export { Label } from './components/label';
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
} from './components/personalization-provider';
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './components/popover';
export { ScrollArea, ScrollBar } from './components/scroll-area';
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
} from './components/select';
export { Separator } from './components/separator';
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './components/sheet';
export { Skeleton, skeletonVariants } from './components/skeleton';
export { Toaster } from './components/sonner';
export { Switch } from './components/switch';
export { Slider } from './components/slider';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/tabs';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/tooltip';
export { Window } from './components/os/window';
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
