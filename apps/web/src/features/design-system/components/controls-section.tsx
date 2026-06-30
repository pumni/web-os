'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SettingsIcon } from 'lucide-react';
import {
  AuthField,
  Button,
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SegmentedPicker,
  Slider,
  SubmitButton,
  Switch,
  Textarea,
  RadioGroup,
  RadioGroupItem,
} from '@pumni/ui/form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Highlight,
  Separator,
  Tabs,
} from '@pumni/ui/layout';
import { ShowcaseSection } from './showcase-section';

type DemoFormValues = {
  workspaceName: string;
  adminEmail: string;
};

export function ControlsSection() {
  const [sliderValue, setSliderValue] = React.useState([45]);
  const [pickerSize, setPickerSize] = React.useState('default');
  const [pickerView, setPickerView] = React.useState('grid');
  const [highlightQuery, setHighlightQuery] = React.useState('set');
  const [demoInputVariant, setDemoInputVariant] = React.useState<'outline' | 'filled'>('outline');
  const [demoInputDisabled, setDemoInputDisabled] = React.useState(false);
  const [demoInputInvalid, setDemoInputInvalid] = React.useState(false);

  const form = useForm<DemoFormValues>({
    defaultValues: {
      workspaceName: 'Pumni OS Catalog',
      adminEmail: '',
    },
  });

  return (
    <ShowcaseSection
      id="controls"
      title="Controls"
      description="Interactable form elements, selection fields, button variants, and validations."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>Action triggers across hierarchy levels.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link Action</Button>
            </div>
            <Separator />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="lg">Large</Button>
              <Button size="default">Default</Button>
              <Button size="sm">Small</Button>
              <Button size="xs">XS</Button>
              <Button size="icon" aria-label="Icon option">
                <SettingsIcon className="size-4" />
              </Button>
              <Button size="icon-sm" aria-label="Small icon option">
                <SettingsIcon className="size-3.5" />
              </Button>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">
                Loading State (CLS-safe)
              </p>
              <div className="flex flex-wrap gap-2">
                <Button loading>Saving…</Button>
                <Button variant="outline" loading>
                  Processing
                </Button>
                <Button variant="destructive" loading>
                  Deleting
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs & Form Primitives */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inputs & Form Primitives</CardTitle>
            <CardDescription>
              Form validation contexts, specialized fields, and raw input states.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {/* Left side: React Hook Form & Server Action fields */}
            <div className="space-y-5">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Form Context & Validation
                </span>
                <Form {...form}>
                  <form
                    className="space-y-3"
                    onSubmit={form.handleSubmit((values) =>
                      toast.success(`Form saved: ${values.workspaceName}`),
                    )}
                  >
                    <FormField
                      control={form.control}
                      name="workspaceName"
                      rules={{ required: 'Workspace name is required.' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Workspace Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter workspace..." {...field} />
                          </FormControl>
                          <FormDescription>Must be unique in the organization.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <SubmitButton size="sm">Submit Form</SubmitButton>
                    </div>
                  </form>
                </Form>
              </div>

              <Separator />

              <div className="space-y-3.5">
                <span className="text-xs font-semibold text-muted-foreground block">
                  AuthField & SubmitButton (Server Action ready)
                </span>
                <AuthField
                  id="demo-auth-field"
                  label="API Token Name"
                  placeholder="e.g. Production Read-only"
                  error={['Token name must be at least 3 characters.']}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Pending State:</span>
                  <SubmitButton size="xs">Save</SubmitButton>
                  <SubmitButton size="xs" loading>
                    Saving…
                  </SubmitButton>
                </div>
              </div>
            </div>

            {/* Right side: Interactive Input Playground */}
            <div className="space-y-4 md:border-l md:pl-6">
              <span className="text-xs font-semibold text-muted-foreground block">
                Interactive Input Playground
              </span>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="input-playground"
                    className={demoInputInvalid ? 'text-destructive' : ''}
                  >
                    Dynamic Input Field
                  </Label>
                  <Input
                    id="input-playground"
                    variant={demoInputVariant}
                    disabled={demoInputDisabled}
                    aria-invalid={demoInputInvalid ? true : undefined}
                    placeholder={demoInputDisabled ? 'Locked state' : 'Type something...'}
                    defaultValue={demoInputDisabled ? 'Locked' : 'Editable text'}
                  />
                    {demoInputInvalid && (
                    <p className="text-xs text-destructive">Invalid input data entered.</p>
                    )}
                </div>

                <div className="space-y-1.5 pt-2">
                  <Label
                    htmlFor="textarea-playground"
                    className={demoInputInvalid ? 'text-destructive' : ''}
                  >
                    Dynamic Textarea Field
                  </Label>
                  <Textarea
                    id="textarea-playground"
                    variant={demoInputVariant}
                    disabled={demoInputDisabled}
                    aria-invalid={demoInputInvalid ? true : undefined}
                    placeholder={demoInputDisabled ? 'Locked state' : 'Type multiline content...'}
                    defaultValue={demoInputDisabled ? 'Locked' : 'Editable multiline text'}
                    rows={3}
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Configure States & Styles
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="toggle-variant" className="text-xs">
                        Filled Variant
                      </Label>
                      <Switch
                        id="toggle-variant"
                        checked={demoInputVariant === 'filled'}
                        onCheckedChange={(checked) =>
                          setDemoInputVariant(checked ? 'filled' : 'outline')
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="toggle-disabled" className="text-xs">
                        Disabled State
                      </Label>
                      <Switch
                        id="toggle-disabled"
                        checked={demoInputDisabled}
                        onCheckedChange={setDemoInputDisabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="toggle-invalid" className="text-xs">
                        Invalid State (Error)
                      </Label>
                      <Switch
                        id="toggle-invalid"
                        checked={demoInputInvalid}
                        onCheckedChange={setDemoInputInvalid}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selection & Slider */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Selection & Slider</CardTitle>
            <CardDescription>
              Checkbox, switches, select fields, and numeric sliders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="switch-showcase">System Updates</Label>
              <Switch id="switch-showcase" defaultChecked />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="checkbox-showcase" defaultChecked />
              <Label htmlFor="checkbox-showcase">I agree to terms & conditions</Label>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-muted-foreground block">
                Theme Choice (Radio Group)
              </span>
              <RadioGroup defaultValue="dark" className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="light" id="r-light" />
                  <Label htmlFor="r-light" className="text-xs font-normal cursor-pointer">Light Mode</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="dark" id="r-dark" />
                  <Label htmlFor="r-dark" className="text-xs font-normal cursor-pointer">Dark Mode</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="system" id="r-system" />
                  <Label htmlFor="r-system" className="text-xs font-normal cursor-pointer">System Default</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="select-showcase">Select Action</Label>
              <Select defaultValue="profile">
                <SelectTrigger id="select-showcase" className="w-full">
                  <SelectValue placeholder="Choose action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Actions</SelectLabel>
                    <SelectItem value="profile">Edit Profile</SelectItem>
                    <SelectItem value="settings">Open Settings</SelectItem>
                    <SelectSeparator />
                    <SelectItem value="delete" className="text-destructive">
                      Delete Account
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <Label htmlFor="slider-showcase">Volume Adjustment</Label>
                <span className="font-mono text-xs font-semibold text-primary">
                  {sliderValue[0]}%
                </span>
              </div>
              <Slider
                id="slider-showcase"
                aria-label="Volume Adjustment"
                min={0}
                max={100}
                step={1}
                value={sliderValue}
                onValueChange={setSliderValue}
              />
            </div>
          </CardContent>
        </Card>

        {/* Segmented Picker */}
        <Card>
          <CardHeader>
            <CardTitle>Segmented Picker</CardTitle>
            <CardDescription>
              Single-select value choice with no panel content. The sliding indicator tracks the
              active option.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Size variants</Label>
              <SegmentedPicker
                aria-label="Picker size"
                options={['default', 'sm']}
                value={pickerSize}
                onChange={setPickerSize}
                labels={{ default: 'Default', sm: 'Small' }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Full-width (view modes)</Label>
              <SegmentedPicker
                aria-label="View mode"
                options={['list', 'grid', 'compact']}
                value={pickerView}
                onChange={setPickerView}
                labels={{ list: 'List', grid: 'Grid', compact: 'Compact' }}
                fullWidth
              />
            </div>
            <div className="space-y-1.5">
              <Label>Custom labels</Label>
              <SegmentedPicker
                aria-label="Density"
                options={['standard', 'reduced']}
                value="standard"
                onChange={() => {}}
                labels={{ standard: 'Normal', reduced: 'Enhanced' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Text Highlight */}
        <Card>
          <CardHeader>
            <CardTitle>Text Highlight</CardTitle>
            <CardDescription>
              Case-insensitive substring emphasis for searchable lists and filtered results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={highlightQuery}
              onChange={(e) => setHighlightQuery(e.target.value)}
              placeholder="Type to match…"
              aria-label="Highlight query"
            />
            <ul className="space-y-1.5 text-sm">
              {['Account Settings Panel', 'User Profile', 'Set Preferences'].map((text) => (
                <li key={text} className="text-muted-foreground">
                  <Highlight text={text} query={highlightQuery} />
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Matches every whitespace-split token. Empty query renders text untouched.
            </p>
          </CardContent>
        </Card>

        {/* Tabs — section nav (underline only) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Section Tabs</CardTitle>
            <CardDescription>
              Panel content switching driven by a sliding underline indicator. Each trigger owns a
              content panel — use this for sections, not for value-only selection (that is
              SegmentedPicker above).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab-general">
              <Tabs.List className="w-full justify-start sm:w-auto">
                <Tabs.Trigger value="tab-general">General</Tabs.Trigger>
                <Tabs.Trigger value="tab-appearance">Appearance</Tabs.Trigger>
                <Tabs.Trigger value="tab-advanced">Advanced</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="tab-general" className="pt-4 text-sm text-muted-foreground">
                Manage primary workspace credentials, regional defaults, and collaboration
                schedules.
              </Tabs.Content>
              <Tabs.Content value="tab-appearance" className="pt-4 text-sm text-muted-foreground">
                Personalize the background canvas, accent color palettes, and surface transparency
                levels.
              </Tabs.Content>
              <Tabs.Content value="tab-advanced" className="pt-4 text-sm text-muted-foreground">
                Configure hotkeys, hardware acceleration override, and view runtime diagnostic
                statistics.
              </Tabs.Content>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </ShowcaseSection>
  );
}
