'use client';

import { SegmentedPicker } from '@pumni/ui/form';

type SourceType = 'youtube' | 'url';

const SOURCE_LABELS: Record<SourceType, string> = {
  youtube: 'YouTube',
  url: 'Direct URL (MP4/HLS)',
};

export function VideoSourceTabs({
  value,
  onChange,
}: {
  value: SourceType;
  onChange: (val: SourceType) => void;
}) {
  return (
    <SegmentedPicker
      aria-label="Video source"
      options={['youtube', 'url']}
      value={value}
      onChange={onChange}
      labels={SOURCE_LABELS}
      size="sm"
      fullWidth
    />
  );
}
