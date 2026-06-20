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
    <Tabs value={value} onValueChange={(val) => onChange(val as SourceType)} className="w-full">
      <TabsList className="grid h-8 w-full grid-cols-2 rounded-md border border-border bg-muted p-0.5">
        <TabsTrigger value="youtube" className="h-7 text-xs">
          YouTube
        </TabsTrigger>
        <TabsTrigger value="url" className="h-7 text-xs">
          Direct URL (MP4/HLS)
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
