import * as React from "react";
import { cn } from "../lib/cn";
import { Card } from "./card";

interface BentoGridProps extends React.ComponentProps<"div"> {
  children: React.ReactNode;
}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoGridItemProps extends Omit<React.ComponentProps<typeof Card>, "title"> {
  children?: React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  colSpan?: string;
  rowSpan?: string;
}

export function BentoGridItem({
  className,
  children,
  header,
  icon,
  title,
  description,
  colSpan = "col-span-1",
  rowSpan = "row-span-1",
  interactive = true,
  ...props
}: BentoGridItemProps) {
  return (
    <Card
      interactive={interactive}
      className={cn(
        "relative overflow-hidden flex flex-col gap-4 p-5 md:p-6",
        colSpan,
        rowSpan,
        className
      )}
      {...props}
    >
      {header && (
        <div className="flex w-full items-center justify-center rounded-xl bg-muted/40 overflow-hidden min-h-[120px] max-h-[160px] border border-border/10">
          {header}
        </div>
      )}
      <div className="flex flex-col gap-2 flex-1">
        {(icon || title || description) && (
          <div className="space-y-1.5">
            {icon && (
              <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            {title && (
              <h3 className="font-bold text-lg leading-tight tracking-tight text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground leading-normal font-normal">
                {description}
              </p>
            )}
          </div>
        )}
        {children && <div className="mt-2 flex-1 flex flex-col">{children}</div>}
      </div>
    </Card>
  );
}
