'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pumni/ui/layout';
import { CheckCircle2 } from 'lucide-react';

export function DesignTrendsFooter() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-primary" />
          <CardTitle className="text-lg">Kỷ Luật & Tiêu Chuẩn Visual Check</CardTitle>
        </div>
        <CardDescription>Tự đánh giá các tiêu chí trước khi đẩy UI lên production.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-xs text-muted-foreground sm:grid-cols-2 md:grid-cols-3">
        <div className="space-y-2">
          <h5 className="font-bold text-foreground">1. Contrast APCA</h5>
          <p>
            Text trên glass đạt tối thiểu Lc 60 (APCA), viền ≥ Lc 25. Không dùng tỷ lệ WCAG 2.x cũ.
            Gate thực thi ở <code>glass-contrast.test.ts</code>.
          </p>
        </div>
        <div className="space-y-2">
          <h5 className="font-bold text-foreground">2. Opacity Rule</h5>
          <p>
            Tuyệt đối không dùng opacity cho token bề mặt (<code>bg-card/45</code>). Card nội dung
            bắt buộc đặc (solid). State layer (<code>--state-*</code>) là lớp phủ tạm, ngoại lệ duy
            nhất.
          </p>
        </div>
        <div className="space-y-2">
          <h5 className="font-bold text-foreground">3. Backdrop Rule (ADR-0015)</h5>
          <p>
            Glass chỉ dùng khi có backdrop nhiều màu phía sau (desktop blobs / media / scrim
            overlay). Trên nền phẳng đặc → dùng solid card.
          </p>
        </div>
        <div className="space-y-2">
          <h5 className="font-bold text-foreground">4. Stacked Limit</h5>
          <p>
            Tránh lồng quá 2 cấp kính — mỗi lớp ép một backdrop render pass riêng, cấp thứ 3 sẽ tank
            FPS mobile.
          </p>
        </div>
        <div className="space-y-2">
          <h5 className="font-bold text-foreground">5. No Raw Backdrop-Filter</h5>
          <p>
            Không viết <code>backdrop-filter</code> hay <code>rgba()</code> trong TSX. Blur đến từ{' '}
            <code>glass-*</code> utilities / <code>GlassSurface</code>.
          </p>
        </div>
        <div className="space-y-2">
          <h5 className="font-bold text-foreground">6. Compose via Primitives</h5>
          <p>
            Dùng <code>Card</code>, <code>CardWell</code>, <code>Badge</code>,{' '}
            <code>IconBadge</code>, <code>BentoGridItem</code>. Không hand-roll{' '}
            <code>border bg-muted</code> hay pill riêng.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
