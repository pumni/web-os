import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from '../feedback/badge';
import { CardWell, IconBadge } from './index';

describe('Badge', () => {
  it('renders a span with the neutral tone by default', () => {
    render(<Badge data-testid="badge">Idle</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.tagName).toBe('SPAN');
    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(badge).toHaveAttribute('data-tone', 'neutral');
  });

  it.each(['success', 'info'] as const)('applies the %s tone', (tone) => {
    render(
      <Badge tone={tone} data-testid="badge">
        Live
      </Badge>,
    );
    expect(screen.getByTestId('badge')).toHaveAttribute('data-tone', tone);
  });

  it('renders a pulse dot when pulse is set', () => {
    render(
      <Badge tone="success" pulse data-testid="badge">
        Live
      </Badge>,
    );
    // The dot is decorative (aria-hidden); assert the PingDot child exists.
    const badge = screen.getByTestId('badge');
    expect(badge.querySelector('[data-slot="ping-dot"]')).not.toBeNull();
  });

  it('does not render a dot without pulse', () => {
    render(<Badge data-testid="badge">Idle</Badge>);
    expect(screen.getByTestId('badge').querySelector('[data-slot="ping-dot"]')).toBeNull();
  });
});

describe('IconBadge', () => {
  it('renders a span with the primary-soft tone by default', () => {
    render(<IconBadge data-testid="icon-badge" />);
    const chip = screen.getByTestId('icon-badge');
    expect(chip.tagName).toBe('SPAN');
    expect(chip).toHaveAttribute('data-slot', 'icon-badge');
    expect(chip).toHaveAttribute('data-tone', 'primary-soft');
  });

  it('applies the raised tone using the owned surface utility', () => {
    render(<IconBadge tone="raised" data-testid="icon-badge" />);
    const chip = screen.getByTestId('icon-badge');
    expect(chip).toHaveAttribute('data-tone', 'raised');
    expect(chip.className).toContain('surface-raised');
  });

  it('renders the child element when asChild is true', () => {
    render(
      <IconBadge asChild data-testid="icon-badge">
        <a href="/x">x</a>
      </IconBadge>,
    );
    expect(screen.getByTestId('icon-badge').tagName).toBe('A');
  });
});

describe('CardWell', () => {
  it('renders a div well with default radius and padding', () => {
    render(<CardWell data-testid="well">Content</CardWell>);
    const well = screen.getByTestId('well');
    expect(well.tagName).toBe('DIV');
    expect(well).toHaveAttribute('data-slot', 'card-well');
    expect(well.className).toContain('bg-muted');
    expect(well.className).toContain('rounded-lg');
    expect(well.className).toContain('p-4');
  });

  it('supports a padding-less variant', () => {
    render(
      <CardWell padding="none" data-testid="well">
        Content
      </CardWell>,
    );
    expect(screen.getByTestId('well').className).not.toContain('p-4');
  });

  it('renders the child element when asChild is true', () => {
    render(
      <CardWell asChild data-testid="well">
        <ul>
          <li>row</li>
        </ul>
      </CardWell>,
    );
    expect(screen.getByTestId('well').tagName).toBe('UL');
  });
});
