import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

/**
 * Card surface. `glass` (default) is the modern Liquid Glass treatment —
 * translucent frosted fill, hairline edge, layered depth. `solid` keeps the
 * opaque raised surface for dense, contrast-critical content.
 *
 * `interactive` opts a clickable card into CSS micro-feedback (hover lift +
 * press depress, both `motion-safe`-gated). Leave it off for passive surfaces —
 * a static card must not depress. This is the CSS counterpart to the JS
 * `recipes.hoverLift`; reach for the recipe only when the card is already a
 * `motion.*` element (e.g. inside a stagger).
 */
const cardVariants = cva("flex flex-col gap-6 rounded-xl py-6 text-card-foreground", {
  variants: {
    variant: {
      glass: "glass-panel",
      solid: "border bg-card shadow-sm",
    },
    interactive: {
      true: "cursor-pointer transition-[transform,box-shadow] duration-[var(--duration-base)] ease-snappy motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-(--press-scale)",
      false: "",
    },
  },
  defaultVariants: {
    variant: "glass",
    interactive: false,
  },
});

function Card({
  className,
  variant,
  interactive,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant ?? "glass"}
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};
