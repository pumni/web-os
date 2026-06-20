'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';

import { cn } from '../../lib/cn';

/**
 * Avatar size — the only two tiers actually consumed in the app.
 * (`sm` was dead code: zero call sites, so it has been removed.)
 */
type AvatarSize = 'default' | 'lg';

/**
 * Propagates the root `size` to descendants (`AvatarFallback`,
 * `AvatarBadge`, `AvatarGroupCount`) without leaning on `group-data-[size=*]`
 * descendant selectors. Context is the clean seam here: cva variants on the
 * root cannot reach children, and the previous `group-data` chain was brittle
 * (it depended on every ancestor keeping `group/avatar` + a matching
 * `data-size`). The `data-size` attribute stays on the root for any external
 * query, but descendant styling now reads from this value.
 */
const AvatarContext = React.createContext<AvatarSize>('default');

function useAvatarSize(): AvatarSize {
  return React.use(AvatarContext);
}

function Avatar({
  ref,
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: AvatarSize;
}) {
  return (
    <AvatarContext value={size}>
      <AvatarPrimitive.Root
        ref={ref}
        data-slot="avatar"
        data-size={size}
        className={cn(
          'group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10',
          className,
        )}
        {...props}
      />
    </AvatarContext>
  );
}

function AvatarImage({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      data-slot="avatar-image"
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  const size = useAvatarSize();
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground',
        size === 'lg' && 'text-base',
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<'span'>) {
  const size = useAvatarSize();
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        'absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none',
        size === 'lg' ? 'size-3 [&>svg]:size-2' : 'size-2.5 [&>svg]:size-2',
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({
  ref,
  className,
  size = 'default',
  ...props
}: React.ComponentProps<'div'> & { size?: AvatarSize }) {
  return (
    <AvatarContext value={size}>
      <div
        ref={ref}
        data-slot="avatar-group"
        className={cn(
          'group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background',
          className,
        )}
        {...props}
      />
    </AvatarContext>
  );
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<'div'>) {
  const size = useAvatarSize();
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background [&>svg]:size-4',
        size === 'lg' ? 'size-10 [&>svg]:size-5' : 'size-8',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge, AvatarGroup, AvatarGroupCount };
