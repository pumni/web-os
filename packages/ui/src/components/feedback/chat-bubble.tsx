import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/cn';

/**
 * ChatBubble — the owned chat message bubble primitive.
 *
 * Replaces the hand-rolled `<div>` + radius map + timestamp overlay that
 * was inlined twice across `chat-panel.tsx` (BubbleContent +
 * getBubbleRadiusClass), and is intended to be reused by future chat
 * surfaces (DMs, group chats). One vocabulary, one tone contract, one
 * grouped-radius decision tree.
 *
 * ### Tone
 * - `me` — outgoing: `bg-primary text-primary-foreground`, right column.
 * - `them` — incoming: `bg-muted text-foreground`, left column.
 *
 * ### Shape (grouping)
 * Conversations cluster consecutive messages from the same sender. The
 * bubble only rounds the inner corners shared with neighbouring bubbles,
 * so the visual silhouette reads as a single speech run rather than
 * four disconnected pills. The shared base (`rounded-xl`) is set on the
 * cva root; compound variants tuck one floor-side corner toward `rounded-*-xs`
 * based on `tone` × `shape`:
 * - `single` — fully rounded.
 * - `first` — body side that touches the previous (different sender)
 *   message tucks in.
 * - `middle` — both side corners opposite to the column tuck in.
 * - `last` — only the floor-side corner tucks in.
 *
 * ### Timestamp
 * Optional `timestamp` (epoch ms) renders an opacity-0 hover-reveal
 * label next to the bubble. The parent container must carry
 * `className="group"` for the hover to fire (the radius map lives
 * inside the bubble, so this works for any layout the consumer picks).
 *
 * ### Children
 * `children` is rendered inside a `<div>` (not a `<p>`) so callers may
 * pass structured ReactNode — links, inline code, etc. — without HTML
 * nesting violations. String content keeps its pre-wrap semantics.
 */
const chatBubbleVariants = cva(
  'rounded-xl px-3 py-2 text-xs wrap-break-word shadow-control select-text',
  {
    variants: {
      tone: {
        me: 'bg-primary text-primary-foreground',
        them: 'bg-muted text-foreground',
      },
      /**
       * Shape is *only* a base for the compound variants above. Single
       * already inherits `rounded-xl` from the cva root, so listing it
       * again here would be a dead class.
       */
      shape: {
        single: '',
        /**
         * Group start — the compound variant for `them` / `me` adds
         * `rounded-bl-xs` / `rounded-br-xs` to tuck the floor-side
         * corner away from the next same-sender bubble.
         */
        first: '',
        /** Middle — both side corners opposite to the column tuck in. */
        middle: '',
        /**
         * Run end — the top-side corner tucks in to read as the tail
         * of the speech run.
         */
        last: '',
      },
    },
    compoundVariants: [
      // `them` (left column): the floor-side corner is the bottom-left.
      {
        tone: 'them',
        shape: 'first',
        class: 'rounded-bl-xs',
      },
      {
        tone: 'them',
        shape: 'middle',
        class: 'rounded-tl-xs rounded-bl-xs',
      },
      {
        tone: 'them',
        shape: 'last',
        class: 'rounded-tl-xs',
      },
      // `me` (right column): the floor-side corner is the bottom-right.
      {
        tone: 'me',
        shape: 'first',
        class: 'rounded-br-xs',
      },
      {
        tone: 'me',
        shape: 'middle',
        class: 'rounded-tr-xs rounded-br-xs',
      },
      {
        tone: 'me',
        shape: 'last',
        class: 'rounded-tr-xs',
      },
    ],
    defaultVariants: {
      tone: 'them',
      shape: 'single',
    },
  },
);

function formatChatTime(ms: number): string {
  const d = new Date(ms);
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

function ChatBubble({
  className,
  tone = 'them',
  shape = 'single',
  timestamp,
  align,
  children,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof chatBubbleVariants> & {
    /** Optional epoch ms — renders a hover-reveal timestamp next to
     *  the bubble. Requires `group` on an ancestor for hover to fire. */
    timestamp?: number;
    /** Override the bubble column alignment (defaults follow the tone). */
    align?: 'start' | 'end';
  }) {
  const resolvedAlign = align ?? (tone === 'me' ? 'end' : 'start');
  const timeLabel = timestamp != null ? formatChatTime(timestamp) : null;
  const timePosition = tone === 'me' ? 'right-full mr-1.5' : 'left-full ml-1.5';

  return (
    <div
      data-slot="chat-bubble"
      data-tone={tone}
      data-shape={shape}
      className={cn(
        'flex min-w-0 flex-col gap-0.5',
        resolvedAlign === 'end' ? 'items-end' : 'items-start',
      )}
    >
      <div className="relative flex max-w-[70%] items-end">
        <div className={cn(chatBubbleVariants({ tone, shape }), className)} {...props}>
          <div className="leading-snug whitespace-pre-wrap">{children}</div>
        </div>
        {timeLabel !== null ? (
          <span
            className={cn(
              'pointer-events-none absolute top-1/2 hidden -translate-y-1/2 type-caption whitespace-nowrap text-muted-foreground opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100 sm:block',
              timePosition,
            )}
          >
            {timeLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export { ChatBubble, chatBubbleVariants };
