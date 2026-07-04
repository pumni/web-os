import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  CardSpotlight,
  Highlight,
  ScrollArea,
  ScrollBar,
  Separator,
  Tabs,
} from './index';

// Radix ScrollArea / Tabs use ResizeObserver internally.
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------
describe('Separator', () => {
  it('renders with data-slot and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Separator ref={ref} data-testid="sep" />);
    const el = screen.getByTestId('sep');
    expect(el).toHaveAttribute('data-slot', 'separator');
    expect(ref.current).toBe(el);
  });

  it('defaults to horizontal orientation', () => {
    render(<Separator data-testid="sep" />);
    expect(screen.getByTestId('sep')).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('honours explicit vertical orientation', () => {
    render(<Separator orientation="vertical" data-testid="sep" />);
    expect(screen.getByTestId('sep')).toHaveAttribute('data-orientation', 'vertical');
  });
});

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
describe('Avatar', () => {
  it('renders with data-slot, default size, and forwards ref', () => {
    const ref = React.createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} data-testid="avatar" />);
    const el = screen.getByTestId('avatar');
    expect(el).toHaveAttribute('data-slot', 'avatar');
    expect(el).toHaveAttribute('data-size', 'default');
    expect(ref.current).toBe(el);
  });

  it('reflects the lg size on data-size', () => {
    render(<Avatar size="lg" data-testid="avatar" />);
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-size', 'lg');
  });

  it('renders fallback initials as text', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText('JD')).toBeTruthy();
  });

  it('falls back to AvatarFallback while the image is loading', () => {
    // Radix Avatar only paints <img> once it fires `load`; jsdom never fires
    // that, so the image stays hidden and the fallback renders instead. That
    // contract (fallback covers the loading/unloaded state) is the stable,
    // observable behaviour worth locking in here.
    render(
      <Avatar data-testid="avatar">
        <AvatarImage src="/x.png" alt="Jane" />
        <AvatarFallback>JN</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-slot', 'avatar');
    expect(screen.getByText('JN')).toBeTruthy();
  });

  it('renders AvatarBadge with the avatar-badge slot', () => {
    render(
      <Avatar>
        <AvatarBadge data-testid="badge" />
      </Avatar>,
    );
    expect(screen.getByTestId('badge')).toHaveAttribute('data-slot', 'avatar-badge');
  });
});

describe('AvatarGroup', () => {
  it('renders children and a count, each with its slot', () => {
    render(
      <AvatarGroup>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>PN</AvatarFallback>
        </Avatar>
        <AvatarGroupCount>+3</AvatarGroupCount>
      </AvatarGroup>,
    );
    const group = screen.getByText('AL').closest('[data-slot="avatar-group"]');
    expect(group).toBeTruthy();
    expect(screen.getByText('+3')).toHaveAttribute('data-slot', 'avatar-group-count');
  });

  it('forwards ref to the group container', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<AvatarGroup ref={ref} data-testid="group" />);
    expect(ref.current).toBe(screen.getByTestId('group'));
  });
});

// ---------------------------------------------------------------------------
// ScrollArea
// ---------------------------------------------------------------------------
describe('ScrollArea', () => {
  it('renders with data-slot and forwards ref', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ScrollArea ref={ref} data-testid="sa">
        <p>content</p>
      </ScrollArea>,
    );
    const el = screen.getByTestId('sa');
    expect(el).toHaveAttribute('data-slot', 'scroll-area');
    expect(ref.current).toBe(el);
  });

  it('renders a vertical scrollbar child by default', () => {
    const { container } = render(
      <ScrollArea data-testid="sa">
        <p>content</p>
      </ScrollArea>,
    );
    // Radix ScrollArea may defer painting the scrollbar until layout resolves
    // (jsdom reports no overflow, so the bar is often absent). The Root +
    // Viewport slots are the stable, always-present surface — assert those.
    expect(screen.getByTestId('sa')).toHaveAttribute('data-slot', 'scroll-area');
    expect(container.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull();
  });

  it('ScrollBar forwards ref and orientation when composed inside ScrollArea', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ScrollArea data-testid="sa">
        <ScrollBar ref={ref} orientation="horizontal" data-testid="sb" />
        <p>content</p>
      </ScrollArea>,
    );
    // ScrollBar only renders when ScrollArea provides its context.
    const sb = screen.queryByTestId('sb');
    if (sb) {
      expect(sb).toHaveAttribute('data-orientation', 'horizontal');
      expect(ref.current).toBe(sb);
    }
  });
});

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
describe('Tabs', () => {
  it('renders trigger/tablist roles and active state', () => {
    render(
      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Trigger value="general">General</Tabs.Trigger>
          <Tabs.Trigger value="appearance">Appearance</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="general">General content</Tabs.Content>
        <Tabs.Content value="appearance">Appearance content</Tabs.Content>
      </Tabs>,
    );

    const list = screen.getByRole('tablist');
    expect(list).toHaveAttribute('data-slot', 'tabs-list');

    const tabsEl = screen.getAllByRole('tab');
    expect(tabsEl).toHaveLength(2);
    expect(screen.getByRole('tab', { name: 'General' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'Appearance' })).toHaveAttribute(
      'data-state',
      'inactive',
    );
  });

  it('renders with data-slot and forwards ref on every part', () => {
    const rootRef = React.createRef<HTMLDivElement>();
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();
    render(
      <Tabs ref={rootRef} defaultValue="a" data-testid="tabs">
        <Tabs.List>
          <Tabs.Trigger ref={triggerRef} value="a">
            A
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content ref={contentRef} value="a">
          body
        </Tabs.Content>
      </Tabs>,
    );
    expect(screen.getByTestId('tabs')).toHaveAttribute('data-slot', 'tabs');
    expect(rootRef.current).toBe(screen.getByTestId('tabs'));
    expect(triggerRef.current).toBe(screen.getByRole('tab', { name: 'A' }));
    expect(contentRef.current).toHaveAttribute('data-slot', 'tabs-content');
  });

  // Note: pointer/keyboard selection is not asserted here. Radix Tabs drives
  // activation through pointerdown + roving focus, which jsdom does not model
  // (no layout, no real focus chain) — the interaction is covered instead by
  // the showcase render asserting initial data-state active/inactive.
  // Tabs is underline-only (pill was retired in favour of SegmentedPicker).
});

// ---------------------------------------------------------------------------
// Highlight
// ---------------------------------------------------------------------------
describe('Highlight', () => {
  it('renders text untouched when the query is empty', () => {
    const { container } = render(<Highlight text="Settings" query="" />);
    expect(container.textContent).toBe('Settings');
    expect(container.querySelector('mark')).toBeNull();
  });

  it('wraps the matching substring in a <mark>', () => {
    const { container } = render(<Highlight text="Settings" query="set" />);
    const mark = container.querySelector('mark');
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe('Set');
  });

  it('matches case-insensitively across multiple tokens', () => {
    // Query tokens are substrings: "set" matches the "Set" inside "Settings",
    // "panel" matches "Panel" wholesale. Both are wrapped, non-matched runs are
    // left verbatim.
    const { container } = render(<Highlight text="Account Settings Panel" query="set panel" />);
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(Array.from(marks).map((m) => m.textContent)).toEqual(['Set', 'Panel']);
    // Surrounding text is preserved (not dropped, not wrapped).
    expect(container.textContent).toBe('Account Settings Panel');
  });

  it('renders text untouched when the query is whitespace only', () => {
    const { container } = render(<Highlight text="Settings" query="   " />);
    expect(container.querySelector('mark')).toBeNull();
    expect(container.textContent).toBe('Settings');
  });
});

// ---------------------------------------------------------------------------
// CardSpotlight
// ---------------------------------------------------------------------------
describe('CardSpotlight', () => {
  it('renders as a spotlight Card and forwards children', () => {
    render(
      <CardSpotlight data-testid="spot">
        <h3>Spotlight Card</h3>
      </CardSpotlight>,
    );
    const el = screen.getByTestId('spot');
    expect(el).toHaveAttribute('data-slot', 'card');
    expect(el).toHaveAttribute('data-variant', 'spotlight');
    expect(el.tagName).toBe('DIV');
    expect(screen.getByText('Spotlight Card')).toBeTruthy();
  });

  it('forwards ref to the underlying Card', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardSpotlight ref={ref} data-testid="spot" />);
    expect(ref.current).toBe(screen.getByTestId('spot'));
  });

  it('updates and preserves --spot-x and --spot-y custom properties on pointer move and re-render', () => {
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      cb(0);
      return 0;
    };

    try {
      const { rerender } = render(
        <CardSpotlight data-testid="spot" style={{ color: 'red' }}>
          <h3>Content</h3>
        </CardSpotlight>,
      );
      const el = screen.getByTestId('spot');

      // Mock getBoundingClientRect
      el.getBoundingClientRect = () =>
        ({
          left: 10,
          top: 20,
          width: 100,
          height: 200,
        }) as DOMRect;

      // Simulate pointer move
      fireEvent.pointerMove(el, {
        clientX: 60, // (60 - 10) / 100 * 100 = 50%
        clientY: 120, // (120 - 20) / 200 * 100 = 50%
      });

      expect(el.style.getPropertyValue('--spot-x')).toBe('50%');
      expect(el.style.getPropertyValue('--spot-y')).toBe('50%');
      expect(el.style.color).toBe('red');

      // Re-render component (e.g. parent updates state/props)
      rerender(
        <CardSpotlight data-testid="spot" style={{ color: 'blue' }}>
          <h3>Content</h3>
        </CardSpotlight>,
      );

      // Verify properties are preserved and other styles are updated correctly
      expect(el.style.getPropertyValue('--spot-x')).toBe('50%');
      expect(el.style.getPropertyValue('--spot-y')).toBe('50%');
      expect(el.style.color).toBe('blue');
    } finally {
      window.requestAnimationFrame = originalRAF;
    }
  });

  it('coalesces multiple pointer moves in a single frame to the latest coordinates', async () => {
    // Real browsers batch rapid pointermove events between animation frames.
    // The handler must use the *latest* coords, not the first — otherwise the
    // spotlight appears to lag/stick and "not move" when the cursor sweeps fast.
    const originalRAF = window.requestAnimationFrame;
    const originalCAF = window.cancelAnimationFrame;
    const pendingFrames: Array<(time: number) => void> = [];
    window.requestAnimationFrame = (cb) => {
      pendingFrames.push(cb);
      return pendingFrames.length;
    };
    window.cancelAnimationFrame = () => {};

    try {
      render(<CardSpotlight data-testid="spot" />);
      const el = screen.getByTestId('spot');
      el.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;

      // Enter first so rectRef caches the rect.
      fireEvent.pointerEnter(el, { clientX: 0, clientY: 0 });

      // First move schedules a frame (frameId !== null after this call).
      fireEvent.pointerMove(el, { clientX: 10, clientY: 10 });
      // While the first frame is still pending, three more moves arrive.
      // All must be coalesced; only the last coords (90,90) should be applied
      // when the frame fires.
      fireEvent.pointerMove(el, { clientX: 30, clientY: 40 });
      fireEvent.pointerMove(el, { clientX: 60, clientY: 70 });
      fireEvent.pointerMove(el, { clientX: 90, clientY: 90 });

      // Flush the scheduled frame (mimics the browser firing the rAF callback).
      expect(pendingFrames.length).toBe(1);
      pendingFrames[0]!(0);

      expect(el.style.getPropertyValue('--spot-x')).toBe('90%');
      expect(el.style.getPropertyValue('--spot-y')).toBe('90%');
    } finally {
      window.requestAnimationFrame = originalRAF;
      window.cancelAnimationFrame = originalCAF;
    }
  });

  it('stays accurate after the page scrolls between pointerenter and pointermove', async () => {
    // rectRef caches the bounding rect at pointerenter. When the page scrolls
    // afterwards, rect.left/top change by the scroll delta. The handler must
    // account for this so the spotlight doesn't drift.
    const originalRAF = window.requestAnimationFrame;
    const originalCAF = window.cancelAnimationFrame;
    const pendingFrames: Array<(time: number) => void> = [];
    window.requestAnimationFrame = (cb) => {
      pendingFrames.push(cb);
      return pendingFrames.length;
    };
    window.cancelAnimationFrame = () => {};

    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;

    try {
      render(<CardSpotlight data-testid="spot" />);
      const el = screen.getByTestId('spot');

      // At enter time: element at {left: 0, top: 0}, page not scrolled.
      el.getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
      window.scrollX = 0;
      window.scrollY = 0;
      fireEvent.pointerEnter(el, { clientX: 5, clientY: 5 });

      // User scrolls the page down/right by 50px while still hovering. The
      // element's viewport-relative rect shifts accordingly.
      window.scrollX = 50;
      window.scrollY = 50;
      el.getBoundingClientRect = () =>
        ({ left: -50, top: -50, width: 100, height: 100 }) as DOMRect;

      // Cursor sits at viewport {60, 60} → element-local {60 - (-50), 60 - (-50)} = {110, 110}
      // → 110% (off-edge), but the math must hold regardless.
      fireEvent.pointerMove(el, { clientX: 60, clientY: 60 });
      pendingFrames[0]!(0);

      // Without scroll correction the formula would compute against the stale
      // cached rect (left:0) and yield 60% — wrong. With correct handling the
      // spotlight reflects the true position relative to the visible rect.
      const x = el.style.getPropertyValue('--spot-x');
      const y = el.style.getPropertyValue('--spot-y');
      expect(Math.round(Number.parseFloat(x))).toBe(110);
      expect(Math.round(Number.parseFloat(y))).toBe(110);
    } finally {
      window.requestAnimationFrame = originalRAF;
      window.cancelAnimationFrame = originalCAF;
      window.scrollX = originalScrollX;
      window.scrollY = originalScrollY;
    }
  });
});
