import * as React from "react";

import { DesktopBackground } from "@/components/app-shell/desktop-background";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  GlassSurface,
} from "@pumni/ui";

type AuthShellProps = {
  subtitle: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Shared auth screen: a Liquid Glass panel floating over a token-driven Indigo
 * brand glow. Theme-aware (respects light/dark) instead of hardcoding colors.
 */
export function AuthShell({ subtitle, title, description, footer, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
      <DesktopBackground />
      <div className="relative z-10 w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-gradient-brand text-4xl font-bold tracking-tight">Pumni OS</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <GlassSurface className="flex flex-col gap-6 py-6">
          <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer ? (
            <CardFooter className="flex flex-wrap items-center justify-center gap-1 border-t text-sm text-muted-foreground">
              {footer}
            </CardFooter>
          ) : null}
        </GlassSurface>
      </div>
    </div>
  );
}
