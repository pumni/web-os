import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/cn';

const chatBubbleVariants = cva(
  'rounded-2xl px-4 py-2.5 wrap-break-word shadow-sm select-text transition-all duration-200',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground',
        muted: 'bg-muted text-foreground',
      },
      size: {
        xs: 'text-xs',
        sm: 'text-sm',
      },
      shape: {
        single: '',
        first: '',
        middle: '',
        last: '',
      },
    },
    compoundVariants: [
      // `muted` (left column): the floor-side corner is the bottom-left.
      {
        variant: 'muted',
        shape: 'first',
        class: '!rounded-bl-xs',
      },
      {
        variant: 'muted',
        shape: 'middle',
        class: '!rounded-tl-xs !rounded-bl-xs',
      },
      {
        variant: 'muted',
        shape: 'last',
        class: '!rounded-tl-xs',
      },
      // `primary` (right column): the floor-side corner is the bottom-right.
      {
        variant: 'primary',
        shape: 'first',
        class: '!rounded-br-xs',
      },
      {
        variant: 'primary',
        shape: 'middle',
        class: '!rounded-tr-xs !rounded-br-xs',
      },
      {
        variant: 'primary',
        shape: 'last',
        class: '!rounded-tr-xs',
      },
    ],
    defaultVariants: {
      variant: 'muted',
      shape: 'single',
      size: 'xs',
    },
  },
);

const BubbleContext = React.createContext<{
  showTime: boolean;
  setShowTime: React.Dispatch<React.SetStateAction<boolean>>;
  variant: 'primary' | 'muted';
  shape: 'single' | 'first' | 'middle' | 'last';
} | null>(null);

export function useBubble() {
  const context = React.useContext(BubbleContext);
  if (!context) {
    return {
      showTime: false,
      setShowTime: () => {},
      variant: 'muted' as const,
      shape: 'single' as const,
    };
  }
  return context;
}

// 1. Bubble (Row container)
export interface BubbleProps extends React.ComponentPropsWithoutRef<'div'> {
  align?: 'start' | 'end' | undefined;
  variant?: 'primary' | 'muted' | null | undefined;
  shape?: 'single' | 'first' | 'middle' | 'last' | null | undefined;
}

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  (
    {
      className,
      align,
      variant,
      shape = 'single',
      children,
      ...props
    },
    ref,
  ) => {
    const [showTime, setShowTime] = React.useState(false);
    const resolvedVariant = variant ?? 'muted';
    const resolvedShape = shape ?? 'single';
    const resolvedAlign = align ?? (resolvedVariant === 'primary' ? 'end' : 'start');

    return (
      <BubbleContext.Provider value={{ showTime, setShowTime, variant: resolvedVariant, shape: resolvedShape }}>
        <div
          ref={ref}
          data-slot="chat-bubble"
          data-tone={resolvedVariant === 'primary' ? 'me' : 'them'}
          data-shape={resolvedShape}
          className={cn(
            'relative flex w-fit max-w-[70%] flex-col gap-0.5',
            resolvedAlign === 'end' ? 'self-end items-end' : 'self-start items-start',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </BubbleContext.Provider>
    );
  },
);
Bubble.displayName = 'Bubble';

// 2. BubbleContent (The message bubble itself)
export interface BubbleContentProps
  extends React.ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof chatBubbleVariants> {
  raw?: boolean | undefined;
  timeLabel?: string | undefined;
}

const BubbleContent = React.forwardRef<HTMLDivElement, BubbleContentProps>(
  (
    {
      className,
      variant,
      shape,
      size = 'xs',
      raw = false,
      timeLabel,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const context = useBubble();
    const resolvedVariant = variant ?? context.variant;
    const resolvedShape = shape ?? context.shape;
    const timePosition = resolvedVariant === 'primary' ? 'right-full mr-1.5' : 'left-full ml-1.5';

    const handleBubbleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) return;
      context.setShowTime((prev) => !prev);
      onClick?.(e);
    };

    return (
      <div className="relative flex items-end w-full">
        <div
          ref={ref}
          className={cn(
            chatBubbleVariants({ variant: resolvedVariant, shape: resolvedShape, size }),
            raw && 'p-0',
            className,
          )}
          onClick={handleBubbleClick}
          {...props}
        >
          {raw ? (
            children
          ) : (
            <div className="leading-snug whitespace-pre-wrap">{children}</div>
          )}
        </div>
        {timeLabel ? (
          <span
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 type-caption whitespace-nowrap text-muted-foreground opacity-0 transition-opacity duration-(--duration-fast) sm:group-hover:opacity-100',
              context.showTime && 'opacity-100',
              timePosition,
            )}
          >
            {timeLabel}
          </span>
        ) : null}
      </div>
    );
  },
);
BubbleContent.displayName = 'BubbleContent';

// 3. BubbleGroup (Consecutive messages container)
export interface BubbleGroupProps extends React.ComponentPropsWithoutRef<'div'> {}

const BubbleGroup = React.forwardRef<HTMLDivElement, BubbleGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-0.5 w-full', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
BubbleGroup.displayName = 'BubbleGroup';

// 4. BubbleReactions (Reaction container)
const bubbleReactionsVariants = cva(
  'absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-border bg-card px-1.5 py-0.5 text-xs shadow-sm ring-3 ring-background select-none transition-transform hover:scale-105 active:scale-95',
  {
    variants: {
      side: {
        top: 'top-0 -translate-y-1/2',
        bottom: 'bottom-0 translate-y-1/2',
      },
      align: {
        start: 'left-3',
        end: 'right-3',
      },
    },
    defaultVariants: {
      side: 'bottom',
      align: 'end',
    },
  }
);

export interface BubbleReactionsProps
  extends React.ComponentPropsWithoutRef<'div'>,
    VariantProps<typeof bubbleReactionsVariants> {}

const BubbleReactions = React.forwardRef<HTMLDivElement, BubbleReactionsProps>(
  ({ className, side = 'bottom', align = 'end', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          bubbleReactionsVariants({ side, align }),
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
BubbleReactions.displayName = 'BubbleReactions';

export {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
  chatBubbleVariants,
};
