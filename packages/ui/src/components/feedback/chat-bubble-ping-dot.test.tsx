import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Bubble, BubbleContent, PingDot } from './index';
import { Button } from '../form/index';

function getBubbleRoot(testid: string): HTMLElement {
  // ChatBubble renders the design-system root (`data-slot`/`data-tone`/`data-shape`)
  // on the outer wrapper; the bubble skin (where `data-testid` lands) is its child.
  const skin = screen.getByTestId(testid);
  return skin.parentElement?.parentElement as HTMLElement;
}

describe('PingDot', () => {
  it('renders a span with md size and aria-hidden by default', () => {
    render(<PingDot data-testid="ping" />);
    const dot = screen.getByTestId('ping');
    expect(dot.tagName).toBe('SPAN');
    expect(dot).toHaveAttribute('data-slot', 'ping-dot');
    expect(dot).toHaveAttribute('data-size', 'md');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies the size variant', () => {
    render(<PingDot data-testid="ping" size="lg" />);
    expect(screen.getByTestId('ping')).toHaveAttribute('data-size', 'lg');
  });

  it('renders an animated ping ring when pulse is on', () => {
    render(<PingDot data-testid="ping" />);
    expect(screen.getByTestId('ping').querySelector('.motion-safe\\:animate-ping')).not.toBeNull();
  });

  it('omits the ring when pulse is off', () => {
    render(<PingDot data-testid="ping" pulse={false} />);
    expect(screen.getByTestId('ping').querySelector('.motion-safe\\:animate-ping')).toBeNull();
  });

  it('uses bg-current so the parent text tone drives the colour', () => {
    render(
      <div className="text-primary">
        <PingDot data-testid="ping" />
      </div>,
    );
    const painters = screen.getByTestId('ping').querySelectorAll('[class*="bg-current"]');
    expect(painters.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Bubble', () => {
  it('renders the design-system root with default variant and shape', () => {
    render(
      <Bubble>
        <BubbleContent data-testid="skin">Hello</BubbleContent>
      </Bubble>,
    );
    const root = getBubbleRoot('skin');
    expect(root).toHaveAttribute('data-slot', 'chat-bubble');
    expect(root).toHaveAttribute('data-tone', 'them');
    expect(root).toHaveAttribute('data-shape', 'single');
    expect(screen.getByTestId('skin')).toHaveTextContent('Hello');
  });

  it('applies variant styles', () => {
    render(
      <Bubble variant="primary">
        <BubbleContent data-testid="skin">Hi</BubbleContent>
      </Bubble>,
    );
    expect(getBubbleRoot('skin')).toHaveAttribute('data-tone', 'me');
  });

  it.each(['single', 'first', 'middle', 'last'] as const)(
    'renders the requested shape "%s"',
    (shape) => {
      render(
        <Bubble shape={shape}>
          <BubbleContent data-testid="skin">Body</BubbleContent>
        </Bubble>,
      );
      expect(getBubbleRoot('skin')).toHaveAttribute('data-shape', shape);
    },
  );

  it('applies compound radius classes for grouped muted messages', () => {
    render(
      <Bubble variant="muted" shape="middle">
        <BubbleContent data-testid="skin">Body</BubbleContent>
      </Bubble>,
    );
    const skin = screen.getByTestId('skin');
    expect(skin.className).toContain('rounded-tl-xs');
    expect(skin.className).toContain('rounded-bl-xs');
  });

  it('applies compound radius classes for grouped primary messages', () => {
    render(
      <Bubble variant="primary" shape="last">
        <BubbleContent data-testid="skin">Body</BubbleContent>
      </Bubble>,
    );
    expect(screen.getByTestId('skin').className).toContain('rounded-tr-xs');
  });

  it('keeps the body rounded-xl when shape is single', () => {
    render(
      <Bubble variant="muted" shape="single">
        <BubbleContent data-testid="skin">Body</BubbleContent>
      </Bubble>,
    );
    const skin = screen.getByTestId('skin');
    expect(skin.className).toContain('rounded-xl');
    expect(skin.className).not.toContain('rounded-tl-xs');
  });

  it('renders a hover-reveal timestamp when timeLabel is given', () => {
    render(
      <div className="group">
        <Bubble>
          <BubbleContent timeLabel="03:04" data-testid="skin">
            Body
          </BubbleContent>
        </Bubble>
      </div>,
    );
    const skin = screen.getByTestId('skin');
    const row = skin.parentElement;
    expect(row?.textContent ?? '').toMatch(/03:04/);
  });

  it('does not render a hidden timestamp span when omitted', () => {
    render(
      <Bubble>
        <BubbleContent data-testid="skin">Body</BubbleContent>
      </Bubble>,
    );
    const row = screen.getByTestId('skin').parentElement;
    const hidden = row?.querySelectorAll('[class*="opacity-0"]');
    expect((hidden?.length ?? 0) === 0).toBe(true);
  });

  it('respects the parent text tone for primary', () => {
    render(
      <Bubble variant="primary">
        <BubbleContent data-testid="skin">Hi</BubbleContent>
      </Bubble>,
    );
    const skin = screen.getByTestId('skin');
    expect(skin.className).toContain('bg-primary');
    expect(skin.className).toContain('text-primary-foreground');
  });
});

describe('Button — unstyled variant', () => {
  it('emits the unstyled data variant and a transparent background', () => {
    render(
      <Button variant="unstyled" size="icon-xs" data-testid="btn">
        <span>x</span>
      </Button>,
    );
    const btn = screen.getByTestId('btn');
    expect(btn).toHaveAttribute('data-variant', 'unstyled');
    expect(btn.className).toContain('bg-transparent');
    expect(btn.className).toContain('p-0');
  });

  it('preserves aria-label when external listeners are also spread', () => {
    const fn = () => undefined;
    render(
      <Button
        variant="unstyled"
        size="icon-xs"
        aria-label="Kéo để sắp xếp"
        onPointerDown={fn}
        data-testid="btn"
      >
        <span>x</span>
      </Button>,
    );
    expect(screen.getByTestId('btn')).toHaveAttribute('aria-label', 'Kéo để sắp xếp');
  });
});
