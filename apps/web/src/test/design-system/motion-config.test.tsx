import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MotionConfigProvider } from '@/shared/components/providers/motion-config-provider';

describe('MotionConfigProvider', () => {
  it('renders children unchanged', () => {
    const { getByText } = render(
      <MotionConfigProvider>
        <span>child</span>
      </MotionConfigProvider>,
    );
    expect(getByText('child')).not.toBeNull();
  });
});
