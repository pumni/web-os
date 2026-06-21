---
description: Internal feature structure (layers, public APIs, cross-communication) and architectural boundaries.
when-to-load: When creating or extending a feature under apps/web/src/features.
---

# Feature Module Architecture

All product capabilities live inside `apps/web/src/features/<feature-name>`. Each feature acts as a self-contained **"Mini-Application"** with clear boundaries, separating concerns into strict layers and exposing a minimal public API.

---

## 1. Internal Directory Anatomy

For simple features, files can reside flat under the feature directory. For complex features (e.g. `watch`), organize code into the following logical layers:

```text
features/my-feature/
├── components/           # 1. Presentation Layer (UI components only)
│   ├── main-widget.tsx
│   └── sub-panel.tsx
├── hooks/                # 2. Application Logic Layer (state, orchestrators)
│   ├── use-widget-state.ts
│   └── use-sync-engine.ts
├── actions.ts            # 3. Data Access Layer (mutations)
├── queries.ts            # 3. Data Access Layer (server reads)
├── types.ts              # 4. Type Safety Boundary (domain types)
└── index.ts              # 5. Public API Firewall (entry point)
```

### Layer Responsibilities & Data Flow

*   **Tầng dữ liệu (Data Access Layer - `queries.ts` & `actions.ts`)**:
    *   **Trách nhiệm**: Kết nối trực tiếp với database/API bằng Supabase clients (`@pumni/supabase`).
    *   **Quy chuẩn**: Định nghĩa DTOs (Data Transfer Objects). Nên sử dụng một lớp Adapter nếu cấu trúc cơ sở dữ liệu thay đổi thường xuyên để ánh xạ thành Domain Model sạch, bảo vệ UI khỏi breaking changes.
*   **Tầng Nghiệp vụ & Trạng thái (Application Layer - `hooks/`, State Stores)**:
    *   **Trách nhiệm**: Custom hooks điều phối dữ liệu (Zustand stores, TanStack Query hooks). Xử lý validation, tính toán nghiệp vụ, và đóng gói trạng thái client-side cache.
    *   **Quy chuẩn**: Không render trực tiếp UI hoặc markup ở đây. Chỉ expose dữ liệu sạch và các hàm tương tác.
*   **Tầng Hiển thị (Presentation Layer - `components/`)**:
    *   **Trách nhiệm**: Nhận dữ liệu sạch từ Tầng Nghiệp vụ (qua props hoặc custom hooks) và render UI.
    *   **Quy chuẩn**: Không gọi API trực tiếp (`fetch`/`axios` hay Supabase client) trong component hiển thị. Ưu tiên Accessibility (A11y) và hiệu năng render.

---

## 2. Mô hình "Bức tường lửa" - Public API (`index.ts`)

Mỗi feature bắt buộc phải có một tệp `index.ts` đóng vai trò là **Public API Gate** (Bức tường lửa). Chỉ export các tài nguyên bên ngoài được phép dùng:

```typescript
// features/watch/index.ts

export { WatchRoom } from './components/watch-room';
export { WatchLobby } from './components/watch-lobby';
export type { Room } from './types';
// Các logic API, hooks, và các sub-components phụ trợ được giấu kín hoàn toàn.
```

> [!IMPORTANT]
> **Luật bất di dịch (Firewall Rule)**: Code ngoài feature chỉ được phép import từ gốc của feature (ví dụ: `@/features/watch`). Mọi hành vi import xuyên thấu vào sâu bên trong (ví dụ: `@/features/watch/queries` hay `@/features/watch/components/room-card`) đều bị cấm và sẽ lỗi build.

---

## 3. Quản lý tương tác chéo (Cross-Feature Communication)

Khi Feature A cần tương tác hoặc dùng dữ liệu từ Feature B, áp dụng 3 mô hình xử lý sau:

### Phương án 1: Dịch chuyển lên Tầng Shared (Mô hình Dịch chuyển)
Nếu một component hoặc logic nghiệp vụ được nhiều feature sử dụng và có tính chất dùng chung (tiện ích định dạng, modal đa dụng, primitives), hãy refactor và di chuyển nó ra các package dùng chung:
*   `packages/ui` cho các UI Primitives framework-agnostic.
*   `packages/validators` cho các Zod validation schemas.
*   `apps/web/src/components` hoặc `src/hooks` cho các tài nguyên dùng chung nội bộ ứng dụng.

### Phương án 2: Tương tác qua Hộp đen State Manager (Mô hình Global State)
Sử dụng Global UI Store (Zustand) hoặc cơ chế Custom Events (Pub-Sub) để gửi tín hiệu tương tác mà không để 2 feature biết về sự hiện diện của nhau.

### Phương án 3: Composition Pattern tại Tầng App/Page Layer (Khuyến nghị)
Giữ các feature độc lập bằng cách thiết kế chúng thành các "Khối Lego". Tầng `app/` (các trang Next.js router) sẽ đóng vai trò ráp nối và truyền dữ liệu/callbacks giữa các feature.

```tsx
// src/app/(app)/dashboard/page.tsx
import { RecentRoomsCard, getRecentRooms } from '@/features/watch';
import { getCurrentProfile } from '@/features/profile';

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const rooms = await getRecentRooms(profile.id);
  
  return <RecentRoomsCard rooms={rooms} />;
}
```

---

## 4. Tự động hóa việc thực thi kiến trúc (Architecture Enforcement)

Quy tắc kiến trúc được tự động kiểm tra tại CI/CD qua ESLint:

1.  **Cô lập Feature (`pumni/feature-boundary-<name>`)**: Ngăn chặn tất cả các tệp tin bên ngoài (kể cả các feature khác) import trực tiếp từ thư mục con của một feature (ngoại trừ các file kiểm thử `.test.ts`).
2.  **Độc lập tầng Route (`pumni/feature-no-app-imports`)**: Cấm tuyệt đối code trong `src/features/**` import từ tầng định tuyến `src/app/**`. Điều này đảm bảo tính di động (Portability) và loại bỏ vòng lặp phụ thuộc (Circular Dependencies).

Chạy lệnh kiểm tra thủ công trước khi commit:
```bash
bun run lint
```
