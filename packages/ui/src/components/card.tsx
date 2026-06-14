import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

/**
 * Card surface. `solid` (default) is the crisp raised content surface — opaque
 * fill, hairline border, owned `shadow-card` depth. `inset` is the recessed
 * nested well (muted fill, no shadow). `glass` is opt-in for cards that literally
 * float over other content (it carries the translucent glass treatment + a11y
 * fallbacks); most content should stay solid.
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
      // Raised, crisp content surface — the default. Owned elevation utility.
      solid: "border bg-card shadow-card",
      // Recessed nested well (no shadow, lower contrast fill).
      inset: "border border-border bg-muted",
      // Opt-in: floating translucent glass. Use ONLY when the card literally
      // floats over other content. Most content should NOT use this.
      glass: "glass-panel",
    },
    interactive: {
      true: "cursor-pointer transition-[transform,box-shadow] duration-[var(--duration-base)] ease-snappy motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-(--press-scale)",
      false: "",
    },
  },
  defaultVariants: {
    variant: "solid",
    interactive: false,
  },
});

function Card({
  className,
  variant,
  interactive,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-slot="card"
      data-variant={variant ?? "solid"}
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
