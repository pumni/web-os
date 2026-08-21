import { cva, type VariantProps } from 'class-variance-authority';
import { SmilePlus } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/cn';

const chatBubbleVariants = cva(
  'rounded-2xl px-4 py-2.5 wrap-break-word shadow-sm select-text transition-all duration-(--duration-base)',
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
        class: 'rounded-bl-xs!',
      },
      {
        variant: 'muted',
        shape: 'middle',
        class: 'rounded-tl-xs! rounded-bl-xs!',
      },
      {
        variant: 'muted',
        shape: 'last',
        class: 'rounded-tl-xs!',
      },
      // `primary` (right column): the floor-side corner is the bottom-right.
      {
        variant: 'primary',
        shape: 'first',
        class: 'rounded-br-xs!',
      },
      {
        variant: 'primary',
        shape: 'middle',
        class: 'rounded-tr-xs! rounded-br-xs!',
      },
      {
        variant: 'primary',
        shape: 'last',
        class: 'rounded-tr-xs!',
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
  ({ className, align, variant, shape = 'single', children, ...props }, ref) => {
    const [showTime, setShowTime] = React.useState(false);
    const resolvedVariant = variant ?? 'muted';
    const resolvedShape = shape ?? 'single';
    const resolvedAlign = align ?? (resolvedVariant === 'primary' ? 'end' : 'start');

    return (
      <BubbleContext.Provider
        value={{ showTime, setShowTime, variant: resolvedVariant, shape: resolvedShape }}
      >
        <div
          ref={ref}
          data-slot="chat-bubble"
          data-tone={resolvedVariant === 'primary' ? 'me' : 'them'}
          data-shape={resolvedShape}
          className={cn(
            'group/bubble relative flex w-fit max-w-[70%] flex-col gap-0.5',
            resolvedAlign === 'end' ? 'items-end self-end' : 'items-start self-start',
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
  extends React.ComponentPropsWithoutRef<'div'>, VariantProps<typeof chatBubbleVariants> {
  raw?: boolean | undefined;
  timeLabel?: string | undefined;
  /**
   * When provided, a Messenger-style "add reaction" button is revealed beside
   * the bubble on hover. The consumer wires this to open a picker or quick-react.
   */
  onReact?: (() => void) | undefined;
  reactLabel?: string | undefined;
  /**
   * Custom control rendered in the hover rail in place of the default react
   * button — e.g. an emoji-picker popover trigger. Takes precedence over `onReact`.
   */
  reactAction?: React.ReactNode | undefined;
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
      onReact,
      reactLabel = 'Thêm cảm xúc',
      reactAction,
      children,
      onClick,
      ...props
    },
    ref,
  ) => {
    const context = useBubble();
    const resolvedVariant = variant ?? context.variant;
    const resolvedShape = shape ?? context.shape;
    // The rail sits on the bubble's inner side (opposite its tail), with the
    // react button kept adjacent to the bubble in both columns.
    const railPosition =
      resolvedVariant === 'primary' ? 'right-full mr-1.5 flex-row-reverse' : 'left-full ml-1.5';

    const handleBubbleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button')) return;
      context.setShowTime((prev) => !prev);
      onClick?.(e);
    };

    return (
      <div className="relative flex w-full items-end">
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
          {raw ? children : <div className="leading-snug whitespace-pre-wrap">{children}</div>}
        </div>
        {timeLabel || onReact || reactAction ? (
          <div
            className={cn(
              'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity duration-(--duration-fast) sm:group-hover/bubble:pointer-events-auto sm:group-hover/bubble:opacity-100',
              context.showTime && 'pointer-events-auto opacity-100',
              railPosition,
            )}
          >
            {reactAction ? (
              reactAction
            ) : onReact ? (
              <button
                type="button"
                aria-label={reactLabel}
                onClick={onReact}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
              >
                <SmilePlus className="size-3.5" />
              </button>
            ) : null}
            {timeLabel ? (
              <span className="type-caption whitespace-nowrap text-muted-foreground select-none">
                {timeLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  },
);
BubbleContent.displayName = 'BubbleContent';

// 3. BubbleGroup (Consecutive messages container)
// Auto-assigns Messenger-style shapes (first/middle/last/single) to child
// Bubbles by position so consecutive bubbles cluster with tightened inner
// corners. An explicit `shape` on a child always wins.
export interface BubbleGroupProps extends React.ComponentPropsWithoutRef<'div'> {}

function resolveGroupShape(index: number, count: number): 'single' | 'first' | 'middle' | 'last' {
  if (count <= 1) return 'single';
  if (index === 0) return 'first';
  if (index === count - 1) return 'last';
  return 'middle';
}

const BubbleGroup = React.forwardRef<HTMLDivElement, BubbleGroupProps>(
  ({ className, children, ...props }, ref) => {
    const bubbles = React.Children.toArray(children).filter(React.isValidElement);
    return (
      <div ref={ref} className={cn('flex w-full flex-col gap-0.5', className)} {...props}>
        {bubbles.map((child, index) => {
          if (!React.isValidElement<BubbleProps>(child)) return child;
          if (child.props.shape != null) return child;
          return React.cloneElement(child, {
            shape: resolveGroupShape(index, bubbles.length),
          });
        })}
      </div>
    );
  },
);
BubbleGroup.displayName = 'BubbleGroup';

// 4. BubbleReactions (Reaction container)
const bubbleReactionsVariants = cva(
  'absolute z-10 flex w-fit shrink-0 items-center justify-center gap-0.5 rounded-full bg-card px-1 py-px text-xs leading-none shadow-sm ring-2 ring-background select-none transition-transform hover:scale-105 active:scale-95',
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
  },
);

export interface BubbleReactionsProps
  extends React.ComponentPropsWithoutRef<'div'>, VariantProps<typeof bubbleReactionsVariants> {}

const BubbleReactions = React.forwardRef<HTMLDivElement, BubbleReactionsProps>(
  ({ className, side = 'bottom', align = 'end', children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(bubbleReactionsVariants({ side, align }), className)} {...props}>
        {children}
      </div>
    );
  },
);
BubbleReactions.displayName = 'BubbleReactions';

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions, chatBubbleVariants };
