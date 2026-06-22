import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SettingsIcon } from 'lucide-react';
import {
  AuthField,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Checkbox,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Highlight,
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
  Separator,
  Slider,
  SubmitButton,
  Switch,
  Tabs,
} from '@pumni/ui';
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

        {/* Form & Validation */}
        <Card>
          <CardHeader>
            <CardTitle>Form Primitives</CardTitle>
            <CardDescription>React Hook Form validation states.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="space-y-4"
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
                <div className="flex justify-end gap-2">
                  <SubmitButton size="sm">Submit Form</SubmitButton>
                </div>
              </form>
            </Form>
            <Separator className="my-4" />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">
                AuthField (Server Action form field)
              </p>
              <AuthField
                id="demo-auth-field"
                label="API Token Name"
                placeholder="e.g. Production Read-only"
                error={['Token name must be at least 3 characters.']}
              />
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                SubmitButton (Server Action ready)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Reads <code>useFormStatus</code> for auto-pending state. Falls back to manual{' '}
                <code>loading</code> prop.
              </p>
              <div className="flex gap-2">
                <SubmitButton size="sm">Save</SubmitButton>
                <SubmitButton size="sm" loading>
                  Saving…
                </SubmitButton>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input & Label States */}
        <Card>
          <CardHeader>
            <CardTitle>Input States</CardTitle>
            <CardDescription>Fields under different user feedback scenarios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="input-normal">Active Input (outline)</Label>
              <Input id="input-normal" defaultValue="Editable content" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="input-filled">Filled Variant</Label>
              <Input id="input-filled" variant="filled" placeholder="Filled input style…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="input-invalid" className="text-destructive">
                Invalid Input
              </Label>
              <Input id="input-invalid" placeholder="Invalid data entered" aria-invalid="true" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="input-disabled" className="opacity-50">
                Disabled Input
              </Label>
              <Input id="input-disabled" defaultValue="Locked value" disabled />
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
            <p className="text-[11px] text-muted-foreground">
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
