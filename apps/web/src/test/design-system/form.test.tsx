import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { tokenCss } from './token-test-utils';

beforeAll(() => {
  // Radix Slider uses ResizeObserver internally.
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import {
  Button,
  Input,
  Label,
  Checkbox,
  Switch,
  Slider,
  AuthField,
  SegmentedPicker,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from '@pumni/ui/form';
import { useForm } from 'react-hook-form';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
describe('Input', () => {
  it('renders with data-slot and forwards ref', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} data-testid="input" />);
    const el = screen.getByTestId('input');
    expect(el.tagName).toBe('INPUT');
    expect(el).toHaveAttribute('data-slot', 'input');
    expect(ref.current).toBe(el);
  });

  it('applies outline variant by default', () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId('input').className).toContain('border-input');
  });

  it('applies filled variant', () => {
    render(<Input variant="filled" data-testid="input" />);
    expect(screen.getByTestId('input').className).toContain('border-transparent');
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------
describe('Label', () => {
  it('renders with data-slot and forwards ref', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(
      <Label ref={ref} data-testid="label">
        Email
      </Label>,
    );
    const el = screen.getByTestId('label');
    expect(el.tagName).toBe('LABEL');
    expect(el).toHaveAttribute('data-slot', 'label');
    expect(ref.current).toBe(el);
  });
});

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
describe('Button', () => {
  it('renders as a button with data-slot and forwards ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} data-testid="btn">
        Click
      </Button>,
    );
    const el = screen.getByTestId('btn');
    expect(el.tagName).toBe('BUTTON');
    expect(el).toHaveAttribute('data-slot', 'button');
    expect(ref.current).toBe(el);
  });

  it('sets aria-busy and hides label text when loading', () => {
    render(
      <Button loading data-testid="btn">
        Save
      </Button>,
    );
    const el = screen.getByTestId('btn');
    expect(el).toHaveAttribute('aria-busy', 'true');
    // Label span should be aria-hidden while loading so SR skips the
    // invisible text (aria-busy covers the state announcement).
    const label = el.querySelector('span[aria-hidden="true"]');
    expect(label).toBeTruthy();
    // The label content is rendered but hidden — check it contains "Save".
    // jsdom may not layout opacity:0 spans, so verify via the children.
    expect(el.textContent).toContain('Save');
  });

  it('is disabled when loading even without explicit disabled', () => {
    render(
      <Button loading data-testid="btn">
        Save
      </Button>,
    );
    expect(screen.getByTestId('btn')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------
describe('Checkbox', () => {
  it('renders with data-slot and forwards ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} data-testid="cb" />);
    const el = screen.getByTestId('cb');
    expect(el).toHaveAttribute('data-slot', 'checkbox');
    expect(ref.current).toBe(el);
  });
});

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------
describe('Switch', () => {
  it('renders with data-slot and forwards ref', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Switch ref={ref} data-testid="sw" />);
    const el = screen.getByTestId('sw');
    expect(el).toHaveAttribute('data-slot', 'switch');
    expect(ref.current).toBe(el);
  });

  it('exposes dedicated visual tokens for track and thumb', () => {
    // Regression guard: switch must NOT fall back to --input / --background.
    // Confirms tokens.css owns the 4 role tokens that drive switch visual in
    // both light and dark — removing them would silently regress affordance.
    expect(tokenCss).toContain('--switch-track');
    expect(tokenCss).toContain('--switch-track-checked');
    expect(tokenCss).toContain('--switch-thumb');
    expect(tokenCss).toContain('--switch-thumb-checked');
  });

  it('renders the thumb slot for descendant CSS targeting', () => {
    render(<Switch data-testid="sw" />);
    const thumb = screen.getByTestId('sw').querySelector('[data-slot="switch-thumb"]');
    expect(thumb).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Slider (data-slot regression for CSS targeting)
// ---------------------------------------------------------------------------
describe('Slider', () => {
  it('renders with data-slot and forwards ref', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Slider ref={ref} data-testid="slider" defaultValue={[50]} />);
    const el = screen.getByTestId('slider');
    expect(el).toHaveAttribute('data-slot', 'slider');
    expect(ref.current).toBe(el);
  });

  it('preserves internal data-slot names consumed by descendant selectors', () => {
    render(<Slider data-testid="slider" defaultValue={[50]} />);
    const root = screen.getByTestId('slider');
    // These data-slot values are targeted by `**:` Tailwind selectors in
    // `room-controls.tsx` — renaming them breaks volume/seek sliders.
    expect(root.querySelector('[data-slot="slider-track"]')).not.toBeNull();
    expect(root.querySelector('[data-slot="slider-range"]')).not.toBeNull();
    expect(root.querySelector('[data-slot="slider-thumb"]')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AuthField (server-action driven field)
// ---------------------------------------------------------------------------
describe('AuthField', () => {
  it('renders label + input + wires aria-invalid from error', () => {
    render(<AuthField id="email" label="Email" data-testid="field" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('id', 'email');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('associates error message via aria-describedby and role="alert"', () => {
    render(
      <AuthField
        id="pw"
        label="Password"
        error={['Must be at least 8 characters.']}
        data-testid="field"
      />,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'pw-error');

    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toHaveAttribute('id', 'pw-error');
    expect(errorMsg).toHaveTextContent('Must be at least 8 characters.');
  });

  it('error-driven aria-invalid wins over consumer inputProps', () => {
    // Consumer tries to suppress aria-invalid — error should win because
    // computed aria-invalid is placed after the inputProps spread.
    render(<AuthField id="test" label="Test" error={['Bad value.']} aria-invalid={false} />);
    expect(screen.getByLabelText('Test')).toHaveAttribute('aria-invalid', 'true');
  });
});

// ---------------------------------------------------------------------------
// SegmentedPicker (a11y)
// ---------------------------------------------------------------------------
describe('SegmentedPicker', () => {
  it('renders as a radiogroup with aria-checked on active option', () => {
    const onChange = React.createRef<(v: string) => void>();
    const optionsList = ['comfortable', 'compact'] as const;
    render(
      <SegmentedPicker
        aria-label="Density"
        options={optionsList}
        value="compact"
        onChange={(v) => onChange.current?.(v)}
      />,
    );

    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-label', 'Density');

    // The active option should have aria-checked="true"
    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute('aria-checked', 'false');
    expect(options[0]).toHaveTextContent('comfortable');
    expect(options[1]).toHaveAttribute('aria-checked', 'true');
    expect(options[1]).toHaveTextContent('compact');
  });

  it('renders custom labels via the labels prop', () => {
    const optionsList = ['standard', 'reduced'] as const;
    const labels = { standard: 'Standard', reduced: 'Opaque Solid' } as const;
    render(
      <SegmentedPicker
        aria-label="Transparency"
        options={optionsList}
        value="reduced"
        onChange={() => {}}
        labels={labels}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    // Key 'standard' should display the custom label, not raw key
    expect(radios[0]).toHaveTextContent('Standard');
    // Key 'reduced' should display "Opaque Solid"
    expect(radios[1]).toHaveTextContent('Opaque Solid');
    // Raw keys must NOT appear in the DOM
    expect(screen.queryByText('reduced')).toBeNull();
    expect(screen.queryByText('standard')).toBeNull();
  });

  it('renders data-slot attributes and sliding indicator', () => {
    render(
      <SegmentedPicker
        aria-label="View"
        options={['list', 'grid']}
        value="list"
        onChange={() => {}}
      />,
    );

    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('data-slot', 'segmented-picker');

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('data-slot', 'segmented-picker-item');

    // Sliding indicator is decorative (aria-hidden, not a radio).
    const indicator = group.querySelector('[data-slot="segmented-picker-indicator"]');
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
    // Indicator does not count as a radio element
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('supports fullWidth and size props', () => {
    render(
      <SegmentedPicker
        aria-label="Size"
        options={['sm', 'default']}
        value="sm"
        onChange={() => {}}
        labels={{ sm: 'Small', default: 'Default' }}
        size="sm"
        fullWidth
      />,
    );

    const group = screen.getByRole('radiogroup');
    expect(group).toHaveClass('grid', 'w-full');

    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveClass('h-8');
  });

  it('exposes dedicated visual tokens for the track well and active pill', () => {
    // Regression guard: the picker must NOT fall back to --muted (which
    // collapsed against --background in light and inverted the well in dark).
    // Confirms tokens.css owns the track/active pair that drives the "selected
    // value rises out of the well" affordance in both themes.
    expect(tokenCss).toContain('--segmented-track');
    expect(tokenCss).toContain('--segmented-active');
  });

  it('renders the active pill on the checked option using the active token', () => {
    render(
      <SegmentedPicker
        aria-label="View"
        options={['list', 'grid']}
        value="grid"
        onChange={() => {}}
      />,
    );
    const indicator = screen
      .getByRole('radiogroup')
      .querySelector('[data-slot="segmented-picker-indicator"]');
    expect(indicator?.className).toContain('bg-(--segmented-active)');
  });
});

// ---------------------------------------------------------------------------
// Form (react-hook-form integration)
// ---------------------------------------------------------------------------
describe('Form integration', () => {
  function TestForm({ onSubmit }: { onSubmit: (v: { name: string }) => void }) {
    const form = useForm({ defaultValues: { name: '' } });
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <input data-testid="rhf-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <button type="submit" data-testid="submit">
            Submit
          </button>
        </form>
      </Form>
    );
  }

  it('renders FormLabel with form-item slot and htmlFor from FormItem id', () => {
    render(<TestForm onSubmit={() => {}} />);
    const label = screen.getByText('Name') as HTMLLabelElement;
    expect(label).toHaveAttribute('data-slot', 'form-label');
    // htmlFor should point to the form-item id (DOM attribute is `for`,
    // JS property is `htmlFor` — React sets the `for` attribute).
    expect(label).toHaveAttribute('for');
    expect(label.htmlFor).toBeTruthy();
  });

  it('useFormField throws when used outside FormField', () => {
    // Suppress the expected error boundary output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadConsumer() {
      function Inner() {
        useFormField();
        return null;
      }
      return (
        <Form {...useForm()}>
          <Inner />
        </Form>
      );
    }

    expect(() => render(<BadConsumer />)).toThrow('useFormField should be used within <FormField>');
    spy.mockRestore();
  });
});
