'use client';

import * as React from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  ACCENTS,
  Button,
  Card,
  CardContent,
  cn,
  DensityPicker,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  GlassLevelPicker,
  usePersonalization,
} from '@pumni/ui';

const themeOptions = [
  { value: 'system', label: 'System', icon: MonitorIcon },
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
] as const;

function subscribeToClientReady() {
  return () => {};
}

function getClientReadySnapshot() {
  return true;
}

function getServerReadySnapshot() {
  return false;
}

export default function AppearanceSettingsPage() {
  const { theme = 'system', setTheme } = useTheme();
  const { accent, density, glass, setAccent, setDensity, setGlass } = usePersonalization();
  const mounted = React.useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot,
  );

  const selectedTheme =
    themeOptions.find((option) => option.value === (mounted ? theme : 'system')) ?? themeOptions[0];
  const SelectedIcon = selectedTheme.icon;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Appearance</h1>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of the application.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-medium text-card-foreground">Theme</h2>
            <p className="text-sm text-muted-foreground">Choose how the interface is displayed.</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" pressable={false} className="w-full justify-start sm:w-36">
                <SelectedIcon className="size-4" />
                {selectedTheme.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuRadioGroup
                value={selectedTheme.value}
                onValueChange={(value) => setTheme(value)}
              >
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
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-medium text-card-foreground">Accent</h2>
            <p className="text-sm text-muted-foreground">
              Brand colour used across primary actions and focus rings.
            </p>
          </div>

          <div className="flex gap-2">
            {ACCENTS.map((value) => (
              <button
                key={value}
                type="button"
                // Scope each swatch to its accent so `bg-primary` resolves to that
                // accent's live brand colour — no raw primitives in the component.
                data-accent={value}
                aria-label={value}
                aria-pressed={accent === value}
                onClick={() => setAccent(value)}
                className={cn(
                  'size-7 rounded-full border-2 bg-primary capitalize transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  accent === value ? 'border-foreground' : 'border-transparent',
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-medium text-card-foreground">Surface intensity</h2>
            <p className="text-sm text-muted-foreground">
              Blur strength applied to floating glass surfaces.
            </p>
          </div>

          <GlassLevelPicker value={glass} onChange={setGlass} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-medium text-card-foreground">Density</h2>
            <p className="text-sm text-muted-foreground">
              Control spacing and height of interactive elements.
            </p>
          </div>

          <DensityPicker value={density} onChange={setDensity} />
        </CardContent>
      </Card>
    </div>
  );
}
