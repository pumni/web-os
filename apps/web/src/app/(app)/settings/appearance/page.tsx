"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeOptions = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
] as const;

export default function AppearanceSettingsPage() {
  const { theme = "system", setTheme } = useTheme();
  const selectedTheme = themeOptions.find((option) => option.value === theme) ?? themeOptions[0];
  const SelectedIcon = selectedTheme.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Appearance</h1>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of the application.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-medium text-card-foreground">Theme</h2>
          <p className="text-sm text-muted-foreground">Choose how the interface is displayed.</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start sm:w-36">
              <SelectedIcon className="size-4" />
              {selectedTheme.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuRadioGroup value={selectedTheme.value} onValueChange={setTheme}>
              {themeOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    <Icon className="size-4" />
                    {option.label}
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>
    </div>
  );
}
