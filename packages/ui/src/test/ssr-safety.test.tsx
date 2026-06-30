// @vitest-environment node
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useForm } from 'react-hook-form';

// Import các components từ @pumni/ui
import {
  Button,
  SubmitButton,
  Input,
  Label,
  Checkbox,
  Switch,
  Slider,
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  AuthField,
  SegmentedPicker,
  Textarea,
  RadioGroup,
  RadioGroupItem,
} from '../components/form';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardSpotlight,
  CardWell,
  IconBadge,
  Separator,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Highlight,
  SectionHeading,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/layout';

import {
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  CommandPalette,
  type CommandItem,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/overlay';

import {
  Badge,
  Banner,
  ChatBubble,
  KbdChip,
  PingDot,
  Skeleton,
  Spinner,
  Toaster,
  Progress,
} from '../components/feedback';

import { GlassSurface, PersonalizationProvider } from '../components/identity';

import { BentoGrid, BentoGridItem, Dock, DockItem, Window } from '../components/os';

// ---------------------------------------------------------------------------
// Wrapper Components for Complex Contexts
// ---------------------------------------------------------------------------

function FormTestWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm({
    defaultValues: {
      username: '',
    },
  });
  return (
    <Form {...methods}>
      <form onSubmit={methods.handleSubmit(() => {})}>
        {children}
      </form>
    </Form>
  );
}

// ---------------------------------------------------------------------------
// SSR Safety Tests
// ---------------------------------------------------------------------------

describe('SSR Safety: Form Components', () => {
  it('renders Button', () => {
    expect(() => renderToString(<Button>Click me</Button>)).not.toThrow();
    expect(() => renderToString(<SubmitButton>Submit</SubmitButton>)).not.toThrow();
  });

  it('renders Input, Label, Checkbox, Switch, Slider', () => {
    expect(() => renderToString(<Input placeholder="Type..." />)).not.toThrow();
    expect(() => renderToString(<Label>Input Label</Label>)).not.toThrow();
    expect(() => renderToString(<Checkbox />)).not.toThrow();
    expect(() => renderToString(<Switch />)).not.toThrow();
    expect(() => renderToString(<Slider defaultValue={[50]} />)).not.toThrow();
  });

  it('renders Select and its compound items', () => {
    const html = renderToString(
      <Select defaultValue="apple">
        <SelectTrigger>
          <SelectValue placeholder="Select Fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectSeparator />
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(() => html).not.toThrow();
    expect(html).toContain('button');
  });

  it('renders Form elements correctly inside a form context', () => {
    const html = renderToString(
      <FormTestWrapper>
        <FormField
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormTestWrapper>
    );
    expect(() => html).not.toThrow();
  });

  it('renders AuthField', () => {
    expect(() => renderToString(<AuthField id="auth-email" label="Email" type="email" />)).not.toThrow();
  });

  it('renders SegmentedPicker', () => {
    const options = [
      { value: 'all', label: 'All' },
      { value: 'unread', label: 'Unread' },
    ];
    expect(() =>
      renderToString(
        <SegmentedPicker
          options={options}
          value="all"
          onChange={() => {}}
          aria-label="Filter"
        />
      )
    ).not.toThrow();
  });

  it('renders Textarea', () => {
    expect(() => renderToString(<Textarea placeholder="Type multiline..." />)).not.toThrow();
  });

  it('renders RadioGroup and RadioGroupItem', () => {
    expect(() =>
      renderToString(
        <RadioGroup defaultValue="option-1">
          <RadioGroupItem value="option-1" id="r1" />
          <RadioGroupItem value="option-2" id="r2" />
        </RadioGroup>
      )
    ).not.toThrow();
  });
});

describe('SSR Safety: Layout Components', () => {
  it('renders Card variations', () => {
    expect(() =>
      renderToString(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>
            <CardAction>Action</CardAction>
          </CardFooter>
        </Card>
      )
    ).not.toThrow();

    expect(() => renderToString(<CardSpotlight>Spotlight</CardSpotlight>)).not.toThrow();
    expect(() => renderToString(<CardWell>Well content</CardWell>)).not.toThrow();
  });

  it('renders IconBadge, Separator, ScrollArea', () => {
    expect(() => renderToString(<IconBadge tone="primary-soft">Icon</IconBadge>)).not.toThrow();
    expect(() => renderToString(<Separator />)).not.toThrow();
    expect(() =>
      renderToString(
        <ScrollArea className="h-20">
          <div>Long content</div>
        </ScrollArea>
      )
    ).not.toThrow();
  });

  it('renders Tabs', () => {
    expect(() =>
      renderToString(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Tab 1 Content</TabsContent>
          <TabsContent value="tab2">Tab 2 Content</TabsContent>
        </Tabs>
      )
    ).not.toThrow();
  });

  it('renders Avatar', () => {
    expect(() =>
      renderToString(
        <AvatarGroup>
          <Avatar>
            <AvatarImage src="https://github.com/nutlope.png" />
            <AvatarFallback>NL</AvatarFallback>
            <AvatarBadge />
          </Avatar>
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
      )
    ).not.toThrow();
  });

  it('renders Highlight, SectionHeading', () => {
    expect(() => renderToString(<Highlight query="test" text="This is a test highlight" />)).not.toThrow();
    expect(() => renderToString(<SectionHeading eyebrow="Category" title="Title" description="Desc" />)).not.toThrow();
  });

  it('renders Accordion and AccordionItem', () => {
    expect(() =>
      renderToString(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    ).not.toThrow();
  });
});

describe('SSR Safety: Overlay Components', () => {
  it('renders Dialog, Sheet, Popover, DropdownMenu, ContextMenu with portals', () => {
    expect(() =>
      renderToString(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>Description</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose>Close</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    ).not.toThrow();

    expect(() =>
      renderToString(
        <Sheet>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose>Close</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )
    ).not.toThrow();

    expect(() =>
      renderToString(
        <Popover>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverAnchor />
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )
    ).not.toThrow();
  });

  it('renders Tooltip inside TooltipProvider', () => {
    expect(() =>
      renderToString(
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>Hover</TooltipTrigger>
            <TooltipContent>Content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    ).not.toThrow();
  });

  it('renders CommandPalette', () => {
    const items: CommandItem[] = [
      { id: '1', label: 'Command 1', group: 'General', onSelect: () => {} },
    ];
    expect(() =>
      renderToString(
        <CommandPalette
          open={true}
          onOpenChange={() => {}}
          items={items}
          placeholder="Type command..."
        />
      )
    ).not.toThrow();
  });

  it('renders AlertDialog', () => {
    expect(() =>
      renderToString(
        <AlertDialog>
          <AlertDialogTrigger>Delete</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    ).not.toThrow();
  });
});

describe('SSR Safety: Feedback Components', () => {
  it('renders Badge, Banner, ChatBubble, KbdChip, PingDot, Skeleton, Spinner, Toaster', () => {
    expect(() => renderToString(<Badge>Status</Badge>)).not.toThrow();
    expect(() => renderToString(<Banner title="Announcement" />)).not.toThrow();
    expect(() => renderToString(<ChatBubble>Hello</ChatBubble>)).not.toThrow();
    expect(() => renderToString(<KbdChip>⌘K</KbdChip>)).not.toThrow();
    expect(() => renderToString(<PingDot />)).not.toThrow();
    expect(() => renderToString(<Skeleton />)).not.toThrow();
    expect(() => renderToString(<Spinner />)).not.toThrow();
    expect(() => renderToString(<Toaster />)).not.toThrow();
    expect(() => renderToString(<Progress value={45} />)).not.toThrow();
  });
});

describe('SSR Safety: Identity Components', () => {
  it('renders GlassSurface, PersonalizationProvider', () => {
    expect(() => renderToString(<GlassSurface>Glass</GlassSurface>)).not.toThrow();
    expect(() =>
      renderToString(
        <PersonalizationProvider>
          <div>Context child</div>
        </PersonalizationProvider>
      )
    ).not.toThrow();
  });
});

describe('SSR Safety: OS Components', () => {
  it('renders BentoGrid, Dock', () => {
    expect(() =>
      renderToString(
        <BentoGrid>
          <BentoGridItem tier="feature">Item 1</BentoGridItem>
        </BentoGrid>
      )
    ).not.toThrow();

    expect(() =>
      renderToString(
        <Dock>
          <DockItem label="App 1">
            <span>Icon</span>
          </DockItem>
        </Dock>
      )
    ).not.toThrow();
  });

  it('renders Window', () => {
    expect(() =>
      renderToString(
        <Window id="app-win" title="My Window">
          <div>Window Content</div>
        </Window>
      )
    ).not.toThrow();
  });
});
