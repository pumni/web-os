'use client';

import { Tabs, TabsList, TabsTrigger } from '@pumni/ui';

type SourceType = 'youtube' | 'url';

export function VideoSourceTabs({
  value,
  onChange,
}: {
  value: SourceType;
  onChange: (val: SourceType) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(val) => onChange(val as SourceType)}
      className="w-full"
    >
      <TabsList className="grid grid-cols-2 w-full h-8 p-0.5 bg-muted border border-border rounded-md">
        <TabsTrigger value="youtube" className="text-xs h-7">
          YouTube
        </TabsTrigger>
        <TabsTrigger value="url" className="text-xs h-7">
          Direct URL (MP4/HLS)
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
