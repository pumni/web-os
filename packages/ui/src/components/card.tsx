import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/cn";

/**
 * Card surface. `solid` (default) is the crisp raised content surface — opaque
 * fill, hairline border, owned `shadow-card` depth. `inset` is the recessed
 * nested well (muted fill, no shadow). `glass` is opt-in for cards that literally
 * float over other content (it carries the translucent glass treatment + a11y
 * fallbacks); most content should stay solid. `spotlight` is opt-in: a
 * pointer-tracked radial highlight appears on hover (needs the `CardSpotlight`
 * wrapper which is the client component that injects `--spot-x`/`--spot-y`).
 *
 * `interactive` opts a clickable card into CSS micro-feedback (hover lift +
 * press depress, both `motion-safe`-gated). Leave it off for passive surfaces —
 * a static card must not depress. This is the CSS counterpart to the JS
 * `recipes.hoverLift`; reach for the recipe only when the card is already a
 * `motion.*` element (e.g. inside a stagger).
 *
 * ### Card states
 *
 * The `state` prop drives data-driven surface feedback without layout shifts:
 *
 * - `"idle"` (default) — no change.
 * - `"loading"` — subtle opacity breathing pulse (`motion-safe:animate-breathe`
 *   via `motion.css` keyframe). Sets `aria-busy="true"` automatically.
 * - `"error"` — lateral shake animation (`motion-safe:animate-shake`),
 *   destructive border tint (`border-destructive/20`). Runs once and stops.
 *   **Consumer responsibility:** pair with an `aria-live="polite"` region
 *   outside the Card that announces the error message — the shake is visual
 *   only.
 * - `"success"` — success border tint (`border-success/20`) with a spring
 *   ring fade. **Consumer responsibility:** pair with an `aria-live="polite"`
 *   region that announces the success confirmation.
 *
 * All motion gates behind `prefers-reduced-motion` via the global CSS safety
 * net (`glass.css`) plus the `motion-safe:` Tailwind utility on each class.
 */
const cardVariants = cva("flex flex-col gap-6 py-6 text-card-foreground", {
  variants: {
    variant: {
      // Raised, crisp content surface — the default. Owned elevation utility.
      solid: "border bg-card shadow-card",
      // Recessed nested well (no shadow, lower contrast fill).
      inset: "border border-border bg-muted",
      // Opt-in: floating translucent glass. Use ONLY when the card literally
      // floats over other content. Most content should NOT use this.
      glass: "glass-panel",
      // Opt-in: pointer-tracked spotlight highlight on hover.
      // Renders the same opaque base as `solid` + adds a ::before radial
      // gradient that follows the cursor (requires CardSpotlight client wrapper).
      spotlight: "border bg-card shadow-card card-spotlight group",
    },
    interactive: {
      true: "cursor-pointer transition-[transform,box-shadow,border-color] duration-(--duration-base) ease-snappy hover:shadow-interactive-hover hover:border-primary/30 motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-(--press-scale)",
      false: "",
    },
    radius: {
      none: "rounded-none [--parent-radius:0px]",
      xs: "rounded-xs [--parent-radius:var(--radius-xs)]",
      sm: "rounded-sm [--parent-radius:var(--radius-sm)]",
      md: "rounded-md [--parent-radius:var(--radius-md)]",
      lg: "rounded-lg [--parent-radius:var(--radius-lg)]",
      xl: "rounded-xl [--parent-radius:var(--radius-xl)]",
      "2xl": "rounded-2xl [--parent-radius:var(--radius-2xl)]",
      "3xl": "rounded-3xl [--parent-radius:var(--radius-3xl)]",
    },
    state: {
      /** No feedback — default passive surface. */
      idle: "",
      /**
       * Loading: opacity breathing pulse, gated behind motion-safe.
       * `aria-busy="true"` is set automatically on the element.
       */
      loading: "motion-safe:animate-[breathe_var(--duration-slower)_var(--ease-in-out)_infinite]",
      /**
       * Error: lateral shake (runs once), destructive border tint.
       * Status-tint pattern: /20 border is valid per design-system.md.
       */
      error:
        "border-destructive/20 motion-safe:animate-[shake_var(--duration-base)_var(--ease-spring)_1]",
      /**
       * Success: success border tint with spring transition.
       * Status-tint pattern: /20 border is valid per design-system.md.
       */
      success:
        "border-success/20 transition-[border-color,box-shadow] duration-(--duration-base) ease-(--ease-spring)",
    },
  },
  defaultVariants: {
    variant: "solid",
    interactive: false,
    radius: "xl",
    state: "idle",
  },
});

function Card({
  className,
  variant,
  interactive,
  radius,
  state,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";

  // aria-busy should be true when in loading state
  const ariaBusy = state === "loading" ? true : undefined;

  return (
    <Comp
      data-slot="card"
      data-variant={variant ?? "solid"}
      data-state={state ?? "idle"}
      aria-busy={ariaBusy}
      className={cn(cardVariants({ variant, interactive, radius, state }), className)}
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
  return <div data-slot="card-title" className={cn("type-heading", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("type-label text-muted-foreground", className)}
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
