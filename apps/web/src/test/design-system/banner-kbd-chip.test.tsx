import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Banner, KbdChip } from '@pumni/ui/feedback';

describe('KbdChip', () => {
  it('renders a native <kbd> with the neutral tone', () => {
    render(<KbdChip data-testid="kbd">Ctrl</KbdChip>);
    const kbd = screen.getByTestId('kbd');
    expect(kbd.tagName).toBe('KBD');
    expect(kbd).toHaveAttribute('data-slot', 'kbd-chip');
    expect(kbd).toHaveAttribute('data-tone', 'neutral');
    expect(kbd).toHaveTextContent('Ctrl');
  });

  it('applies the primary tone variant', () => {
    render(
      <KbdChip tone="primary" data-testid="kbd">
        K
      </KbdChip>,
    );
    expect(screen.getByTestId('kbd')).toHaveAttribute('data-tone', 'primary');
    expect(screen.getByTestId('kbd').className).toContain('text-primary');
  });

  it('passes through extra className', () => {
    render(
      <KbdChip className="ml-2" data-testid="kbd">
        Esc
      </KbdChip>,
    );
    expect(screen.getByTestId('kbd').className).toContain('ml-2');
  });
});

describe('Banner', () => {
  it('renders with warning tone and compact size by default', () => {
    render(<Banner title="Phòng không có host" data-testid="banner" />);
    const banner = screen.getByTestId('banner');
    expect(banner).toHaveAttribute('data-slot', 'banner');
    expect(banner).toHaveAttribute('data-tone', 'warning');
    expect(banner).toHaveAttribute('data-size', 'compact');
    expect(banner).toHaveAttribute('role', 'status');
  });

  it('renders the title text', () => {
    render(<Banner title="Ingest failed" data-testid="banner" />);
    expect(screen.getByTestId('banner')).toHaveTextContent('Ingest failed');
  });

  it.each(['warning', 'info', 'error', 'success'] as const)(
    'applies tone class for "%s"',
    (tone) => {
      render(<Banner tone={tone} title="t" data-testid="banner" />);
      const banner = screen.getByTestId('banner');
      const toneClass = `border-${tone === 'error' ? 'destructive' : tone}/20`;
      expect(banner.className).toContain(toneClass);
    },
  );

  it('promotes role to alert when tone="error"', () => {
    render(<Banner tone="error" title="Outage" data-testid="banner" />);
    expect(screen.getByTestId('banner')).toHaveAttribute('role', 'alert');
  });

  it('renders the icon block when icon prop is provided', () => {
    function Triangle(props: { className?: string }) {
      return <svg data-testid="triangle" {...props} />;
    }
    render(<Banner icon={Triangle} title="t" data-testid="banner" />);
    expect(screen.getByTestId('banner').querySelector('[data-testid="triangle"]')).not.toBeNull();
  });

  it('omits icon block when icon is not provided', () => {
    render(<Banner title="t" data-testid="banner" />);
    expect(screen.getByTestId('banner').querySelector('[data-testid="triangle"]')).toBeNull();
  });

  it('renders the trailing action slot', () => {
    render(
      <Banner
        title="Phòng không có host"
        action={<button type="button">Nhận quyền</button>}
        data-testid="banner"
      />,
    );
    expect(screen.getByRole('button', { name: 'Nhận quyền' })).not.toBeNull();
  });

  it('renders description only for block size, not compact', () => {
    const { rerender } = render(
      <Banner size="compact" title="t" description="d" data-testid="banner" />,
    );
    expect(screen.getByTestId('banner')).not.toHaveTextContent('d');

    rerender(<Banner size="block" title="t" description="d" data-testid="banner" />);
    expect(screen.getByTestId('banner')).toHaveTextContent('d');
  });
});
