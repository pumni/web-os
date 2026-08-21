import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { DesignSystemShowcase } from '@/features/design-system';
import { PersonalizationProvider } from '@pumni/ui/identity';
import { TooltipProvider } from '@pumni/ui/overlay';

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast,
}));

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderShowcase() {
  return render(
    <PersonalizationProvider>
      <TooltipProvider>
        <DesignSystemShowcase />
      </TooltipProvider>
    </PersonalizationProvider>,
  );
}

describe('DesignSystemShowcase', { timeout: 30000 }, () => {
  it('renders the primary QA sections from shared UI primitives', () => {
    renderShowcase();

    expect(screen.getByRole('heading', { name: 'Design System' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Foundations', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Controls', level: 2 })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Surfaces & Layout', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Overlays & Menus', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Feedback & Identity', level: 2 })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Identity & Personalization', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Motion', level: 2 })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Bento Grid (12-col)', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Card States & Spotlight', level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Application dock' })).toBeInTheDocument();

    // Additional coverage for new primitives and structures
    expect(screen.getAllByRole('slider')[0]).toBeInTheDocument();
    expect(screen.getByText('Volume Adjustment')).toBeInTheDocument();
    expect(screen.getByText('Button Variants')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Destructive' })).toBeInTheDocument();
    expect(screen.getByText('Typography Scale')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getAllByText('JN')[0]).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Secondary' })[0]).toBeInTheDocument();
  });

  it('renders the Kinetic OS Window demo and resets coordinates', () => {
    renderShowcase();

    const jsTabButton = screen.getByRole('radio', { name: 'JS Orchestration' });
    fireEvent.click(jsTabButton);

    expect(screen.getByText('Kinetic OS Window')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByText('Momentum')).toBeInTheDocument();
  });

  it('renders form-control primitives with the default active tab', () => {
    renderShowcase();

    expect(screen.getByRole('switch', { name: /system updates/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /i agree to terms/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'Appearance' })).toHaveAttribute(
      'data-state',
      'inactive',
    );
  });

  it('opens the right-click context menu surface', () => {
    renderShowcase();

    fireEvent.contextMenu(screen.getByText('Right-Click Area'));

    expect(screen.getByRole('menuitem', { name: /new folder/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /clean workspace/i })).toBeInTheDocument();
  });

  it('opens dialog and sends toast feedback', () => {
    renderShowcase();

    fireEvent.click(screen.getAllByRole('button', { name: 'Success' })[0]!);
    expect(toast.success).toHaveBeenCalledWith('Changes saved successfully.');

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Dialog' }));
    expect(screen.getByRole('heading', { name: 'Overlay Dialog Surface' })).toBeInTheDocument();
  });

  it('opens sheet and command palette surfaces', () => {
    renderShowcase();

    fireEvent.click(screen.getByRole('button', { name: /trigger sheet/i }));
    expect(screen.getByRole('heading', { name: 'Overlay Side Sheet' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Command Palette' }));
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
  });

  it('opens dropdown and renders avatar group states', () => {
    renderShowcase();

    fireEvent.pointerDown(screen.getByRole('button', { name: /open dropdown/i }), {
      button: 0,
      ctrlKey: false,
    });

    expect(screen.getByRole('menuitem', { name: /user settings/i })).toBeInTheDocument();
    expect(screen.getByText('PN')).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('toggles APCA presets and updates Lc score', () => {
    renderShowcase();

    expect(screen.getByText('Interactive Lc Playground')).toBeInTheDocument();

    const presetButton = screen.getByRole('button', { name: /Coral on Dark/i });
    fireEvent.click(presetButton);

    expect(screen.getByText('Lc 60+ — Pass Text')).toBeInTheDocument();
  });

  it('renders OKLCH sliders for foreground and background adjustment', () => {
    renderShowcase();

    // Check for the presence of the slider labels
    expect(screen.getAllByText('Lightness (L)').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Chroma (C)').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Hue (h)').length).toBeGreaterThanOrEqual(2);

    // Verify slider elements exist
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(6);
  });

  it('toggles reduced motion simulation in Motion section', () => {
    renderShowcase();

    expect(screen.getByText(/All Animations Active/)).toBeInTheDocument();

    const toggleButton = screen.getByRole('button', { name: /Simulate Reduced Motion/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText(/Animations Blocked/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stop Simulation/i })).toBeInTheDocument();
  });

  it('renders View Transitions demo inside Navigation & Scroll tab', () => {
    renderShowcase();

    const navTabButton = screen.getByRole('radio', { name: 'Navigation & Scroll' });
    fireEvent.click(navTabButton);

    expect(screen.getByText('Page View Transitions')).toBeInTheDocument();
  });

  it('renders APCA contrast calculator with pass/fail indicator', () => {
    renderShowcase();

    expect(screen.getByText('APCA Contrast')).toBeInTheDocument();
    expect(screen.getByText('Lc 90+ — Max')).toBeInTheDocument();
  });

  it('renders the Spinner primitive in the Feedback section', () => {
    renderShowcase();

    expect(screen.getByText('Loading Spinners')).toBeInTheDocument();
    // Spinner is decorative (aria-hidden) — assert via its data-slot.
    expect(screen.getAllByLabelText('Loading data')[0]).toBeInTheDocument();
  });

  it('renders the Highlight primitive in the Controls section', () => {
    renderShowcase();

    expect(screen.getByText('Text Highlight')).toBeInTheDocument();
    expect(screen.getByLabelText('Highlight query')).toHaveValue('set');
    // Default query 'set' wraps the "Set" inside "Settings" in a <mark>.
    const marks = document.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
    expect(Array.from(marks).some((m) => m.textContent === 'Set')).toBe(true);
  });

  it('renders the SegmentedPicker view modes with friendly labels', () => {
    renderShowcase();

    // The view-mode picker now exposes human labels, not raw keys.
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Compact' })).toBeInTheDocument();
  });
});
